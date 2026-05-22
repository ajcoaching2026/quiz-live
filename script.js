// ==========================================================================
// 1. ENGINE CONFIGURATION & HIGH SECURITY BYPASS GUARD
// ==========================================================================
const SHEET_ID = '1AMoTh-nkZRgChqqsIrJlUNPQxSRnXNqxCV6ztt-NbbA'; 
const SHEET_TITLE = 'Sheet1';

// Bypass URL jo bina publish kiye direct CSV data load karega
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(SHEET_TITLE)}`;

let questions = [];
let userAnswers = {};
let timerInterval;
let timeLeft = 3600; // 60 minutes default

// ==========================================================================
// 2. DATA FETCHING & CSV PARSING ENGINE
// ==========================================================================
async function loadQuestions() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        if (rows.length <= 1) {
            throw new Error('No data found in sheet');
        }

        // Header mapping: [RPSC Que No., Full Question, Option 1, Option 2, Option 3, Option 4, Correct Option]
        questions = rows.slice(1).map((row, index) => {
            return {
                id: row[0] || (index + 1),
                question: row[1] || '',
                options: [row[2] || '', row[3] || '', row[4] || '', row[5] || ''],
                correct: parseInt(row[6]) || 1
            };
        }).filter(q => q.question.trim() !== '');

        // Hide loading and show instruction screen
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('instruction-screen').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading quiz data:', error);
        document.getElementById('loading-text').innerHTML = `⚠️ Connection Error!<br><small style="color:red;">Please check if Google Sheet sharing is set to 'Anyone with the link can view'.</small>`;
    }
}

// Custom CSV Parser Helper Function
function parseCSV(text) {
    let lines = [];
    let row = [""];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        let next = text[i+1];

        if (c === '"') {
            if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') { i++; }
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);
    return lines;
}

// Initialize on window load
window.onload = () => {
    loadQuestions();
    setupSecurity();
};

// ==========================================================================
// 3. SECURITY GUARD & ANTI-CHEAT ENGINE
// ==========================================================================
function setupSecurity() {
    // Disable right click
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Disable text selection
    document.addEventListener('selectstart', e => e.preventDefault());
    
    // URL Cleanup/Masking - Developer tools access block
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
    }
}
