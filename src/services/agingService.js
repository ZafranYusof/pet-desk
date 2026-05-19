/**
 * PetDesk - Aging Service
 * Tracks pet age in real days since creation, birthday logic, and age stages.
 */

const AGING_KEY = 'petdesk_aging_data';

/**
 * Get or initialize aging data for the pet.
 * If no birthDate exists, sets it to today (backward compat for existing pets).
 */
export function getAgingData() {
  try {
    const stored = localStorage.getItem(AGING_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

/**
 * Initialize aging data (call on pet creation or first load)
 */
export function initAgingData(createdAt) {
  const birthDate = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
  const data = {
    birthDate,
    lastBirthdayYear: new Date(birthDate).getFullYear(),
  };
  localStorage.setItem(AGING_KEY, JSON.stringify(data));
  return data;
}

/**
 * Save aging data
 */
export function saveAgingData(data) {
  localStorage.setItem(AGING_KEY, JSON.stringify(data));
}

/**
 * Get pet age from birthDate
 * Returns { days, weeks, months, displayText }
 */
export function getPetAge(birthDate) {
  if (!birthDate) return { days: 0, weeks: 0, months: 0, displayText: '0 days old' };

  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now - birth;
  const days = Math.floor(diffMs / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  let displayText;
  if (days === 0) displayText = 'Born today!';
  else if (days === 1) displayText = '1 day old';
  else if (days < 14) displayText = `${days} days old`;
  else if (weeks < 8) displayText = `${weeks} weeks old`;
  else if (months < 12) displayText = `${months} months old`;
  else {
    const years = Math.floor(months / 12);
    displayText = years === 1 ? '1 year old' : `${years} years old`;
  }

  return { days, weeks, months, displayText };
}

/**
 * Check if today is the pet's birthday (same month + day as birthDate)
 */
export function isBirthday(birthDate) {
  if (!birthDate) return false;
  const birth = new Date(birthDate);
  const now = new Date();
  return birth.getMonth() === now.getMonth() && birth.getDate() === now.getDate();
}

/**
 * Check if birthday should be celebrated this year
 * (hasn't been celebrated yet for the current year)
 */
export function shouldCelebrateBirthday() {
  const data = getAgingData();
  if (!data) return false;
  if (!isBirthday(data.birthDate)) return false;

  const currentYear = new Date().getFullYear();
  const birthYear = new Date(data.birthDate).getFullYear();

  // Don't celebrate on the actual creation day (day 0)
  if (currentYear === birthYear) return false;

  return data.lastBirthdayYear < currentYear;
}

/**
 * Mark birthday as celebrated for this year
 */
export function markBirthdayCelebrated() {
  const data = getAgingData();
  if (!data) return;
  data.lastBirthdayYear = new Date().getFullYear();
  saveAgingData(data);
}

/**
 * Get birthday rewards
 */
export function getBirthdayRewards() {
  const data = getAgingData();
  const age = data ? getPetAge(data.birthDate) : { days: 365 };
  const years = Math.max(1, Math.floor(age.days / 365));

  return {
    xp: 100 * years,
    food: 'golden_apple',
    foodCount: years,
    message: `Happy Birthday! ${years} year${years > 1 ? 's' : ''} of friendship!`,
  };
}

/**
 * Get age stage based on days alive
 */
export function getAgeStage(days) {
  if (days <= 7) return 'baby';
  if (days <= 30) return 'young';
  if (days <= 90) return 'adult';
  return 'elder';
}

/**
 * Get age stage display info
 */
export function getAgeStageInfo(stage) {
  const stages = {
    baby: { label: 'Baby', emoji: '🐣', color: 'text-pink-300' },
    young: { label: 'Young', emoji: '🌱', color: 'text-green-300' },
    adult: { label: 'Adult', emoji: '⭐', color: 'text-blue-300' },
    elder: { label: 'Elder', emoji: '👑', color: 'text-yellow-300' },
  };
  return stages[stage] || stages.young;
}

/**
 * Get mood/behavior modifiers based on age stage
 */
export function getAgeMoodModifier(stage) {
  switch (stage) {
    case 'baby':
      return {
        hungerDecayMultiplier: 1.5, // gets hungry faster
        scaleModifier: 0.8, // smaller sprite
        speedModifier: 1.2, // more bouncy
        xpModifier: 1.0,
        happinessDecayMultiplier: 1.0,
      };
    case 'young':
      return {
        hungerDecayMultiplier: 1.0,
        scaleModifier: 1.0,
        speedModifier: 1.0,
        xpModifier: 1.0,
        happinessDecayMultiplier: 1.0,
      };
    case 'adult':
      return {
        hungerDecayMultiplier: 1.0,
        scaleModifier: 1.0,
        speedModifier: 0.9, // slightly slower
        xpModifier: 1.0,
        happinessDecayMultiplier: 0.8, // more content
      };
    case 'elder':
      return {
        hungerDecayMultiplier: 0.8, // eats less
        scaleModifier: 1.0,
        speedModifier: 0.7, // walks slower
        xpModifier: 1.1, // wisdom bonus +10% XP
        happinessDecayMultiplier: 0.9,
      };
    default:
      return {
        hungerDecayMultiplier: 1.0,
        scaleModifier: 1.0,
        speedModifier: 1.0,
        xpModifier: 1.0,
        happinessDecayMultiplier: 1.0,
      };
  }
}
