/**
 * PetDesk - Memory Service
 * Pet remembers owner's name, past events, and interaction history.
 */

const MEMORY_KEY = 'petdesk_pet_memory';
const INTERACTION_HISTORY_KEY = 'petdesk_interaction_history';

function loadMemory() {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    ownerName: null,
    firstRunComplete: false,
    createdAt: Date.now(),
    milestones: [],
    favoriteFood: null,
    totalDaysActive: 0,
    lastActiveDate: null,
  };
}

function saveMemory(memory) {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) { /* ignore */ }
}

function loadInteractionHistory() {
  try {
    const stored = localStorage.getItem(INTERACTION_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

function saveInteractionHistory(history) {
  try {
    // Keep last 100 entries
    const trimmed = history.slice(-100);
    localStorage.setItem(INTERACTION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) { /* ignore */ }
}

/**
 * Check if first run (owner name not set).
 */
export function isFirstRun() {
  const memory = loadMemory();
  return !memory.firstRunComplete;
}

/**
 * Set owner name and mark first run complete.
 */
export function setOwnerName(name) {
  const memory = loadMemory();
  memory.ownerName = name;
  memory.firstRunComplete = true;
  saveMemory(memory);
}

/**
 * Get owner name.
 */
export function getOwnerName() {
  const memory = loadMemory();
  return memory.ownerName;
}

/**
 * Get full memory state.
 */
export function getMemory() {
  return loadMemory();
}

/**
 * Record an interaction event with timestamp.
 */
export function recordMemoryEvent(type, details = {}) {
  const history = loadInteractionHistory();
  history.push({
    type,
    details,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
  });
  saveInteractionHistory(history);

  // Update daily active tracking
  const memory = loadMemory();
  const today = new Date().toISOString().split('T')[0];
  if (memory.lastActiveDate !== today) {
    memory.totalDaysActive = (memory.totalDaysActive || 0) + 1;
    memory.lastActiveDate = today;
    saveMemory(memory);
  }
}

/**
 * Add a milestone to memory.
 */
export function addMilestone(milestone) {
  const memory = loadMemory();
  memory.milestones.push({
    ...milestone,
    timestamp: Date.now(),
    date: new Date().toISOString().split('T')[0],
  });
  // Keep last 50 milestones
  if (memory.milestones.length > 50) {
    memory.milestones = memory.milestones.slice(-50);
  }
  saveMemory(memory);
}

/**
 * Get interaction count for a specific type on a given date.
 */
export function getInteractionCount(type, date = null) {
  const history = loadInteractionHistory();
  const targetDate = date || new Date().toISOString().split('T')[0];
  return history.filter(e => e.type === type && e.date === targetDate).length;
}

/**
 * Get interaction count for a type in the last N days.
 */
export function getRecentInteractionCount(type, days = 7) {
  const history = loadInteractionHistory();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return history.filter(e => e.type === type && e.timestamp >= cutoff).length;
}

/**
 * Get days since a specific event type last occurred.
 */
export function getDaysSinceEvent(type) {
  const history = loadInteractionHistory();
  const events = history.filter(e => e.type === type);
  if (events.length === 0) return null;
  const lastEvent = events[events.length - 1];
  return Math.floor((Date.now() - lastEvent.timestamp) / (24 * 60 * 60 * 1000));
}

/**
 * Generate a memory-based chat message referencing past events.
 */
export function getMemoryChat(petState) {
  const memory = loadMemory();
  const history = loadInteractionHistory();
  const ownerName = memory.ownerName;

  if (!ownerName || history.length === 0) return null;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Count yesterday's events
  const yesterdayFeeds = history.filter(e => e.type === 'feed' && e.date === yesterday).length;
  const yesterdayPlays = history.filter(e => e.type === 'play' && e.date === yesterday).length;
  const yesterdayPets = history.filter(e => e.type === 'pet' && e.date === yesterday).length;

  // Count today's events
  const todayFeeds = history.filter(e => e.type === 'feed' && e.date === today).length;

  // Days since last game
  const lastGame = history.filter(e => e.type === 'game').pop();
  const daysSinceGame = lastGame ? Math.floor((Date.now() - lastGame.timestamp) / 86400000) : null;

  // Build possible messages
  const messages = [];

  if (yesterdayFeeds > 3) {
    messages.push(`${ownerName} fed me ${yesterdayFeeds} times yesterday! I was so full!`);
    messages.push(`Remember yesterday? You fed me ${yesterdayFeeds} times, ${ownerName}!`);
  }

  if (yesterdayPlays > 2) {
    messages.push(`We played ${yesterdayPlays} times yesterday! That was so fun, ${ownerName}!`);
  }

  if (yesterdayPets > 5) {
    messages.push(`${ownerName} petted me ${yesterdayPets} times yesterday... I felt so loved!`);
  }

  if (daysSinceGame !== null && daysSinceGame >= 3) {
    messages.push(`Hey ${ownerName}, we haven't played a game in ${daysSinceGame} days!`);
    messages.push(`Remember when we played games ${daysSinceGame} days ago? Let's do that again!`);
  }

  if (memory.totalDaysActive > 7) {
    messages.push(`We've been together for ${memory.totalDaysActive} days now, ${ownerName}!`);
  }

  if (memory.totalDaysActive > 30) {
    messages.push(`${memory.totalDaysActive} days together... you're my best friend, ${ownerName}!`);
  }

  if (todayFeeds === 0 && new Date().getHours() > 12) {
    messages.push(`${ownerName}... you haven't fed me today yet...`);
  }

  // Milestone references
  const recentMilestones = memory.milestones.filter(m => Date.now() - m.timestamp < 7 * 86400000);
  recentMilestones.forEach(m => {
    if (m.type === 'levelup') {
      const daysAgo = Math.floor((Date.now() - m.timestamp) / 86400000);
      if (daysAgo > 0 && daysAgo <= 5) {
        messages.push(`Remember when I reached level ${m.level} ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago? That was exciting!`);
      }
    }
    if (m.type === 'game_win') {
      const daysAgo = Math.floor((Date.now() - m.timestamp) / 86400000);
      if (daysAgo > 0 && daysAgo <= 5) {
        messages.push(`We won that game ${daysAgo} day${daysAgo > 1 ? 's' : ''} ago! I'm still proud!`);
      }
    }
  });

  if (messages.length === 0) {
    // Generic memory messages
    if (ownerName) {
      messages.push(
        `Hi ${ownerName}!`,
        `${ownerName}, I'm happy you're here!`,
        `What should we do today, ${ownerName}?`,
      );
    }
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Get relationship level based on total interactions.
 */
export function getRelationshipLevel() {
  const history = loadInteractionHistory();
  const total = history.length;
  if (total >= 500) return { level: 5, name: 'Soulmate' };
  if (total >= 200) return { level: 4, name: 'Best Friend' };
  if (total >= 100) return { level: 3, name: 'Close Friend' };
  if (total >= 30) return { level: 2, name: 'Friend' };
  return { level: 1, name: 'Acquaintance' };
}
