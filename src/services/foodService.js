/**
 * PetDesk - Food System Service
 * Manages food types, inventory, effects, and timed buffs.
 */

const INVENTORY_KEY = 'petdesk_food_inventory';
const EFFECTS_KEY = 'petdesk_active_effects';

const foods = [
  // Basic (always available)
  {
    id: 'bread',
    name: 'Bread',
    emoji: '🍞',
    unlockLevel: 1,
    isSpecial: false,
    effects: { hunger: 15, happiness: 0, energy: 0, xp: 0 },
    speciesBonus: null,
    duration: null,
  },
  {
    id: 'apple',
    name: 'Apple',
    emoji: '🍎',
    unlockLevel: 1,
    isSpecial: false,
    effects: { hunger: 20, happiness: 5, energy: 0, xp: 0 },
    speciesBonus: null,
    duration: null,
  },
  {
    id: 'water',
    name: 'Water',
    emoji: '💧',
    unlockLevel: 1,
    isSpecial: false,
    effects: { hunger: 10, happiness: 0, energy: 10, xp: 0 },
    speciesBonus: null,
    duration: null,
  },
  // Unlockable
  {
    id: 'cake',
    name: 'Cake',
    emoji: '🎂',
    unlockLevel: 5,
    isSpecial: false,
    effects: { hunger: 25, happiness: 15, energy: -5, xp: 0 },
    speciesBonus: null,
    duration: null,
  },
  {
    id: 'fish',
    name: 'Fish',
    emoji: '🐟',
    unlockLevel: 7,
    isSpecial: false,
    effects: { hunger: 30, happiness: 10, energy: 0, xp: 0 },
    speciesBonus: { cat: { happiness: 20 } },
    duration: null,
  },
  {
    id: 'steak',
    name: 'Steak',
    emoji: '🥩',
    unlockLevel: 10,
    isSpecial: false,
    effects: { hunger: 40, happiness: 0, energy: 5, xp: 0 },
    speciesBonus: null,
    duration: null,
  },
  {
    id: 'pizza',
    name: 'Pizza',
    emoji: '🍕',
    unlockLevel: 12,
    isSpecial: false,
    effects: { hunger: 35, happiness: 10, energy: 0, xp: 0 },
    speciesBonus: null,
    duration: null,
  },
  {
    id: 'sushi',
    name: 'Sushi',
    emoji: '🍣',
    unlockLevel: 15,
    isSpecial: false,
    effects: { hunger: 30, happiness: 15, energy: 0, xp: 5 },
    speciesBonus: null,
    duration: null,
  },
  // Special (rare, from daily rewards or achievements)
  {
    id: 'golden_apple',
    name: 'Golden Apple',
    emoji: '✨',
    unlockLevel: 1,
    isSpecial: true,
    effects: { hunger: 50, happiness: 30, energy: 0, xp: 0 },
    speciesBonus: null,
    duration: { type: 'xpMultiplier', value: 2, seconds: 300 },
  },
  {
    id: 'star_candy',
    name: 'Star Candy',
    emoji: '🌟',
    unlockLevel: 1,
    isSpecial: true,
    effects: { hunger: 20, happiness: 50, energy: 0, xp: 0 },
    speciesBonus: null,
    duration: { type: 'dance', value: 1, seconds: 10 },
  },
  {
    id: 'energy_drink',
    name: 'Energy Drink',
    emoji: '⚡',
    unlockLevel: 1,
    isSpecial: true,
    effects: { hunger: 10, happiness: 0, energy: 80, xp: 0 },
    speciesBonus: null,
    duration: { type: 'speedBoost', value: 2, seconds: 180 },
  },
  {
    id: 'mystery_meat',
    name: 'Mystery Meat',
    emoji: '🔮',
    unlockLevel: 1,
    isSpecial: true,
    effects: { hunger: 0, happiness: 0, energy: 0, xp: 0 }, // randomized on use
    speciesBonus: null,
    duration: null,
  },
];

/**
 * Get available foods for a given level.
 * Non-special foods: available if level >= unlockLevel
 * Special foods: always shown if in inventory
 */
export function getFoods(level) {
  return foods.map((food) => {
    const unlocked = !food.isSpecial ? level >= food.unlockLevel : true;
    return { ...food, unlocked };
  });
}

/**
 * Get all food definitions
 */
export function getAllFoods() {
  return foods;
}

/**
 * Get food by ID
 */
export function getFoodById(id) {
  return foods.find((f) => f.id === id) || null;
}

/**
 * Get special food inventory from localStorage
 */
