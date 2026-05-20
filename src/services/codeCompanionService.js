/**
 * Code Companion Service
 * Detects coding activity, tracks sessions, and provides contextual tips.
 */

const CODING_STATS_KEY = 'petdesk_coding_stats';
const CODING_SESSION_KEY = 'petdesk_coding_session';
const CODING_SETTINGS_KEY = 'petdesk_coding_settings';

// Known IDE/editor process names and window title patterns
const CODE_EDITORS = [
  { name: 'VS Code', patterns: ['Visual Studio Code', 'VSCodium', '- Code'] },
  { name: 'IntelliJ', patterns: ['IntelliJ IDEA', 'WebStorm', 'PyCharm', 'PhpStorm', 'RubyMine', 'GoLand', 'CLion', 'Rider'] },
  { name: 'Sublime Text', patterns: ['Sublime Text'] },
  { name: 'Notepad++', patterns: ['Notepad++'] },
  { name: 'Vim', patterns: ['- VIM', '- NVIM', 'Neovim'] },
  { name: 'Emacs', patterns: ['Emacs', 'emacs'] },
  { name: 'Atom', patterns: ['Atom'] },
  { name: 'Android Studio', patterns: ['Android Studio'] },
  { name: 'Xcode', patterns: ['Xcode'] },
  { name: 'Eclipse', patterns: ['Eclipse'] },
  { name: 'NetBeans', patterns: ['NetBeans'] },
  { name: 'Cursor', patterns: ['Cursor'] },
  { name: 'Zed', patterns: ['Zed'] },
  { name: 'Terminal', patterns: ['Windows Terminal', 'Command Prompt', 'PowerShell', 'Terminal', 'iTerm'] },
];

// Language detection from window titles
const LANGUAGE_PATTERNS = [
  { lang: 'JavaScript', patterns: ['.js ', '.js -', '.jsx ', '.jsx -', '.mjs '] },
  { lang: 'TypeScript', patterns: ['.ts ', '.ts -', '.tsx ', '.tsx -'] },
  { lang: 'Python', patterns: ['.py ', '.py -', '.pyw '] },
  { lang: 'Java', patterns: ['.java ', '.java -'] },
  { lang: 'C++', patterns: ['.cpp ', '.cpp -', '.hpp ', '.cc ', '.h -'] },
  { lang: 'C#', patterns: ['.cs ', '.cs -'] },
  { lang: 'Go', patterns: ['.go ', '.go -'] },
  { lang: 'Rust', patterns: ['.rs ', '.rs -'] },
  { lang: 'Ruby', patterns: ['.rb ', '.rb -'] },
  { lang: 'PHP', patterns: ['.php ', '.php -'] },
  { lang: 'HTML', patterns: ['.html ', '.html -', '.htm '] },
  { lang: 'CSS', patterns: ['.css ', '.css -', '.scss ', '.sass '] },
  { lang: 'Kotlin', patterns: ['.kt ', '.kt -'] },
  { lang: 'Swift', patterns: ['.swift ', '.swift -'] },
  { lang: 'Dart', patterns: ['.dart ', '.dart -'] },
  { lang: 'Vue', patterns: ['.vue ', '.vue -'] },
  { lang: 'Svelte', patterns: ['.svelte ', '.svelte -'] },
  { lang: 'Markdown', patterns: ['.md ', '.md -', '.mdx '] },
  { lang: 'JSON', patterns: ['.json ', '.json -'] },
  { lang: 'YAML', patterns: ['.yml ', '.yaml '] },
];

// Contextual tips
const BREAK_TIPS = [
  "You've been debugging for a while. Take a 5-min break?",
  "Stretch time! Your back will thank you later.",
  "Quick break? Sometimes the answer comes when you step away.",
  "30 min straight — nice focus! But hydrate, yeah?",
  "Eyes need rest too. Look at something 20ft away for 20 sec.",
];

const STREAK_TIPS = [
  "Nice coding streak! Keep it up 🔥",
  "You're in the zone! Solid session today.",
  "Productive day! Your pet is impressed.",
  "Code warrior mode activated 💪",
];

