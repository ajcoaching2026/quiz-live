// 1. CONFIGURATION
const SHEET_ID = '1g0ESwN7re5X-KaRraGMSdF0lu3Fff8ZJ2lsXjf4m9fQ'; // <-- Apni Sheet ID yahan check kar lein
const SHEET_TITLE = 'Sheet1';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_TITLE}`;

let quizData = [];
let currentQuestionIndex = 0;
let totalTime = 30 * 60; // 30 Minutes
let timerInterval;

// Trackers for Result
let userAnswers = []; // Student ne kya answer diya, yahan save hoga

const optionPrefixes = ['A. ', 'B. ', 'C. ', 'D. '];

// 2. FETCH DATA FROM GOOGLE SHEET
async function loadQuizData() {
    try {
        const response = await fetch(SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.substr(47).slice(0, -2));
        const rows = jsonData.table.rows;
        
        quizData = rows.map(row => ({
            question: row.c[0] ? row.c[0].v : '',
            options: [
                row.c[1] ? row.c[1].v : '',
                row.c[2] ? row.c[2].v : '',
                row.c[3] ? row.c[3].v : '',
                row.c[4] ? row.c[4].v : ''
            ],
            correct: row.c[5] ? row.c[5].v : '',
            explanation: row.c[6] ? row.c[6].v : 'No explanation provided.'
        })).slice(0, 40); // Limit 1 to 40 rows

        if(quizData.length > 0) {
            // Initialize user answers with null (skipped by default)
            userAnswers = new Array(quizData.length).fill(null);
            startTotalTimer();
            displayQuestion();
        } else {
            document.getElementById("quiz-box").innerHTML = "<h3>Sheet me koi data nahi mila!</h3>";
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("quiz-box").innerHTML = "<h3>Quiz load nahi ho paya. Permissions check karein.</h3>";
    }
}

// 3. DISPLAY QUESTION & OPTIONS
function displayQuestion() {
    let currentQuiz = quizData[currentQuestionIndex];
    document.getElementById("question-text").innerText = `${currentQuestionIndex + 1}. ${currentQuiz.question}`;
    
    let optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = ""; 
    
    currentQuiz.options.forEach((option, i) => {
        let button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = optionPrefixes[i] + option;
        
        // Agar user pehle hi iska answer de chuka hai (back/next case ke liye)
        if (userAnswers[currentQuestionIndex] === option) {
            button.classList.add("selected");
        }
        
        button.onclick = function() {
            // Purane selected highlights hatayein
            document.querySelectorAll(".option-btn").forEach(btn => btn.classList.remove("selected"));
            // Naya select karein
            button.classList.add("selected");
            userAnswers[currentQuestionIndex] = option; // Answer save kiya
        };
        
        optionsContainer.appendChild(button);
    });

    // Handle Submit Button visibility on last question
    if (currentQuestionIndex === quizData.length - 1) {
        document.getElementById("next-btn").style.display = "none";
        document.getElementById("submit-quiz-btn").style.display = "inline-block";
    } else {
        document.getElementById("next-btn").style.display = "inline-block";
        document.getElementById("submit-quiz-btn").style.display = "none";
    }
}

function nextQuestion() {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

// 4. TOTAL TIMER LOGIC
function startTotalTimer() {
    timerInterval = setInterval(() => {
        let minutes = Math.floor(totalTime / 60);
        let seconds = totalTime % 60;
        document.getElementById("timer").innerText = 
            `⏱️ Time Left: ${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (totalTime <= 0) {
            calculateResult(); // Time khatam toh auto-submit
        }
        totalTime--;
    }, 1000);
}

// 5. CALCULATE & SHOW SCORECARD
function calculateResult() {
    clearInterval(timerInterval);
    document.getElementById("timer-panel").style.display = "none";
    document.getElementById("quiz-box").style.display = "none";
    
    let totalQuestions = quizData.length;
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    userAnswers.forEach((ans, index) => {
        if (ans === null) {
            skipped++;
        } else {
            attempted++;
            if (ans === quizData[index].correct) {
                correct++;
            } else {
                wrong++;
            }
        }
    });

    // Marking System: +3 for Correct, -1 for Wrong
    let finalScore = (correct * 3) - (wrong * 1);
    let maxMarks = totalQuestions * 3;
    let accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

    // Display Result Dashboard
    document.getElementById("score").innerText = `${finalScore} / ${maxMarks}`;
    document.getElementById("stat-total").innerText = totalQuestions;
    document.getElementById("stat-attempted").innerText = attempted;
    document.getElementById("stat-correct").innerText = correct;
    document.getElementById("stat-wrong").innerText = wrong;
    document.getElementById("stat-skipped").innerText = skipped;
    document.getElementById("stat-accuracy").innerText = `${accuracy}%`;

    document.getElementById("result-container").style.display = "block";
    
    // Review Sections Generate Karna backend me
    generateReviewSection();
}

// 6. GENERATE ALL QUESTIONS REVIEW LIST
function generateReviewSection() {
    let reviewList = document.getElementById("review-list");
    reviewList.innerHTML = "";

    quizData.forEach((quiz, index) => {
        let userAns = userAnswers[index];
        let isCorrect = userAns === quiz.correct;
        
        let qCard = document.createElement("div");
        qCard.className = "review-q-card";

        // Status badge design
        let statusBadge = "";
        if (userAns === null) {
            statusBadge = `<span class="badge badge-skipped">🟡 Skipped</span>`;
        } else if (isCorrect) {
            statusBadge = `<span class="badge badge-correct">🟢 Correct (+3)</span>`;
        } else {
            statusBadge = `<span class="badge badge-wrong">🔴 Wrong (-1)</span>`;
        }

        qCard.innerHTML = `
            <div class="review-q-header">
                <strong>Question ${index + 1}:</strong> ${statusBadge}
            </div>
            <p class="review-q-text">${quiz.question}</p>
            <div class="review-answers">
                <p><strong>Your Answer:</strong> ${userAns ? userAns : '<span style="color:#7f8c8d;">Not Attempted</span>'}</p>
                <p><strong>Correct Answer:</strong> <span style="color:#27ae60; font-weight:bold;">${quiz.correct}</span></p>
            </div>
            <div class="review-explanation-box">
                <strong>💡 Explanation / व्याख्या:</strong>
                <p>${quiz.explanation}</p>
            </div>
        `;
        reviewList.appendChild(qCard);
    });
}

// Toggle Review Section on Button Click
function toggleReview() {
    let reviewSection = document.getElementById("review-section");
    if (reviewSection.style.display === "none" || reviewSection.style.display === "") {
        reviewSection.style.display = "block";
        reviewSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        reviewSection.style.display = "none";
    }
}

window.onload = loadQuizData;
