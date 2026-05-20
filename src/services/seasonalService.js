/**
 * PetDesk - Seasonal Events Service
 * Checks current date for seasonal events and provides rewards.
 */

const SEASONAL_KEY = 'petdesk_seasonal_events';

const SEASONAL_EVENTS = [
  {
    id: 'raya',
    name: 'Hari Raya',
    emoji: '🌙',
    startMonth: 3, // April (0-indexed) - approximate, varies yearly
    startDay: 10,
    endMonth: 3,
    endDay: 20,
    xpMultiplier: 1.5,
    particles: 'stars',
    bgColor: 'from-green-900/20 to-yellow-900/20',
    accessories: ['ketupat-charm'],
    banner: '🌙 Selamat Hari Raya! Bonus XP active!',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    startMonth: 11, // December
    startDay: 20,
    endMonth: 11,
    endDay: 26,
    xpMultiplier: 2.0,
    particles: 'snow',
    bgColor: 'from-red-900/20 to-green-900/20',
    accessories: ['santa-hat'],
    banner: '🎄 Merry Christmas! Double XP!',
  },
  {
    id: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    startMonth: 9, // October
    startDay: 25,
    endMonth: 10, // November
    endDay: 1,
    xpMultiplier: 1.5,
    particles: 'fire',
    bgColor: 'from-orange-900/20 to-purple-900/20',
    accessories: ['witch-hat'],
    banner: '🎃 Spooky Season! Bonus XP!',
  },
  {
    id: 'newyear',
    name: 'New Year',
    emoji: '🎆',
    startMonth: 0, // January
    startDay: 1,
    endMonth: 0,
    endDay: 3,
    xpMultiplier: 2.0,
    particles: 'sparkles',
    bgColor: 'from-blue-900/20 to-purple-900/20',
    accessories: ['party-hat'],
    banner: '🎆 Happy New Year! Double XP!',
  },
  {
    id: 'valentine',
    name: "Valentine's Day",
    emoji: '💝',
    startMonth: 1, // February
    startDay: 13,
    endMonth: 1,
    endDay: 15,
    xpMultiplier: 1.5,
    particles: 'hearts',
    bgColor: 'from-pink-900/20 to-red-900/20',
    accessories: ['heart-bow'],
    banner: "💝 Happy Valentine's! Love XP bonus!",
  },
];

/**
 * Load claimed seasonal rewards
 */
function loadClaimedRewards() {
  try {
    const stored = localStorage.getItem(SEASONAL_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {};
}

/**
 * Save claimed seasonal rewards
 */
function saveClaimedRewards(claimed) {
  try {
    localStorage.setItem(SEASONAL_KEY, JSON.stringify(claimed));
  } catch (e) { /* ignore */ }
}

/**
 * Check if a date falls within an event's range
 */
function isDateInRange(date, event) {
  const month = date.getMonth();
  const day = date.getDate();

  // Handle events that span across months
  if (event.startMonth === event.endMonth) {
    // Same month: day must be within start and end
    return month === event.startMonth && day >= event.startDay && day <= event.endDay;
  } else if (event.startMonth < event.endMonth) {
    // Spans multiple months within same year
    if (month === event.startMonth && day >= event.startDay) return true;
    if (month === event.endMonth && day <= event.endDay) return true;
    if (month > event.startMonth && month < event.endMonth) return true;
  } else {
    // Wraps around year (e.g., Dec to Jan)
    if (month === event.startMonth && day >= event.startDay) return true;
    if (month === event.endMonth && day <= event.endDay) return true;
    if (month > event.startMonth || month < event.endMonth) return true;
  }

  return false;
}

/**
 * Get currently active seasonal event (if any)
 */
export function getActiveSeasonalEvent() {
  const now = new Date();
  for (const event of SEASONAL_EVENTS) {
    if (isDateInRange(now, event)) {
      return event;
    }
  }
  return null;
}

/**
 * Check if reward has been claimed for current event occurrence
 */
export function hasClaimedReward(eventId) {
  const claimed = loadClaimedRewards();
  const year = new Date().getFullYear();
  const key = `${eventId}_${year}`;
  return !!claimed[key];
}

/**
 * Claim reward for a seasonal event
 */
export function claimSeasonalReward(eventId) {
  const claimed = loadClaimedRewards();
  const year = new Date().getFullYear();
  const key = `${eventId}_${year}`;

  if (claimed[key]) return null; // Already claimed

  claimed[key] = { claimedAt: Date.now() };
  saveClaimedRewards(claimed);

  const event = SEASONAL_EVENTS.find((e) => e.id === eventId);
  if (!event) return null;

  return {
    xpBonus: 50,
    accessories: event.accessories || [],
    message: `Claimed ${event.name} reward!`,
  };
}

/**
 * Get XP multiplier for active event
 */
export function getSeasonalXpMultiplier() {
  const event = getActiveSeasonalEvent();
  return event ? event.xpMultiplier : 1.0;
}

/**
 * Get all seasonal events (for display)
 */
export function getAllSeasonalEvents() {
  return SEASONAL_EVENTS;
}
