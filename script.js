const receiverEl = document.getElementById('receiver');
const easyEl = document.getElementById('easy');
const difficultEl = document.getElementById('difficult');
const difficultAdditionEl = document.getElementById('difficult-addition');
const difficultCreditsEl = document.getElementById('difficult-credits');
const mathTaskEl = document.getElementById('mathTask');
const answersEl = document.getElementById('answers');
const correctAnswerEl = document.getElementById('correctAnswer');
const incorrectAnswerEl = document.getElementById('incorrectAnswer');
const feedbackEl = document.getElementById('feedback');
const fixationCrossEl = document.getElementById('fixationCross');

let selectedAllocation = 0;
let currentAddition = 0;
let chosenAddition = 0;
let chosenCredits = 0;
let correctAnswer = [];
let incorrectAnswer = [];
let correctPosition;
let shownNumbers = [];
let startTime;
let decisionTime;
let answerStartTime;
let answerDecisionTime;
let timeoutId = null; 
let timedOut = false; 
let data = [];
let numberOfRounds = 0; 
const maxRounds = 4;
let trialCounter = 0;
let timestamp1 = new Date();
let timestamp2;
let creditsSelf    = 0;
let creditsCharity = 0;
let donatedTickets = 0;
let selfFrac = 0.5; 
let attemptedDonation = 0;
let selfTrialPreference  = 0;
let charityTrialPreference = 0;



const receivers = ['Charity', 'Self']; //  For testing...
const additions = [1, 3, 7]; // , 3, 7
const credits = [2, 4, 8]; //, 4, 8
let participantSID;

/* ───────────────── Allocation control ───────────────── */
let allocationPercentage = 50;          // 25, 50, or 75
let impactedReceiver   = 'Both';        // 'Self', 'Charity', or 'Both'
let roundAssignments   = [];            // e.g., ['custom','fixed', ...] length = 4


function start() {
    participantSID = prompt("Please enter your Connect ID:", "");
    console.log("SID:", participantSID);
    // showAllocationSlider();

    buildTrialList();      
    displayNextTrial();
}


function showAllocationSlider(){

    const expWrap   = document.querySelector('.experiment-container');
    const container = document.getElementById('sliderContainer');
    const slider    = document.getElementById('allocationSlider');
    const confirm   = document.getElementById('sliderConfirm');

    /* put panel outside blurred wrapper just once */
    if(container.parentElement !== document.body){
        document.body.appendChild(container);
    }

    expWrap.classList.add('blur-lock');
    container.style.display = 'block';

    confirm.onclick = () => {

        allocationPercentage = parseInt(slider.value, 10);   // 25‒75
        /* map 25→1  ,  50→0.5 ,  75→0 */
        selfFrac = (75 - allocationPercentage) / 50;
        /* clamp just in case */
        selfFrac = Math.max(0, Math.min(1, selfFrac));
    
        impactedReceiver = selfFrac > 0.5 ? 'Self'
                         : selfFrac < 0.5 ? 'Charity'
                         : 'Both';
    
        roundAssignments = selfFrac === 0.5
            ? ['fixed','fixed','fixed','fixed']   // no change
            : ['fixed','fixed','custom','custom'];
    
        /* shuffle the four buckets */
        for (let i = roundAssignments.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roundAssignments[i], roundAssignments[j]] =
                [roundAssignments[j], roundAssignments[i]];
        }
    
        console.log(`🎛 slider = ${allocationPercentage}%  →  selfFrac = ${selfFrac}`);
        console.log('🎲 bucket order:', roundAssignments);
    
        expWrap.classList.remove('blur-lock');
        container.style.display = 'none';

        buildTrialList();       
        displayNextTrial();      // start first bucket
    };
}



// Initialize all combinations
let trialCombinations = [];

