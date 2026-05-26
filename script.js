// ==========================================================================
// 1. DYNAMIC CONFIGURATION & LINK ENGINE
// ==========================================================================

function getActiveSheetUrl() {

    const urlParams = new URLSearchParams(window.location.search);

    const customUrl = urlParams.get("sheet");

    if (customUrl) {

        if (QUIZ_CONFIG.enableConsoleLogs) {

            console.log("🔗 Dynamic URL Loaded");

        }

        return decodeURIComponent(customUrl);

    }

    return QUIZ_CONFIG.defaultSheetUrl;

}

const ENGINE_URL = getActiveSheetUrl();


// ==========================================================================
// 2. GLOBAL STATE VARIABLES
// ==========================================================================

let questions = [];

let userAnswers = {};

let currentQuestionIndex = 0;

let timerInterval;

let totalDurationSeconds = 0;

let timeLeft = 0;


// ==========================================================================
// 3. LOAD QUESTIONS ENGINE
// ==========================================================================

async function loadQuestions() {

    try {

        if (QUIZ_CONFIG.enableConsoleLogs) {

            console.log("🚀 Fetching:", ENGINE_URL);

        }

        const response = await fetch(ENGINE_URL);

        if (!response.ok) {

            throw new Error("Sheet Fetch Failed");

        }

        const csvText = await response.text();

        const rows = parseCSV(csvText);

        const dataRows = rows
            .slice(1)
            .filter(row => row.length >= 7 && row[1]);

        if (dataRows.length === 0) {

            throw new Error("No Questions Found");

        }

        questions = dataRows.map((row, index) => {

            return {

                id: row[0] || index + 1,

                question: row[1],

                options: [

                    row[2],

                    row[3],

                    row[4],

                    row[5]

                ],

                correctOption: parseInt(row[6]) || 1,

                explanation:
                    row[7] ||
                    "No Explanation Available.",

                subject:
                    row[8] ||
                    "General",

                examName:
                    row[16] ||
                    QUIZ_CONFIG.fallbackExamName,

                telegramLink:
                    row[17] ||
                    QUIZ_CONFIG.defaultTelegramLink

            };

        });

        initializeExamProfile();

    }

    catch (error) {

        console.error(error);

        document.getElementById(
            "loading-screen"
        ).innerHTML = `

            <div style="
                color:red;
                text-align:center;
                padding:20px;
            ">

                <i class="fa-solid fa-circle-exclamation"
                   style="font-size:40px;">
                </i>

                <p style="margin-top:15px;">

                    Error Loading Sheet

                </p>

            </div>
        `;
    }
}


// ==========================================================================
// 4. CSV PARSER
// ==========================================================================

function parseCSV(text) {

    let lines = [];

    let row = [''];

    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {

        let c = text[i];

        let next = text[i + 1];

        if (c === '"') {

            if (inQuotes && next === '"') {

                row[row.length - 1] += '"';

                i++;

            }

            else {

                inQuotes = !inQuotes;

            }

        }

        else if (c === ',' && !inQuotes) {

            row.push('');

        }

        else if (
            (c === '\n' || c === '\r')
            &&
            !inQuotes
        ) {

            if (c === '\r' && next === '\n') {

                i++;

            }

            lines.push(row);

            row = [''];

        }

        else {

            row[row.length - 1] += c;

        }
    }

    if (row.length > 1 || row[0] !== '') {

        lines.push(row);

    }

    return lines;

}


// ==========================================================================
// 5. INITIALIZE EXAM
// ==========================================================================

function initializeExamProfile() {

    if (questions.length === 0) return;

    const sampleQ = questions[0];

    document.title =
        `${QUIZ_CONFIG.coachingName} | ${QUIZ_CONFIG.portalTitle}`;

    document.getElementById(
        "ins-exam-name"
    ).innerText = sampleQ.examName;

    document.getElementById(
        "ins-total-q"
    ).innerText = questions.length;

    document.getElementById(
        "ins-total-marks"
    ).innerText =
        questions.length *
        QUIZ_CONFIG.correctMarks;

    document.getElementById(
        "ins-total-time"
    ).innerText =
        Math.floor(
            (
                questions.length *
                QUIZ_CONFIG.secondsPerQuestion
            ) / 60
        ) + " Minutes";

    document.getElementById(
        "ins-correct-marks"
    ).innerText =
        `+${QUIZ_CONFIG.correctMarks}`;

    document.getElementById(
        "ins-negative-marks"
    ).innerText =
        `${QUIZ_CONFIG.negativeMarks}`;

    totalDurationSeconds =
        questions.length *
        QUIZ_CONFIG.secondsPerQuestion;

    timeLeft = totalDurationSeconds;

    document.getElementById(
        "loading-screen"
    ).style.display = "none";

    document.getElementById(
        "instructions-screen"
    ).style.display = "block";
}
// ==========================================================================
// 6. START EXAM
// ==========================================================================

