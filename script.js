const quizData = [

{
question: "The Ganga is a holy river.",
options: ["Ganga", "holy", "river", "is"],
correct: 0,
explanation:
"Ganga is a Proper Noun because it is the name of a specific river."
},

{
question: "Choose the Collective Noun.",
options: ["Team", "Book", "Delhi", "Honesty"],
correct: 0,
explanation:
"Team is a Collective Noun because it refers to a group."
}

];

let currentQuestion = 0;
let timer = 30;
let score = 0;
let userAnswers = [];

const questionEl =
document.getElementById("question");

const buttons =
document.querySelectorAll(".option-btn");

const timerEl =
document.getElementById("timer");

function loadQuestion() {

timer = 30;

questionEl.innerText =
quizData[currentQuestion].question;

quizData[currentQuestion].options.forEach(
(option, index) => {

buttons[index].innerText =
String.fromCharCode(65 + index)
+ ". " + option;

buttons[index].onclick = () => {

userAnswers[currentQuestion] = index;

if(index ===
quizData[currentQuestion].correct){
score++;
}

nextQuestion();

};

});

}

function nextQuestion() {

currentQuestion++;

if(currentQuestion < quizData.length){

loadQuestion();

}

else{

let resultHTML =
"Quiz Finished!<br><br>" +
"Score: " + score + "/" +
quizData.length + "<br><br>";

quizData.forEach((q, index) => {

let userAnswer =
userAnswers[index];

let correctAnswer =
q.correct;

resultHTML +=
"<b>Q" + (index + 1) + ":</b> "
+ q.question + "<br><br>";

resultHTML +=
"Your Answer: "
+ q.options[userAnswer]
+ "<br>";

resultHTML +=
"Correct Answer: "
+ q.options[correctAnswer]
+ "<br><br>";

resultHTML +=
"Explanation: "
+ q.explanation
+ "<br><hr><br>";

});

questionEl.innerHTML =
resultHTML;

document.getElementById("options")
.style.display = "none";

timerEl.style.display = "none";

}

}

setInterval(() => {

timer--;

timerEl.innerText = timer;

if(timer === 0){

nextQuestion();

}

}, 1000);

loadQuestion();