function initCombinations(){
    trialCombinations = [];

    const bucketType  = roundAssignments[numberOfRounds];   // 'fixed' | 'custom'
    const combosBase  = [];                                // all addition×credit pairs
    for (let a of additions){
        for (let c of credits){
            combosBase.push({addition:a, credit:c});
        }
    }

    /* Each bucket always contains TWO repetitions of every a×c combo (≈ previous design) */
    const repeated = combosBase.concat(combosBase);        // length = combosBase*2
    const totalTrials = repeated.length;

    let receiversList = [];

    if (bucketType === 'fixed'){          // classic 50-50
        /* Alternate Self / Charity so count stays equal */
        for (let i=0;i<totalTrials;i++){
            receiversList.push(i%2===0 ? 'Self' : 'Charity');
        }
    }else{                               
        const nSelf    = Math.round(totalTrials * selfFrac);
        const nCharity = totalTrials - nSelf;
        receiversList  = Array(nSelf).fill('Self')
                       .concat(Array(nCharity).fill('Charity'));

        /* shuffle to avoid streaks */
        for (let i=receiversList.length-1;i>0;i--){
            const j=Math.floor(Math.random()*(i+1));
            [receiversList[i],receiversList[j]]=[receiversList[j],receiversList[i]];
        }
    }

    /* Build the trial objects */
    repeated.forEach((combo,idx)=>{
        trialCombinations.push({
            receiver : receiversList[idx],
            addition : combo.addition,
            credit   : combo.credit,
            round    : numberOfRounds + 1
        });
    });

    /* final shuffle for this bucket (twice, like before) */
    for(let i=0;i<2;i++){
        trialCombinations.sort(()=>Math.random()-0.5);
    }

    console.log(`🔄 round ${numberOfRounds+1}  –  bucket=${bucketType}`,
                `| trials=${totalTrials}  (Self:${receiversList.filter(r=>r==='Self').length}`,
                ` Charity:${receiversList.filter(r=>r==='Charity').length})`);

    displayNextTrial();
}



//  Display the choices
let currentTrial  = {};
let trialResults  = [];


function displayNextTrial(){

    if (trialIndex >= trialList.length){
        endExperiment();
        return;
    }

    trialCounter++;
    const trial = trialList[trialIndex];
    console.log(`🧩  Trial ${trialCounter}`, trial);

    startTime    = Date.now();
    currentTrial = { ...trial, trialNumber: trialCounter };

    // Use receiverEl just as an instruction line if you want
    receiverEl.textContent   = "Choose a task:";
    receiverEl.style.display = 'block';

    difficultAdditionEl.textContent = '+' + trial.addition;
    difficultCreditsEl.textContent  = trial.credit + ' credits';

    chosenAddition = trial.addition;
    chosenCredits  = trial.credit;

    easyEl.style.display      = 'block';
    difficultEl.style.display = 'block';

    easyEl.onclick = () => {
        decisionTime      = Date.now() - startTime;
        participantChoice = 'easy';
        currentAddition   = 0;
        proceedToMathTask();
    };
    difficultEl.onclick = () => {
        decisionTime      = Date.now() - startTime;
        participantChoice = 'difficult';
        currentAddition   = chosenAddition;
        proceedToMathTask();
    };
}



function proceedToNextTrial(){
    trialIndex++;                    // always move forward exactly one
    console.log(`✅ answered ${trialIndex} / ${trialList.length}`);
    displayNextTrial();
}







let trialList  = [];
let trialIndex = 0;

const REPS_PER_ROUND = 1;   // how many times to repeat each (addition, credit) combo

function buildTrialList () {
    trialList  = [];
    trialIndex = 0;

    // 1. create all unique (addition × credit) combos
    const baseCombos = [];
    additions.forEach(a => {
        credits.forEach(c => {
            baseCombos.push({
                receiver: 'Self',   // or 'You' or '' – it's just logged now
                addition: a,
                credit: c
            });
        });
    });

    // 2. repeat them REPS_PER_ROUND times
    for (let r = 0; r < REPS_PER_ROUND; r++) {
        baseCombos.forEach(combo => {
            trialList.push({ ...combo });
        });
    }

    // 3. shuffle final trial list
    shuffleArray(trialList);

    console.log(`📝 Final trial list built – ${trialList.length} trials`);
}






