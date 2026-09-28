const storeKey = 'study-log-minutes-v1';
const timerStoreKey = 'study-log-timer-v1';
const getTodayKey = () => new Date().toISOString().slice(0, 10);
const pad = value => String(value).padStart(2, '0');
let logs = JSON.parse(localStorage.getItem(storeKey) || '{}');
let elapsed = 0;
let running = false;
let timer = null;
let sessionStartedAt = null;
let lastRecordedElapsed = 0;
let viewDate = new Date();

try {
  const savedTimer = JSON.parse(localStorage.getItem(timerStoreKey) || 'null');
  if (savedTimer) {
    elapsed = savedTimer.elapsed || 0;
    running = Boolean(savedTimer.running && savedTimer.sessionStartedAt);
    sessionStartedAt = running ? savedTimer.sessionStartedAt : null;
    lastRecordedElapsed = savedTimer.lastRecordedElapsed || elapsed;
  }
} catch {
  localStorage.removeItem(timerStoreKey);
}

const timeDisplay = document.querySelector('#timeDisplay');
const startButton = document.querySelector('#startButton');
const resetButton = document.querySelector('#resetButton');
const timerStatus = document.querySelector('#timerStatus');

function format(seconds) {
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds % 3600 / 60))}:${pad(seconds % 60)}`;
}
function formatMinutes(minutes) {
  return `${Math.floor(minutes / 60)}h ${pad(minutes % 60)}m`;
}
function getElapsed() {
  if (!running || !sessionStartedAt) return elapsed;
  return elapsed + Math.max(0, Math.floor((Date.now() - sessionStartedAt) / 1000));
}
function saveTimerState() {
  localStorage.setItem(timerStoreKey, JSON.stringify({ elapsed, running, sessionStartedAt, lastRecordedElapsed }));
}
function recordCompletedMinutes() {
  const currentElapsed = getElapsed();
  const newMinutes = Math.floor(currentElapsed / 60) - Math.floor(lastRecordedElapsed / 60);
  lastRecordedElapsed = currentElapsed;
  if (newMinutes > 0) {
    const key = getTodayKey();
    logs[key] = (logs[key] || 0) + newMinutes;
    localStorage.setItem(storeKey, JSON.stringify(logs));
    saveTimerState();
    updateTodayTotal();
    renderCalendar();
  }
  return currentElapsed;
}
function updateTodayTotal() {
  const todayTotal = document.querySelector('#todayTotal');
  if (todayTotal) {
    todayTotal.textContent = formatMinutes(logs[getTodayKey()] || 0);
  }
}
function updateTimer() { timeDisplay.textContent = format(getElapsed()); }
function tick() {
  updateTimer();
  recordCompletedMinutes();
}
function setRunning(next) {
  if (next) {
    running = true;
    sessionStartedAt = Date.now();
    timerStatus.textContent = 'You’re in focus mode';
    startButton.innerHTML = '<span class="play-icon">Ⅱ</span> Pause session';
    saveTimerState();
    timer = setInterval(tick, 1000);
    tick();
  } else {
    elapsed = recordCompletedMinutes();
    running = false;
    sessionStartedAt = null;
    clearInterval(timer); timer = null;
    timerStatus.textContent = 'Break';
    startButton.innerHTML = '<span class="play-icon">▶</span> Start Studying';
    saveTimerState();
  }
}
startButton.addEventListener('click', () => setRunning(!running));
resetButton.addEventListener('click', () => {
  if (running) setRunning(false);
  elapsed = 0;
  lastRecordedElapsed = 0;
  saveTimerState();
  updateTimer();
});

function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  const today = getTodayKey();
  document.querySelector('#monthLabel').textContent = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const grid = document.querySelector('#calendarGrid');
  grid.innerHTML = '';
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, i - offset + 1);
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const outside = date.getMonth() !== month;
    const minutes = logs[key] || 0;
    const cell = document.createElement('div');
    cell.className = `day${outside ? ' other-month' : ''}${key === today ? ' today' : ''}${minutes ? ' has-study' : ''}`;
    cell.innerHTML = `<span class="day-number">${date.getDate()}</span>${minutes ? `<span class="day-time">${formatMinutes(minutes)}</span>` : ''}`;
    grid.appendChild(cell);
  }
}
document.querySelector('#prevMonth').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); });
document.querySelector('#nextMonth').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && running) tick();
});
const quotes = [
  'Small progress is still progress.',
  'The future is built one study session at a time.',
  'Focus on the next page, not the whole book.',
  'Consistency turns effort into confidence.',
  'Your goals are waiting on the other side of today’s work.',
  'Start where you are. Use what you have. Do what you can.',
  'A little every day adds up to a lot.'
];
const dateNumber = new Date().getFullYear() * 372 + new Date().getMonth() * 31 + new Date().getDate();
document.querySelector('#dailyQuote').textContent = `“${quotes[dateNumber % quotes.length]}”`;
updateTodayTotal();
updateTimer();
renderCalendar();
if (running) {
  timerStatus.textContent = 'You’re in focus mode';
  startButton.innerHTML = '<span class="play-icon">Ⅱ</span> Pause session';
  timer = setInterval(tick, 1000);
  tick();
}
