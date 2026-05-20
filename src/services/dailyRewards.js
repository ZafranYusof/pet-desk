/**
 * PetDesk - Daily Rewards System
 * Tracks login streaks and provides daily bonuses.
 */

const STORAGE_KEY = 'petdesk_daily_rewards';

const dailyRewards = [
  { day: 1, xp: 10, description: '+10 XP' },
  { day: 2, xp: 15, description: '+15 XP' },
  { day: 3, xp: 20, accessory: true, description: '+20 XP + Random Accessory' },
  { day: 4, xp: 25, description: '+25 XP' },
  { day: 5, xp: 30, description: '+30 XP' },
  { day: 6, xp: 40, description: '+40 XP' },
  { day: 7, xp: 50, accessory: true, badge: true, description: '+50 XP + Streak Master Badge + Accessory' },
];

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Load reward state from localStorage
 */
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {
    loginDates: [],
    lastClaimed: null,
    streak: 0,
  };
}

/**
 * Save reward state to localStorage
 */
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // ignore
  }
}

/**
 * Get current streak count
 */
export function getStreak() {
  const state = loadState();
  return calculateStreak(state);
}

function calculateStreak(state) {
  const { loginDates } = state;
  if (!loginDates || loginDates.length === 0) return 0;

  const sorted = [...loginDates].sort().reverse();
  const today = getToday();
  const yesterday = getYesterday();

  // If last login was today or yesterday, count streak
  if (sorted[0] !== today && sorted[0] !== yesterday) {
    return 0; // streak broken
  }

  let streak = 0;
  let checkDate = new Date(sorted[0]);

  for (let i = 0; i < sorted.length; i++) {
    const expected = checkDate.toISOString().split('T')[0];
    if (sorted[i] === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (sorted[i] < expected) {
      break;
    }
  }

  return streak;
}

/**
 * Check if daily reward is available (not claimed today)
 */
export function checkDailyReward() {
  const state = loadState();
  const today = getToday();

  if (state.lastClaimed === today) {
    return null; // already claimed today
  }

  // Calculate what day in the cycle we're on
  const streak = calculateStreak(state);
  const dayInCycle = (streak % 7) + 1; // 1-7
  const cycleNumber = Math.floor(streak / 7); // 0, 1, 2...
  const multiplier = cycleNumber > 0 ? 1.5 : 1;

  const reward = dailyRewards[dayInCycle - 1];

  return {
    day: dayInCycle,
    streak: streak + 1, // will be after claiming
    xp: Math.round(reward.xp * multiplier),
    accessory: reward.accessory || false,
    badge: reward.badge || false,
    description: reward.description,
    multiplier,
  };
}

/**
 * Claim today's reward. Returns updated pet state and reward info.
 */
export function claimReward(petState) {
  const state = loadState();
  const today = getToday();

  if (state.lastClaimed === today) {
    return { petState, reward: null };
  }

  // Add today to login dates
  if (!state.loginDates.includes(today)) {
    state.loginDates.push(today);
  }
  state.lastClaimed = today;

  // Calculate streak after adding today
  const streak = calculateStreak(state);
  state.streak = streak;
  saveState(state);

  const dayInCycle = ((streak - 1) % 7) + 1;
  const cycleNumber = Math.floor((streak - 1) / 7);
  const multiplier = cycleNumber > 0 ? 1.5 : 1;
  const reward = dailyRewards[dayInCycle - 1];
  const xpGain = Math.round(reward.xp * multiplier);

  // Apply XP to pet
  const updated = { ...petState };
  updated.xp = (updated.xp || 0) + xpGain;
  updated.level = Math.floor(updated.xp / 100) + 1;

  // Unlock random accessory if reward includes one
  let unlockedAccessory = null;
  if (reward.accessory) {
    const allAccessories = ['party-hat', 'cool-shades', 'bow-tie', 'crown', 'wizard-hat', 'monocle', 'scarf', 'headphones'];
    const locked = allAccessories.filter((a) => !(updated.unlockedAccessories || []).includes(a));
    if (locked.length > 0) {
      unlockedAccessory = locked[Math.floor(Math.random() * locked.length)];
      updated.unlockedAccessories = [...(updated.unlockedAccessories || []), unlockedAccessory];
    }
  }

  return {
    petState: updated,
    reward: {
      day: dayInCycle,
      streak,
      xp: xpGain,
      accessory: unlockedAccessory,
      badge: reward.badge || false,
      description: reward.description,
      multiplier,
    },
  };
}

/**
 * Dismiss today's reward without claiming (skip).
 * Prevents popup from showing again until tomorrow.
 */
export function dismissReward() {
  const state = loadState();
  const today = getToday();
  state.lastClaimed = today;
  // Don't add to loginDates (streak doesn't count)
  saveState(state);
}

/**
 * Get last 7 days status for calendar strip
 */
export function getWeekStatus() {
  const state = loadState();
  const today = getToday();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en', { weekday: 'short' });

    days.push({
      date: dateStr,
      day: dayName,
      claimed: state.loginDates.includes(dateStr),
      isToday: dateStr === today,
    });
  }

  return days;
}
