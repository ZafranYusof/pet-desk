/**
 * PetDesk - Skill Service
 * Pet can learn 12 skills across 3 categories (Combat, Life, Social).
 * Earn skill points on level up. Skills have 3 ranks each.
 * Skills actually affect gameplay by modifying multipliers.
 */

const SKILL_STATE_KEY = 'petdesk_skill_state';

export const SKILL_CATEGORIES = {
  combat: { id: 'combat', name: 'Combat', emoji: '⚔️', color: 'text-red-400', bgColor: 'bg-red-900/20' },
  life: { id: 'life', name: 'Life', emoji: '🌿', color: 'text-green-400', bgColor: 'bg-green-900/20' },
  social: { id: 'social', name: 'Social', emoji: '💬', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
};

export const SKILLS = [
  // Combat
  { id: 'attack_up', name: 'Attack Up', category: 'combat', description: 'Increases battle damage', icon: '🗡️', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'attackMultiplier', values: [1.1, 1.25, 1.5] }] },
  { id: 'defense_up', name: 'Defense Up', category: 'combat', description: 'Reduces damage taken in battle', icon: '🛡️', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'defenseMultiplier', values: [1.1, 1.25, 1.5] }] },
  { id: 'critical_hit', name: 'Critical Hit', category: 'combat', description: 'Chance for double damage', icon: '💥', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'critChance', values: [0.1, 0.2, 0.35] }] },
  { id: 'combo_master', name: 'Combo Master', category: 'combat', description: 'Multi-hit attacks in battle', icon: '🔥', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'comboChance', values: [0.1, 0.2, 0.3] }] },

  // Life
  { id: 'fast_learner', name: 'Fast Learner', category: 'life', description: 'Earn more XP from all sources', icon: '📚', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'xpMultiplier', values: [1.1, 1.25, 1.5] }] },
  { id: 'green_thumb', name: 'Green Thumb', category: 'life', description: 'Garden grows faster', icon: '🌱', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'gardenSpeedMultiplier', values: [1.2, 1.4, 1.7] }] },
  { id: 'chef', name: 'Chef', category: 'life', description: 'Food effects +50% per rank', icon: '👨‍🍳', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'foodEffectMultiplier', values: [1.5, 2.0, 2.5] }] },
  { id: 'endurance', name: 'Endurance', category: 'life', description: 'Slower stat decay over time', icon: '💪', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'decayMultiplier', values: [0.9, 0.75, 0.6] }] },

  // Social
  { id: 'charmer', name: 'Charmer', category: 'social', description: 'Earn more coins from all sources', icon: '✨', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'coinMultiplier', values: [1.2, 1.5, 2.0] }] },
  { id: 'lucky', name: 'Lucky', category: 'social', description: 'Better loot from dungeons and events', icon: '🍀', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'lootMultiplier', values: [1.2, 1.5, 2.0] }] },
  { id: 'popular', name: 'Popular', category: 'social', description: 'Leaderboard score boost', icon: '🌟', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'leaderboardMultiplier', values: [1.1, 1.25, 1.5] }] },
  { id: 'mentor', name: 'Mentor', category: 'social', description: 'Companion pet earns shared XP', icon: '🎓', maxRank: 3, costPerRank: [1, 2, 3], effects: [{ stat: 'companionXpShare', values: [0.1, 0.2, 0.3] }] },
];

/**
 * Get default skill state
 */
function getDefaultSkillState() {
  return {
    skillPoints: 0,
    totalPointsEarned: 0,
    skills: {}, // { skillId: rank (0-3) }
  };
}

/**
 * Load skill state
 */
export function getSkillState() {
  try {
    const stored = localStorage.getItem(SKILL_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return getDefaultSkillState();
}

/**
 * Save skill state
 */
export function saveSkillState(state) {
  try {
    localStorage.setItem(SKILL_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/**
 * Award skill point (called on level up)
 */
export function awardSkillPoint() {
  const state = getSkillState();
  state.skillPoints += 1;
  state.totalPointsEarned += 1;
  saveSkillState(state);
  return state;
}

/**
 * Learn or upgrade a skill
 */
export function learnSkill(skillId) {
  const state = getSkillState();
  const skill = SKILLS.find(s => s.id === skillId);
  if (!skill) return { success: false, reason: 'Skill not found' };

  const currentRank = state.skills[skillId] || 0;
  if (currentRank >= skill.maxRank) return { success: false, reason: 'Already maxed' };

  const cost = skill.costPerRank[currentRank];
  if (state.skillPoints < cost) return { success: false, reason: 'Not enough skill points' };

  state.skillPoints -= cost;
  state.skills[skillId] = currentRank + 1;
  saveSkillState(state);

  return { success: true, newRank: currentRank + 1 };
}

/**
 * Get current rank of a skill
 */
export function getSkillRank(skillId) {
  const state = getSkillState();
  return state.skills[skillId] || 0;
}

/**
 * Get the effective multiplier for a given stat from all skills
 */
export function getSkillMultiplier(statName) {
  const state = getSkillState();
  let multiplier = statName === 'decayMultiplier' ? 1.0 : 1.0;

  for (const skill of SKILLS) {
    const rank = state.skills[skill.id] || 0;
    if (rank === 0) continue;

    for (const effect of skill.effects) {
      if (effect.stat === statName) {
        const value = effect.values[rank - 1];
        if (statName === 'decayMultiplier') {
          multiplier *= value; // Decay is multiplicative reduction
        } else {
          multiplier *= value;
        }
      }
    }
  }

  return multiplier;
}

/**
 * Get all skill multipliers at once (for performance)
 */
export function getAllSkillMultipliers() {
  const state = getSkillState();
  const multipliers = {
    attackMultiplier: 1.0,
    defenseMultiplier: 1.0,
    critChance: 0,
    comboChance: 0,
    xpMultiplier: 1.0,
    gardenSpeedMultiplier: 1.0,
    foodEffectMultiplier: 1.0,
    decayMultiplier: 1.0,
    coinMultiplier: 1.0,
    lootMultiplier: 1.0,
    leaderboardMultiplier: 1.0,
    companionXpShare: 0,
  };

  for (const skill of SKILLS) {
    const rank = state.skills[skill.id] || 0;
    if (rank === 0) continue;

    for (const effect of skill.effects) {
      const value = effect.values[rank - 1];
      if (effect.stat === 'critChance' || effect.stat === 'comboChance' || effect.stat === 'companionXpShare') {
        multipliers[effect.stat] += value;
      } else {
        multipliers[effect.stat] *= value;
      }
    }
  }

  return multipliers;
}

/**
 * Get total skills learned (for achievements)
 */
export function getTotalSkillsLearned() {
  const state = getSkillState();
  return Object.values(state.skills).filter(r => r > 0).length;
}

/**
 * Get total skills maxed (for achievements)
 */
export function getTotalSkillsMaxed() {
  const state = getSkillState();
  let count = 0;
  for (const skill of SKILLS) {
    if ((state.skills[skill.id] || 0) >= skill.maxRank) count++;
  }
  return count;
}
