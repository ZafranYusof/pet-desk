/**
 * PetDesk - Activity Monitor Service
 * Tracks user's active window and categorizes activities.
 */

const ACTIVITY_HISTORY_KEY = 'petdesk-activity-history';
const ACTIVITY_SETTINGS_KEY = 'petdesk-activity-settings';
const MAX_HISTORY = 10;

// Activity categories with associated process names
const ACTIVITY_CATEGORIES = {
  coding: {
    label: 'Coding',
    icon: '💻',
    processes: ['code', 'cursor', 'sublime_text', 'notepad++', 'vim', 'nvim', 'powershell', 'cmd', 'windowsterminal', 'wt', 'terminal', 'mintty', 'git-bash', 'idea64', 'webstorm64', 'pycharm64', 'devenv'],
    titleKeywords: ['visual studio', 'vs code', 'vscode', 'cursor', 'sublime', 'intellij', 'pycharm', 'webstorm', 'terminal', 'powershell', 'cmd.exe'],
  },
  browsing: {
    label: 'Browsing',
    icon: '🌐',
    processes: ['chrome', 'firefox', 'msedge', 'brave', 'opera', 'vivaldi', 'arc'],
    titleKeywords: ['chrome', 'firefox', 'edge', 'brave', 'opera'],
  },
  gaming: {
    label: 'Gaming',
    icon: '🎮',
    processes: ['steam', 'steamwebhelper', 'epicgameslauncher', 'robloxplayerbeta', 'robloxplayer', 'minecraft', 'javaw', 'valorant', 'leagueclient', 'genshinimpact'],
    titleKeywords: ['steam', 'roblox', 'minecraft', 'valorant', 'league of legends', 'genshin'],
  },
  creative: {
    label: 'Creative',
    icon: '🎨',
    processes: ['figma', 'photoshop', 'illustrator', 'blender', 'krita', 'gimp', 'inkscape', 'afterfx', 'premiere', 'davinci'],
    titleKeywords: ['figma', 'photoshop', 'illustrator', 'blender', 'krita', 'draw.io', 'canva', 'premiere', 'after effects'],
  },
  communication: {
    label: 'Communication',
    icon: '💬',
    processes: ['discord', 'whatsapp', 'telegram', 'slack', 'teams', 'zoom', 'skype', 'signal'],
    titleKeywords: ['discord', 'whatsapp', 'telegram', 'slack', 'microsoft teams', 'zoom'],
  },
  productivity: {
    label: 'Productivity',
    icon: '📝',
    processes: ['winword', 'excel', 'powerpnt', 'onenote', 'notion', 'obsidian', 'evernote', 'todoist'],
    titleKeywords: ['word', 'excel', 'powerpoint', 'notion', 'obsidian', 'google docs', 'google sheets'],
  },
  media: {
    label: 'Media',
    icon: '🎵',
    processes: ['spotify', 'vlc', 'wmplayer', 'itunes', 'musicbee', 'foobar2000', 'mpv'],
    titleKeywords: ['spotify', 'vlc', 'youtube', 'netflix', 'twitch', 'disney+'],
  },
};

let currentActivity = null;
let activityStartTime = null;
let activityHistory = [];
let changeCallbacks = [];
let idleSinceTime = null;
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes same window = idle

/**
 * Get activity monitoring settings.
 */