export function getInventory() {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Add special food to inventory
 */
export function addToInventory(foodId, count = 1) {
  const inventory = getInventory();
  inventory[foodId] = (inventory[foodId] || 0) + count;
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  return inventory;
}

/**
 * Use a food item on the pet. Returns updated pet state and effect info.
 */
export function useFood(foodId, petState) {
  const food = getFoodById(foodId);
  if (!food) return { updatedPet: petState, effect: null, message: 'Unknown food!' };

  // Special foods require inventory
  if (food.isSpecial) {
    const inventory = getInventory();
    if (!inventory[foodId] || inventory[foodId] <= 0) {
      return { updatedPet: petState, effect: null, message: 'No more in inventory!' };
    }
    // Consume from inventory
    inventory[foodId] -= 1;
    if (inventory[foodId] <= 0) delete inventory[foodId];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }

  const updated = { ...petState };
  let effects = { ...food.effects };
  let message = `${petState.name || 'Pet'} ate ${food.name}!`;

  // Handle mystery meat - randomize effects
  if (foodId === 'mystery_meat') {
    const outcomes = [
      { hunger: 50, happiness: 30, energy: 0, xp: 0, msg: 'Delicious! A golden apple in disguise!' },
      { hunger: 20, happiness: 50, energy: 0, xp: 0, msg: 'Sweet! Star candy flavor!' },
      { hunger: 10, happiness: 0, energy: 80, xp: 0, msg: 'ENERGY SURGE!' },
      { hunger: 30, happiness: 15, energy: 5, xp: 5, msg: 'Tastes like sushi... not bad!' },
      { hunger: 15, happiness: -10, energy: 0, xp: 0, msg: 'Yuck! That was terrible!' },
    ];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    effects = { hunger: outcome.hunger, happiness: outcome.happiness, energy: outcome.energy, xp: outcome.xp };
    message = outcome.msg;
  }

  // Apply base effects
  updated.hunger = Math.min(100, Math.max(0, updated.hunger + effects.hunger));
  updated.happiness = Math.min(100, Math.max(0, updated.happiness + effects.happiness));
  updated.energy = Math.min(100, Math.max(0, updated.energy + effects.energy));
  updated.xp = (updated.xp || 0) + (effects.xp || 0);
  updated.lastFed = Date.now();
  updated.state = 'eating';

  // Apply species bonus
  if (food.speciesBonus && food.speciesBonus[updated.species]) {
    const bonus = food.speciesBonus[updated.species];
    Object.entries(bonus).forEach(([stat, value]) => {
      if (stat === 'happiness') updated.happiness = Math.min(100, updated.happiness + value);
      else if (stat === 'hunger') updated.hunger = Math.min(100, updated.hunger + value);
      else if (stat === 'energy') updated.energy = Math.min(100, updated.energy + value);
      else if (stat === 'xp') updated.xp += value;
    });
    message += ` ${updated.species} bonus!`;
  }

  // Start timed effect if applicable
  let activeEffect = null;
  if (food.duration && foodId !== 'mystery_meat') {
    activeEffect = {
      type: food.duration.type,
      value: food.duration.value,
      remainingSeconds: food.duration.seconds,
      foodName: food.name,
      foodEmoji: food.emoji,
    };
    addActiveEffect(activeEffect);

    // Immediate effect for dance
    if (food.duration.type === 'dance') {
      updated.state = 'dancing';
    }
  }

  return { updatedPet: updated, effect: activeEffect, message };
}

/**
 * Get currently active timed effects
 */
export function getActiveEffects() {
  try {
    const stored = localStorage.getItem(EFFECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a new active effect
 */
function addActiveEffect(effect) {
  const effects = getActiveEffects();
  // Replace existing effect of same type
  const filtered = effects.filter((e) => e.type !== effect.type);
  filtered.push(effect);
  localStorage.setItem(EFFECTS_KEY, JSON.stringify(filtered));
}

/**
 * Tick all active effects (call every second).
 * Decrements timers and removes expired effects.
 * Returns current active effects after tick.
 */
export function tickEffects() {
  const effects = getActiveEffects();
  const updated = effects
    .map((e) => ({ ...e, remainingSeconds: e.remainingSeconds - 1 }))
    .filter((e) => e.remainingSeconds > 0);
  localStorage.setItem(EFFECTS_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Check if a specific effect type is active
 */
export function hasActiveEffect(type) {
  const effects = getActiveEffects();
  return effects.find((e) => e.type === type) || null;
}

/**
 * Clear all active effects
 */
export function clearAllEffects() {
  localStorage.setItem(EFFECTS_KEY, JSON.stringify([]));
}
