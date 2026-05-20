/**
 * PetDesk - Onboarding Service
 * First-time user tutorial state management.
 */

const ONBOARDING_KEY = 'petdesk_onboarding';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to PetDesk!',
    description: 'This is your virtual desktop pet! It lives on your screen and grows with you.',
    emoji: '🎉',
    highlight: null,
  },
  {
    id: 'pet',
    title: 'Click to Pet!',
    description: 'Click on your pet to show it love. It gains happiness and XP from your attention!',
    emoji: '💕',
    highlight: 'pet',
  },
  {
    id: 'context_menu',
    title: 'Right-Click for Menu',
    description: 'Right-click anywhere to open the menu. Feed, play, and access all features from here.',
    emoji: '📋',
    highlight: 'contextMenu',
  },
  {
    id: 'feed',
    title: 'Keep Your Pet Fed!',
    description: 'Feed your pet regularly to keep it happy. A hungry pet gets sad and loses energy.',
    emoji: '🍽️',
    highlight: 'feed',
  },
  {
    id: 'games',
    title: 'Play Games for XP!',
    description: 'Play mini games in the Arcade to earn XP and level up your pet faster!',
    emoji: '🕹️',
    highlight: 'arcade',
  },
  {
    id: 'quests',
    title: 'Complete Quests!',
    description: 'Check the Quest Board for daily and weekly challenges. Earn rewards and unlock the story!',
    emoji: '📜',
    highlight: 'quests',
  },
  {
    id: 'achievements',
    title: 'Unlock Achievements!',
    description: 'There are tons of achievements to discover. Keep playing to unlock them all!',
    emoji: '🏆',
    highlight: 'achievements',
  },
];

function loadOnboardingState() {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    completed: false,
    skipped: false,
    currentStep: 0,
    startedAt: null,
  };
}

function saveOnboardingState(state) {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/**
 * Check if onboarding should show.
 */
export function shouldShowOnboarding() {
  const state = loadOnboardingState();
  return !state.completed && !state.skipped;
}

/**
 * Get current onboarding step.
 */
export function getCurrentStep() {
  const state = loadOnboardingState();
  if (state.currentStep >= ONBOARDING_STEPS.length) return null;
  return {
    ...ONBOARDING_STEPS[state.currentStep],
    stepIndex: state.currentStep,
    totalSteps: ONBOARDING_STEPS.length,
  };
}

/**
 * Advance to next step.
 */
export function nextStep() {
  const state = loadOnboardingState();
  state.currentStep += 1;
  if (state.currentStep >= ONBOARDING_STEPS.length) {
    state.completed = true;
  }
  saveOnboardingState(state);
  return getCurrentStep();
}

/**
 * Go to previous step.
 */
export function prevStep() {
  const state = loadOnboardingState();
  if (state.currentStep > 0) {
    state.currentStep -= 1;
    saveOnboardingState(state);
  }
  return getCurrentStep();
}

/**
 * Skip onboarding entirely.
 */
export function skipOnboarding() {
  const state = loadOnboardingState();
  state.skipped = true;
  saveOnboardingState(state);
}

/**
 * Complete onboarding.
 */
export function completeOnboarding() {
  const state = loadOnboardingState();
  state.completed = true;
  saveOnboardingState(state);
}

/**
 * Reset onboarding (for testing).
 */
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}

/**
 * Get all steps.
 */
export function getAllSteps() {
  return ONBOARDING_STEPS;
}