const STUCK_TIPS = [
  "Stuck? Try rubber duck debugging with me 🦆",
  "Sometimes explaining the problem out loud helps.",
  "Have you tried console.log-ing everything? No shame in that.",
  "Take a step back — what's the simplest thing that could work?",
  "Read the error message one more time. Slowly.",
];

let _pollInterval = null;
let _currentSession = null;

// --- Storage helpers ---

function getStats() {
  try {
    const stored = localStorage.getItem(CODING_STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    totalMinutes: 0,
    dailyMinutes: {},    // { 'YYYY-MM-DD': minutes }
    weeklyMinutes: {},   // { 'YYYY-WW': minutes }
    languages: {},       // { 'JavaScript': minutes }
    streakDays: 0,
    lastCodingDate: null,
    sessions: [],        // last 50 sessions
  };
}

function saveStats(stats) {
  localStorage.setItem(CODING_STATS_KEY, JSON.stringify(stats));
}

function getSettings() {
  try {
    const stored = localStorage.getItem(CODING_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    breakReminderMinutes: 30,
    enabled: true,
    showTips: true,
  };
}

function saveSettings(settings) {
  localStorage.setItem(CODING_SETTINGS_KEY, JSON.stringify(settings));
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekKey() {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// --- Detection ---

function detectEditorFromTitle(windowTitle) {
  if (!windowTitle) return null;
  for (const editor of CODE_EDITORS) {
    for (const pattern of editor.patterns) {
      if (windowTitle.includes(pattern)) {
        return editor.name;
      }
    }
  }
  return null;
}

function detectLanguageFromTitle(windowTitle) {
  if (!windowTitle) return 'Unknown';
  const titleWithSpace = windowTitle + ' ';
  for (const lang of LANGUAGE_PATTERNS) {
    for (const pattern of lang.patterns) {
      if (titleWithSpace.includes(pattern)) {
        return lang.lang;
      }
    }
  }
  return 'Unknown';
}

/**
 * Check if user is currently coding by querying active window title via Electron.
 */
export async function checkCodingActivity() {
  try {
    if (window.electronAPI?.getActiveWindowTitle) {
      const title = await window.electronAPI.getActiveWindowTitle();
      const editor = detectEditorFromTitle(title);
      if (editor) {
        return {
          isCoding: true,
          editor,
          language: detectLanguageFromTitle(title),
          windowTitle: title,
        };
      }
    }
  } catch (e) { /* ignore */ }
  return { isCoding: false, editor: null, language: null, windowTitle: null };
}

// --- Session management ---

export function startCodingSession(editor, language) {
  _currentSession = {
    startTime: Date.now(),
    editor,
    language,
    lastActivity: Date.now(),
  };
  localStorage.setItem(CODING_SESSION_KEY, JSON.stringify(_currentSession));
  return _currentSession;
}

export function updateCodingSession(language) {
  if (_currentSession) {
    _currentSession.lastActivity = Date.now();
    if (language && language !== 'Unknown') {
      _currentSession.language = language;
    }
    localStorage.setItem(CODING_SESSION_KEY, JSON.stringify(_currentSession));
  }
}

export function endCodingSession() {
  if (!_currentSession) return null;

  const duration = Math.round((Date.now() - _currentSession.startTime) / 60000); // minutes
  const session = { ..._currentSession, endTime: Date.now(), durationMinutes: duration };

  // Update stats
  const stats = getStats();
  const todayKey = getTodayKey();
  const weekKey = getWeekKey();

  stats.totalMinutes += duration;
  stats.dailyMinutes[todayKey] = (stats.dailyMinutes[todayKey] || 0) + duration;
  stats.weeklyMinutes[weekKey] = (stats.weeklyMinutes[weekKey] || 0) + duration;

  if (session.language && session.language !== 'Unknown') {
    stats.languages[session.language] = (stats.languages[session.language] || 0) + duration;
  }

  // Update streak
  const today = getTodayKey();
  if (stats.lastCodingDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (stats.lastCodingDate === yesterdayKey) {
      stats.streakDays += 1;
    } else if (stats.lastCodingDate !== today) {
      stats.streakDays = 1;
    }
    stats.lastCodingDate = today;
  }

  // Keep last 50 sessions
  stats.sessions.unshift({ editor: session.editor, language: session.language, duration, date: todayKey });
  if (stats.sessions.length > 50) stats.sessions = stats.sessions.slice(0, 50);

  saveStats(stats);
  _currentSession = null;
  localStorage.removeItem(CODING_SESSION_KEY);

  return session;
}

export function getCurrentSession() {
  if (_currentSession) return _currentSession;
  try {
    const stored = localStorage.getItem(CODING_SESSION_KEY);
    if (stored) {
      _currentSession = JSON.parse(stored);
      return _currentSession;
    }
  } catch (e) { /* ignore */ }
  return null;
}

export function getSessionDuration() {
  const session = getCurrentSession();
  if (!session) return 0;
  return Math.round((Date.now() - session.startTime) / 60000);
}

// --- Tips ---

export function getContextualTip() {
  const duration = getSessionDuration();
  const settings = getSettings();

  if (!settings.showTips) return null;

  if (duration >= settings.breakReminderMinutes) {
    return BREAK_TIPS[Math.floor(Math.random() * BREAK_TIPS.length)];
  }

  if (duration >= 60) {
    return STREAK_TIPS[Math.floor(Math.random() * STREAK_TIPS.length)];
  }

  // Random stuck tip (low chance)
  if (Math.random() < 0.1) {
    return STUCK_TIPS[Math.floor(Math.random() * STUCK_TIPS.length)];
  }

  return null;
}

// --- Stats getters ---

export function getCodingStats() {
  return getStats();
}

export function getTodayCodingMinutes() {
  const stats = getStats();
  return stats.dailyMinutes[getTodayKey()] || 0;
}

export function getWeeklyCodingMinutes() {
  const stats = getStats();
  return stats.weeklyMinutes[getWeekKey()] || 0;
}

export function getLanguageBreakdown() {
  const stats = getStats();
  const total = Object.values(stats.languages).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, minutes]) => ({
      language: lang,
      minutes,
      percentage: Math.round((minutes / total) * 100),
    }));
}

export function getDailyChartData(days = 7) {
  const stats = getStats();
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    data.push({
      day: dayNames[d.getDay()],
      date: key,
      minutes: stats.dailyMinutes[key] || 0,
    });
  }
  return data;
}

