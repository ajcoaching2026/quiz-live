// 1. CONFIGURATION
const SHEET_ID = '1g0ESwN7re5X-KaRraGMSdF0lu3Fff8ZJ2lsXjf4m9fQ';
const SHEET_TITLE = 'Sheet1';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_TITLE}`;

let quizData = [];
let currentQuestionIndex = 0;
let totalTime = 30 * 60; // 30 Minutes
let timerInterval;
let userAnswers = []; // Tracker for choices
let isSubmitted = false; // Flag to check if test is over

const optionPrefixes = ['A. ', 'B. ', 'C. ', 'D. '];

// 2. FETCH DATA FROM GOOGLE SHEET
async function loadQuizData() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;

        const allQuestions = rows.map(row => {
            return {
                question: row.c[0] ? row.c[0].v : '',
                optionA: row.c[1] ? row.c[1].v : '',
                optionB: row.c[2] ? row.c[2].v : '',
                optionC: row.c[3] ? row.c[3].v : '',
                optionD: row.c[4] ? row.c[4].v : '',
                correct: row.c[5] ? row.c[5].v : '',
                explanation: row.c[6] ? row.c[6].v : 'No explanation available.'
            };
        });

        // ⭐ STRICT LIMIT: Sheet mein chahe jitne hon, hum sirf top ke 60 uthayenge
        quizData = allQuestions.slice(0, 60);

        if (quizData.length > 0) {
            userAnswers = new Array(quizData.length).fill(null);
            document.getElementById('loading-profile').style.display = 'none';
            document.getElementById('quiz-box').style.display = 'block';
            
            // Set FAB Badge total to 60
            document.getElementById('fab-badge').innerText = quizData.length;
            
            startTimer();
            buildDrawerGrid();
            showQuestion(0);
        } else {
            document.getElementById('loading-profile').innerText = "No questions found in sheet!";
        }
    } catch (error) {
        console.error("Error loading sheet data:", error);
        document.getElementById('loading-profile').innerText = "Error loading exam profile. Please refresh.";
    }
}

// 3. TIMER FUNCTION
function startTimer() {
    const timerElement = document.getElementById('timer');
    timerInterval = setInterval(() => {
        let minutes = Math.floor(totalTime / 60);
        let seconds = totalTime % 60;
        timerElement.innerText = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (totalTime <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
        totalTime--;
    }, 1000);
}

// 4. DISPLAY QUESTION & OPTIONS
function showQuestion(index) {
    currentQuestionIndex = index;
    const q = quizData[index];

    document.getElementById('progress-header').innerText = `📝 Q: ${index + 1}/${quizData.length}`;
    document.getElementById('question-text').innerText = q.question;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    const options = [q.optionA, q.optionB, q.optionC, q.optionD];
    const optionKeys = ['optionA', 'optionB', 'optionC', 'optionD'];

    options.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${optionPrefixes[i]}${optText}`;

        if (userAnswers[index] === optionKeys[i]) {
            btn.classList.add('selected');
        }

        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            userAnswers[index] = optionKeys[i];
            updateGridStatus();
        };

        optionsContainer.appendChild(btn);
    });

    document.getElementById('prev-btn').disabled = (index === 0);
    document.getElementById('prev-btn').onclick = () => showQuestion(index - 1);
    
    document.getElementById('clear-btn').onclick = () => {
        userAnswers[index] = null;
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        updateGridStatus();
    };

    const nextBtn = document.getElementById('next-btn');
    if (index === quizData.length - 1) {
        nextBtn.innerHTML = '🚀 Submit';
        nextBtn.onclick = () => {
            if (confirm("Are you sure you want to submit the test?")) {
                submitQuiz();
            }
        };
    } else {
        nextBtn.innerHTML = 'Next ➡️';
        nextBtn.onclick = () => showQuestion(index + 1);
    }

    updateGridStatus();
}

// 5. DRAWER NAVIGATION LOGIC
function openDrawer() {
    document.getElementById('drawer-overlay').style.display = 'block';
    document.getElementById('question-drawer').style.right = '0';
}

function closeDrawer() {
    document.getElementById('drawer-overlay').style.display = 'none';
    document.getElementById('question-drawer').style.right = '-300px';
}

function buildDrawerGrid() {
    const gridContainer = document.getElementById('questions-grid');
    gridContainer.innerHTML = '';
    
    quizData.forEach((_, index) => {
        const item = document.createElement('div');
        item.id = `grid-item-${index}`;
        item.className = 'grid-item';
        item.innerText = index + 1;
        
        item.onclick = () => {
            if (!isSubmitted) {
                // Test chal raha hai toh question badlo
                showQuestion(index);
            } else {
                // Test khatam ho gaya toh direct us review question par scroll karo
                // Pehle review panel kholo agar band ho toh
                const panel = document.getElementById('review-panel');
                if (panel.style.display === 'none') {
                    toggleReview();
                }
                const reviewTarget = document.getElementById(`review-item-${index}`);
                if (reviewTarget) {
                    reviewTarget.scrollIntoView({ behavior: 'smooth' });
                }
            }
            closeDrawer();
        };
        gridContainer.appendChild(item);
    });
}

