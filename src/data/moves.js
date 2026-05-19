/**
 * PetDesk - Battle Moves
 * Move definitions per species and evolution stage.
 */

export const moves = {
  slime: [
    {
      id: 'bounce',
      name: 'Bounce',
      type: 'basic',
      mpCost: 0,
      multiplier: 1.0,
      description: 'A bouncy body slam',
      effect: null,
    },
    {
      id: 'sticky_slap',
      name: 'Sticky Slap',
      type: 'basic',
      mpCost: 0,
      multiplier: 0.8,
      description: 'Slaps with sticky goo',
      effect: { type: 'slow', chance: 0.2, speedReduction: 3, duration: 2 },
    },
    {
      id: 'acid_splash',
      name: 'Acid Splash',
      type: 'special',
      mpCost: 8,
      multiplier: 1.5,
      description: 'Corrosive acid ignores defense',
      effect: { type: 'piercing', defenseIgnore: 0.5 },
    },
    {
      id: 'gel_shield',
      name: 'Gel Shield',
      type: 'special',
      mpCost: 5,
      multiplier: 0,
      description: 'Doubles defense for 2 turns',
      effect: { type: 'buff', stat: 'defense', multiplier: 2, duration: 2 },
    },
  ],

  cat: [
    {
      id: 'scratch',
      name: 'Scratch',
      type: 'basic',
      mpCost: 0,
      multiplier: 1.0,
      description: 'Sharp claw swipe',
      effect: null,
    },
    {
      id: 'pounce',
      name: 'Pounce',
      type: 'basic',
      mpCost: 0,
      multiplier: 1.2,
      description: 'Leaps at the enemy',
      effect: { type: 'selfDebuff', stat: 'defense', reduction: 2, duration: 1 },
    },
    {
      id: 'nine_lives',
      name: 'Nine Lives',
      type: 'special',
      mpCost: 10,
      multiplier: 0,
      description: 'Heals 30% max HP',
      effect: { type: 'heal', percent: 0.3 },
    },
    {
      id: 'shadow_strike',
      name: 'Shadow Strike',
      type: 'special',
      mpCost: 7,
      multiplier: 2.0,
      description: 'Powerful but may miss',
      effect: { type: 'missChance', chance: 0.3 },
    },
  ],

  ghost: [
    {
      id: 'haunt',
      name: 'Haunt',
      type: 'basic',
      mpCost: 0,
      multiplier: 0.9,
      description: 'Spooky presence',
      effect: { type: 'fear', chance: 0.15 },
    },
    {
      id: 'phase',
      name: 'Phase',
      type: 'basic',
      mpCost: 0,
      multiplier: 0.7,
      description: 'Phases through, becomes untargetable',
      effect: { type: 'phase', duration: 1 },
    },
    {
      id: 'soul_drain',
      name: 'Soul Drain',
      type: 'special',
      mpCost: 8,
      multiplier: 1.3,
      description: 'Drains life from enemy',
      effect: { type: 'lifesteal', percent: 0.5 },
    },
    {
      id: 'nightmare',
      name: 'Nightmare',
      type: 'special',
      mpCost: 12,
      multiplier: 2.5,
      description: 'Devastating but costs HP',
      effect: { type: 'selfDamage', percent: 0.1 },
    },
  ],
};

// Ultimate move unlocked at evolution stage 2+
export const ultimateMove = {
  id: 'ultimate',
  name: 'Ultimate',
  type: 'special',
  mpCost: 15, // 10 at evo stage 3
  multiplier: 3.0,
  description: 'Unleash full power!',
  effect: null,
};

/**
 * Get moves for a species at a given evolution stage.
 * @param {string} species
 * @param {number} evoStage - 0 = base, 1, 2, 3
 * @returns {Array} available moves
 */
export function getMovesForSpecies(species, evoStage = 0) {
  const baseMoves = moves[species] || moves.slime;

  // Apply evolution damage bonus
  const damageBonus = evoStage === 1 ? 1.1 : evoStage === 2 ? 1.2 : evoStage >= 3 ? 1.3 : 1.0;

  const enhanced = baseMoves.map((move) => ({
    ...move,
    multiplier: move.multiplier * damageBonus,
  }));

  // Add ultimate at evo stage 2+
  if (evoStage >= 2) {
    const ult = {
      ...ultimateMove,
      multiplier: ultimateMove.multiplier * damageBonus,
      mpCost: evoStage >= 3 ? 10 : 15,
    };
    enhanced.push(ult);
  }

  return enhanced;
}
