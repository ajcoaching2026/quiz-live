// ==========================================================================
// 1. ENGINE CONFIGURATION & HIGH SECURITY ANTI-CHEAT GUARD (LATEST UPDATED)
// ==========================================================================
const SHEET_ID = '1AMoTh-nkZRgChqqsIrJlUNPQxSRnXNqxCV6ztt-NbbA'; 
const SHEET_TITLE = 'Sheet1';

// Direct Google Visualization API Link - Jo bina publish kiye direct access khol dega
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_TITLE)}`;

// [ANTI-CHEAT POINT 8]: URL Clean Up (ID Chupana) immediate hook execution
(function cleanUrlGuard() {
    if (window.history && window.history.replaceState) {
        // Microsecond execution timeline par URL se core query parameters ko strip karke clean layout leave karega
        window.history.replaceState({}, document.title, window.location.pathname);
    }
})();

// [ANTI-CHEAT POINT 8]: Absolute Input/Inspect Blockades
document.addEventListener('keydown', function(e) {
    // Blocks Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12, Ctrl+U (View Source)
    if (e.keyCode == 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) || 
        (e.ctrlKey && e.keyCode == 85)) {
        e.preventDefault();
        return false;
    }
});

// [ANTI-CHEAT POINT 8]: Text Copy & Drag Inhibition Selection Rules
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());

// Core runtime memory arrays
let quizData = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let timerInterval;
let totalSeconds = 0; // Dynamic Calculated
let globalTelegramLink = "https://t.me/AJHinglishAcademy"; 

// ==========================================================================
// 2. DYNAMIC AUTOMATIC SHEET PARSING & METRIC CALCULATIONS ENGINE
// ==========================================================================
async function loadQuizData() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error("Data stream unavailable");
        
        const text = await response.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rows = json.table.rows;

        if (!rows || rows.length === 0) {
            document.getElementById('loading-profile').innerText = "Empty database rows layout structured!";
            return;
        }

        // --- AUTOMATIC EXTRACTION FROM ROW 2 (Index 0 of data rows) ---
        let detectedExamName = "RPSC Premium Practice Set";
        const row2 = rows[0];
        if (row2 && row2.c) {
            if (row2.c[15] && row2.c[15].v) {
                detectedExamName = row2.c[15].v; // Column P: Exam Name
            }
            if (row2.c[16] && row2.c[16].v) {
                globalTelegramLink = row2.c[16].v; // Column Q: Telegram Link
            }
        }

        // --- AUTOMATIC MAPPING FROM GOOGLE SHEET COLUMNS ---
        quizData = rows.map((row) => {
            if (!row || !row.c || !row.c[1]) return null; // Agar Question Text blank h toh line drop out kardo
            return {
                question: row.c[1] ? row.c[1].v : '',        // Column B: Full Question
                option1: row.c[2] ? row.c[2].v : 'Option 1',  // Column C
                option2: row.c[3] ? row.c[3].v : 'Option 2',  // Column D
                option3: row.c[4] ? row.c[4].v : 'Option 3',  // Column E
                option4: row.c[5] ? row.c[5].v : 'Option 4',  // Column F
                option5: "Question not attempted",           // FIXED English Option 5
                explanation: row.c[7] ? row.c[7].v : '',     // Column H: Solution
                additional: row.c[8] ? row.c[8].v : '',      // Column I: Extra Key Facts
                correctKey: row.c[13] ? parseInt(row.c[13].v) : null // Column N: Master Key (1,2,3,4)
            };
        }).filter(q => q !== null && q.question.toString().trim() !== '');

        // Slice up to maximum 60 rows safely for evaluation data bounds
        quizData = quizData.slice(0, 60);
        const qCount = quizData.length;

        if (qCount > 0) {
            userAnswers = new Array(qCount).fill(null);

            // --- FORMULA MATHEMATICS FORMULATIONS ---
            const calculatedTotalMarks = qCount * 3; // Questions × 3 Marks
            const calculatedSeconds = qCount * 40;   // Questions × 40 Seconds Rule
            totalSeconds = calculatedSeconds;        // Commit runtime memory duration

            // Seconds to proper reading human minutes formatting conversion
            const displayMins = Math.floor(calculatedSeconds / 60);
            const displaySecs = calculatedSeconds % 60;
            const timeStringHTML = displaySecs > 0 ? `${displayMins} Mins ${displaySecs} Secs` : `${displayMins} Minutes`;

            // --- UI BINDING INSTRUCTIONS TEXT FIELDS ---
            document.getElementById('ins-exam-name').innerText = detectedExamName;
            document.getElementById('ins-total-q').innerText = qCount;
            document.getElementById('ins-total-marks').innerText = calculatedTotalMarks;
            document.getElementById('ins-total-time').innerText = timeStringHTML;

            // Trigger Transition Screens
            document.getElementById('loading-profile').style.display = 'none';
            document.getElementById('instructions-screen').style.display = 'block';

            // Click interaction architecture setup for Start Button
            document.getElementById('start-exam-btn').onclick = () => {
                document.getElementById('instructions-screen').style.display = 'none';
                document.getElementById('quiz-screen').style.display = 'block';
                document.getElementById('timer-wrapper').style.display = 'flex';
                
                startTimerEngine();
                buildGridDrawerMatrix();
                showQuestionLayout(0);
            };

            // Setup explicit navigation standard click nodes
            document.getElementById('prev-btn').onclick = () => showQuestionLayout(currentQuestionIndex - 1);
            document.getElementById('next-btn').onclick = () => showQuestionLayout(currentQuestionIndex + 1);
            document.getElementById('clear-btn').onclick = clearSelectedAnswers;
            document.getElementById('submit-btn').onclick = processExamSubmission;

        } else {
            document.getElementById('loading-profile').innerText = "Database mapping error: Questions missing or structural schema conflict!";
        }
    } catch (error) {
        console.error("Critical Execution Interruption: ", error);
        document.getElementById('loading-profile').innerText = "Connection error. Please cross check sheet access controls.";
    }
}

// ==========================================================================
// 3. REAL-TIME RENDERING INTERFACE & NAVIGATION LOCKS
// ==========================================================================
function showQuestionLayout(index) {
    currentQuestionIndex = index;
    const q = quizData[index];
    
    // Clean Question Indicator Rendering Engine (E.g., "Question 1")
    document.getElementById('current-question-num').innerText = `Question ${index + 1}`;
    document.getElementById('question-text').innerText = q.question;
    
    const optionsWrapper = document.getElementById('options-container');
    optionsWrapper.innerHTML = '';

    const arrayOptions = [q.option1, q.option2, q.option3, q.option4, q.option5];
    
    arrayOptions.forEach((textString, i) => {
        const optionIdNumber = i + 1;
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span><b>(${optionIdNumber})</b></span> <span>${textString}</span>`;
        
        if (userAnswers[index] === optionIdNumber) {
            btn.classList.add('selected');
        }
        
        btn.onclick = () => registerUserChoice(optionIdNumber);
        optionsWrapper.appendChild(btn);
    });

    // NAVIGATION LOCK SYSTEM: Disable bounds limits checking rules
    document.getElementById('prev-btn').disabled = (index === 0);
    document.getElementById('next-btn').disabled = (index === quizData.length - 1);

    buildGridDrawerMatrix(); // Keeps active class refreshed in matrix
}