function updateGridStatus() {
    quizData.forEach((_, index) => {
        const item = document.getElementById(`grid-item-${index}`);
        if (!item) return;

        if (!isSubmitted) {
            item.className = 'grid-item';
            if (userAnswers[index] !== null) item.classList.add('attempted');
            if (index === currentQuestionIndex) item.classList.add('current');
        } else {
            // Submit ke baad ka dynamic color status
            item.className = 'grid-item';
            const selectedKey = userAnswers[index];
            if (!selectedKey) {
                item.classList.add('res-skipped');
            } else {
                const selectedText = quizData[index][selectedKey].toString().trim().toLowerCase();
                const correctText = quizData[index].correct.toString().trim().toLowerCase();
                if (selectedText === correctText) {
                    item.classList.add('res-correct');
                } else {
                    item.classList.add('res-wrong');
                }
            }
        }
    });
}

// 6. SCORE CALCULATION & SUBMIT
function submitQuiz() {
    clearInterval(timerInterval);
    isSubmitted = true;
    
    document.getElementById('quiz-box').style.display = 'none';
    document.getElementById('result-box').style.display = 'block';

    // Top Header badal dete hain
    document.getElementById('progress-header').innerText = `📊 Result Declared`;
    document.getElementById('timer').innerText = `⏱️ Finished`;

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    quizData.forEach((q, index) => {
        const selectedKey = userAnswers[index];
        if (!selectedKey) {
            skippedCount++;
        } else {
            const selectedText = q[selectedKey].toString().trim().toLowerCase();
            const correctText = q.correct.toString().trim().toLowerCase();

            if (selectedText === correctText) {
                correctCount++;
            } else {
                wrongCount++;
            }
        }
    });

    const totalMarks = (correctCount * 3) - (wrongCount * 1);

    document.getElementById('score-marks').innerText = totalMarks;
    document.getElementById('score-correct').innerText = correctCount;
    document.getElementById('score-wrong').innerText = wrongCount;
    document.getElementById('score-skipped').innerText = skippedCount;

    // Upgraded Drawer Legend text for Result Mode
    const legendContainer = document.querySelector('.drawer-legend');
    legendContainer.innerHTML = `
        <div class="legend-row">
            <span class="legend-item"><span class="dot result-correct"></span> Correct</span>
            <span class="legend-item"><span class="dot result-wrong"></span> Wrong</span>
            <span class="legend-item"><span class="dot unattempted"></span> Skipped</span>
        </div>
        <p style="font-size:11px; color:#1a73e8; margin-top:5px; text-align:center;">💡 Tap any number to jump to its explanation!</p>
    `;

    // Reset grid status with Red and Green colors
    updateGridStatus();
}

// 7. REVIEW PANEL & JUMP RENDER
function toggleReview() {
    const panel = document.getElementById('review-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        renderReview();
        panel.scrollIntoView({ behavior: 'smooth' });
    } else {
        panel.style.display = 'none';
    }
}

function renderReview() {
    const listContainer = document.getElementById('review-list');
    listContainer.innerHTML = '';

    quizData.forEach((q, index) => {
        const selectedKey = userAnswers[index];
        const selectedText = selectedKey ? q[selectedKey] : 'Not Attempted / Skipped';
        const correctText = q.correct;

        let statusBadge = '';
        if (!selectedKey) {
            statusBadge = `<span class="badge skipped-badge">Skipped (0)</span>`;
        } else if (selectedText.toString().trim().toLowerCase() === correctText.toString().trim().toLowerCase()) {
            statusBadge = `<span class="badge correct-badge">🟢 Correct (+3)</span>`;
        } else {
            statusBadge = `<span class="badge wrong-badge">🔴 Wrong (-1)</span>`;
        }

        const item = document.createElement('div');
        item.id = `review-item-${index}`; // ID for jumping scrolling
        item.className = 'review-item';
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #2c3e50;">Question ${index + 1}:</h4>
                ${statusBadge}
            </div>
            <p style="font-size: 16px; margin-bottom: 12px; color: #333; font-weight: 500;">${q.question}</p>
            <div class="review-answers">
                <p><strong>Your Answer:</strong> <span style="color: ${selectedKey ? '#e74c3c' : '#7f8c8d'}">${selectedText}</span></p>
                <p><strong>Correct Answer:</strong> <span style="color: #1e8e3e; font-weight: bold;">${correctText}</span></p>
            </div>
            <div class="review-explanation">
                <strong>💡 Explanation / व्याख्या:</strong>
                <p style="margin-top: 5px; color: #444; line-height: 1.5;">${q.explanation}</p>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function retakeTest() {
    location.reload();
}

window.onload = loadQuizData;
