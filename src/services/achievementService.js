/**
 * PetDesk - Achievement System
 * Defines achievements, tracks progress, and persists unlock state.
 */

const STORAGE_KEY = 'petdesk_achievements';
const STATS_KEY = 'petdesk_achievement_stats';
const SHOWCASE_KEY = 'petdesk_achievement_showcase';

// Rarity tiers
export const RARITY = {
  COMMON: { id: 'common', label: 'Common', color: 'text-gray-400', bgColor: 'bg-gray-600/20', borderColor: 'border-gray-500/40', points: 5 },
  RARE: { id: 'rare', label: 'Rare', color: 'text-blue-400', bgColor: 'bg-blue-600/20', borderColor: 'border-blue-500/40', points: 15 },
  EPIC: { id: 'epic', label: 'Epic', color: 'text-purple-400', bgColor: 'bg-purple-600/20', borderColor: 'border-purple-500/40', points: 30 },
  LEGENDARY: { id: 'legendary', label: 'Legendary', color: 'text-yellow-400', bgColor: 'bg-yellow-600/20', borderColor: 'border-yellow-500/40', points: 50 },
};

const achievementDefinitions = [
  // Feeding - Common
  { id: 'first_meal', name: 'First Meal', description: 'Feed pet for the first time', icon: '🍖', category: 'feeding', target: 1, stat: 'timesFed', rarity: 'common' },
  { id: 'gourmet', name: 'Gourmet', description: 'Feed pet 50 times', icon: '🍽️', category: 'feeding', target: 50, stat: 'timesFed', rarity: 'common' },
  { id: 'master_chef', name: 'Master Chef', description: 'Feed pet 200 times', icon: '👨‍🍳', category: 'feeding', target: 200, stat: 'timesFed', rarity: 'rare' },
  { id: 'food_critic', name: 'Food Critic', description: 'Feed pet 500 times', icon: '🧑‍🍳', category: 'feeding', target: 500, stat: 'timesFed', rarity: 'epic' },
  { id: 'feast_master', name: 'Feast Master', description: 'Feed pet 1000 times', icon: '🍱', category: 'feeding', target: 1000, stat: 'timesFed', rarity: 'legendary' },

  // Playing - Common/Rare
  { id: 'playtime', name: 'Playtime!', description: 'Play with pet for the first time', icon: '🎮', category: 'playing', target: 1, stat: 'timesPlayed', rarity: 'common' },
  { id: 'fun_lover', name: 'Fun Lover', description: 'Play 30 times', icon: '🎉', category: 'playing', target: 30, stat: 'timesPlayed', rarity: 'common' },
  { id: 'game_master', name: 'Game Master', description: 'Win all 3 mini games', icon: '🏆', category: 'playing', target: 3, stat: 'gamesWon', rarity: 'rare' },
  { id: 'play_addict', name: 'Play Addict', description: 'Play 200 times', icon: '🕹️', category: 'playing', target: 200, stat: 'timesPlayed', rarity: 'epic' },

  // Petting
  { id: 'first_touch', name: 'First Touch', description: 'Pet your pet for the first time', icon: '✋', category: 'petting', target: 1, stat: 'totalPets', rarity: 'common' },
  { id: 'best_friends', name: 'Best Friends', description: 'Pet 100 times', icon: '🤝', category: 'petting', target: 100, stat: 'totalPets', rarity: 'common' },
  { id: 'inseparable', name: 'Inseparable', description: 'Pet 500 times', icon: '💕', category: 'petting', target: 500, stat: 'totalPets', rarity: 'rare' },
  { id: 'soul_bond', name: 'Soul Bond', description: 'Pet 2000 times', icon: '💞', category: 'petting', target: 2000, stat: 'totalPets', rarity: 'legendary' },

  // Levels
  { id: 'growing_up', name: 'Growing Up', description: 'Reach level 5', icon: '🌱', category: 'levels', target: 5, stat: 'level', rarity: 'common' },
  { id: 'experienced', name: 'Experienced', description: 'Reach level 10', icon: '⭐', category: 'levels', target: 10, stat: 'level', rarity: 'common' },
  { id: 'veteran', name: 'Veteran', description: 'Reach level 20', icon: '🌟', category: 'levels', target: 20, stat: 'level', rarity: 'rare' },
  { id: 'elite', name: 'Elite', description: 'Reach level 35', icon: '💫', category: 'levels', target: 35, stat: 'level', rarity: 'epic' },
  { id: 'transcendent', name: 'Transcendent', description: 'Reach level 50', icon: '✨', category: 'levels', target: 50, stat: 'level', rarity: 'legendary' },

  // Species
  { id: 'cat_person', name: 'Cat Person', description: 'Unlock the cat', icon: '🐱', category: 'species', target: null, stat: 'unlockedCat', rarity: 'common' },
  { id: 'ghostbuster', name: 'Ghostbuster', description: 'Unlock the ghost', icon: '👻', category: 'species', target: null, stat: 'unlockedGhost', rarity: 'common' },
  { id: 'collector', name: 'Collector', description: 'Own all 3 species', icon: '🎪', category: 'species', target: 3, stat: 'speciesCount', rarity: 'rare' },

  // Accessories
  { id: 'fashion_start', name: 'Fashion Start', description: 'Equip first accessory', icon: '👒', category: 'accessories', target: 1, stat: 'accessoriesEquipped', rarity: 'common' },
  { id: 'fashionista', name: 'Fashionista', description: 'Own 6 accessories', icon: '💎', category: 'accessories', target: 6, stat: 'accessoriesOwned', rarity: 'rare' },
  { id: 'fully_dressed', name: 'Fully Dressed', description: 'Equip hat + glasses + other simultaneously', icon: '🎩', category: 'accessories', target: null, stat: 'fullyDressed', rarity: 'rare' },
  { id: 'wardrobe_king', name: 'Wardrobe King', description: 'Own 15 accessories', icon: '👗', category: 'accessories', target: 15, stat: 'accessoriesOwned', rarity: 'epic' },

  // Special - Rare/Epic/Legendary
  { id: 'night_owl', name: 'Night Owl', description: 'Interact with pet at 3AM', icon: '🦉', category: 'special', target: null, stat: 'nightOwl3am', rarity: 'rare' },
  { id: 'early_bird', name: 'Early Bird', description: 'Interact before 6AM', icon: '🐦', category: 'special', target: null, stat: 'earlyBird', rarity: 'rare' },
  { id: 'dedicated', name: 'Dedicated', description: '7-day login streak', icon: '🔥', category: 'special', target: 7, stat: 'loginStreak', rarity: 'rare' },
  { id: 'marathon', name: 'Marathon', description: 'Complete 5 pomodoros in a day', icon: '🏃', category: 'special', target: 5, stat: 'dailyPomodoros', rarity: 'epic' },
  { id: 'green_thumb', name: 'Green Thumb', description: 'Harvest 10 plants', icon: '🌻', category: 'special', target: 10, stat: 'plantsHarvested', rarity: 'rare' },
  { id: 'master_gardener', name: 'Master Gardener', description: 'Harvest 50 plants', icon: '🌳', category: 'special', target: 50, stat: 'plantsHarvested', rarity: 'epic' },
  { id: 'dungeon_master', name: 'Dungeon Master', description: 'Clear dungeon floor 10', icon: '🏰', category: 'special', target: 10, stat: 'dungeonFloor', rarity: 'epic' },
  { id: 'dungeon_legend', name: 'Dungeon Legend', description: 'Clear dungeon floor 25', icon: '⚔️', category: 'special', target: 25, stat: 'dungeonFloor', rarity: 'legendary' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Score 1000+ in racing', icon: '🏎️', category: 'special', target: 1000, stat: 'racingHighScore', rarity: 'epic' },
  { id: 'high_roller', name: 'High Roller', description: 'Earn 1000 coins total', icon: '💰', category: 'special', target: 1000, stat: 'totalCoinsEarned', rarity: 'rare' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn 10000 coins total', icon: '🤑', category: 'special', target: 10000, stat: 'totalCoinsEarned', rarity: 'legendary' },
  { id: 'battle_victor', name: 'Battle Victor', description: 'Win 10 battles', icon: '🗡️', category: 'special', target: 10, stat: 'battlesWon', rarity: 'rare' },
  { id: 'undefeated', name: 'Undefeated', description: 'Win 5 battles in a row', icon: '🛡️', category: 'special', target: 5, stat: 'winStreak', rarity: 'epic' },
  { id: 'champion', name: 'Champion', description: 'Win 50 battles', icon: '👑', category: 'special', target: 50, stat: 'battlesWon', rarity: 'legendary' },
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Chat with pet 50 times', icon: '🦋', category: 'special', target: 50, stat: 'chatMessages', rarity: 'rare' },
  { id: 'decorator', name: 'Decorator', description: 'Place 10 decorations', icon: '🖼️', category: 'special', target: 10, stat: 'decorationsPlaced', rarity: 'rare' },
  { id: 'interior_designer', name: 'Interior Designer', description: 'Own 20 furniture items', icon: '🏡', category: 'special', target: 20, stat: 'furnitureOwned', rarity: 'epic' },
  { id: 'evolution_first', name: 'First Evolution', description: 'Evolve your pet once', icon: '🧬', category: 'special', target: 1, stat: 'timesEvolved', rarity: 'rare' },
  { id: 'fully_evolved', name: 'Fully Evolved', description: 'Reach max evolution', icon: '🌌', category: 'special', target: 3, stat: 'timesEvolved', rarity: 'legendary' },
  { id: 'quest_complete', name: 'Quest Seeker', description: 'Complete 20 quests', icon: '📜', category: 'special', target: 20, stat: 'questsCompleted', rarity: 'rare' },
  { id: 'quest_master', name: 'Quest Master', description: 'Complete 100 quests', icon: '🗺️', category: 'special', target: 100, stat: 'questsCompleted', rarity: 'epic' },
  { id: 'dreamer', name: 'Dreamer', description: 'Have 10 dreams', icon: '💭', category: 'special', target: 10, stat: 'dreamsHad', rarity: 'rare' },
  { id: 'lucid_dreamer', name: 'Lucid Dreamer', description: 'Have 50 dreams', icon: '🌙', category: 'special', target: 50, stat: 'dreamsHad', rarity: 'epic' },
  { id: 'photographer', name: 'Photographer', description: 'Take 10 photos', icon: '📸', category: 'special', target: 10, stat: 'photosTaken', rarity: 'rare' },
  { id: 'streak_30', name: 'Monthly Devotion', description: '30-day login streak', icon: '📅', category: 'special', target: 30, stat: 'loginStreak', rarity: 'legendary' },
  { id: 'crafter', name: 'Crafter', description: 'Craft 10 items', icon: '🔨', category: 'special', target: 10, stat: 'itemsCrafted', rarity: 'rare' },
  { id: 'master_crafter', name: 'Master Crafter', description: 'Craft 50 items', icon: '⚒️', category: 'special', target: 50, stat: 'itemsCrafted', rarity: 'epic' },
  { id: 'skill_learner', name: 'Skill Learner', description: 'Learn 5 skills', icon: '📘', category: 'special', target: 5, stat: 'skillsLearned', rarity: 'rare' },
  { id: 'skill_master', name: 'Skill Master', description: 'Max out a skill', icon: '🎓', category: 'special', target: 1, stat: 'skillsMaxed', rarity: 'epic' },
  { id: 'completionist', name: 'Completionist', description: 'Unlock 40 achievements', icon: '🏅', category: 'special', target: 40, stat: 'achievementsUnlocked', rarity: 'legendary' },
];

/**
 * Load achievements from localStorage
 */
export function getAchievements() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with definitions to handle new achievements added later
      return achievementDefinitions.map((def) => {
        const existing = parsed.find((a) => a.id === def.id);
        return {
          ...def,
          unlocked: existing?.unlocked || false,
          unlockedAt: existing?.unlockedAt || null,
        };
      });
    }
  } catch (e) {
    // ignore parse errors
  }
  return achievementDefinitions.map((def) => ({
    ...def,
    unlocked: false,
    unlockedAt: null,
  }));
}

