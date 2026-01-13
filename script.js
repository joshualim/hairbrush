// State
const state = {
    selectedAvatar: null,
    musicUrl: null,
    currentStepIndex: 0,
    startTime: 0,
    timeRemaining: 0,
    timerInterval: null,
    isPaused: false,
    totalDuration: 0 // of current step
};

// Brushing Routine Steps
const brushingSteps = [
    {
        title: "Start at the Ends",
        description: "Gently brush the very bottom tips of your hair",
        duration: 30,
        stage: 1
    },
    {
        title: "Move to the Middle",
        description: "Brush starting from the middle down to the ends.",
        duration: 30,
        stage: 2
    },
    {
        title: "From the Top",
        description: "Now brush from the roots all the way down.",
        duration: 30,
        stage: 3
    },
    {
        title: "Magic Shine",
        description: "Smooth everything out to make it super shiny!",
        duration: 20,
        stage: 4
    }
];

// Tracks
const tracks = [
    { title: "Fresh", file: "fresh.mp3", icon: "🍃" },
    { title: "Gardens", file: "gardens-stylish-chill.mp3", icon: "🏡" },
    { title: "Goldshire", file: "goldshire.mp3", icon: "✨" },
    { title: "Honey Kisses", file: "honey-kisses.mp3", icon: "🍯" },
    { title: "Free Spirit", file: "music-free.mp3", icon: "🕊️" },
    { title: "Patents", file: "patents.mp3", icon: "💡" },
    { title: "September", file: "september.mp3", icon: "🍂" }
];

// DOM Elements - Selected immediately (Script is at end of body)
const screens = {
    setup: document.getElementById('setup-screen'),
    active: document.getElementById('active-screen'),
    completion: document.getElementById('completion-screen')
};

// Event Listeners
const selectionContainer = document.querySelector('.avatar-selection');
const songGrid = document.getElementById('song-grid');
const musicInput = document.getElementById('music-file');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const pauseBtn = document.getElementById('pause-btn');
const skipBtn = document.getElementById('skip-btn');
const restartBtn = document.getElementById('restart-btn');
const bgMusic = document.getElementById('bg-music');

// UI Updaters
const currentBuddyImg = document.getElementById('current-buddy');
const finalBuddyImg = document.getElementById('final-buddy');
const stepTitle = document.getElementById('step-title');
const stepDesc = document.getElementById('step-desc');
const timerText = document.getElementById('time-left');
const progressCircle = document.querySelector('.progress-ring__circle--value');

let circleRadius = 52;
let circumference = 326.72;

if (progressCircle) {
    circleRadius = progressCircle.r.baseVal.value;
    circumference = circleRadius * 2 * Math.PI;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;
}

// Logic

if (selectionContainer) {
    selectionContainer.addEventListener('click', (e) => {
        // Use event delegation to find the clicked option
        const option = e.target.closest('.avatar-option');
        if (!option) return; // Clicked in the gap between items

        console.log("Avatar selected:", option.dataset.avatar);

        // UI Update
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // State Update
        state.selectedAvatar = option.dataset.avatar;

        // Image Update (Use Stage 1 for setup)
        const imgSrc = `assets/avatar_${state.selectedAvatar}_stage1.png`;
        if (currentBuddyImg) currentBuddyImg.src = imgSrc;
        if (finalBuddyImg) finalBuddyImg.src = imgSrc;

        checkReadyToStart();
    });
} else {
    console.error("Selection container not found!");
}

// Render Song Grid
if (songGrid) {
    tracks.forEach(track => {
        const el = document.createElement('div');
        el.className = 'song-option';
        el.dataset.file = track.file;
        el.innerHTML = `
            <div class="song-icon">${track.icon}</div>
            <div class="song-title">${track.title}</div>
        `;
        songGrid.appendChild(el);
    });

    songGrid.addEventListener('click', (e) => {
        const option = e.target.closest('.song-option');
        if (!option) return;

        // Clear file input if any
        if (musicInput) musicInput.value = '';
        document.getElementById('file-name').textContent = "No music selected";

        // UI Update
        document.querySelectorAll('.song-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // State Update
        state.musicUrl = `tracks/${option.dataset.file}`;
        bgMusic.src = state.musicUrl;

        // Basic pre-load (optional but good practice)
        bgMusic.load();
    });
}

if (musicInput) {
    musicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Clear grid selection
            if (songGrid) {
                document.querySelectorAll('.song-option').forEach(opt => opt.classList.remove('selected'));
            }

            document.getElementById('file-name').textContent = file.name;
            state.musicUrl = URL.createObjectURL(file);
            bgMusic.src = state.musicUrl;
            checkReadyToStart();
        }
    });
}

