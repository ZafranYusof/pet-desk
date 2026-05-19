/**
 * PetDesk - Pet State Engine
 * Manages pet mood, hunger, energy, happiness, XP, and animation states.
 * Includes species/accessory unlock logic.
 */

import { speciesConfig } from '../data/sprites';
import { accessories } from '../data/accessories';
import { checkEvolution, getEvolutionStage } from './evolutionService';

export function createDefaultPet() {
  const now = Date.now();
  return {
    name: 'Slime',
    mood: 'happy',
    hunger: 100,
    energy: 100,
    happiness: 100,
    xp: 0,
    level: 1,
    lastFed: now,
    lastPlayed: now,
    lastPetted: now,
    totalPets: 0,
    createdAt: now,
    state: 'idle',
    species: 'slime',
    accessories: [],
    unlockedSpecies: ['slime'],
    unlockedAccessories: ['party-hat'],
  };
}

/**
 * Called every 5 seconds. Updates hunger/energy/mood based on elapsed time.
 */
export function tick(petState, idleSeconds) {
  const updated = { ...petState };

  // Hunger decreases by ~1 every 60s (0.083 per 5s tick)
  updated.hunger = Math.max(0, updated.hunger - 0.083);

  // Energy decreases by ~1 every 90s when active (0.056 per 5s tick)
  if (idleSeconds < 300) {
    updated.energy = Math.max(0, updated.energy - 0.056);
  } else {
    // Resting while idle - energy recovers slowly
    updated.energy = Math.min(100, updated.energy + 0.1);
  }

  // Happiness slowly decays (~1 every 120s)
  updated.happiness = Math.max(0, updated.happiness - 0.042);

  // Update mood and state
  updated.mood = calculateMood(updated);
  updated.state = getState(updated, idleSeconds);
  updated.level = calculateLevel(updated.xp);

  return updated;
}

/**
 * Feed the pet: hunger +30, happiness +10, xp +5
 */
export function feed(petState) {
  const updated = { ...petState };
  updated.hunger = Math.min(100, updated.hunger + 30);
  updated.happiness = Math.min(100, updated.happiness + 10);
  updated.xp += 5;
  updated.lastFed = Date.now();
  updated.state = 'eating';
  updated.mood = calculateMood(updated);
  updated.level = calculateLevel(updated.xp);
  return updated;
}

/**
 * Play with the pet: happiness +20, energy -15, xp +10
 */
export function play(petState) {
  const updated = { ...petState };
  updated.happiness = Math.min(100, updated.happiness + 20);
  updated.energy = Math.max(0, updated.energy - 15);
  updated.xp += 10;
  updated.lastPlayed = Date.now();
  updated.state = 'playing';
  updated.mood = calculateMood(updated);
  updated.level = calculateLevel(updated.xp);
  return updated;
}

/**
 * Pet the pet: happiness +5, xp +2, totalPets++
 */
export function pet(petState) {
  const updated = { ...petState };
  updated.happiness = Math.min(100, updated.happiness + 5);
  updated.xp += 2;
  updated.totalPets += 1;
  updated.lastPetted = Date.now();
  updated.mood = calculateMood(updated);
  updated.level = calculateLevel(updated.xp);
  return updated;
}

/**
 * Put pet to sleep: energy +50 (applied gradually in ticks, but instant for now)
 */
export function sleep(petState) {
  const updated = { ...petState };
  updated.energy = Math.min(100, updated.energy + 50);
  updated.state = 'sleeping';
  updated.mood = 'sleepy';
  return updated;
}

/**
 * Derive mood from hunger/energy/happiness values.
 */
export function calculateMood(petState) {
  if (petState.hunger < 30) return 'hungry';
  if (petState.energy < 20) return 'sleepy';
  if (petState.happiness > 80 && petState.energy > 50) return 'happy';
  if (petState.happiness < 30) return 'sad';
  return 'neutral';
}

/**
 * Calculate level from XP. Level = floor(xp/100) + 1
 */
export function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

/**
 * Derive animation state from pet state and idle time.
 */
export function getState(petState, idleSeconds) {
  // If system is idle >5min, pet sleeps
  if (idleSeconds > 300) return 'sleeping';

  // If pet was just fed/played, keep that state briefly (handled by UI timer)
  if (petState.state === 'eating' || petState.state === 'playing') {
    return petState.state;
  }

  // Mood-based states
  if (petState.mood === 'sleepy') return 'sleeping';
  if (petState.mood === 'happy' && Math.random() > 0.7) return 'dancing';
  if (petState.mood === 'happy') return 'walking';

  return 'idle';
}

/**
 * Check and apply unlocks when level changes.
 * Returns updated pet state with newly unlocked species/accessories.
 */
export function checkUnlocks(petState) {
  const updated = { ...petState };
  let newUnlocks = [];

  // Check species unlocks
  Object.entries(speciesConfig).forEach(([id, config]) => {
    if (updated.level >= config.unlockLevel && !updated.unlockedSpecies.includes(id)) {
      updated.unlockedSpecies = [...updated.unlockedSpecies, id];
      newUnlocks.push({ type: 'species', id, name: config.name });
    }
  });

  // Check accessory unlocks
  accessories.forEach((acc) => {
    if (updated.level >= acc.unlockLevel && !updated.unlockedAccessories.includes(acc.id)) {
      updated.unlockedAccessories = [...updated.unlockedAccessories, acc.id];
      newUnlocks.push({ type: 'accessory', id: acc.id, name: acc.name });
    }
  });

  return { petState: updated, newUnlocks };
}

/**
 * Check if a level-up triggers an evolution.
 * Returns evolution data or null.
 */
export function checkEvolutionOnLevelUp(petState, oldLevel, newLevel) {
  const species = petState.species || 'slime';
  const evolution = checkEvolution(species, oldLevel, newLevel);
  if (evolution) {
    return {
      ...evolution,
      oldPrefix: getEvolutionStage(species, oldLevel).spritePrefix,
      newPrefix: evolution.prefix,
    };
  }
  return null;
}

/**
 * Switch active species
 */
export function switchSpecies(petState, speciesId) {
  if (!petState.unlockedSpecies.includes(speciesId)) return petState;
  const config = speciesConfig[speciesId];
  return {
    ...petState,
    species: speciesId,
    name: config?.name || petState.name,
  };
}

/**
 * Equip an accessory (max 1 per category)
 */
export function equipAccessory(petState, accessoryId) {
  const acc = accessories.find((a) => a.id === accessoryId);
  if (!acc || !petState.unlockedAccessories.includes(accessoryId)) return petState;

  // Remove any existing accessory in same category
  const filtered = petState.accessories.filter((id) => {
    const existing = accessories.find((a) => a.id === id);
    return existing?.category !== acc.category;
  });

  return {
    ...petState,
    accessories: [...filtered, accessoryId],
  };
}

/**
 * Unequip an accessory
 */
export function unequipAccessory(petState, accessoryId) {
  return {
    ...petState,
    accessories: petState.accessories.filter((id) => id !== accessoryId),
  };
}