function startExam() {


    document.getElementById(
        "quiz-screen"
    ).style.display = "grid";

    document.getElementById(
        "timer-box"
    ).style.display = "flex";

    const floatingBtn =
        document.getElementById(
            "floating-submit-btn"
        );

    if (floatingBtn) {

        floatingBtn.style.display = "flex";

    }

    renderPalette();

    renderQuestion();

    startTimer();

}


// ==========================================================================
// 7. TIMER ENGINE
// ==========================================================================

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            autoSubmitExam();

            return;

        }

        timeLeft--;

        displayTime();

    }, 1000);

}


function displayTime() {

    const minutes =
        Math.floor(timeLeft / 60);

    const seconds =
        timeLeft % 60;

    const formatted =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    document.getElementById(
        "timer-display"
    ).innerText = formatted;

    if (timeLeft <= 300) {

        document.getElementById(
            "timer-box"
        ).style.background = "var(--danger)";

    }

}


// ==========================================================================
// 8. QUESTION RENDER ENGINE
// ==========================================================================

function renderQuestion() {

    if (
        currentQuestionIndex < 0
        ||
        currentQuestionIndex >= questions.length
    ) {
        return;
    }

    const q =
        questions[currentQuestionIndex];

    document.getElementById(
        "current-q-num"
    ).innerText =
        `Question ${currentQuestionIndex + 1}`;

    document.getElementById(
        "question-text"
    ).innerText =
        q.question;

    const optionsContainer =
        document.getElementById(
            "options-container"
        );

    optionsContainer.innerHTML = "";

    q.options.forEach((optText, index) => {

        if (!optText) return;

        const optionNumber = index + 1;

        const selected =
            userAnswers[currentQuestionIndex]
            === optionNumber;

        const optionDiv =
            document.createElement("div");

        optionDiv.className =
            `option-card ${selected ? "selected" : ""}`;

        optionDiv.innerHTML = `

            <div class="option-indicator">

                ${String.fromCharCode(65 + index)}

            </div>

            <div class="option-text">

                ${optText}

            </div>

        `;

        optionDiv.onclick = () => {

            selectOption(optionNumber);

        };

        optionsContainer.appendChild(optionDiv);

    });


    // OPTION 5

    const skippedSelected =
        userAnswers[currentQuestionIndex]
        === 5;

    const skippedDiv =
        document.createElement("div");

    skippedDiv.className =
        `option-card option-not-attempted ${skippedSelected ? "selected" : ""}`;

    skippedDiv.innerHTML = `

        <div class="option-indicator">

            <i class="fa-solid fa-ban"></i>

        </div>

        <div class="option-text">

            Question Not Attempted

        </div>

    `;

    skippedDiv.onclick = () => {

        selectOption(5);

    };

    optionsContainer.appendChild(skippedDiv);


    // BUTTON STATES

    document.getElementById(
        "back-btn"
    ).disabled =
        currentQuestionIndex === 0;

    const nextBtn =
        document.getElementById(
            "next-btn"
        );

    if (
        currentQuestionIndex ===
        questions.length - 1
    ) {

        nextBtn.innerHTML = `

            Review & Submit
            <i class="fa-solid fa-circle-check"></i>

        `;

    }

    else {

        nextBtn.innerHTML = `

            Next
            <i class="fa-solid fa-chevron-right"></i>

        `;

    }

    updatePaletteStatus();

}
// ==========================================================================
// 9. OPTION SELECT ENGINE
// ==========================================================================

function selectOption(optionNumber) {

    userAnswers[currentQuestionIndex] =
        optionNumber;

    renderQuestion();

    renderPalette();

}


// ==========================================================================
// 10. NAVIGATION ENGINE
// ==========================================================================

