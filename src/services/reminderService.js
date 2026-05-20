/**
 * PetDesk - Smart Reminder Service
 * Pattern-based reminders from activity learning + user-set reminders.
 */

const REMINDERS_KEY = 'petdesk_reminders';
const REMINDER_PATTERNS_KEY = 'petdesk_reminder_patterns';

/**
 * Load reminders from localStorage
 */
export function getReminders() {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Save reminders to localStorage
 */
export function saveReminders(reminders) {
  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (e) { /* ignore */ }
}

/**
 * Add a new reminder
 * @param {object} reminder - { message, triggerTime, recurring, recurringInterval, type }
 * type: 'once' | 'recurring' | 'pattern'
 * recurringInterval: 'daily' | 'hourly' | custom ms
 */
export function addReminder(reminder) {
  const reminders = getReminders();
  const newReminder = {
    id: Date.now() + Math.random().toString(36).slice(2, 8),
    message: reminder.message || 'Reminder!',
    triggerTime: reminder.triggerTime || Date.now() + 60000,
    type: reminder.type || 'once',
    recurring: reminder.recurring || false,
    recurringInterval: reminder.recurringInterval || null,
    recurringTime: reminder.recurringTime || null, // HH:MM for daily
    snoozed: false,
    snoozeUntil: null,
    completed: false,
    createdAt: Date.now(),
  };
  reminders.push(newReminder);
  saveReminders(reminders);
  return newReminder;
}

/**
 * Remove a reminder by id
 */
export function removeReminder(id) {
  const reminders = getReminders().filter(r => r.id !== id);
  saveReminders(reminders);
  return reminders;
}

/**
 * Snooze a reminder
 * @param {string} id - reminder id
 * @param {number} duration - snooze duration in ms
 */
export function snoozeReminder(id, duration) {
  const reminders = getReminders();
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    reminder.snoozed = true;
    reminder.snoozeUntil = Date.now() + duration;
    reminder.triggerTime = Date.now() + duration;
    saveReminders(reminders);
  }
  return reminders;
}

/**
 * Mark a reminder as completed
 */
export function completeReminder(id) {
  const reminders = getReminders();
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    if (reminder.recurring && reminder.recurringInterval) {
      // Reschedule recurring reminder
      if (reminder.recurringInterval === 'daily') {
        reminder.triggerTime = Date.now() + 24 * 60 * 60 * 1000;
      } else if (reminder.recurringInterval === 'hourly') {
        reminder.triggerTime = Date.now() + 60 * 60 * 1000;
      } else if (typeof reminder.recurringInterval === 'number') {
        reminder.triggerTime = Date.now() + reminder.recurringInterval;
      }
      reminder.snoozed = false;
      reminder.snoozeUntil = null;
    } else {
      reminder.completed = true;
    }
    saveReminders(reminders);
  }
  return reminders;
}

/**
 * Check for due reminders
 * @returns {object[]} array of due reminders
 */
export function checkDueReminders() {
  const now = Date.now();
  const reminders = getReminders();
  const due = reminders.filter(r => {
    if (r.completed) return false;
    if (r.snoozed && r.snoozeUntil && now < r.snoozeUntil) return false;
    return now >= r.triggerTime;
  });
  return due;
}

/**
 * Get active (non-completed) reminders
 */
export function getActiveReminders() {
  return getReminders().filter(r => !r.completed);
}

// === Pattern-based reminders ===

const DEFAULT_PATTERNS = {
  enabled: true,
  appPatterns: {}, // { appName: { usualHour: number, count: number } }
  breakReminder: true,
  breakIntervalMs: 2 * 60 * 60 * 1000, // 2 hours
  lastBreakReminder: 0,
  lastAppActivity: {},
};

/**
 * Load pattern settings
 */
export function getPatternSettings() {
  try {
    const stored = localStorage.getItem(REMINDER_PATTERNS_KEY);
    if (stored) return { ...DEFAULT_PATTERNS, ...JSON.parse(stored) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_PATTERNS };
}

/**
 * Save pattern settings
 */
export function savePatternSettings(settings) {
  try {
    localStorage.setItem(REMINDER_PATTERNS_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

/**
 * Toggle pattern-based reminders
 */
export function togglePatternReminders(enabled) {
  const settings = getPatternSettings();
  settings.enabled = enabled;
  savePatternSettings(settings);
}

/**
 * Record app usage for pattern learning
 * @param {string} appName - name of the app
 */
export function recordAppPattern(appName) {
  if (!appName) return;
  const settings = getPatternSettings();
  const hour = new Date().getHours();

  if (!settings.appPatterns[appName]) {
    settings.appPatterns[appName] = { usualHour: hour, count: 1, hours: [hour] };
  } else {
    settings.appPatterns[appName].count++;
    const hours = settings.appPatterns[appName].hours || [];
    hours.push(hour);
    // Keep last 20 entries
    if (hours.length > 20) hours.shift();
    settings.appPatterns[appName].hours = hours;
    // Calculate most common hour
    const hourCounts = {};
    hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
    let maxCount = 0;
    let maxHour = hour;
    Object.entries(hourCounts).forEach(([h, c]) => {
      if (c > maxCount) { maxCount = c; maxHour = parseInt(h); }
    });
    settings.appPatterns[appName].usualHour = maxHour;
  }

  settings.lastAppActivity[appName] = Date.now();
  savePatternSettings(settings);
}

/**
 * Check for pattern-based reminder suggestions
 * @returns {string|null} suggestion message or null
 */
export function checkPatternReminders() {
  const settings = getPatternSettings();
  if (!settings.enabled) return null;

  const now = Date.now();
  const currentHour = new Date().getHours();

  // Break reminder: if user has been active for 2+ hours
  if (settings.breakReminder) {
    const timeSinceBreak = now - (settings.lastBreakReminder || 0);
    if (timeSinceBreak > settings.breakIntervalMs) {
      settings.lastBreakReminder = now;
      savePatternSettings(settings);
      return "You've been at it for a while! Time for a break? 🧘";
    }
  }

  // App pattern reminders: suggest apps user usually opens at this hour
  const suggestions = [];
  Object.entries(settings.appPatterns).forEach(([appName, data]) => {
    if (data.count >= 5 && data.usualHour === currentHour) {
      const lastUsed = settings.lastAppActivity[appName] || 0;
      const hoursSinceUsed = (now - lastUsed) / (60 * 60 * 1000);
      // Only suggest if not used in last 2 hours
      if (hoursSinceUsed > 2) {
        suggestions.push(`You usually open ${appName} around now`);
      }
    }
  });

  if (suggestions.length > 0) {
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  return null;
}

/**
 * Create a quick "remind me in X minutes" reminder
 * @param {number} minutes - minutes from now
 * @param {string} message - reminder message
 */
export function quickReminder(minutes, message) {
  return addReminder({
    message: message || `${minutes} minute reminder!`,
    triggerTime: Date.now() + minutes * 60 * 1000,
    type: 'once',
    recurring: false,
  });
}

/**
 * Create a daily recurring reminder
 * @param {string} time - HH:MM format
 * @param {string} message - reminder message
 */
export function dailyReminder(time, message) {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

  return addReminder({
    message: message || `Daily reminder at ${time}`,
    triggerTime: trigger.getTime(),
    type: 'recurring',
    recurring: true,
    recurringInterval: 'daily',
    recurringTime: time,
  });
}
