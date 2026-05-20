/**
 * PetDesk - Activity Log Service
 * Records what the pet did while user was away or during the session.
 * Max 50 entries, auto-prunes old ones.
 */

const ACTIVITY_LOG_KEY = 'petdesk_activity_log';
const MAX_ENTRIES = 50;

/**
 * Get all activity log entries
 */
export function getActivityLog() {
  try {
    const stored = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Add a new activity log entry
 */
export function addActivityEntry(type, message, icon) {
  const log = getActivityLog();
  const entry = {
    id: Date.now() + Math.random().toString(36).slice(2, 6),
    type,
    message,
    icon: icon || getIconForType(type),
    timestamp: Date.now(),
  };

  log.unshift(entry);

  // Auto-prune to max entries
  while (log.length > MAX_ENTRIES) {
    log.pop();
  }

  try {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log));
  } catch (e) { /* ignore */ }

  return entry;
}

/**
 * Get icon for activity type
 */
function getIconForType(type) {
  const icons = {
    sleep: '😴',
    hungry: '🍽️',
    played_alone: '🎮',
    chatted: '💬',
    levelup: '⭐',
    fed: '🍖',
    played: '🎾',
    petted: '💕',
    evolved: '✨',
    achievement: '🏆',
    woke_up: '☀️',
    sad: '😢',
    happy: '😊',
    danced: '💃',
    explored: '🗺️',
  };
  return icons[type] || '📝';
}

/**
 * Record common activities
 */
export function logSleep() {
  return addActivityEntry('sleep', 'Took a nap', '😴');
}

export function logHungry() {
  return addActivityEntry('hungry', 'Got hungry while waiting', '🍽️');
}

export function logPlayedAlone() {
  return addActivityEntry('played_alone', 'Played by themselves', '🎮');
}

export function logChatted(message) {
  return addActivityEntry('chatted', message || 'Had a chat', '💬');
}

export function logLevelUp(level) {
  return addActivityEntry('levelup', `Reached level ${level}!`, '⭐');
}

export function logFed(foodName) {
  return addActivityEntry('fed', foodName ? `Ate ${foodName}` : 'Was fed', '🍖');
}

export function logPlayed() {
  return addActivityEntry('played', 'Played with owner', '🎾');
}

export function logPetted() {
  return addActivityEntry('petted', 'Got some pets', '💕');
}

export function logEvolved(name) {
  return addActivityEntry('evolved', `Evolved into ${name}!`, '✨');
}

export function logAchievement(name) {
  return addActivityEntry('achievement', `Unlocked: ${name}`, '🏆');
}

export function logWokeUp() {
  return addActivityEntry('woke_up', 'Woke up refreshed', '☀️');
}

export function logDanced() {
  return addActivityEntry('danced', 'Had a dance party', '💃');
}

/**
 * Generate offline activities (called when app starts after being closed)
 */
export function generateOfflineActivities(petState, lastSaveTime) {
  if (!lastSaveTime) return;

  const now = Date.now();
  const offlineMinutes = (now - lastSaveTime) / 60000;

  if (offlineMinutes < 5) return; // Less than 5 min, skip

  const activities = [];

  // Pet slept while away
  if (offlineMinutes > 30) {
    activities.push({ type: 'sleep', message: 'Slept while you were away', icon: '😴' });
  }

  // Pet got hungry
  if (offlineMinutes > 60) {
    activities.push({ type: 'hungry', message: 'Got hungry waiting for you', icon: '🍽️' });
  }

  // Pet played alone
  if (offlineMinutes > 15 && Math.random() > 0.5) {
    activities.push({ type: 'played_alone', message: 'Played alone for a bit', icon: '🎮' });
  }

  // Pet chatted to itself
  if (offlineMinutes > 45 && Math.random() > 0.6) {
    activities.push({ type: 'chatted', message: 'Talked to themselves', icon: '💬' });
  }

  // Add all generated activities
  activities.forEach((a) => addActivityEntry(a.type, a.message, a.icon));

  return activities;
}

/**
 * Clear all activity log entries
 */
export function clearActivityLog() {
  try {
    localStorage.removeItem(ACTIVITY_LOG_KEY);
  } catch (e) { /* ignore */ }
}
