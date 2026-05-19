/**
 * PetDesk - Achievement System
 * Defines achievements, tracks progress, and persists unlock state.
 */

const STORAGE_KEY = 'petdesk_achievements';
const STATS_KEY = 'petdesk_achievement_stats';

const achievementDefinitions = [
  // Feeding
  { id: 'first_meal', name: 'First Meal', description: 'Feed pet for the first time', icon: '🍖', category: 'feeding', target: 1, stat: 'timesFed' },
  { id: 'gourmet', name: 'Gourmet', description: 'Feed pet 50 times', icon: '🍽️', category: 'feeding', target: 50, stat: 'timesFed' },
  { id: 'master_chef', name: 'Master Chef', description: 'Feed pet 200 times', icon: '👨‍🍳', category: 'feeding', target: 200, stat: 'timesFed' },

  // Playing
  { id: 'playtime', name: 'Playtime!', description: 'Play with pet for the first time', icon: '🎮', category: 'playing', target: 1, stat: 'timesPlayed' },
  { id: 'fun_lover', name: 'Fun Lover', description: 'Play 30 times', icon: '🎉', category: 'playing', target: 30, stat: 'timesPlayed' },
  { id: 'game_master', name: 'Game Master', description: 'Win all 3 mini games', icon: '🏆', category: 'playing', target: 3, stat: 'gamesWon' },

  // Petting
  { id: 'first_touch', name: 'First Touch', description: 'Pet your pet for the first time', icon: '✋', category: 'petting', target: 1, stat: 'totalPets' },
  { id: 'best_friends', name: 'Best Friends', description: 'Pet 100 times', icon: '🤝', category: 'petting', target: 100, stat: 'totalPets' },
  { id: 'inseparable', name: 'Inseparable', description: 'Pet 500 times', icon: '💕', category: 'petting', target: 500, stat: 'totalPets' },

  // Levels
  { id: 'growing_up', name: 'Growing Up', description: 'Reach level 5', icon: '🌱', category: 'levels', target: 5, stat: 'level' },
  { id: 'experienced', name: 'Experienced', description: 'Reach level 10', icon: '⭐', category: 'levels', target: 10, stat: 'level' },
  { id: 'legendary', name: 'Legendary', description: 'Reach level 20', icon: '🌟', category: 'levels', target: 20, stat: 'level' },
  { id: 'transcendent', name: 'Transcendent', description: 'Reach level 50', icon: '✨', category: 'levels', target: 50, stat: 'level' },

  // Species
  { id: 'cat_person', name: 'Cat Person', description: 'Unlock the cat', icon: '🐱', category: 'species', target: null, stat: 'unlockedCat' },
  { id: 'ghostbuster', name: 'Ghostbuster', description: 'Unlock the ghost', icon: '👻', category: 'species', target: null, stat: 'unlockedGhost' },
  { id: 'collector', name: 'Collector', description: 'Own all 3 species', icon: '🎪', category: 'species', target: 3, stat: 'speciesCount' },

  // Accessories
  { id: 'fashion_start', name: 'Fashion Start', description: 'Equip first accessory', icon: '👒', category: 'accessories', target: 1, stat: 'accessoriesEquipped' },
  { id: 'fashionista', name: 'Fashionista', description: 'Own 6 accessories', icon: '💎', category: 'accessories', target: 6, stat: 'accessoriesOwned' },
  { id: 'fully_dressed', name: 'Fully Dressed', description: 'Equip hat + glasses + other simultaneously', icon: '🎩', category: 'accessories', target: null, stat: 'fullyDressed' },

  // Special
  { id: 'night_owl', name: 'Night Owl', description: 'Interact with pet after midnight', icon: '🦉', category: 'special', target: null, stat: 'nightOwl' },
  { id: 'dedicated', name: 'Dedicated', description: '7-day login streak', icon: '🔥', category: 'special', target: 7, stat: 'loginStreak' },
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

  // Night owl check
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) {
    stats.nightOwl = true;
  }

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