/* Fisher-Yates */
function shuffleArray(arr){
    for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
    }
}

// Function to get three random numbers between 1 to 9
function generateRandomNumbers() {
    let numbers = [];
    for (let i = 0; i < 3; i++) {
        numbers.push(Math.floor(Math.random() * 9) + 1);
    }
    shownNumbers = numbers;
    return numbers;
}

// Function to calculate the correct and incorrect answers based on chosen addition and generated numbers
function calculateAnswers(numbers) {
    correctAnswer = numbers.map(num => {
        let result = num + currentAddition;
        
        // If result goes over 9, take the last digit
        if(result > 9) {
            result = result % 10; 
        }
        
        return result;
    });
    
    // Randomly pick a number to make it incorrect for incorrectAnswer
    let randomIndex = Math.floor(Math.random() * 3);
    let offset = Math.random() < 0.5 ? 1 : -1;
    incorrectAnswer = [...correctAnswer];
    //incorrectAnswer[randomIndex] = (incorrectAnswer[randomIndex] + offset + 10) % 10;
    incorrectAnswer[randomIndex] = Math.random() < 0.5 
    ? (incorrectAnswer[randomIndex] + 1) % 10 // Ensuring that incorrect answer is also in range 0-9
    : (incorrectAnswer[randomIndex] - 1 + 10) % 10; // Ensuring that we don't go below 0
}

//  Proceed to Math Task
function proceedToMathTask() {
    
    // Hide the choice options
    easyEl.style.display = 'none';
    difficultEl.style.display = 'none';

    // Ensure mathTaskEl is in the flow of the document
    mathTaskEl.style.display = 'block';


    // Show the addition value
    additionValueEl.textContent = `+${currentAddition}`;
    additionValueEl.style.display = 'block';

    const numbers = generateRandomNumbers();
    calculateAnswers(numbers);

    let currentIndex = 0;
    const showNumber = () => {
        mathTaskEl.textContent = numbers[currentIndex];
        mathTaskEl.style.opacity = '1';
        
        setTimeout(() => {
            mathTaskEl.style.opacity = '0';
            currentIndex++;
            
            if (currentIndex < numbers.length) {
                setTimeout(showNumber, 300);
            } else {
                displayAnswerOptions();
            }
        }, 300);
    };
    
    setTimeout(showNumber, 300);
}

//  Display Answer Options
function displayAnswerOptions() {
    // Hide the addition value
    additionValueEl.style.display = 'none';
    receiverEl.textContent = "What is the correct answer?"; // Set message here

    // Randomly decide if the correct answer should be on the left or right
    let isCorrectOnLeft = Math.random() < 0.5;

    correctAnswerEl.onclick = null; // Removing previous listener
    incorrectAnswerEl.onclick = null; // Removing previous listener

    if (isCorrectOnLeft) {
        correctPosition = 'left';
        correctAnswerEl.textContent = correctAnswer.join(' ');
        incorrectAnswerEl.textContent = incorrectAnswer.join(' ');

        correctAnswerEl.onclick = () => {
            answerDecisionTime = new Date().getTime() - answerStartTime;
            checkAnswer(true);
        };
        incorrectAnswerEl.onclick = () => {
            answerDecisionTime = new Date().getTime() - answerStartTime;
            checkAnswer(false);
        };
    } else {
        correctPosition = 'right';
        correctAnswerEl.textContent = incorrectAnswer.join(' ');
        incorrectAnswerEl.textContent = correctAnswer.join(' ');

        correctAnswerEl.onclick = () => {
            answerDecisionTime = new Date().getTime() - answerStartTime;
            checkAnswer(false);
        };
        incorrectAnswerEl.onclick = () => {
            answerDecisionTime = new Date().getTime() - answerStartTime;
            checkAnswer(true);
        };
    }

    answersEl.style.display = 'flex';

     // Clear any existing timeout
     if (timeoutId !== null) {
        clearTimeout(timeoutId);
    }

       // Set a timer to mark the answer as wrong after 7 seconds
       timeoutId = setTimeout(() => {
        timedOut = true; // Mark as timed out
        checkAnswer(false);
    }, 7000);

   // Set the start time when answer options are displayed
   answerStartTime = new Date().getTime();
}


