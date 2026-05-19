// Stats service - tracks lifetime statistics for PetDesk

const STATS_KEY = 'petdesk-lifetime-stats';

function getDefaultStats() {
  return {
    totalPlaytime: 0,
    totalInteractions: 0,
    totalFeeds: 0,
    totalPlays: 0,
    totalPets: 0,
    totalSleeps: 0,
    totalGamesPlayed: 0,
    totalGamesWon: 0,
    totalXPEarned: 0,
    totalLevelUps: 0,
    totalEvolutions: 0,
    totalAchievements: 0,
    highestLevel: 0,
    highestStreak: 0,
    dailyHistory: [],
    firstOpenDate: null,
    lastOpenDate: null,
    favoriteFood: null,
    favoriteGame: null,
    longestSession: 0,
    foodCounts: {},
    gameCounts: {},
  };
}

let stats = null;
let sessionStart = Date.now();
let playtimeInterval = null;

function loadStats() {
  if (stats) return stats;
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      stats = { ...getDefaultStats(), ...JSON.parse(stored) };
    } else {
      stats = getDefaultStats();
      stats.firstOpenDate = new Date().toISOString();
    }
  } catch (e) {
    stats = getDefaultStats();
    stats.firstOpenDate = new Date().toISOString();
  }
  stats.lastOpenDate = new Date().toISOString();
  saveStats();
  return stats;
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) { /* ignore */ }
}

// Record an interaction by type
export function recordInteraction(type) {
  const s = loadStats();
  s.totalInteractions++;

  switch (type) {
    case 'feed':
      s.totalFeeds++;
      break;
    case 'play':
      s.totalPlays++;
      break;
    case 'pet':
      s.totalPets++;
      break;
    case 'sleep':
      s.totalSleeps++;
      break;
    case 'game':
      s.totalGamesPlayed++;
      break;
    default:
      break;
  }

  saveStats();
  updateDailyHistory(type);
}

// Record a game win
export function recordGameWin() {
  const s = loadStats();
  s.totalGamesWon++;
  saveStats();
}

// Record XP earned
export function recordXP(amount) {
  const s = loadStats();
  s.totalXPEarned += amount;
  saveStats();
}

// Record level up
export function recordLevelUp(level) {
  const s = loadStats();
  s.totalLevelUps++;
  if (level > s.highestLevel) {
    s.highestLevel = level;
  }
  saveStats();
}

// Record evolution
export function recordEvolution() {
  const s = loadStats();
  s.totalEvolutions++;
  saveStats();
}

// Record achievement unlock
export function recordAchievementUnlock() {
  const s = loadStats();
  s.totalAchievements++;
  saveStats();
}

// Record streak
export function recordStreak(streak) {
  const s = loadStats();
  if (streak > s.highestStreak) {
    s.highestStreak = streak;
  }
  saveStats();
}

// Record food fed (for favorite tracking)
export function recordFood(foodName) {
  const s = loadStats();
  if (!s.foodCounts) s.foodCounts = {};
  s.foodCounts[foodName] = (s.foodCounts[foodName] || 0) + 1;

  // Update favorite
  let maxCount = 0;
  let fav = null;
  Object.entries(s.foodCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      fav = name;
    }
  });
  s.favoriteFood = fav;
  saveStats();
}

// Record game played (for favorite tracking)
export function recordGamePlayed(gameId) {
  const s = loadStats();
  if (!s.gameCounts) s.gameCounts = {};
  s.gameCounts[gameId] = (s.gameCounts[gameId] || 0) + 1;

  // Update favorite
  let maxCount = 0;
  let fav = null;
  Object.entries(s.gameCounts).forEach(([id, count]) => {
    if (count > maxCount) {
      maxCount = count;
      fav = id;
    }
  });
  s.favoriteGame = fav;
  saveStats();
}

// Track playtime - call this to start tracking
export function startPlaytimeTracking() {
  sessionStart = Date.now();
  if (playtimeInterval) clearInterval(playtimeInterval);

  playtimeInterval = setInterval(() => {
    const s = loadStats();
    s.totalPlaytime += 60; // add 60 seconds
    s.lastOpenDate = new Date().toISOString();

    // Update longest session
    const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000);
    if (sessionDuration > s.longestSession) {
      s.longestSession = sessionDuration;
    }

    saveStats();
  }, 60000); // every 60 seconds
}