export function getStreak() {
  const stats = getStats();
  return stats.streakDays;
}

// --- Polling ---

export function startPolling(onActivity, intervalMs = 10000) {
  if (_pollInterval) clearInterval(_pollInterval);

  _pollInterval = setInterval(async () => {
    const activity = await checkCodingActivity();
    const session = getCurrentSession();

    if (activity.isCoding) {
      if (!session) {
        startCodingSession(activity.editor, activity.language);
      } else {
        updateCodingSession(activity.language);
      }
    } else {
      // If no coding for 5 minutes, end session
      if (session && (Date.now() - session.lastActivity > 5 * 60 * 1000)) {
        endCodingSession();
      }
    }

    if (onActivity) onActivity(activity, getCurrentSession());
  }, intervalMs);

  return _pollInterval;
}

export function stopPolling() {
  if (_pollInterval) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  }
}

// --- Settings ---

export function getCodingSettings() {
  return getSettings();
}

export function updateCodingSettings(newSettings) {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  saveSettings(updated);
  return updated;
}

// --- AI Chat integration ---

export function getCodingContext() {
  const session = getCurrentSession();
  const stats = getStats();
  const todayMin = getTodayCodingMinutes();

  return {
    isCurrentlyCoding: !!session,
    currentEditor: session?.editor || null,
    currentLanguage: session?.language || null,
    sessionDuration: getSessionDuration(),
    todayMinutes: todayMin,
    streak: stats.streakDays,
    topLanguages: getLanguageBreakdown().slice(0, 3).map(l => l.language),
  };
}