// Check if the given answer is correct
let isAnswerCorrect = false;
function checkAnswer(isCorrect) {
    clearTimeout(timeoutId);           // stop the auto-fail timer
    timeoutId = null;

    feedbackEl.style.display = 'block';
    answersEl.style.display  = 'none';
    receiverEl.style.display = 'none';

    // ── credits earned this trial ───────────────────────────
    let creditsEarned = 0;
    if (isCorrect) {
        if (participantChoice === 'easy')      creditsEarned = 1;           // always 1
        else                                    creditsEarned = chosenCredits;
    }

    // ── add to running totals ───────────────────────────────
    if (creditsEarned > 0) {
        if (currentTrial.receiver === 'Self')   creditsSelf    += creditsEarned;
        else                                    creditsCharity += creditsEarned;
    }

    // ── feedback text ───────────────────────────────────────
    const fb =  timedOut  ? 'Timed out!'
              : isCorrect ? 'Correct!'
              :             'Incorrect!';
    feedbackEl.innerHTML = `${fb}<br><br><span style="font-size:.8em;">${creditsEarned} credits</span>`;

    // ── log trial data ──────────────────────────────────────
    trialResults.push({
        trialNumber          : currentTrial.trialNumber,
        receiver             : currentTrial.receiver,
        easy_addition        : 0,
        easy_credits         : 1,
        difficult_addition   : chosenAddition,
        difficult_credits    : chosenCredits,
        choice               : participantChoice,
        answer               : correctAnswer.join(' '),
        answer_correct       : isCorrect,
        shown_numbers        : shownNumbers.join(' '),
        incorrect_option     : incorrectAnswer.join(' '),
        correct_position     : correctPosition,
        time_to_decision     : decisionTime,
        timedOut             : timedOut,
        answer_time_to_decision : answerDecisionTime
    });
    timedOut = false;

    const interimTimestamp = new Date();
    generateCSV(
      trialResults,
      participantUniqueKey,
      participantSID,
      timestamp1,
      interimTimestamp
    );

    // ── short ISI, then next trial ──────────────────────────
    setTimeout(() => {
        feedbackEl.style.display = 'none';
        fixationCrossEl.style.display = 'block';
        setTimeout(() => {
            fixationCrossEl.style.display = 'none';
            receiverEl.style.display = 'block';
            easyEl.style.display = 'block';
            difficultEl.style.display = 'block';
            proceedToNextTrial();
        }, 500);
    }, 1000);
}




