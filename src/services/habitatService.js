// Habitat/Room System - themed backgrounds for the pet

const HABITAT_STORAGE_KEY = 'petdesk_active_habitat';

const habitats = [
  {
    id: 'desktop',
    name: 'Desktop',
    description: 'Your normal desktop - no frills',
    unlockLevel: 0,
    bgStyle: {},
    particles: null,
    groundColor: 'transparent',
    ambientEffect: 'none',
    moodBonus: { happiness: 0, energy: 0, xpMultiplier: 1 },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'A peaceful woodland clearing',
    unlockLevel: 3,
    bgStyle: {
      background: 'linear-gradient(to bottom, rgba(34,139,34,0.05) 0%, rgba(34,100,34,0.4) 60%, rgba(45,90,39,0.9) 100%)',
    },
    particles: 'leaves',
    groundColor: '#2d5a27',
    ambientEffect: 'gentle',
    moodBonus: { happiness: 0.2, energy: 0, xpMultiplier: 1 },
  },
  {
    id: 'space',
    name: 'Space',
    description: 'The vast cosmic void',
    unlockLevel: 8,
    bgStyle: {
      background: 'radial-gradient(ellipse at center, #1a0533 0%, #0d0015 50%, #000000 100%)',
    },
    particles: 'stars',
    groundColor: '#1a0533',
    ambientEffect: 'calm',
    moodBonus: { happiness: 0.1, energy: 0.1, xpMultiplier: 1 },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue tranquility',
    unlockLevel: 12,
    bgStyle: {
      background: 'linear-gradient(to bottom, #1a8fc4 0%, #0e5f8a 40%, #0a3d5c 70%, #062a40 100%)',
    },
    particles: 'bubbles',
    groundColor: '#c2a366',
    ambientEffect: 'relaxing',
    moodBonus: { happiness: 0.3, energy: 0, xpMultiplier: 1 },
  },
  {
    id: 'castle',
    name: 'Castle',
    description: 'Ancient stone halls of knowledge',
    unlockLevel: 18,
    bgStyle: {
      background: 'linear-gradient(to bottom, #2a2a2a 0%, #3d3d3d 50%, #1a1a1a 100%)',
    },
    particles: 'sparks',
    groundColor: '#4a4a4a',
    ambientEffect: 'studious',
    moodBonus: { happiness: 0.1, energy: 0, xpMultiplier: 1.2 },
  },
  {
    id: 'neon',
    name: 'Neon City',
    description: 'Cyberpunk streets that never sleep',
    unlockLevel: 25,
    bgStyle: {
      background: 'linear-gradient(to bottom, #0a0a0f 0%, #0f0a1a 60%, #1a0a2e 100%)',
    },
    particles: 'rain',
    groundColor: '#1a0a2e',
    ambientEffect: 'energizing',
    moodBonus: { happiness: 0, energy: 0.2, xpMultiplier: 1 },
  },
];

/**
 * Get all habitats with their unlock status based on current level
 */
export function getHabitats(currentLevel = 1) {
  return habitats.map((h) => ({
    ...h,
    unlocked: currentLevel >= h.unlockLevel,
  }));
}

/**
 * Get the currently active habitat id from localStorage
 */
export function getActiveHabitat() {
  try {
    const stored = localStorage.getItem(HABITAT_STORAGE_KEY);
    if (stored && habitats.find((h) => h.id === stored)) {
      return stored;
    }
  } catch (e) { /* ignore */ }
  return 'desktop';
}

/**
 * Set the active habitat
 */
export function setActiveHabitat(id) {
  try {
    if (habitats.find((h) => h.id === id)) {
      localStorage.setItem(HABITAT_STORAGE_KEY, id);
      return true;
    }
  } catch (e) { /* ignore */ }
  return false;
}

/**
 * Check if a habitat is unlocked at the given level
 */
export function isHabitatUnlocked(id, level) {
  const habitat = habitats.find((h) => h.id === id);
  if (!habitat) return false;
  return level >= habitat.unlockLevel;
}

/**
 * Get the mood bonus for a habitat
 */
export function getHabitatMoodBonus(id) {
  const habitat = habitats.find((h) => h.id === id);
  if (!habitat) return { happiness: 0, energy: 0, xpMultiplier: 1 };
  return habitat.moodBonus;
}

/**
 * Get a single habitat definition by id
 */
export function getHabitatById(id) {
  return habitats.find((h) => h.id === id) || habitats[0];
}
