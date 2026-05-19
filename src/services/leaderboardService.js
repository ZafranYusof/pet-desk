// Leaderboard Service - Simulated online leaderboard with fake players

const LEADERBOARD_KEY = 'petdesk_leaderboard';
const PLAYER_SCORES_KEY = 'petdesk_player_scores';
const LAST_UPDATE_KEY = 'petdesk_leaderboard_last_update';

const FAKE_NAMES = [
  "PixelMaster", "SlimeKing99", "GhostHunter", "CatLord", "NeonPet",
  "StarChaser", "ByteBoss", "CloudWalker", "DarkPhantom", "GoldenPaw",
  "ShadowFang", "CrystalEye", "ThunderPet", "MoonChild", "FireStarter",
  "IceQueen", "StormRider", "NightOwl", "SunDancer", "RainMaker",
  "CosmicDust", "PixelNinja", "CodePet", "DataDog", "BitBeast",
  "HexHero", "VoidWalker", "LightBringer", "DreamWeaver", "ChaosPet"
];

const CATEGORIES = ['level', 'battleWins', 'arcadeHighScore', 'totalXp', 'collection'];

// Seeded random for consistent fake player generation
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// Generate a bell curve value around a center
function bellCurveValue(center, spread, rng) {
  // Box-Muller approximation using uniform randoms
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.001))) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, Math.round(center + z * spread));
}

