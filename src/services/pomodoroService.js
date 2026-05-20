/**
 * PetDesk - Pomodoro Service
 * Focus timer with work/break cycles.
 */

const POMODORO_KEY = 'petdesk_pomodoro';
const POMODORO_STATS_KEY = 'petdesk_pomodoro_stats';

function loadPomodoroState() {
  try {
    const stored = localStorage.getItem(POMODORO_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    active: false,
    mode: 'work', // 'work' or 'break'
    startTime: null,
    duration: 25 * 60 * 1000, // 25 min default
    breakDuration: 5 * 60 * 1000, // 5 min default
    sessionsToday: 0,
    lastSessionDate: null,
  };
}

function savePomodoroState(state) {
  try {
    localStorage.setItem(POMODORO_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

function loadPomodoroStats() {
  try {
    const stored = localStorage.getItem(POMODORO_STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    totalSessions: 0,
    totalFocusMinutes: 0,
    streakDays: 0,
    lastStreakDate: null,
    bestStreak: 0,
  };
}

function savePomodoroStats(stats) {
  try {
    localStorage.setItem(POMODORO_STATS_KEY, JSON.stringify(stats));
  } catch (e) { /* ignore */ }
}

/**
 * Start a pomodoro session.
 */
export function startPomodoro(workMinutes = 25, breakMinutes = 5) {
  const state = loadPomodoroState();
  const today = new Date().toISOString().split('T')[0];

  if (state.lastSessionDate !== today) {
    state.sessionsToday = 0;
    state.lastSessionDate = today;
  }

  state.active = true;
  state.mode = 'work';
  state.startTime = Date.now();
  state.duration = workMinutes * 60 * 1000;
  state.breakDuration = breakMinutes * 60 * 1000;
  savePomodoroState(state);
  return state;
}

/**
 * Stop/cancel the current pomodoro.
 */
export function stopPomodoro() {
  const state = loadPomodoroState();
  state.active = false;
  state.mode = 'work';
  state.startTime = null;
  savePomodoroState(state);
  return state;
}

/**
 * Get current pomodoro status.
 */
export function getPomodoroStatus() {
  const state = loadPomodoroState();
  if (!state.active || !state.startTime) {
    return { active: false, mode: 'idle', timeLeft: 0, progress: 0, sessionsToday: state.sessionsToday || 0 };
  }

  const elapsed = Date.now() - state.startTime;
  const totalDuration = state.mode === 'work' ? state.duration : state.breakDuration;
  const timeLeft = Math.max(0, totalDuration - elapsed);
  const progress = Math.min(1, elapsed / totalDuration);

  return {
    active: true,
    mode: state.mode,
    timeLeft,
    progress,
    sessionsToday: state.sessionsToday || 0,
    isComplete: timeLeft <= 0,
  };
}

/**
 * Check if pomodoro timer is complete and handle transition.
 * Returns event type if transition happened.
 */
export function tickPomodoro() {
  const state = loadPomodoroState();
  if (!state.active || !state.startTime) return null;

  const elapsed = Date.now() - state.startTime;
  const totalDuration = state.mode === 'work' ? state.duration : state.breakDuration;

  if (elapsed >= totalDuration) {
    if (state.mode === 'work') {
      // Work session complete - switch to break
      state.mode = 'break';
      state.startTime = Date.now();
      state.sessionsToday = (state.sessionsToday || 0) + 1;
      savePomodoroState(state);

      // Update stats
      const stats = loadPomodoroStats();
      stats.totalSessions += 1;
      stats.totalFocusMinutes += Math.round(state.duration / 60000);

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastStreakDate === yesterday || stats.lastStreakDate === today) {
        if (stats.lastStreakDate !== today) {
          stats.streakDays += 1;
        }
      } else {
        stats.streakDays = 1;
      }
      stats.lastStreakDate = today;
      if (stats.streakDays > stats.bestStreak) stats.bestStreak = stats.streakDays;
      savePomodoroStats(stats);

      return 'work_complete';
    } else {
      // Break complete - stop
      state.active = false;
      state.mode = 'work';
      state.startTime = null;
      savePomodoroState(state);
      return 'break_complete';
    }
  }

  return null;
}

/**
 * Get pomodoro stats.
 */
export function getPomodoroStats() {
  const stats = loadPomodoroStats();
  const state = loadPomodoroState();
  return {
    ...stats,
    sessionsToday: state.sessionsToday || 0,
  };
}

/**
 * Get settings.
 */
export function getPomodoroSettings() {
  const state = loadPomodoroState();
  return {
    workMinutes: Math.round((state.duration || 25 * 60 * 1000) / 60000),
    breakMinutes: Math.round((state.breakDuration || 5 * 60 * 1000) / 60000),
  };
}

/**
 * Pet discouragement messages during focus mode.
 */
export function getFocusMessage() {
  const messages = [
    "I'm helping you focus! No distractions!",
    "Shh... we're in focus mode!",
    "Keep going! You're doing great!",
    "No playing right now - focus time!",
    "Almost there! Stay focused!",
    "I believe in you! Keep working!",
    "Focus focus focus!",
    "You can pet me after the timer!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Pet celebration messages for break time.
 */
export function getBreakMessage() {
  const messages = [
    "Break time! You earned it!",
    "Woohoo! Great focus session!",
    "Time to relax! Let's play!",
    "You did it! Take a breather!",
    "Amazing focus! Now let's have fun!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