/**
 * Save achievements to localStorage
 */
export function persistAchievements(achievements) {
  try {
    const toSave = achievements.map(({ id, unlocked, unlockedAt }) => ({ id, unlocked, unlockedAt }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    // ignore
  }
}

/**
 * Load tracked stats from localStorage
 */
export function getStats() {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // ignore
  }
  return {
    timesFed: 0,
    timesPlayed: 0,
    totalPets: 0,
    gamesWon: 0,
    gamesWonSet: [], // track which games won
    level: 1,
    speciesCount: 1,
    unlockedCat: false,
    unlockedGhost: false,
    accessoriesEquipped: 0,
    accessoriesOwned: 1,
    fullyDressed: false,
    nightOwl: false,
    loginStreak: 0,
  };
}

/**
 * Save stats to localStorage
 */
export function persistStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    // ignore
  }
}

/**
 * Build current stats from pet state
 */
export function buildStatsFromPetState(petState, existingStats) {
  const stats = { ...existingStats };

  stats.level = petState.level || 1;
  stats.totalPets = petState.totalPets || 0;
  stats.speciesCount = (petState.unlockedSpecies || ['slime']).length;
  stats.unlockedCat = (petState.unlockedSpecies || []).includes('cat');
  stats.unlockedGhost = (petState.unlockedSpecies || []).includes('ghost');
  stats.accessoriesOwned = (petState.unlockedAccessories || []).length;
  stats.accessoriesEquipped = (petState.accessories || []).length;

  // Check fully dressed (hat + glasses + another category)
  if (petState.accessories && petState.accessories.length >= 3) {
    stats.fullyDressed = true;
  }

  // Night owl check (3AM specifically)
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 4) {
    stats.nightOwl3am = true;
  }
  // Early bird
  if (hour >= 4 && hour < 6) {
    stats.earlyBird = true;
  }

  // Count achievements unlocked
  const achievements = getAchievements();
  stats.achievementsUnlocked = achievements.filter(a => a.unlocked).length;

  return stats;
}