function checkReadyToStart() {
    if (state.selectedAvatar) {
        startBtn.disabled = false;
    }
}

if (startBtn) startBtn.addEventListener('click', startRoutine);
if (stopBtn) stopBtn.addEventListener('click', stopRoutine);
if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
if (skipBtn) skipBtn.addEventListener('click', nextStep);
if (restartBtn) restartBtn.addEventListener('click', resetApp);

// Functions
function switchScreen(screenName) {
    Object.values(screens).forEach(s => {
        if (s) {
            s.classList.remove('active');
            s.classList.add('hidden');
        }
    });

    const target = screens[screenName];
    if (target) {
        target.classList.remove('hidden');
        // small delay to allow display:block to apply before opacity transition
        setTimeout(() => {
            target.classList.add('active');
        }, 10);
    }
}

function startRoutine() {
    state.currentStepIndex = 0;
    switchScreen('active');
    updateAvatarState(1); // Start at stage 1
    if (state.musicUrl) {
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
    }
    loadStep(0);
}

function stopRoutine() {
    clearInterval(state.timerInterval);
    bgMusic.pause();
    bgMusic.currentTime = 0;
    switchScreen('setup');
}

function resetApp() {
    stopRoutine();
}

function updateAvatarState(stage, isGlowing = false) {
    if (!state.selectedAvatar) return;

    const imgSrc = `assets/avatar_${state.selectedAvatar}_stage${stage}.png`;
    currentBuddyImg.src = imgSrc;

    // Add simple transition fade if we wanted, but replace is fine
    if (isGlowing) {
        currentBuddyImg.classList.add('avatar-glowing');
        finalBuddyImg.classList.add('avatar-glowing');
    } else {
        currentBuddyImg.classList.remove('avatar-glowing');
        finalBuddyImg.classList.remove('avatar-glowing');
    }
}

function loadStep(index) {
    if (index >= brushingSteps.length) {
        completeRoutine();
        return;
    }

    const step = brushingSteps[index];
    state.currentStepIndex = index;
    state.totalDuration = step.duration;
    state.timeRemaining = step.duration;

    stepTitle.textContent = step.title;
    stepDesc.textContent = step.description;

    // Update Avatar based on step logic
    // Step 0 -> Stage 1
    // Step 1 -> Stage 2
    // Step 2 -> Stage 3
    // Step 3 -> Stage 3 (but getting ready for finish)
    updateAvatarState(step.stage);

    updateTimerUI();
    startTimer();
}

function startTimer() {
    clearInterval(state.timerInterval);
    state.isPaused = false;
    pauseBtn.textContent = "Pause ⏸️";

    state.timerInterval = setInterval(() => {
        if (!state.isPaused) {
            state.timeRemaining--;
            updateTimerUI();

            if (state.timeRemaining <= 0) {
                // Step finished
                clearInterval(state.timerInterval);
                nextStep();
            }
        }
    }, 1000);
}

function togglePause() {
    state.isPaused = !state.isPaused;
    pauseBtn.textContent = state.isPaused ? "Resume ▶️" : "Pause ⏸️";
    if (state.isPaused) {
        bgMusic.pause();
    } else {
        if (state.musicUrl) bgMusic.play();
    }
}

function nextStep() {
    loadStep(state.currentStepIndex + 1);
}

function updateTimerUI() {
    // Text
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Ring
    const offset = circumference - (state.timeRemaining / state.totalDuration) * circumference;
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = offset;
    }
}

function completeRoutine() {
    clearInterval(state.timerInterval);

    // Show final stage (5)
    const finalImgSrc = `assets/avatar_${state.selectedAvatar}_stage5.png`;
    finalBuddyImg.src = finalImgSrc;
    finalBuddyImg.classList.add('avatar-glowing');

    switchScreen('completion');
}