function navigateNext() {

    if (
        currentQuestionIndex ===
        questions.length - 1
    ) {

        triggerSubmitConfirmation();

    }

    else {

        currentQuestionIndex++;

        renderQuestion();

    }

}


function navigateBack() {

    if (currentQuestionIndex > 0) {

        currentQuestionIndex--;

        renderQuestion();

    }

}


function clearResponse() {

    if (
        userAnswers[currentQuestionIndex]
        !== undefined
    ) {

        delete userAnswers[
            currentQuestionIndex
        ];

        renderQuestion();

        renderPalette();

    }

}


// ==========================================================================
// 11. PALETTE ENGINE
// ==========================================================================

function renderPalette() {

    const paletteGrid =
        document.getElementById(
            "palette-grid"
        );

    if (!paletteGrid) return;

    paletteGrid.innerHTML = "";

    questions.forEach((_, index) => {

        const btn =
            document.createElement(
                "button"
            );

        btn.className =
            "palette-btn";

        btn.innerText =
            index + 1;

        if (
            index === currentQuestionIndex
        ) {

            btn.classList.add(
                "active"
            );

        }

        else if (
            userAnswers[index]
            !== undefined
        ) {

            if (
                userAnswers[index] === 5
            ) {

                btn.classList.add(
                    "skipped"
                );

            }

            else {

                btn.classList.add(
                    "answered"
                );

            }

        }

        btn.onclick = () => {

            jumpToQuestion(index);

        };

        paletteGrid.appendChild(btn);

    });

    updatePaletteCounts();

}


function jumpToQuestion(index) {

    currentQuestionIndex = index;

    renderQuestion();

}


function updatePaletteCounts() {

    let answered = 0;

    let skipped = 0;

    questions.forEach((_, index) => {

        if (
            userAnswers[index]
            !== undefined
        ) {

            if (
                userAnswers[index] === 5
            ) {

                skipped++;

            }

            else {

                answered++;

            }

        }

    });

    document.getElementById(
        "count-answered"
    ).innerText = answered;

    document.getElementById(
        "count-skipped"
    ).innerText = skipped;

    document.getElementById(
        "count-not-visited"
    ).innerText =
        questions.length -
        (answered + skipped);

}


function updatePaletteStatus() {

    const buttons =
        document.querySelectorAll(
            ".palette-btn"
        );

    buttons.forEach((btn, index) => {

        if (
            index === currentQuestionIndex
        ) {

            btn.classList.add(
                "active"
            );

        }

        else {

            btn.classList.remove(
                "active"
            );

        }

    });

}
// ==========================================================================
// 12. SUBMIT CONFIRMATION
// ==========================================================================

function triggerSubmitConfirmation() {

    const totalQuestions =
        questions.length;

    let answered = 0;

    let skipped = 0;

    questions.forEach((_, index) => {

        if (
            userAnswers[index]
            !== undefined
        ) {

            if (
                userAnswers[index] === 5
            ) {

                skipped++;

            }

            else {

                answered++;

            }

        }

    });

    const notVisited =
        totalQuestions -
        (answered + skipped);

    const confirmation =
        confirm(

            `📊 Test Summary\n\n` +

            `Total Questions: ${totalQuestions}\n` +

            `Answered: ${answered}\n` +

            `Skipped: ${skipped}\n` +

            `Not Visited: ${notVisited}\n\n` +

            `Do you want to submit the test?`

        );

    if (confirmation) {

        autoSubmitExam();

    }

}


// ==========================================================================
// 13. RESULT ENGINE
// ==========================================================================