export function getActivitySettings() {
  try {
    const stored = localStorage.getItem(ACTIVITY_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return { enabled: true };
}

/**
 * Save activity monitoring settings.
 */
export function saveActivitySettings(settings) {
  try {
    localStorage.setItem(ACTIVITY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

/**
 * Check if activity monitoring is enabled.
 */
export function isActivityMonitorEnabled() {
  return getActivitySettings().enabled !== false;
}

/**
 * Categorize an activity based on process name and window title.
 */
export function categorizeActivity(processName, windowTitle) {
  const procLower = (processName || '').toLowerCase();
  const titleLower = (windowTitle || '').toLowerCase();

  // Check YouTube in browser title → media
  if (titleLower.includes('youtube') || titleLower.includes('netflix') || titleLower.includes('twitch')) {
    return 'media';
  }

  // Check Stack Overflow / docs in browser → coding (research)
  if (titleLower.includes('stack overflow') || titleLower.includes('stackoverflow') || titleLower.includes('github') || titleLower.includes('mdn web docs')) {
    return 'coding';
  }

  for (const [category, config] of Object.entries(ACTIVITY_CATEGORIES)) {
    // Check process name
    if (config.processes.some(p => procLower.includes(p))) {
      return category;
    }
    // Check window title keywords
    if (config.titleKeywords.some(kw => titleLower.includes(kw))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Get category info (label, icon).
 */
export function getCategoryInfo(category) {
  if (ACTIVITY_CATEGORIES[category]) {
    return ACTIVITY_CATEGORIES[category];
  }
  return { label: 'Other', icon: '📱' };
}

/**
 * Load activity history from localStorage.
 */
function loadHistory() {
  try {
    const stored = localStorage.getItem(ACTIVITY_HISTORY_KEY);
    if (stored) {
      activityHistory = JSON.parse(stored);
    }
  } catch (e) { /* ignore */ }
}

/**
 * Save activity history to localStorage.
 */
function saveHistory() {
  try {
    localStorage.setItem(ACTIVITY_HISTORY_KEY, JSON.stringify(activityHistory.slice(-MAX_HISTORY)));
  } catch (e) { /* ignore */ }
}

/**
 * Handle a new active window event from Electron.
 */
export function handleActiveWindowEvent(data) {
  if (!isActivityMonitorEnabled()) return;

  const { processName, windowTitle } = data;
  const category = categorizeActivity(processName, windowTitle);
  const now = Date.now();

  // If same activity, just update idle tracking
  if (currentActivity && currentActivity.processName === processName && currentActivity.windowTitle === windowTitle) {
    return;
  }

  // Save previous activity to history
  if (currentActivity) {
    const duration = now - activityStartTime;
    activityHistory.push({
      ...currentActivity,
      duration,
      endTime: now,
    });
    // Trim history
    if (activityHistory.length > MAX_HISTORY) {
      activityHistory = activityHistory.slice(-MAX_HISTORY);
    }
    saveHistory();
  }

  // Set new activity
  const newActivity = {
    processName,
    windowTitle,
    category,
    startTime: now,
  };

  currentActivity = newActivity;
  activityStartTime = now;
  idleSinceTime = now;

  // Notify listeners
  changeCallbacks.forEach(cb => {
    try { cb(newActivity); } catch (e) { /* ignore */ }
  });
}

/**
 * Get the current activity.
 */
export function getCurrentActivity() {
  if (!currentActivity) return null;
  const duration = Date.now() - activityStartTime;
  const categoryInfo = getCategoryInfo(currentActivity.category);
  return {
    ...currentActivity,
    ...categoryInfo,
    duration,
    durationMinutes: Math.floor(duration / 60000),
  };
}

/**
 * Get activity history (last 10).
 */
export function getActivityHistory() {
  return activityHistory.map(a => ({
    ...a,
    ...getCategoryInfo(a.category),
    durationMinutes: Math.floor((a.duration || 0) / 60000),
  }));
}

/**
 * Get how long the user has been doing the current activity.
 */
export function getActivityDuration() {
  if (!activityStartTime) return 0;
  return Date.now() - activityStartTime;
}

/**
 * Check if user is "idle" (same window for 5+ minutes).
 */
export function isUserIdle() {
  if (!idleSinceTime) return false;
  return (Date.now() - idleSinceTime) > IDLE_THRESHOLD_MS;
}

/**
 * Register a callback for activity changes.
 */
export function onActivityChange(callback) {
  changeCallbacks.push(callback);
  return () => {
    changeCallbacks = changeCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Initialize the activity monitor (call once on app mount).
 */
export function initActivityMonitor() {
  loadHistory();

  if (window.electronAPI?.onActiveWindow) {
    window.electronAPI.onActiveWindow((data) => {
      handleActiveWindowEvent(data);
    });
  }
}