function registerUserChoice(optionNumber) {
    userAnswers[currentQuestionIndex] = optionNumber;
    showQuestionLayout(currentQuestionIndex);
}

function clearSelectedAnswers() {
    userAnswers[currentQuestionIndex] = null;
    showQuestionLayout(currentQuestionIndex);
}

// ==========================================================================
// 4. ACTIVE LIVE COUNTDOWN TIMER ENGINE
// ==========================================================================
function startTimerEngine() {
    timerInterval = setInterval(() => {
        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            autoForceSubmission();
            return;
        }
        totalSeconds--;
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        document.getElementById('timer-display').innerText = `${hours}:${minutes}:${seconds}`;
    }, 1000);
}

function autoForceSubmission() {
    alert("Time out! Test is being submitted automatically.");
    executeEvaluationCalculation();
}

function processExamSubmission() {
    if (confirm("Are you absolutely sure you want to finish and submit this test?")) {
        clearInterval(timerInterval);
        executeEvaluationCalculation();
    }
}

// ==========================================================================
// 5. EVALUATION, MATRIX GENERATOR & MERGED EXPLANATIONS VIEW
// ==========================================================================
function buildGridDrawerMatrix() {
    const grid = document.getElementById('drawer-grid');
    grid.innerHTML = '';
    quizData.forEach((_, i) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.innerText = i + 1;
        
        if (userAnswers[i] !== null) gridItem.classList.add('attempted');
        if (i === currentQuestionIndex) gridItem.classList.add('active');
        
        gridItem.onclick = () => {
            showQuestionLayout(i);
            toggleSideDrawer();
        };
        grid.appendChild(gridItem);
    });
}

