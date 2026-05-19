/**
 * PetDesk - Personality Trait System
 * Each species has unique traits that modify behavior and interactions.
 */

const personalities = {
  slime: {
    bounciness: 0.8,
    friendliness: 0.9,
    laziness: 0.3,
    appetite: 0.7,
    specials: ['split', 'jiggle'],
    walkFrequencyMultiplier: 1.2,
    bounceFrequencyMultiplier: 2.0,
    bounceHeightMultiplier: 1.5,
    hungerDecayMultiplier: 1.0,
    idleVariant: null,
  },
  cat: {
    bounciness: 0.2,
    friendliness: 0.4,
    laziness: 0.7,
    appetite: 0.5,
    specials: ['groom', 'turnAway'],
    walkFrequencyMultiplier: 0.6,
    bounceFrequencyMultiplier: 0.3,
    bounceHeightMultiplier: 0.5,
    hungerDecayMultiplier: 0.7,
    idleVariant: 'groom',
    ignoreClickChance: 0.3,
    feedHappinessMultiplier: 0.6,
  },
  ghost: {
    bounciness: 0.5,
    friendliness: 0.6,
    laziness: 0.4,
    appetite: 0.3,
    specials: ['flicker', 'teleport'],
    walkFrequencyMultiplier: 0.9,
    bounceFrequencyMultiplier: 0.7,
    bounceHeightMultiplier: 1.0,
    hungerDecayMultiplier: 0.5,
    idleVariant: null,
    teleportChance: 0.1,
    flickerChance: 0.08,
  },
};

/**
 * Get personality traits for a species.
 * @param {string} species
 * @returns {object} personality traits
 */
export function getPersonality(species) {
  return personalities[species] || personalities.slime;
}

/**
 * Apply personality modifiers to the tick update.
 * Modifies hunger decay rate based on species appetite.
 * @param {object} petState
 * @param {object} personality
 * @returns {object} modified pet state
 */
export function applyPersonalityToTick(petState, personality) {
  const updated = { ...petState };

  // Modify hunger decay based on appetite (lower appetite = slower decay)
  // Base decay is 0.083 per tick, personality modifies it
  const hungerModifier = personality.hungerDecayMultiplier || 1.0;
  const baseDecay = 0.083;
  const adjustedDecay = baseDecay * hungerModifier;

  // Recalculate hunger with personality modifier
  // (tick already applied base decay, so we adjust the difference)
  const decayDiff = baseDecay - adjustedDecay;
  updated.hunger = Math.min(100, Math.max(0, updated.hunger + decayDiff));

  // Lazier pets recover energy slightly faster when idle
  if (personality.laziness > 0.5) {
    updated.energy = Math.min(100, updated.energy + 0.02 * personality.laziness);
  }

  return updated;
}

/**
 * Determine if a click should be ignored based on personality.
 * Cat has 30% chance to ignore clicks.
 * @param {object} personality
 * @returns {boolean}
 */
export function shouldIgnoreClick(personality) {
  if (personality.ignoreClickChance) {
    return Math.random() < personality.ignoreClickChance;
  }
  return false;
}

export default personalities;