// Converts the data array to CSV format and triggers a download
function generateCSV(trialResults, participantUniqueKey, participantSID, timestamp1, timestamp2) {

    const header = [
        "participantSID","startTime","finishTime","TrialNumber","uniqueKey",
        "receiver","easy_addition","easy_credits","difficult_addition",
        "difficult_credits","choice","answer","answer_correct","shown_numbers",
        "incorrect_option","correct_position","time_to_decision",
        "answer_time_to_decision","timedOut",
        "credits_self_total","credits_charity_total",
        "actual_donated_tickets","attempted_donation",
        "self_trial_preference","charity_trial_preference", "allocationPercentage"
    ];
    const csvRows = [header];

    for (const item of trialResults) {
        csvRows.push([
            participantSID,
            timestamp1,
            timestamp2,
            item.trialNumber,
            participantUniqueKey,
            item.receiver,
            item.easy_addition,
            item.easy_credits,
            item.difficult_addition,
            item.difficult_credits,
            item.choice,
            item.answer,
            item.answer_correct,
            item.shown_numbers,
            item.incorrect_option,
            item.correct_position,
            item.time_to_decision,
            item.answer_time_to_decision,
            item.timedOut,
            creditsSelf,
            creditsCharity,
            donatedTickets,
            attemptedDonation,
            selfTrialPreference,
            charityTrialPreference,
            selectedAllocation
        ]);
    }

    const csvContent = csvRows.map(e => e.join(",")).join("\n");

    // Upload to serverless function
    const uploadUrl = '/.netlify/functions/upload-csv'; 

    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    // xhr.setRequestHeader('Content-Type', 'text/csv;charset=utf-8');
  // Retrieve SID value for filename and current date
      //const filename = participantSID;
      //xhr.setRequestHeader('X-Filename', filename);
            const currentDate = new Date(); //new stuff (next 3 lines too)
            //const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
            const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}_${String(currentDate.getHours()).padStart(2, '0')}`;
            const filename = `${participantSID}_${formattedDate}`;
            xhr.setRequestHeader('X-Filename', filename);

    xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        if (xhr.status === 200) {
          console.log('File uploaded successfully:');
        } else {
          console.error('Error uploading file:', xhr.responseText);
        }
      }
    };
    xhr.send(csvContent);

    console.log(csvContent);
    // Create a Blob object with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
    // Create a link element, and set its attributes
    const link = document.createElement("a");
  
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "trial_results.csv");
  
    // Append the link to the DOM and simulate a click to start the download
    document.body.appendChild(link);
    //link.click();
  
    // Remove the link from the DOM
    document.body.removeChild(link);
}


// Ending the experiment
function generateUniqueKey() {
    const length = 16;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
const participantUniqueKey = generateUniqueKey();

function endExperiment() {

    const timestamp2 = new Date();
    const container  = document.querySelector('.experiment-container');

    container.innerHTML = `
        <div class="donation-screen" style="
            max-width:500px;margin:40px auto;text-align:center;
            background:#fff;padding:30px;border-radius:10px;
            box-shadow:0 4px 12px rgba(0,0,0,.1);">
            <h2 style="margin-top:0;">Congratulations!</h2>
            <p style="font-size:1.1rem;">
                You earned <strong>${creditsSelf}</strong> tickets for yourself.<br>
            </p>
            <br>
            <button id="donationConfirm" class="box"
                    style="margin-top:20px;">Next</button>
        </div>
    `;

    document.getElementById('donationConfirm').onclick = () => {
        // Capture the raw attempted donation before clamping
        const attempted = parseInt(document.getElementById('donationInput').value, 10) || 0;
        attemptedDonation = attempted;

        // Now enforce that they can’t donate more than they have
        donatedTickets   = Math.max(0, Math.min(attempted, creditsSelf));
        creditsSelf     -= donatedTickets;
        creditsCharity  += donatedTickets;
        showKeyScreen(); // proceed to final screen & CSV
    };

    function showKeyScreen() {
        const t2 = new Date();
        container.innerHTML = `
            <div class="content-text" style="text-align:center;">
                <h2>Task Key:</h2><br>
                <p>
                  <strong><u id="uniqueKey">${participantUniqueKey}</u></strong><br><br>
                  <button class="box" onclick="copyToClipboard()">Click to Copy</button><br><br>
                  Please paste this code <u><strong>at the bottom of the screen</strong></u>
                  to prove you have completed this exercise.
                </p>
            </div>
        `;
        const sc = document.createElement('script');
        sc.textContent = `
            function copyToClipboard(){
                const txt = document.getElementById("uniqueKey").textContent;
                navigator.clipboard.writeText(txt).then(() => alert("Key copied!"));
            }
        `;
        document.body.appendChild(sc);

        generateCSV(trialResults, participantUniqueKey, participantSID, timestamp1, t2);
    }
}




 

//CHEAT CODE (to update):
// <navigate to folder first>
// git status
// git add .                               (preparing all new changes to be added)
// git commit -m "Your commit message"     (commiting changes)
// git push
// npx netlify deploy --prod               (deploy to website)
// to check new files, go to AWS S3 (amazon), buckets, emotionregulation

// or in short:         git add . && git commit -m "update" && git push && npx netlify deploy --prod

// data: https://us-east-1.console.aws.amazon.com/console/home?region=us-east-1#  --> console home --> S3 service --> emotionregulation bucket --> same name folder --> files 




// Initialize the experiment
start();
