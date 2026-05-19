/**
 * PetDesk - Evolution System
 * Manages pet evolution stages, requirements, and progression.
 */

const EVOLUTIONS = {
  slime: [
    { stage: 1, level: 15, name: 'Gel Knight', prefix: 'slime_evo1' },
    { stage: 2, level: 25, name: 'Slime King', prefix: 'slime_evo2' },
    { stage: 3, level: 40, name: 'Cosmic Slime', prefix: 'slime_evo3' },
  ],
  cat: [
    { stage: 1, level: 15, name: 'Shadow Cat', prefix: 'cat_evo1' },
    { stage: 2, level: 25, name: 'Thunder Cat', prefix: 'cat_evo2' },
    { stage: 3, level: 40, name: 'Celestial Cat', prefix: 'cat_evo3' },
  ],
  ghost: [
    { stage: 1, level: 15, name: 'Phantom', prefix: 'ghost_evo1' },
    { stage: 2, level: 25, name: 'Wraith', prefix: 'ghost_evo2' },
    { stage: 3, level: 40, name: 'Ethereal', prefix: 'ghost_evo3' },
  ],
};

/**
 * Get the current evolution stage for a species at a given level.
 * @returns {{ stage: number, name: string, spritePrefix: string }}
 */
export function getEvolutionStage(species, level) {
  const evolutions = EVOLUTIONS[species];
  if (!evolutions) return { stage: 0, name: 'Base', spritePrefix: species };

  // Find highest evolution the pet qualifies for
  let current = { stage: 0, name: 'Base', spritePrefix: species };
  for (const evo of evolutions) {
    if (level >= evo.level) {
      current = { stage: evo.stage, name: evo.name, spritePrefix: evo.prefix };
    }
  }
  return current;
}

/**
 * Get info about the next evolution available.
 * @returns {{ level: number, name: string } | null}
 */
export function getNextEvolution(species, level) {
  const evolutions = EVOLUTIONS[species];
  if (!evolutions) return null;

  for (const evo of evolutions) {
    if (level < evo.level) {
      return { level: evo.level, name: evo.name };
    }
  }
  return null; // Already at max evolution
}

/**
 * Check if an evolution was triggered between oldLevel and newLevel.
 * @returns {object|null} Evolution data if triggered, null otherwise
 */
export function checkEvolution(species, oldLevel, newLevel) {
  const evolutions = EVOLUTIONS[species];
  if (!evolutions) return null;

  for (const evo of evolutions) {
    if (oldLevel < evo.level && newLevel >= evo.level) {
      return {
        stage: evo.stage,
        name: evo.name,
        prefix: evo.prefix,
        species,
      };
    }
  }
  return null;
}

/**
 * Get progress towards the next evolution.
 * @returns {{ current: number, next: number, percent: number }}
 */
export function getEvolutionProgress(species, level) {
  const evolutions = EVOLUTIONS[species];
  if (!evolutions) return { current: level, next: 0, percent: 100 };

  // Find current stage start and next stage level
  let prevLevel = 1;
  let nextLevel = null;

  for (const evo of evolutions) {
    if (level < evo.level) {
      nextLevel = evo.level;
      break;
    }
    prevLevel = evo.level;
  }

  if (nextLevel === null) {
    // Max evolution reached
    return { current: level, next: 0, percent: 100 };
  }

  const range = nextLevel - prevLevel;
  const progress = level - prevLevel;
  const percent = Math.min(100, Math.round((progress / range) * 100));

  return { current: level, next: nextLevel, percent };
}

export { EVOLUTIONS };