/**
 * Check achievements against current stats.
 * Returns array of newly unlocked achievements.
 */
export function checkAchievements(petState, stats) {
  const achievements = getAchievements();
  const currentStats = buildStatsFromPetState(petState, stats);
  const newlyUnlocked = [];

  achievements.forEach((achievement) => {
    if (achievement.unlocked) return;

    let unlocked = false;

    if (achievement.target !== null) {
      // Numeric target comparison
      const currentValue = currentStats[achievement.stat];
      if (typeof currentValue === 'number' && currentValue >= achievement.target) {
        unlocked = true;
      }
    } else {
      // Boolean check
      const currentValue = currentStats[achievement.stat];
      if (currentValue === true) {
        unlocked = true;
      }
    }

    if (unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      newlyUnlocked.push(achievement);
    }
  });

  if (newlyUnlocked.length > 0) {
    persistAchievements(achievements);
    persistStats(currentStats);
  }

  return newlyUnlocked;
}

/**
 * Increment a specific stat and persist
 */
export function incrementStat(statKey, amount = 1) {
  const stats = getStats();
  if (typeof stats[statKey] === 'number') {
    stats[statKey] += amount;
  } else {
    stats[statKey] = amount;
  }
  persistStats(stats);
  return stats;
}

/**
 * Record a mini game win
 */
