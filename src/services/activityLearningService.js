/**
 * PetDesk - Activity Learning Service
 * Tracks daily activity patterns and learns user habits over time.
 * All data stored in localStorage.
 */

const PATTERNS_KEY = 'petdesk-patterns';
const ACTIVITY_LOG_KEY = 'petdesk-activity-log';
const MAX_LOG_ENTRIES = 500;

/**
 * Get stored patterns data.
 */
function getStoredPatterns() {
  try {
    const stored = localStorage.getItem(PATTERNS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    hourlyApps: {},       // { "9": { "Code": 5, "Chrome": 3 }, "10": {...} }
    appDurations: {},     // { "Code": [30, 45, 60], "Chrome": [15, 20] } in minutes
    appSequences: [],     // [{ from: "Chrome", to: "Code", count: 5 }]
    activeHours: {},      // { "9": 12, "10": 15, ... } count of active sessions per hour
    idlePatterns: {},     // { "12": 3, "13": 5 } idle occurrences per hour
    dailyStats: [],       // [{ date, totalActive, topApp, sessions }]
  };
}

/**
 * Save patterns data.
 */
function savePatterns(patterns) {
  try {
    localStorage.setItem(PATTERNS_KEY, JSON.stringify(patterns));
  } catch (e) { /* ignore */ }
}

/**
 * Get activity log.
 */
function getActivityLog() {
  try {
    const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Save activity log.
 */
function saveActivityLog(log) {
  try {
    const trimmed = log.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmed));
  } catch (e) { /* ignore */ }
}

/**
 * Record an activity event.
 * @param {object} activity - { processName, windowTitle, category, timestamp? }
 */
export function recordActivity(activity) {
  const now = Date.now();
  const hour = new Date(now).getHours().toString();
  const appName = activity.processName || 'unknown';

  // Update activity log
  const log = getActivityLog();
  log.push({
    app: appName,
    title: activity.windowTitle || '',
    category: activity.category || 'other',
    timestamp: activity.timestamp || now,
    hour: parseInt(hour),
  });
  saveActivityLog(log);

  // Update patterns
  const patterns = getStoredPatterns();

  // Track hourly app usage
  if (!patterns.hourlyApps[hour]) patterns.hourlyApps[hour] = {};
  patterns.hourlyApps[hour][appName] = (patterns.hourlyApps[hour][appName] || 0) + 1;

  // Track active hours
  patterns.activeHours[hour] = (patterns.activeHours[hour] || 0) + 1;

  // Track app sequences (last app -> current app)
  if (log.length >= 2) {
    const prevApp = log[log.length - 2].app;
    if (prevApp !== appName) {
      const existingSeq = patterns.appSequences.find(
        (s) => s.from === prevApp && s.to === appName
      );
      if (existingSeq) {
        existingSeq.count += 1;
      } else {
        patterns.appSequences.push({ from: prevApp, to: appName, count: 1 });
      }
      // Keep only top 30 sequences
      patterns.appSequences.sort((a, b) => b.count - a.count);
      patterns.appSequences = patterns.appSequences.slice(0, 30);
    }
  }

  savePatterns(patterns);
}

/**
 * Record app session duration when switching away.
 * @param {string} appName - The app that was active
 * @param {number} durationMs - How long it was active in ms
 */
export function recordAppDuration(appName, durationMs) {
  const patterns = getStoredPatterns();
  const durationMin = Math.round(durationMs / 60000);
  if (durationMin < 1) return; // Ignore very short sessions

  if (!patterns.appDurations[appName]) patterns.appDurations[appName] = [];
  patterns.appDurations[appName].push(durationMin);
  // Keep last 20 durations per app
  if (patterns.appDurations[appName].length > 20) {
    patterns.appDurations[appName] = patterns.appDurations[appName].slice(-20);
  }

  savePatterns(patterns);
}

/**
 * Record idle occurrence.
 */
export function recordIdle() {
  const hour = new Date().getHours().toString();
  const patterns = getStoredPatterns();
  if (!patterns.idlePatterns) patterns.idlePatterns = {};
  patterns.idlePatterns[hour] = (patterns.idlePatterns[hour] || 0) + 1;
  savePatterns(patterns);
}

/**
 * Get all learned patterns.
 */
export function getPatterns() {
  return getStoredPatterns();
}

/**
 * Get daily stats for today.
 */
export function getDailyStats() {
  const log = getActivityLog();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = log.filter((e) => {
    const d = new Date(e.timestamp).toISOString().split('T')[0];
    return d === today;
  });

  if (todayEntries.length === 0) {
    return { date: today, totalSessions: 0, topApp: null, categories: {} };
  }

  // Count apps
  const appCounts = {};
  const categoryCounts = {};
  todayEntries.forEach((e) => {
    appCounts[e.app] = (appCounts[e.app] || 0) + 1;
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  const topApp = Object.entries(appCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    date: today,
    totalSessions: todayEntries.length,
    topApp: topApp ? topApp[0] : null,
    categories: categoryCounts,
    appCounts,
  };
}

/**
 * Get an insight based on learned patterns.
 * Returns a string the pet can say, or null if not enough data.
 */
export function getInsight() {
  const patterns = getStoredPatterns();
  const hour = new Date().getHours();
  const hourStr = hour.toString();
  const insights = [];

  // What app is usually used at this hour?
  if (patterns.hourlyApps[hourStr]) {
    const hourApps = patterns.hourlyApps[hourStr];
    const topApp = Object.entries(hourApps).sort((a, b) => b[1] - a[1])[0];
    if (topApp && topApp[1] >= 3) {
      insights.push(`You usually use ${topApp[0]} around this time`);
    }
  }

  // Most active hours
  if (Object.keys(patterns.activeHours).length >= 5) {
    const sortedHours = Object.entries(patterns.activeHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => `${h}:00`);
    insights.push(`Your most active hours are ${sortedHours.join(', ')}`);
  }

  // Common sequences
  if (patterns.appSequences.length > 0) {
    const topSeq = patterns.appSequences[0];
    if (topSeq.count >= 3) {
      insights.push(`You often go from ${topSeq.from} to ${topSeq.to}`);
    }
  }

  // Average session duration for top app
  const appDurations = patterns.appDurations || {};
  const topDurationApp = Object.entries(appDurations)
    .filter(([, durations]) => durations.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)[0];
  if (topDurationApp) {
    const avg = Math.round(topDurationApp[1].reduce((a, b) => a + b, 0) / topDurationApp[1].length);
    insights.push(`Your average ${topDurationApp[0]} session is about ${avg} minutes`);
  }

  // Idle patterns
  if (patterns.idlePatterns && Object.keys(patterns.idlePatterns).length >= 3) {
    const topIdleHour = Object.entries(patterns.idlePatterns)
      .sort((a, b) => b[1] - a[1])[0];
    if (topIdleHour && topIdleHour[1] >= 3) {
      insights.push(`You tend to take breaks around ${topIdleHour[0]}:00`);
    }
  }

  if (insights.length === 0) return null;
  return insights[Math.floor(Math.random() * insights.length)];
}

/**
 * Get pattern summary for AI context.
 */
export function getPatternSummary() {
  const patterns = getStoredPatterns();
  const hour = new Date().getHours();
  const hourStr = hour.toString();
  const parts = [];

  // Current hour typical app
  if (patterns.hourlyApps[hourStr]) {
    const hourApps = patterns.hourlyApps[hourStr];
    const topApp = Object.entries(hourApps).sort((a, b) => b[1] - a[1])[0];
    if (topApp && topApp[1] >= 2) {
      parts.push(`Usually uses ${topApp[0]} at ${hour}:00`);
    }
  }

  // Most active hours
  if (Object.keys(patterns.activeHours).length >= 3) {
    const peak = Object.entries(patterns.activeHours)
      .sort((a, b) => b[1] - a[1])[0];
    parts.push(`Peak activity hour: ${peak[0]}:00`);
  }

  // Top sequence
  if (patterns.appSequences.length > 0 && patterns.appSequences[0].count >= 3) {
    const seq = patterns.appSequences[0];
    parts.push(`Common workflow: ${seq.from} → ${seq.to}`);
  }

  return parts.join('; ') || 'Not enough data yet';
}
