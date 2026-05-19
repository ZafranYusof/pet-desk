/**
 * PetDesk - Notification Service
 * Triggers desktop notifications based on pet state with cooldown.
 */

const NOTIFICATION_STORAGE_KEY = 'petdesk_last_notification';
const LAST_INTERACTION_KEY = 'petdesk_last_interaction';
const COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

const notifications = {
  hunger: {
    condition: (state) => state.hunger < 20,
    message: "Hey! I'm starving over here! 🍖",
    priority: 3,
  },
  energy: {
    condition: (state) => state.energy < 15,
    message: "So... tired... need... sleep... 😴",
    priority: 2,
  },
  happiness: {
    condition: (state) => state.happiness < 25,
    message: "I'm bored. Play with me? 🎮",
    priority: 1,
  },
  neglect: {
    condition: (state) => {
      const lastInteraction = getLastInteractionTime();
      const twoHours = 2 * 60 * 60 * 1000;
      return lastInteraction && (Date.now() - lastInteraction) > twoHours;
    },
    message: "Did you forget about me? 😢",
    priority: 0,
  },
};

/**
 * Get the last notification timestamp from localStorage.
 * @returns {number|null}
 */
function getLastNotificationTime() {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Set the last notification timestamp.
 */
function setLastNotificationTime() {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, Date.now().toString());
  } catch (e) {
    console.error('[notifications] Failed to save timestamp:', e);
  }
}

/**
 * Get the last interaction time from localStorage.
 * @returns {number|null}
 */
function getLastInteractionTime() {
  try {
    const stored = localStorage.getItem(LAST_INTERACTION_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Record an interaction (feed, play, pet, game).
 * Call this whenever the user interacts with the pet.
 */
export function recordInteraction() {
  try {
    localStorage.setItem(LAST_INTERACTION_KEY, Date.now().toString());
  } catch (e) {
    console.error('[notifications] Failed to record interaction:', e);
  }
}

/**
 * Check if cooldown has elapsed since last notification.
 * @returns {boolean}
 */
function isCooldownElapsed() {
  const last = getLastNotificationTime();
  if (!last) return true;
  return (Date.now() - last) > COOLDOWN_MS;
}

/**
 * Send a notification via Electron's Notification API.
 * @param {string} message
 */
function sendNotification(message) {
  if (window.electronAPI && window.electronAPI.showNotification) {
    window.electronAPI.showNotification(message);
  }
  setLastNotificationTime();
}

/**
 * Check pet state and send notification if conditions are met.
 * Should be called every 60 seconds.
 * @param {object} petState
 */
export function checkAndNotify(petState) {
  if (!isCooldownElapsed()) return;

  // Find the highest priority triggered notification
  let triggered = null;
  let highestPriority = -1;

  for (const [key, config] of Object.entries(notifications)) {
    if (config.condition(petState) && config.priority > highestPriority) {
      triggered = config;
      highestPriority = config.priority;
    }
  }

  if (triggered) {
    sendNotification(triggered.message);
  }
}

/**
 * Send a level-up notification immediately (bypasses cooldown check but sets it).
 * @param {number} level
 */
export function notifyLevelUp(level) {
  const message = `LEVEL UP! I'm now level ${level}! 🌟`;
  sendNotification(message);
}