export function recordGameWin(gameId) {
  const stats = getStats();
  if (!stats.gamesWonSet) stats.gamesWonSet = [];
  if (!stats.gamesWonSet.includes(gameId)) {
    stats.gamesWonSet.push(gameId);
    stats.gamesWon = stats.gamesWonSet.length;
  }
  persistStats(stats);
  return stats;
}

/**
 * Get achievement progress for display
 */
export function getAchievementProgress(achievement, stats) {
  if (achievement.unlocked) return null;
  if (achievement.target === null) return null;

  const current = stats[achievement.stat] || 0;
  return {
    current: Math.min(current, achievement.target),
    target: achievement.target,
    percent: Math.min(100, Math.round((current / achievement.target) * 100)),
  };
}

/**
 * Get rarity info for an achievement
 */
export function getAchievementRarity(achievement) {
  const rarityKey = (achievement.rarity || 'common').toUpperCase();
  return RARITY[rarityKey] || RARITY.COMMON;
}

/**
 * Get total achievement points
 */
export function getTotalAchievementPoints() {
  const achievements = getAchievements();
  let total = 0;
  for (const a of achievements) {
    if (a.unlocked) {
      const rarity = getAchievementRarity(a);
      total += rarity.points;
    }
  }
  return total;
}

/**
 * Get showcase (pinned achievements, max 3)
 */
export function getShowcase() {
  try {
    const stored = localStorage.getItem(SHOWCASE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Pin an achievement to showcase (max 3)
 */
export function pinToShowcase(achievementId) {
  const showcase = getShowcase();
  if (showcase.includes(achievementId)) return showcase;
  if (showcase.length >= 3) showcase.shift(); // Remove oldest
  showcase.push(achievementId);
  try {
    localStorage.setItem(SHOWCASE_KEY, JSON.stringify(showcase));
  } catch (e) { /* ignore */ }
  return showcase;
}

/**
 * Unpin an achievement from showcase
 */
export function unpinFromShowcase(achievementId) {
  let showcase = getShowcase();
  showcase = showcase.filter(id => id !== achievementId);
  try {
    localStorage.setItem(SHOWCASE_KEY, JSON.stringify(showcase));
  } catch (e) { /* ignore */ }
  return showcase;
}