function toggleSideDrawer() {
    const drawer = document.getElementById('side-drawer');
    const overlay = document.getElementById('drawer-overlay');
    if (drawer.style.right === '0px') {
        drawer.style.right = '-290px';
        overlay.style.display = 'none';
    } else {
        drawer.style.right = '0px';
        overlay.style.display = 'block';
    }
}

function executeEvaluationCalculation() {
    let rightCount = 0;
    let wrongCount = 0;
    let skipCount = 0;

    quizData.forEach((q, i) => {
        const choice = userAnswers[i];
        if (choice === null || choice === 5) {
            skipCount++;
        } else if (choice === q.correctKey) {
            rightCount++;
        } else {
            wrongCount++;
        }
    });

    // Score evaluation algorithms formula check rules
    const finalScore = (rightCount * 3) - (wrongCount * 1);
    const maximumMarksPossible = quizData.length * 3;

    // Transition Screens Display Setup
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('timer-wrapper').style.display = 'none';
    const resultBox = document.getElementById('result-screen');
    resultBox.style.display = 'block';

    // Set metrics fields values
    document.getElementById('res-total').innerText = quizData.length;
    document.getElementById('res-correct').innerText = rightCount;
    document.getElementById('res-wrong').innerText = wrongCount;
    document.getElementById('res-unattempt').innerText = skipCount;
    document.getElementById('res-score').innerText = finalScore.toFixed(2);
    document.getElementById('res-max-score').innerText = maximumMarksPossible;

    // Dynamic configuration inject for back channel Telegram hyper-redirect node link
    const tgRedirectNode = document.getElementById('telegram-redirect-btn');
    if (tgRedirectNode) {
        tgRedirectNode.href = globalTelegramLink;
    }

    // REVIEW SOLUTION CARDS EXTRACTION GENERATOR BOX
    const solutionWrapper = document.getElementById('review-solutions-box');
    solutionWrapper.innerHTML = '';

    quizData.forEach((q, i) => {
        const blockNode = document.createElement('div');
        blockNode.className = 'card review-card';
        
        let userDisplayValue = userAnswers[i] ? `Option ${userAnswers[i]}` : 'Not Attempted / Skipped';
        if (userAnswers[i] === 5) userDisplayValue = "Option 5 (Question not attempted)";

        const isCorrectMatch = (userAnswers[i] === q.correctKey);
        if (userAnswers[i] === null || userAnswers[i] === 5) {
            blockNode.style.borderLeft = "5px solid #f39c12"; // Amber for skipped items
        } else if (isCorrectMatch) {
            blockNode.classList.add('correct-block');
        } else {
            blockNode.classList.add('wrong-block');
        }

        blockNode.innerHTML = `
            <h4><b>Q.${i + 1}:</b> ${q.question}</h4>
            <div class="opts-line">1. ${q.option1} | 2. ${q.option2} | 3. ${q.option3} | 4. ${q.option4}</div>
            <p style="color: var(--secondary); font-size: 14px;"><b><i class="fa-solid fa-circle-check"></i> Sahi Jawab (Official Key):</b> Option ${q.correctKey}</p>
            <p style="color: ${isCorrectMatch ? 'var(--secondary)' : 'var(--danger)'}; font-size: 14px; margin-bottom: 8px;">
                <b><i class="fa-solid ${isCorrectMatch ? 'fa-user-check' : 'fa-user-xmark'}"></i> Aapka Chayan (User Choice):</b> ${userDisplayValue}
            </p>
            <div class="exp-box">
                <p style="color: var(--primary); margin-bottom: 5px;"><b><i class="fa-solid fa-graduation-cap"></i> व्याख्या (Solution Content):</b></p>
                <p>${q.explanation ? q.explanation : 'व्याख्या उपलब्ध नहीं है।'}</p>
                <div style="border-top: 1px dashed #cbd5e0; margin: 8px 0;"></div>
                <p style="color: #718096; margin-bottom: 5px;"><b><i class="fa-solid fa-circle-info"></i> अतिरिक्त जानकारी (Key Facts):</b></p>
                <p>${q.additional ? q.additional : 'अतिरिक्त तथ्य उपलब्ध नहीं हैं।'}</p>
            </div>
        `;
        solutionWrapper.appendChild(blockNode);
    });
    
    // Jump scroll viewport focus straight straight back up to dashboard peak area safely
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Initial Bootstrapper Launcher Execution
window.onload = () => {
    loadQuizData();
};
                