// Get player's real scores from pet state
function getPlayerScores() {
  try {
    const stored = localStorage.getItem(PLAYER_SCORES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return { level: 1, battleWins: 0, arcadeHighScore: 0, totalXp: 0, collection: 0 };
}

function savePlayerScores(scores) {
  try {
    localStorage.setItem(PLAYER_SCORES_KEY, JSON.stringify(scores));
  } catch (e) { /* ignore */ }
}

// Generate fake players scaled around the player's stats
function generateFakePlayers(playerScores) {
  const today = new Date().toISOString().split('T')[0];
  const daySeed = today.split('-').reduce((acc, v) => acc * 100 + parseInt(v), 0);

  const players = [];

  for (let i = 0; i < 50; i++) {
    const rng = seededRandom(daySeed + i * 7919);
    const nameIndex = i % FAKE_NAMES.length;
    const suffix = i >= FAKE_NAMES.length ? Math.floor(i / FAKE_NAMES.length) + '' : '';
    const name = FAKE_NAMES[nameIndex] + suffix;

    const scores = {};

    CATEGORIES.forEach((cat) => {
      const playerVal = playerScores[cat] || 1;
      let spread, center;

      if (i < 3) {
        // Top 3: always ahead of player
        center = playerVal * (1.2 + (3 - i) * 0.15);
        spread = playerVal * 0.1;
      } else if (i >= 40) {
        // Bottom 10: always below player
        center = playerVal * (0.3 + rng() * 0.4);
        spread = playerVal * 0.05;
      } else {
        // Middle: distributed around player
        center = playerVal * (0.6 + rng() * 0.8);
        spread = playerVal * 0.2;
      }

      scores[cat] = Math.max(1, Math.round(bellCurveValue(center, spread, rng)));
    });

    players.push({ name, scores, seed: daySeed + i });
  }

  return players;
}

// Load or regenerate leaderboard
function loadLeaderboard() {
  try {
    const stored = localStorage.getItem(LEADERBOARD_KEY);
    const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (stored && lastUpdate === today) {
      return JSON.parse(stored);
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveLeaderboard(players) {
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(players));
    localStorage.setItem(LAST_UPDATE_KEY, today);
  } catch (e) { /* ignore */ }
}

// Update fake players with small daily increments
export function updateFakePlayers() {
  const playerScores = getPlayerScores();
  let players = loadLeaderboard();

  if (!players) {
    players = generateFakePlayers(playerScores);
    saveLeaderboard(players);
  } else {
    // Apply small random increments to simulate daily play
    const rng = seededRandom(Date.now() % 100000);
    players = players.map((p, i) => {
      const updated = { ...p, scores: { ...p.scores } };
      CATEGORIES.forEach((cat) => {
        const playerVal = playerScores[cat] || 1;
        const increment = Math.max(0, Math.round(playerVal * 0.02 * rng()));
        updated.scores[cat] = (updated.scores[cat] || 1) + increment;
      });
      return updated;
    });

    // Re-scale if player has grown significantly
    const playerLevel = playerScores.level || 1;
    const avgFakeLevel = players.reduce((sum, p) => sum + (p.scores.level || 1), 0) / players.length;
    if (playerLevel > avgFakeLevel * 1.5 || playerLevel < avgFakeLevel * 0.3) {
      players = generateFakePlayers(playerScores);
    }

    saveLeaderboard(players);
  }

  return players;
}

// Get sorted leaderboard for a category
export function getLeaderboard(category, petName = 'You') {
  const playerScores = getPlayerScores();
  let fakePlayers = loadLeaderboard();

  if (!fakePlayers) {
    fakePlayers = generateFakePlayers(playerScores);
    saveLeaderboard(fakePlayers);
  }

  // Build entries: fake players + real player
  const entries = fakePlayers.map((p) => ({
    name: p.name,
    score: p.scores[category] || 0,
    isPlayer: false,
  }));

  // Add real player
  entries.push({
    name: `★ ${petName} ★`,
    score: playerScores[category] || 0,
    isPlayer: true,
  });

  // Sort descending
  entries.sort((a, b) => b.score - a.score);

  // Assign ranks
  return entries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

// Get player's rank in a category
export function getPlayerRank(category) {
  const leaderboard = getLeaderboard(category);
  const playerEntry = leaderboard.find((e) => e.isPlayer);
  return playerEntry ? playerEntry.rank : leaderboard.length;
}

// Submit/update player's score for a category
export function submitScore(category, score) {
  const scores = getPlayerScores();
  // For most categories, keep the highest value
  if (category === 'arcadeHighScore') {
    scores[category] = Math.max(scores[category] || 0, score);
  } else {
    scores[category] = score;
  }
  savePlayerScores(scores);
}

// Sync all player scores from pet state (call on mount / after actions)
export function syncPlayerScores(petState, stats) {
  const scores = getPlayerScores();
  scores.level = petState.level || 1;
  scores.totalXp = petState.xp || 0;

  if (stats) {
    scores.battleWins = stats.battlesWon || 0;
    scores.collection = (stats.achievementsUnlocked || 0) +
      (petState.unlockedAccessories?.length || 0) +
      (petState.unlockedSpecies?.length || 0);
  }

  savePlayerScores(scores);
}

// Get motivational message based on rank
export function getMotivationalMessage(category, petName) {
  const leaderboard = getLeaderboard(category, petName);
  const playerEntry = leaderboard.find((e) => e.isPlayer);
  if (!playerEntry) return "Keep playing!";

  const rank = playerEntry.rank;
  const total = leaderboard.length;

  if (rank === 1) return "👑 You're #1! Unbeatable!";
  if (rank <= 3) return "🔥 So close to the top! Keep pushing!";

  // Find next player above
  const above = leaderboard[rank - 2]; // rank is 1-indexed, array is 0-indexed
  if (above) {
    const diff = above.score - playerEntry.score;
    const categoryLabel = getCategoryUnit(category);
    return `${diff} ${categoryLabel} to rank #${rank - 1}!`;
  }

  if (rank <= Math.floor(total * 0.25)) return "Top 25%! You're climbing fast! 🚀";
  if (rank <= Math.floor(total * 0.5)) return "Keep going! You're in the top half! 💪";
  return "Every journey starts somewhere! Keep at it! ✨";
}

function getCategoryUnit(category) {
  switch (category) {
    case 'level': return 'levels';
    case 'battleWins': return 'wins';
    case 'arcadeHighScore': return 'points';
    case 'totalXp': return 'XP';
    case 'collection': return 'items';
    default: return 'points';
  }
}

// Category display info
export function getCategoryInfo(category) {
  switch (category) {
    case 'level':
      return { label: 'Level', icon: '⭐', format: (v) => `Lv.${v}` };
    case 'battleWins':
      return { label: 'Battles', icon: '⚔️', format: (v) => `${v} wins` };
    case 'arcadeHighScore':
      return { label: 'Arcade', icon: '🕹️', format: (v) => `${v} pts` };
    case 'totalXp':
      return { label: 'XP', icon: '✨', format: (v) => `${v} XP` };
    case 'collection':
      return { label: 'Collection', icon: '🎒', format: (v) => `${v} items` };
    default:
      return { label: category, icon: '📊', format: (v) => `${v}` };
  }
}

export { CATEGORIES };
