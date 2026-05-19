/**
 * PetDesk - Scrapbook System
 * Auto-generates milestone entries for the pet's journey.
 */

const STORAGE_KEY = 'petdesk_scrapbook';
const MAX_ENTRIES = 50;

/**
 * Load scrapbook entries from localStorage
 */
export function getScrapbookEntries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Save scrapbook entries to localStorage
 */
function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    // ignore
  }
}

/**
 * Add a new scrapbook entry
 */
export function addScrapbookEntry(type, title, description, emoji) {
  const entries = getScrapbookEntries();

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: new Date().toISOString(),
    type,
    title,
    description,
    emoji,
  };

  // Add to front (newest first)
  entries.unshift(entry);

  // Cap at max entries
  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  saveEntries(entries);
  return entry;
}

/**
 * Check if an entry of a specific type already exists (for "first time" events)
 */
export function hasEntry(type) {
  const entries = getScrapbookEntries();
  return entries.some((e) => e.type === type);
}

// --- Milestone helpers ---

export function recordFirstFeed() {
  if (!hasEntry('first_feed')) {
    return addScrapbookEntry('first_feed', 'First Meal!', 'Fed my pet for the very first time.', '🍖');
  }
  return null;
}

export function recordFirstPlay() {
  if (!hasEntry('first_play')) {
    return addScrapbookEntry('first_play', 'First Playtime!', 'Played with my pet for the first time.', '🎮');
  }
  return null;
}

export function recordFirstPet() {
  if (!hasEntry('first_pet')) {
    return addScrapbookEntry('first_pet', 'First Pet!', 'Gave my pet its first head pat.', '✋');
  }
  return null;
}

export function recordLevelUp(level) {
  return addScrapbookEntry('level_up', `Level ${level}!`, `My pet reached level ${level}!`, '⭐');
}

export function recordSpeciesUnlock(speciesName) {
  return addScrapbookEntry('species_unlock', `New Friend: ${speciesName}`, `Unlocked the ${speciesName}!`, '🎉');
}

export function recordAccessoryEquip(accessoryName) {
  const type = `accessory_first_${accessoryName}`;
  if (!hasEntry(type)) {
    return addScrapbookEntry(type, 'New Look!', `Tried on ${accessoryName} for the first time.`, '👒');
  }
  return null;
}

export function recordAchievement(achievementName, emoji) {
  return addScrapbookEntry('achievement', `Achievement: ${achievementName}`, `Unlocked "${achievementName}"!`, emoji || '🏆');
}

export function recordStreak(days) {
  return addScrapbookEntry('streak', `${days}-Day Streak!`, `Logged in ${days} days in a row!`, '🔥');
}

export function recordGameWin(gameName) {
  const type = `game_first_${gameName}`;
  if (!hasEntry(type)) {
    return addScrapbookEntry(type, `Won ${gameName}!`, `Won ${gameName} for the first time!`, '🕹️');
  }
  return null;
}