function autoSubmitExam() {

    clearInterval(timerInterval);

    let totalScore = 0;

    let correctCount = 0;

    let wrongCount = 0;

    let unattemptedCount = 0;

    let analysisHtml = "";

    questions.forEach((q, index) => {

        const userAnswer =
            userAnswers[index];

        let statusHtml = "";

        let marks = 0;

        if (
            userAnswer === undefined
            ||
            userAnswer === 5
        ) {

            unattemptedCount++;

            statusHtml = `

                <span class="badge badge-warning">

                    Not Attempted

                </span>

            `;

        }

        else if (
            userAnswer === q.correctOption
        ) {

            correctCount++;

            marks =
                QUIZ_CONFIG.correctMarks;

            totalScore += marks;

            statusHtml = `

                <span class="badge badge-success">

                    Correct (+${marks})

                </span>

            `;

        }

        else {

            wrongCount++;

            marks =
                QUIZ_CONFIG.negativeMarks;

            totalScore += marks;

            statusHtml = `

                <span class="badge badge-danger">

                    Wrong (${marks})

                </span>

            `;

        }

        analysisHtml += `

            <div class="analysis-row">

                <div class="analysis-q-text">

                    <b>

                        Q${index + 1}.

                    </b>

                    ${q.question}

                </div>

                <div style="margin-top:10px;">

                    <p>

                        <b>Your Answer:</b>

                        ${
                            userAnswer &&
                            userAnswer !== 5

                            ?

                            q.options[userAnswer - 1]

                            :

                            "Not Attempted"
                        }

                    </p>

                    <p style="
                        color:var(--secondary);
                        margin-top:5px;
                    ">

                        <b>Correct Answer:</b>

                        Option
                        ${String.fromCharCode(
                            64 + q.correctOption
                        )}

                        (
                            ${q.options[
                                q.correctOption - 1
                            ]}
                        )

                    </p>

                </div>

                <div class="explanation-box">

                    <strong>

                        💡 Explanation:

                    </strong>

                    <br>

                    ${q.explanation}

                </div>

                <div style="
                    margin-top:10px;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                ">

                    ${statusHtml}

                    <span style="
                        font-weight:bold;
                    ">

                        Marks: ${marks}

                    </span>

                </div>

            </div>

        `;

    });


    // RESULT SCREEN UPDATE

    document.getElementById(
        "quiz-screen"
    ).style.display = "none";

    document.getElementById(
        "timer-box"
    ).style.display = "none";

    document.getElementById(
        "floating-submit-btn"
    ).style.display = "none";

    document.getElementById(
        "result-screen"
    ).style.display = "block";


    // RESULT VALUES

    document.getElementById(
        "res-score"
    ).innerText =
        totalScore;

    document.getElementById(
        "res-total-q"
    ).innerText =
        questions.length;

    document.getElementById(
        "res-correct"
    ).innerText =
        correctCount;

    document.getElementById(
        "res-wrong"
    ).innerText =
        wrongCount;

    document.getElementById(
        "res-unattempted"
    ).innerText =
        unattemptedCount;


    // TELEGRAM LINK

    document.getElementById(
        "telegram-btn-link"
    ).href =
        QUIZ_CONFIG.defaultTelegramLink;


    // ANALYSIS

    document.getElementById(
        "analysis-container"
    ).innerHTML =
        analysisHtml;

}
// ==========================================================================
// 14. RESTART QUIZ
// ==========================================================================

function restartQuiz() {

    window.location.reload();

}


// ==========================================================================

// ==========================================================================
// 15. MOBILE SIDEBAR TOGGLE
// ==========================================================================

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "right-sidebar"
        );

    if (!sidebar) return;

    sidebar.classList.toggle("open");

}


// ==========================================================================
// 16. SECURITY ENGINE
// ==========================================================================

function setupSecurity() {

    if (
        !QUIZ_CONFIG.enableAntiCheat
    ) {
        return;
    }

    // RIGHT CLICK BLOCK

    document.addEventListener(
        "contextmenu",
        e => e.preventDefault()
    );


    // TEXT SELECT BLOCK

    document.addEventListener(
        "selectstart",
        e => e.preventDefault()
    );


    // COPY BLOCK

    document.addEventListener(
        "copy",
        e => e.preventDefault()
    );


    // CUT BLOCK

    document.addEventListener(
        "cut",
        e => e.preventDefault()
    );


    // DEV TOOLS BLOCK

    document.addEventListener(
        "keydown",
        e => {

            if (
                e.key === "F12"
            ) {

                e.preventDefault();

            }

            if (
                e.ctrlKey
                &&
                (
                    e.key === "u"
                    ||
                    e.key === "U"
                    ||
                    e.key === "s"
                    ||
                    e.key === "S"
                    ||
                    e.key === "c"
                    ||
                    e.key === "C"
                    ||
                    e.key === "i"
                    ||
                    e.key === "I"
                )
            ) {

                e.preventDefault();

            }

        }
    );

}


// =========================================================================
// 17. INITIALIZE APP
// ==========================================================================

window.onload = () => {

    setupSecurity();

    loadQuestions();
};