// Stop playtime tracking
export function stopPlaytimeTracking() {
  if (playtimeInterval) {
    clearInterval(playtimeInterval);
    playtimeInterval = null;
  }
}

// Update daily history
function updateDailyHistory(type) {
  const s = loadStats();
  const today = new Date().toISOString().split('T')[0];

  if (!s.dailyHistory) s.dailyHistory = [];

  let todayEntry = s.dailyHistory.find((d) => d.date === today);
  if (!todayEntry) {
    todayEntry = { date: today, interactions: 0, xp: 0, playtime: 0, feeds: 0, plays: 0, pets: 0 };
    s.dailyHistory.push(todayEntry);
  }

  todayEntry.interactions++;
  if (type === 'feed') todayEntry.feeds = (todayEntry.feeds || 0) + 1;
  if (type === 'play') todayEntry.plays = (todayEntry.plays || 0) + 1;
  if (type === 'pet') todayEntry.pets = (todayEntry.pets || 0) + 1;

  // Keep only last 30 days
  if (s.dailyHistory.length > 30) {
    s.dailyHistory = s.dailyHistory.slice(-30);
  }

  saveStats();
}

// Update daily playtime (called from playtime tracker)
export function recordDailyPlaytime() {
  const s = loadStats();
  const today = new Date().toISOString().split('T')[0];

  if (!s.dailyHistory) s.dailyHistory = [];

  let todayEntry = s.dailyHistory.find((d) => d.date === today);
  if (!todayEntry) {
    todayEntry = { date: today, interactions: 0, xp: 0, playtime: 0, feeds: 0, plays: 0, pets: 0 };
    s.dailyHistory.push(todayEntry);
  }

  todayEntry.playtime += 60;
  saveStats();
}

// Get full stats
export function getStats() {
  return loadStats();
}

// Get last 7 days summary
export function getWeeklyTrend() {
  const s = loadStats();
  const now = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = (s.dailyHistory || []).find((h) => h.date === dateStr);
    days.push({
      date: dateStr,
      dayLabel: d.toLocaleDateString('en', { weekday: 'short' }),
      interactions: entry ? entry.interactions : 0,
      playtime: entry ? entry.playtime || 0 : 0,
    });
  }

  return days;
}

// Generate fun facts
export function getFunFacts() {
  const s = loadStats();
  const facts = [];

  if (s.totalFeeds > 0) {
    facts.push(`You've fed your pet ${s.totalFeeds.toLocaleString()} times! 🍖`);
  }
  if (s.totalPets > 0) {
    facts.push(`${s.totalPets.toLocaleString()} head pats given ❤️`);
  }
  if (s.favoriteFood) {
    facts.push(`Favorite food: ${s.favoriteFood} 🍎`);
  }
  if (s.favoriteGame) {
    const gameNames = { catchFood: 'Catch Food', memoryMatch: 'Memory Match', quickTap: 'Quick Tap' };
    facts.push(`Favorite game: ${gameNames[s.favoriteGame] || s.favoriteGame} 🎮`);
  }
  if (s.longestSession > 0) {
    const hrs = Math.floor(s.longestSession / 3600);
    const mins = Math.floor((s.longestSession % 3600) / 60);
    facts.push(`Longest session: ${hrs > 0 ? hrs + 'h ' : ''}${mins}m ⏱️`);
  }
  if (s.highestStreak > 0) {
    facts.push(`Highest streak: ${s.highestStreak} days 🔥`);
  }
  if (s.totalGamesPlayed > 0 && s.totalGamesWon > 0) {
    const winRate = Math.round((s.totalGamesWon / s.totalGamesPlayed) * 100);
    facts.push(`Games win rate: ${winRate}% 🎯`);
  }

  return facts;
}

// Format playtime as human readable
export function formatPlaytime(seconds) {
  if (seconds < 60) return '< 1m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Get days active (days with at least 1 interaction)
export function getDaysActive() {
  const s = loadStats();
  if (!s.firstOpenDate) return 0;
  const first = new Date(s.firstOpenDate);
  const now = new Date();
  return Math.max(1, Math.ceil((now - first) / 86400000));
}
