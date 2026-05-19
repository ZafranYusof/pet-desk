/**
 * PetDesk - Breeding Service
 * Handles pet breeding logic, hybrid generation, and cooldowns.
 */

import { hybridSpeciesConfig } from '../data/hybridSprites';
import { createDefaultPet } from './petEngine';
import { getCoins, addCoins } from './housingService';

const BREEDING_KEY = 'petdesk-breeding-data';
const BREED_COST = 100;
const BREED_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours
const MIN_LEVEL = 10;

function loadBreedingData() {
  try {
    const stored = localStorage.getItem(BREEDING_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return { lastBreedTime: null, hybridsCreated: [] };
}

function saveBreedingData(data) {
  try {
    localStorage.setItem(BREEDING_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

/**
 * Get the hybrid species resulting from two parent species.
 */
export function getHybridSpecies(species1, species2) {
  const pair = [species1, species2].sort();
  const key = pair.join('+');
  const mapping = {
    'cat+slime': 'slimecat',
    'ghost+slime': 'ectoplasm',
    'cat+ghost': 'phantomcat',
    'slime+slime': 'megaslime',
    'cat+cat': 'twintail',
    'ghost+ghost': 'poltergeist',
  };
  return mapping[key] || null;
}

/**
 * Check if two pets can breed.
 */
export function canBreed(pet1, pet2) {
  if (!pet1 || !pet2) {
    return { canBreed: false, reason: 'Need 2 pets to breed' };
  }

  // Check if either is a hybrid (sterile)
  if (hybridSpeciesConfig[pet1.species]) {
    return { canBreed: false, reason: `${pet1.name} is a hybrid and cannot breed` };
  }
  if (hybridSpeciesConfig[pet2.species]) {
    return { canBreed: false, reason: `${pet2.name} is a hybrid and cannot breed` };
  }

  // Check levels
  if ((pet1.level || 1) < MIN_LEVEL) {
    return { canBreed: false, reason: `${pet1.name} must be level ${MIN_LEVEL}+` };
  }
  if ((pet2.level || 1) < MIN_LEVEL) {
    return { canBreed: false, reason: `${pet2.name} must be level ${MIN_LEVEL}+` };
  }

  // Check cooldown
  const cooldown = getBreedCooldown();
  if (cooldown > 0) {
    const hours = Math.ceil(cooldown / (60 * 60 * 1000));
    return { canBreed: false, reason: `Cooldown: ${hours}h remaining` };
  }

  // Check coins
  const coins = getCoins();
  if (coins < BREED_COST) {
    return { canBreed: false, reason: `Need ${BREED_COST} coins (have ${coins})` };
  }

  // Check valid combination
  const hybrid = getHybridSpecies(pet1.species, pet2.species);
  if (!hybrid) {
    return { canBreed: false, reason: 'No valid hybrid for this combination' };
  }

  return { canBreed: true, reason: 'Ready to breed!' };
}

/**
 * Get remaining cooldown in ms (0 if ready).
 */
export function getBreedCooldown() {
  const data = loadBreedingData();
  if (!data.lastBreedTime) return 0;
  const elapsed = Date.now() - data.lastBreedTime;
  return Math.max(0, BREED_COOLDOWN - elapsed);
}

/**
 * Get averaged personality traits from two parents.
 */
export function getHybridPersonality(parent1, parent2) {
  const traits = ['playfulness', 'laziness', 'affection', 'independence', 'curiosity'];
  const result = {};
  for (const trait of traits) {
    const v1 = parent1[trait] || 50;
    const v2 = parent2[trait] || 50;
    result[trait] = Math.round((v1 + v2) / 2);
  }
  return result;
}

/**
 * Perform breeding. Returns the new hybrid pet state.
 */
export function breed(pet1, pet2) {
  const check = canBreed(pet1, pet2);
  if (!check.canBreed) return null;

  const hybridSpecies = getHybridSpecies(pet1.species, pet2.species);
  const config = hybridSpeciesConfig[hybridSpecies];
  if (!config) return null;

  // Deduct coins
  addCoins(-BREED_COST);

  // Create hybrid pet
  const hybrid = createDefaultPet();
  hybrid.species = hybridSpecies;
  hybrid.name = config.name;
  hybrid.level = 1;
  hybrid.xp = 0;
  hybrid.isHybrid = true;
  hybrid.parents = [pet1.species, pet2.species];
  hybrid.parentNames = [pet1.name, pet2.name];

  // Boosted base stats (+20%)
  hybrid.hunger = 100;
  hybrid.energy = 100;
  hybrid.happiness = 100;

  // Inherit personality traits (averaged)
  const personality = getHybridPersonality(pet1, pet2);
  Object.assign(hybrid, personality);

  // Unlock the hybrid species
  hybrid.unlockedSpecies = [hybridSpecies];

  // Save breeding data
  const data = loadBreedingData();
  data.lastBreedTime = Date.now();
  data.hybridsCreated.push({
    id: hybridSpecies + '_' + Date.now(),
    species: hybridSpecies,
    parents: [pet1.species, pet2.species],
    parentNames: [pet1.name, pet2.name],
    createdAt: Date.now(),
  });
  saveBreedingData(data);

  return hybrid;
}

/**
 * Get list of all hybrids created.
 */
export function getHybridsCreated() {
  const data = loadBreedingData();
  return data.hybridsCreated || [];
}

/**
 * Get breeding cost.
 */
export function getBreedCost() {
  return BREED_COST;
}

/**
 * Get minimum level required.
 */
export function getMinBreedLevel() {
  return MIN_LEVEL;
}
