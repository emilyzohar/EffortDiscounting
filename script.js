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
const introScreen     = document.getElementById('introScreen');
const introText       = document.getElementById('introText');
const startPracticeBtn = document.getElementById('startPracticeBtn');
const taskUI          = document.getElementById('taskUI');
const instructionsScreen = document.getElementById('instructionsScreen');

const postTaskScreen = document.getElementById('postTaskScreen');
const postTaskForm   = document.getElementById('postTaskForm');

// Multi-page navigation for post-task form
document.addEventListener('DOMContentLoaded', () => {
  const postPages = document.querySelectorAll('.postPage');
  const postNextButtons = document.querySelectorAll('.postNext');

  postNextButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const currentPage = e.target.closest('.postPage');
      const nextId = e.target.dataset.next;
      const nextPage = document.getElementById(nextId);

      if (!currentPage || !nextPage) return;

      // Optionally: simple per-page check for required items on that page only
      const requiredOnPage = currentPage.querySelectorAll('input[required]');
      for (const input of requiredOnPage) {
        const name = input.name;
        const checked = currentPage.querySelector(`input[name="${name}"]:checked`);
        if (!checked) {
          alert('Please answer all questions on this page before continuing.');
          return;
        }
      }

      currentPage.style.display = 'none';
      nextPage.style.display = 'block';
    });
  });
});

let postTaskResponses = {};


let effortBeliefs = {
  bad: null,
  good: null,
  help_progress: null,
  stop_progress: null,
  goals: null
};


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
let endTimestamp = null; 
let creditsSelf    = 0;
let creditsCharity = 0;
let donatedTickets = 0;
let selfFrac = 0.5; 
let attemptedDonation = 0;
let selfTrialPreference  = 0;
let charityTrialPreference = 0;
let participantChoice = null;




const receivers = ['Self']; //  For testing...
const additions = [1, 3, 7]; // , 3, 7
const credits = [2, 4, 8]; //, 4, 8

/* ───────────────── Allocation control ───────────────── */
let allocationPercentage = 50;          // 25, 50, or 75
let impactedReceiver   = 'Both';        // 'Self', 'Charity', or 'Both'
let roundAssignments   = [];            // e.g., ['custom','fixed', ...] length = 4


let participantSID = null;

function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function initParticipant() {
  const sidFromUrl = getUrlParam('sid');  // e.g., ?sid=ABC123 in the URL
  if (sidFromUrl && sidFromUrl.trim() !== '') {
    participantSID = sidFromUrl.trim();
  } else {
    participantSID = prompt("Please enter your Connect ID:", "");
  }
  console.log("SID:", participantSID);
}

let phase = 'practice';   // 'practice' or 'main'


function start() {
  initParticipant();
  showIntroScreen();   // first screen is the message
}




