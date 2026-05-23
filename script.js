// ==========================================================================
// 1. ENGINE CONFIGURATION & DYNAMIC BYPASS LINK (FINAL VERSION)
// ==========================================================================
const SHEET_ID = '1AMoTh-nkZRgChqqsIrJlUNPQxSRnXNqxCV6ztt-NbbA'; 
const SHEET_TITLE = 'Sheet1';

// Yeh formula aapke dynamic link se direct bina kisi block ke CSV data khench lega
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWSmJ5INf2sHspBSUIsGIVuPwItYqeG1NPWM2d-_D_lguar1Z_9T7KSTtLjj6bLqk4PJlLe8kESdFc/pub?gid=45318566&single=true&output=csv';

let questions = [];
let userAnswers = {};
let timerInterval;
let timeLeft = 3600; // 60 Minutes Default Time

// ==========================================================================
// 2. ULTRA-ROBUST DATA FETCHING & PARSING ENGINE
// ==========================================================================
async function loadQuestions() {
    try {
        console.log("Fetching data from:", SHEET_URL);
        const response = await fetch(SHEET_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        if (rows.length <= 1) {
            throw new Error('Sheet khali dikh rahi hai!');
        }

        // Row 1 Header ko chhodkar automatic cells map karne ke liye
        questions = rows.slice(1).map((row, index) => {
            let qText = row[1] ? row[1].trim() : "";
            
            return {
                id: row[0] || (index + 1),
                question: qText,
                options: [
                    row[2] || 'Option A', 
                    row[3] || 'Option B', 
                    row[4] || 'Option C', 
                    row[5] || 'Option D'
                ],
                // Correct option agar number nahi hai toh default 1 set karega
                correct: parseInt(row[6]) ? parseInt(row[6]) : 1
            };
        }).filter(q => q.question !== ""); 

        console.log("Successfully parsed questions:", questions);

        // Loading screen hatao aur instruction screen dikhao
        document.getElementById('loading-profile').style.display = 'none';
        document.getElementById('instructions-screen').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading quiz data:', error);
        document.getElementById('loading-profile').innerHTML = `
            <span style="color:#e74c3c; font-weight:bold;">⚠️ Data Loading Failed!</span><br>
            <small style="color:#555; display:block; margin-top:5px;">
                Browser Refresh karke check karein. Agar dikkat bani rahe toh sheet ka naam check karein.
            </small>
        `;
    }
}

// Custom Standard CSV Parser (Handles spaces, commas and new lines within cells perfectly)
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

// Window load trigger
window.onload = () => {
    loadQuestions();
    setupSecurity();
};

// ==========================================================================
// 3. ANTI-CHEAT & SECURITY GUARD
// ==========================================================================
function setupSecurity() {
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
    }
}
