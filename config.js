// ==========================================================================
// MASTER CONFIGURATION FILE
// Future me sirf isi file ko edit karna hoga
// ==========================================================================

const QUIZ_CONFIG = {

    // ==========================================================
    // BRANDING SETTINGS
    // ==========================================================

    coachingName: "AJ HiNGLISH Academy",

    portalTitle: "PYQ TEST",

    // ==========================================================
    // GOOGLE SHEET SETTINGS
    // ==========================================================

    defaultSheetUrl:
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vS491dA6RcKihM7YUmBvGyDbB5F1uJTbYb6psFwXvfH7OkItyuYQIdST2ervg2msQ/pub?gid=45318566&single=true&output=csv",

    // ==========================================================
    // TELEGRAM SETTINGS
    // ==========================================================

    defaultTelegramLink:
        "https://t.me/AJHinglishAcademy",

    // ==========================================================
    // EXAM SETTINGS
    // ==========================================================

    fallbackExamName: "PYQ Test Series",

    correctMarks: 1,

    negativeMarks: -0.25,

    secondsPerQuestion: 60,

    // ==========================================================
    // UI SETTINGS
    // ==========================================================

    showQuestionGrid: true,

    showFloatingSubmit: true,

    // ==========================================================
    // SECURITY SETTINGS
    // ==========================================================

    enableAntiCheat: true,

    enableUrlCleaner: true,

    // ==========================================================
    // DEBUG SETTINGS
    // ==========================================================

    enableConsoleLogs: false
};


// ==========================================================================
// AUTO TITLE SETTER
// =========================================================================

document.title =
    `${QUIZ_CONFIG.coachingName} | ${QUIZ_CONFIG.portalTitle}`;