function getIntroMessage() {
  const msgFromUrl = getUrlParam('msg');
  if (msgFromUrl && msgFromUrl.trim() !== '') {
    return decodeURIComponent(msgFromUrl);
  }

  const cond = getUrlParam('cond');

  // Condition 1: Effort reappraisal
  if (cond === '1') {
    return `
  <!-- PAGE 1 -->
  <div id="page1" class="page">
    <p>When people work hard on a task, it’s completely normal to feel a mix of emotions and sensations.</p>

    <p>
      You might notice a sense of <strong>challenge, a boost in focus, or moments of frustration, fatigue, stress, or irritation.</strong>
      These reactions can feel intense, but they’re also <strong>signs that you’re actively moving toward your goal.</strong>
    </p>

    <p>
      They show that your mind and body are engaged and using their resources to help you perform well.
    </p>

    <button class="nextBtn" data-next="page2">Next</button>
  </div>

  <!-- PAGE 2 -->
  <div id="page2" class="page" style="display:none;">
    <p>
      Think of it like the body’s <em>fight-or-flight response</em>: when something matters and requires effort, your system shifts into a more alert, energized state.
    </p>

    <p>
      Research shows that as tasks become more demanding, people naturally experience increased attention and reduced boredom—a shift into deeper engagement.
    </p>

    <p>
      Feelings like stress or pressure often show up alongside this, not because you’re failing or incapable, but because your system is mobilizing energy and focus to support what you’re doing.
      People experience these sensations even when they have more than enough ability to succeed.
    </p>

    <button class="nextBtn" data-next="page3">Next</button>
  </div>

  <!-- PAGE 3 -->
  <div id="page3" class="page" style="display:none;">
    <p>
      As you begin the next task, keep in mind that the <strong>feelings that come with effort are there to support you</strong>—they’re part of how your body and mind help you rise to a challenge.
    </p>

    <button id="finalNext">Next</button>
  </div>
    `;
  }

  // Condition 2: Neutral (no reappraisal, no “effort is bad/good”)
  else {
    return `
  <!-- PAGE 1 -->
  <div id="page1" class="page">
    <p>People often have a range of reactions when they work on tasks.</p>

    <p>
      These reactions can vary from person to person and from task to task.
    </p>

    <p>
      What someone experiences during a task can depend on many factors, including the type of task, the environment, and their own habits or preferences.
    </p>

    <button class="nextBtn" data-next="page2">Next</button>
  </div>

  <!-- PAGE 2 -->
  <div id="page2" class="page" style="display:none;">
    <p>
      Everyday tasks can differ in how engaging or routine they feel. Some tasks involve paying closer attention, while others are more automatic.
    </p>

    <p>
      There is natural variation in how people approach tasks — some prefer to work quickly, others more slowly. None of these patterns are necessarily better or worse.
    </p>

    <button class="nextBtn" data-next="page3">Next</button>
  </div>

  <!-- PAGE 3 -->
  <div id="page3" class="page" style="display:none;">
    <p>
      Continue on to the activity.
    </p>

    <button id="finalNext">Next</button>
  </div>
    `;
  }

  // Default fallback if no cond or unknown cond
  return `
    <div class="page">
      <p>You’ll now complete a short practice version of the task to get familiar with it. After practice, the real trials will begin.</p>
      <button id="finalNext">Next</button>
    </div>
  `;
}




// Handle clicks on any .nextBtn inside the intro pages
// Handle clicks on any .nextBtn inside the intro pages
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".postNext");
  if (!btn) return;

  const nextID = btn.dataset.next;
  if (!nextID) return;

  // Hide all post pages
  document.querySelectorAll("#postTaskScreen .postPage")
    .forEach(pg => pg.style.display = "none");

  // Show target page
  const nextPage = document.getElementById(nextID);
  nextPage.style.display = "block";
});



function showIntroScreen() {
  const msg  = getIntroMessage();
  const cond = getUrlParam('cond');

  introText.innerHTML = msg;
  introScreen.style.display        = 'block';
  instructionsScreen.style.display = 'none';
  taskUI.style.display             = 'none';

  const introNextBtn = document.getElementById('introNextBtn');
  if (introNextBtn) introNextBtn.style.display = 'none'; // we only use inline buttons

  // --- NEW: wire page navigation *after* HTML is injected ---

  // Make sure only page1 is visible to start
  const pages = introScreen.querySelectorAll('.page');
  pages.forEach(p => p.style.display = 'none');
  const firstPage = document.getElementById('page1');
  if (firstPage) firstPage.style.display = 'block';

  // Attach click handlers to each .nextBtn
  const pageNextButtons = introScreen.querySelectorAll('.nextBtn');
  pageNextButtons.forEach(btn => {
    btn.type = 'button';   // make sure it doesn't behave like submit anywhere
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const nextId = btn.dataset.next;
      if (!nextId) return;

      pages.forEach(p => p.style.display = 'none');
      const nextPage = document.getElementById(nextId);
      if (nextPage) nextPage.style.display = 'block';
    });
  });

  // Final Next: move on to pre-task survey
  const finalNextBtn = document.getElementById('finalNext');
  if (finalNextBtn) {
    finalNextBtn.type = 'button';
    finalNextBtn.onclick = (e) => {
      e.preventDefault();
      introScreen.style.display = 'none';
      showEffortSurvey();
    };
  }
}


