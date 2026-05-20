/**
 * PetDesk - Visual Aging Service
 * Tracks pet age in real days and provides stage-based modifications.
 */

const VISUAL_AGING_KEY = 'petdesk_visual_aging';

const AGE_STAGES = [
  { id: 'baby', name: 'Baby', minDay: 0, maxDay: 3, spriteSize: 12, decayMultiplier: 1.3, emoji: '🍼' },
  { id: 'teen', name: 'Teen', minDay: 4, maxDay: 10, spriteSize: 14, decayMultiplier: 1.1, emoji: '🌱' },
  { id: 'adult', name: 'Adult', minDay: 11, maxDay: 30, spriteSize: 16, decayMultiplier: 1.0, emoji: '⭐' },
  { id: 'elder', name: 'Elder', minDay: 31, maxDay: Infinity, spriteSize: 18, decayMultiplier: 0.7, emoji: '👑' },
];

function loadVisualAging() {
  try {
    const stored = localStorage.getItem(VISUAL_AGING_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return null;
}

function saveVisualAging(data) {
  try {
    localStorage.setItem(VISUAL_AGING_KEY, JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

/**
 * Initialize visual aging data.
 */
export function initVisualAging(createdAt = null) {
  const existing = loadVisualAging();
  if (existing) return existing;

  const data = {
    birthDate: createdAt || Date.now(),
    lastStage: 'baby',
    stageTransitions: [{ stage: 'baby', date: new Date().toISOString().split('T')[0], timestamp: Date.now() }],
  };
  saveVisualAging(data);
  return data;
}

/**
 * Get current age in days.
 */
export function getVisualAge() {
  const data = loadVisualAging();
  if (!data) return 0;
  return Math.floor((Date.now() - data.birthDate) / (24 * 60 * 60 * 1000));
}

/**
 * Get current age stage based on days alive.
 */
export function getVisualAgeStage() {
  const days = getVisualAge();
  for (const stage of AGE_STAGES) {
    if (days >= stage.minDay && days <= stage.maxDay) {
      return stage;
    }
  }
  return AGE_STAGES[AGE_STAGES.length - 1];
}

/**
 * Get sprite size for current age stage.
 */
export function getAgeSpriteSize() {
  const stage = getVisualAgeStage();
  return stage.spriteSize;
}

/**
 * Get decay rate multiplier for current age stage.
 * Baby = faster hunger decay, Elder = slower energy decay.
 */
export function getAgeDecayMultiplier() {
  const stage = getVisualAgeStage();
  return stage.decayMultiplier;
}

/**
 * Check if a stage transition just happened.
 * Returns the new stage if transition occurred, null otherwise.
 */
export function checkStageTransition() {
  const data = loadVisualAging();
  if (!data) return null;

  const currentStage = getVisualAgeStage();
  if (currentStage.id !== data.lastStage) {
    const oldStage = data.lastStage;
    data.lastStage = currentStage.id;
    data.stageTransitions.push({
      stage: currentStage.id,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    });
    saveVisualAging(data);
    return { oldStage, newStage: currentStage.id, stageName: currentStage.name, emoji: currentStage.emoji };
  }
  return null;
}

/**
 * Get all age stages info.
 */
export function getAllAgeStages() {
  return AGE_STAGES;
}

/**
 * Get age badge info for stats panel.
 */
export function getAgeBadge() {
  const stage = getVisualAgeStage();
  const days = getVisualAge();
  return {
    stage: stage.id,
    name: stage.name,
    emoji: stage.emoji,
    days,
    spriteSize: stage.spriteSize,
  };
}

/**
 * Get scale factor relative to default (16px).
 */
export function getAgeScaleFactor() {
  const stage = getVisualAgeStage();
  return stage.spriteSize / 16;
}
