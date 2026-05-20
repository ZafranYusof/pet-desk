/**
 * PetDesk - Personality Evolution System
 * Tracks interaction history and evolves personality over time.
 * Neglect = rebellious, Pamper = clingy, Balanced = happy
 */

const PERSONALITY_EVO_KEY = 'petdesk_personality_evolution';

const defaultEvolutionState = {
  totalFeeds: 0,
  totalPlays: 0,
  totalPets: 0,
  neglectMinutes: 0,
  lastInteractionTime: Date.now(),
  personalityTraits: {
    rebelliousness: 0,    // 0-100, increases with neglect
    clinginess: 0,        // 0-100, increases with pampering
    happiness: 50,        // 0-100, balanced = high
  },
  dominantPersonality: 'balanced', // 'rebellious', 'clingy', 'balanced'
  evolutionHistory: [],
};

/**
 * Load personality evolution state from storage
 */
export function loadPersonalityEvolution() {
  try {
    const stored = localStorage.getItem(PERSONALITY_EVO_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return { ...defaultEvolutionState };
}

/**
 * Save personality evolution state
 */
export function savePersonalityEvolution(state) {
  try {
    localStorage.setItem(PERSONALITY_EVO_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/**
 * Record an interaction and update personality traits
 */
export function recordPersonalityInteraction(type) {
  const state = loadPersonalityEvolution();
  const now = Date.now();

  // Calculate time since last interaction (neglect tracking)
  const minutesSinceLastInteraction = (now - state.lastInteractionTime) / 60000;

  // If more than 30 minutes since last interaction, count as neglect
  if (minutesSinceLastInteraction > 30) {
    state.neglectMinutes += minutesSinceLastInteraction;
  }

  state.lastInteractionTime = now;

  switch (type) {
    case 'feed':
      state.totalFeeds++;
      break;
    case 'play':
      state.totalPlays++;
      break;
    case 'pet':
      state.totalPets++;
      break;
  }

  // Recalculate personality traits
  const totalInteractions = state.totalFeeds + state.totalPlays + state.totalPets;
  const interactionsPerHour = totalInteractions / Math.max(1, state.neglectMinutes / 60 + totalInteractions * 0.5 / 60);

  // High interaction rate = pampering
  if (interactionsPerHour > 10) {
    state.personalityTraits.clinginess = Math.min(100, state.personalityTraits.clinginess + 1);
    state.personalityTraits.rebelliousness = Math.max(0, state.personalityTraits.rebelliousness - 0.5);
  }

  // Low interaction rate = neglect
  if (state.neglectMinutes > 120 && totalInteractions < state.neglectMinutes / 30) {
    state.personalityTraits.rebelliousness = Math.min(100, state.personalityTraits.rebelliousness + 1);
    state.personalityTraits.clinginess = Math.max(0, state.personalityTraits.clinginess - 0.5);
  }

  // Calculate happiness (inverse of extremes)
  state.personalityTraits.happiness = 100 - Math.max(state.personalityTraits.rebelliousness, state.personalityTraits.clinginess) * 0.7;

  // Determine dominant personality
  const { rebelliousness, clinginess } = state.personalityTraits;
  if (rebelliousness > 60) {
    state.dominantPersonality = 'rebellious';
  } else if (clinginess > 60) {
    state.dominantPersonality = 'clingy';
  } else {
    state.dominantPersonality = 'balanced';
  }

  savePersonalityEvolution(state);
  return state;
}

/**
 * Check neglect on tick (called periodically)
 */
export function tickPersonalityEvolution() {
  const state = loadPersonalityEvolution();
  const now = Date.now();
  const minutesSinceLastInteraction = (now - state.lastInteractionTime) / 60000;

  // Gradual neglect accumulation
  if (minutesSinceLastInteraction > 30) {
    state.neglectMinutes += 5 / 60; // Add per tick (5s)
    state.personalityTraits.rebelliousness = Math.min(100, state.personalityTraits.rebelliousness + 0.01);
    state.personalityTraits.happiness = Math.max(0, state.personalityTraits.happiness - 0.005);
  } else {
    // Slowly recover when interacting regularly
    state.personalityTraits.rebelliousness = Math.max(0, state.personalityTraits.rebelliousness - 0.005);
    state.personalityTraits.clinginess = Math.max(0, state.personalityTraits.clinginess - 0.003);
  }

  // Update dominant personality
  const { rebelliousness, clinginess } = state.personalityTraits;
  if (rebelliousness > 60) {
    state.dominantPersonality = 'rebellious';
  } else if (clinginess > 60) {
    state.dominantPersonality = 'clingy';
  } else {
    state.dominantPersonality = 'balanced';
  }

  savePersonalityEvolution(state);
  return state;
}

/**
 * Get personality-affected chat messages
 */
export function getPersonalityChat(dominantPersonality) {
  const messages = {
    rebellious: [
      "Hmph. You finally showed up.",
      "Oh, NOW you remember I exist?",
      "Whatever. I was fine on my own.",
      "*ignores you*",
      "Don't touch me. I'm busy.",
      "You think treats fix everything?",
      "I was having a great time without you.",
      "Took you long enough...",
    ],
    clingy: [
      "You're back!! I missed you SO much!",
      "Don't leave me again, okay? 🥺",
      "Stay stay stay! Please!",
      "I was counting the seconds...",
      "Are you going somewhere? Take me with you!",
      "I get lonely when you're not here...",
      "Promise you won't leave?",
      "Can we just stay together forever?",
    ],
    balanced: [
      "Hey! Good to see you!",
      "Having a great day!",
      "Life is good~",
      "What should we do today?",
      "I'm feeling great!",
      "Thanks for hanging out with me!",
      "This is nice.",
      "I appreciate you!",
    ],
  };

  const pool = messages[dominantPersonality] || messages.balanced;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get personality-affected ignore chance (rebellious pets ignore more)
 */
export function getPersonalityIgnoreChance(dominantPersonality) {
  switch (dominantPersonality) {
    case 'rebellious': return 0.4; // 40% chance to ignore clicks
    case 'clingy': return 0;       // Never ignores
    case 'balanced': return 0.05;  // 5% chance (playful)
    default: return 0.05;
  }
}

/**
 * Get personality evolution summary for display
 */
export function getPersonalitySummary() {
  const state = loadPersonalityEvolution();
  return {
    dominant: state.dominantPersonality,
    traits: state.personalityTraits,
    totalInteractions: state.totalFeeds + state.totalPlays + state.totalPets,
    neglectMinutes: Math.floor(state.neglectMinutes),
  };
}
