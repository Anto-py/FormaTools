/* ============================================================
   Outils Formateur — Side Panel JS
   ============================================================ */

// ============================================================
// PHASES PÉDAGOGIQUES
// ============================================================

const phaseButtons = document.querySelectorAll('.phase-btn');
let activePhase = null;

phaseButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const phase = btn.dataset.phase;

    if (activePhase === phase) {
      // Désélection
      activePhase = null;
      phaseButtons.forEach(b => b.classList.remove('active', 'inactive'));
    } else {
      activePhase = phase;
      phaseButtons.forEach(b => {
        if (b.dataset.phase === phase) {
          b.classList.add('active');
          b.classList.remove('inactive');
        } else {
          b.classList.remove('active');
          b.classList.add('inactive');
        }
      });
    }
    broadcastState();
  });
});

// ============================================================
// BROADCAST — chrome.storage.session → content script overlay
// ============================================================

function broadcastState() {
  if (!chrome?.storage?.session) return;

  const projectedItems = [];
  document.querySelectorAll('.parking-item[data-projected="true"]').forEach(item => {
    projectedItems.push({
      id:   item.dataset.id,
      text: item.querySelector('.parking-item-text').textContent
    });
  });

  chrome.storage.session.set({
    formatools: {
      phase: activePhase,
      timer: timerState === 'idle' ? null : {
        state:            timerState,
        remainingSeconds: timerSeconds,
        totalSeconds:     timerTotalSeconds
      },
      projectedItems
    }
  });
}

// Efface l'overlay quand le side panel est fermé
window.addEventListener('unload', () => {
  chrome?.storage?.session?.set({ formatools: { phase: null, timer: null } });
});

// ============================================================
// AUDIO — Web Audio API (100% offline)
// ============================================================

function playAlert() {
  // Alerte 1min : bip doux, discret
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start();
  osc.stop(ctx.currentTime + 0.8);
}

function playEnd() {
  // Fin de timer : 3 bips descendants, plus marqués
  const ctx = new AudioContext();
  [520, 440, 360].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.35;
    gain.gain.setValueAtTime(0.4, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

// ============================================================
// MINUTEUR
// ============================================================

const timerIdle   = document.getElementById('timer-idle');
const timerActive = document.getElementById('timer-active');
const timerDisplay = document.getElementById('timer-display');
const timerDurationInput = document.getElementById('timer-duration');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');

let timerInterval    = null;
let timerSeconds     = 0;
let timerTotalSeconds = 0;
let timerState       = 'idle'; // idle | running | paused | ended
let alertedOneMin    = false;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function startTimer() {
  const minutes = parseInt(timerDurationInput.value, 10);
  if (isNaN(minutes) || minutes < 1 || minutes > 99) return;

  timerSeconds      = minutes * 60;
  timerTotalSeconds = timerSeconds;
  alertedOneMin     = false;
  timerState        = 'running';

  timerDisplay.textContent = formatTime(timerSeconds);
  timerDisplay.classList.remove('warning', 'ended');
  btnPause.textContent = '⏸ Pause';
  btnPause.classList.remove('hidden');

  timerIdle.classList.add('hidden');
  timerActive.classList.remove('hidden');

  timerInterval = setInterval(tick, 1000);
  broadcastState();
}

function tick() {
  timerSeconds--;
  timerDisplay.textContent = formatTime(timerSeconds);

  // Alerte 1 minute restante
  if (timerSeconds === 60 && !alertedOneMin) {
    alertedOneMin = true;
    timerDisplay.classList.add('warning');
    playAlert();
  }

  // Fin du timer
  if (timerSeconds <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds  = 0;
    timerState    = 'ended';

    timerDisplay.textContent = '00:00';
    timerDisplay.classList.add('ended');
    btnPause.classList.add('hidden');
    playEnd();
  }

  broadcastState();
}

function pauseResumeTimer() {
  if (timerState === 'running') {
    clearInterval(timerInterval);
    timerInterval = null;
    timerState    = 'paused';
    btnPause.textContent = '▶ Reprendre';
  } else if (timerState === 'paused') {
    timerState    = 'running';
    btnPause.textContent = '⏸ Pause';
    timerInterval = setInterval(tick, 1000);
  }
  broadcastState();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerState    = 'idle';
  timerSeconds  = 0;
  alertedOneMin = false;

  timerDisplay.classList.remove('warning', 'ended');
  btnPause.classList.remove('hidden');
  timerActive.classList.add('hidden');
  timerIdle.classList.remove('hidden');
  broadcastState();
}

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseResumeTimer);
btnReset.addEventListener('click', resetTimer);

// ============================================================
// PARKING LOT
// ============================================================

const parkingTextInput = document.getElementById('parking-input');
const parkingList      = document.getElementById('parking-list');
const btnAddParking    = document.getElementById('btn-add-parking');

function addParkingItem() {
  const text = parkingTextInput.value.trim();
  if (!text) return;

  const li = document.createElement('li');
  li.className = 'parking-item';
  li.dataset.id = Date.now().toString();
  li.dataset.projected = 'false';

  // Bouton : projeter sur la fenêtre de navigation
  const btnProject = document.createElement('button');
  btnProject.className = 'parking-item-project';
  btnProject.textContent = '▣';
  btnProject.setAttribute('aria-label', 'Projeter');
  btnProject.addEventListener('click', () => {
    const isProjected = li.dataset.projected === 'true';
    li.dataset.projected = (!isProjected).toString();
    li.classList.toggle('projected', !isProjected);
    btnProject.classList.toggle('projected', !isProjected);
    broadcastState();
  });

  const span = document.createElement('span');
  span.className = 'parking-item-text';
  span.textContent = text;

  const btnDelete = document.createElement('button');
  btnDelete.className = 'parking-item-delete';
  btnDelete.textContent = '✕';
  btnDelete.setAttribute('aria-label', 'Supprimer');
  btnDelete.addEventListener('click', () => {
    li.remove();
    broadcastState(); // retire de l'overlay si elle était projetée
  });

  li.appendChild(btnProject);
  li.appendChild(span);
  li.appendChild(btnDelete);
  parkingList.appendChild(li);

  parkingTextInput.value = '';
  parkingTextInput.focus();
  li.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

btnAddParking.addEventListener('click', addParkingItem);

parkingTextInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addParkingItem();
});