const effortSurveyScreen = document.getElementById('effortSurveyScreen');
const effortSurveyForm   = document.getElementById('effortSurveyForm');

function showEffortSurvey() {
  effortSurveyScreen.style.display = 'block';
  instructionsScreen.style.display = 'none';
  taskUI.style.display             = 'none';
}

// handle survey submission
if (effortSurveyForm) {
  effortSurveyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(effortSurveyForm);
    effortBeliefs.bad           = formData.get('bad');
    effortBeliefs.good          = formData.get('good');
    effortBeliefs.help_progress = formData.get('help_progress');
    effortBeliefs.stop_progress = formData.get('stop_progress');
    effortBeliefs.goals         = formData.get('goals');

    console.log('Effort beliefs:', effortBeliefs);

    // hide survey, go to your existing instructions + practice flow
    effortSurveyScreen.style.display = 'none';
    showInstructionsScreen();
  });
}

function showInstructionsScreen() {
    instructionsScreen.style.display = 'block';
    introScreen.style.display = 'none';

    startPracticeBtn.onclick = () => {
        instructionsScreen.style.display = 'none';
        taskUI.style.display = 'block';

        buildPracticeTrialList();
        displayNextTrial();
    };
}



let trialList  = [];
let trialIndex = 0;

function buildPracticeTrialList() {
  trialList  = [];
  trialIndex = 0;

  // 4 simple practice trials
  trialList.push({ receiver: 'Practice', addition: 1, credit: 2 });
  trialList.push({ receiver: 'Practice', addition: 3, credit: 2 });
  trialList.push({ receiver: 'Practice', addition: 1, credit: 4 });
  trialList.push({ receiver: 'Practice', addition: 3, credit: 4 });

  shuffleArray(trialList);

  console.log('🔧 Practice trials built:', trialList);
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

        buildMainTrialList();       
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









const REPS_PER_ROUND = 2;   // how many times to repeat each (addition, credit) combo

function buildMainTrialList () {
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
    "self_trial_preference","charity_trial_preference","allocationPercentage",
    // PRE-TASK effort beliefs
    "pre_bad","pre_good","pre_help_progress","pre_stop_progress","pre_goals",
    // POST-TASK items
    "post_meaning_1","post_meaning_2",
    "post_risk_1","post_risk_2",
    "post_effort_1","post_effort_2",
    "post_demand_1","post_demand_2",
    "post_pleasant_1","post_pleasant_2",
    "post_pride","post_encouraged",
    "post_challenge","post_stressed",
    "post_frustrated","post_fatigued",
    "post_bored","post_overwhelmed"
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
      allocationPercentage,
      // PRE questionnaire (from effortSurveyForm)
      effortBeliefs.bad           ?? "",
      effortBeliefs.good          ?? "",
      effortBeliefs.help_progress ?? "",
      effortBeliefs.stop_progress ?? "",
      effortBeliefs.goals         ?? "",
      // POST questionnaire (from postTaskForm)
      postTaskResponses.meaning_1       ?? "",
      postTaskResponses.meaning_2       ?? "",
      postTaskResponses.risk_1     ?? "",
      postTaskResponses.risk_2 ?? "",
      postTaskResponses.effort_1     ?? "",
      postTaskResponses.effort_2 ?? "",
      postTaskResponses.demand_1     ?? "",
      postTaskResponses.demand_2 ?? "",
      postTaskResponses.pleasant_1     ?? "",
      postTaskResponses.pleasant_2 ?? "",
      postTaskResponses.pride ?? "",
      postTaskResponses.encouraged ?? "",
      postTaskResponses.challenge ?? "",
      postTaskResponses.stressed ?? "",
      postTaskResponses.frustrated ?? "",
      postTaskResponses.fatigued ?? "",
      postTaskResponses.bored ?? "",
      postTaskResponses.overwhelmed ?? ""
    ]);
  }



  const csvContent = csvRows.map(e => e.join(",")).join("\n");

  // ----- build filename (same logic you had) -----
  const currentDate = new Date();
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}_${String(currentDate.getHours()).padStart(2, '0')}`;
  const filename = `${participantSID}_${formattedDate}.csv`;

  // ===== SEND TO DATAPIPE (no Netlify, no AWS) =====
  fetch("https://pipe.jspsych.org/api/data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      experimentID: "R7hDnmaVe5J0",   // your DataPipe experiment ID
      filename: filename,
      data: csvContent                // raw CSV string
    })
  })
  .then(response => response.json())
  .then(json => {
    if (json.message === "Success") {
      console.log("✅ DataPipe upload success:", json);
    } else {
      console.error("⚠️ DataPipe error:", json);
    }
  })
  .catch(err => {
    console.error("❌ DataPipe upload failed:", err);
  });

  // (optional) also log CSV locally for debugging
  console.log(csvContent);

  // OPTIONAL: keep local download for backup
  /*
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "trial_results.csv");
  document.body.appendChild(link);
  // link.click();
  document.body.removeChild(link);
  */
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


// handle post-task survey submission
function showPostTaskScreen() {
  console.log('showPostTaskScreen called');
  console.log('postTaskScreen is', postTaskScreen);
  postTaskScreen.style.display = 'block';
}

if (postTaskForm) {
  console.log('postTaskForm found:', postTaskForm);

  postTaskForm.addEventListener('submit', (e) => {
    console.log('🔥 postTaskForm submit event fired');

    // At this point, ALL required fields must be filled.
    // If any were missing, this handler would never run.

    e.preventDefault();

    const formData = new FormData(postTaskForm);
    postTaskResponses = Object.fromEntries(formData.entries());
    console.log('Post-task responses:', postTaskResponses);

    generateCSV(
      trialResults,
      participantUniqueKey,
      participantSID,
      timestamp1,
      endTimestamp
    );

    const container = document.querySelector('.experiment-container');
    postTaskScreen.style.display = 'none';

    container.innerHTML = `
      <div class="content-text" style="text-align:center;">
        <h2 style="margin-top:0;">Congratulations!</h2>
        <p style="font-size:1.1rem;">
          You earned <strong>${creditsSelf}</strong> tickets for yourself.<br>
        </p>
        <p>Thank you for participating!</p>
        <button class="box" id="continueBtn">Continue</button>
      </div>
    `;

    document.getElementById("continueBtn").onclick = () => {
      window.location.href = "https://google.com";
    };
  });
} else {
  console.warn('⚠️ postTaskForm is null when script ran');
}



function endExperiment() {
  const container  = document.querySelector('.experiment-container');

  // If we're just finishing practice, go to real task
  if (phase === 'practice') {
    // Hide task UI
    taskUI.style.display = 'none';

    // Show practice end screen
    const practiceEndScreen = document.getElementById('practiceEndScreen');
    practiceEndScreen.style.display = 'block';

    document.getElementById('startRealBtn').onclick = () => {
      phase        = 'main';
      timestamp1   = new Date();  // reset start time for real task
      trialResults = [];          // clear out practice data

      // Hide practice end screen and show task UI
      practiceEndScreen.style.display = 'none';
      taskUI.style.display            = 'block';

      receiverEl.style.display  = 'block';
      easyEl.style.display      = 'block';
      difficultEl.style.display = 'block';

      buildMainTrialList();
      displayNextTrial();
    };
    return;
  }

  // ── MAIN TASK END ─────────────────────────────
  endTimestamp = new Date();          // store finish time for CSV

  // Hide task UI and show post-task questions
  taskUI.style.display = 'none';
  showPostTaskScreen();
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
