/**
 * PetDesk - Personality Evolution System (Enhanced)
 * Tracks interaction history and evolves personality over time.
 * Now tracks: ignoreCount, interactCount, feedCount, playCount, talkCount
 * Personality traits: sarcastic/independent, clingy/affectionate, playful/energetic, foodie/grateful, philosophical/chatty
 */

const PERSONALITY_EVO_KEY = 'petdesk_personality_evolution';

const defaultEvolutionState = {
  totalFeeds: 0,
  totalPlays: 0,
  totalPets: 0,
  neglectMinutes: 0,
  lastInteractionTime: Date.now(),
  // Enhanced tracking
  ignoreCount: 0,       // how many times pet's chat was dismissed quickly
  interactCount: 0,     // how many times user clicked/interacted with pet
  feedCount: 0,         // total feeds
  playCount: 0,         // total plays
  talkCount: 0,         // how many times user used AI chat
  personalityTraits: {
    rebelliousness: 0,    // 0-100, increases with neglect
    clinginess: 0,        // 0-100, increases with pampering
    happiness: 50,        // 0-100, balanced = high
    sarcasm: 0,           // 0-100, increases with high ignore
    affection: 0,         // 0-100, increases with high interact
    playfulness: 0,       // 0-100, increases with high play
    foodLove: 0,          // 0-100, increases with high feed
    philosophy: 0,        // 0-100, increases with high talk (AI chat)
  },
  dominantPersonality: 'balanced', // 'rebellious', 'clingy', 'balanced', 'sarcastic', 'affectionate', 'playful', 'foodie', 'philosophical'
  evolutionHistory: [],
};

/**
 * Load personality evolution state from storage
 */
export function loadPersonalityEvolution() {
  try {
    const stored = localStorage.getItem(PERSONALITY_EVO_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old state to new format
      return {
        ...defaultEvolutionState,
        ...parsed,
        personalityTraits: {
          ...defaultEvolutionState.personalityTraits,
          ...(parsed.personalityTraits || {}),
        },
      };
    }
  } catch (e) { /* ignore */ }
  return { ...defaultEvolutionState, personalityTraits: { ...defaultEvolutionState.personalityTraits } };
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
 * Record a chat dismiss (user closed chat bubble quickly)
 */
export function recordChatDismiss() {
  const state = loadPersonalityEvolution();
  state.ignoreCount = (state.ignoreCount || 0) + 1;
  state.personalityTraits.sarcasm = Math.min(100, (state.personalityTraits.sarcasm || 0) + 0.5);
  state.personalityTraits.affection = Math.max(0, (state.personalityTraits.affection || 0) - 0.2);
  recalculateDominant(state);
  savePersonalityEvolution(state);
  return state;
}

/**
 * Record an AI chat interaction (user talked to pet)
 */
export function recordTalkInteraction() {
  const state = loadPersonalityEvolution();
  state.talkCount = (state.talkCount || 0) + 1;
  state.personalityTraits.philosophy = Math.min(100, (state.personalityTraits.philosophy || 0) + 1);
  state.personalityTraits.affection = Math.min(100, (state.personalityTraits.affection || 0) + 0.3);
  recalculateDominant(state);
  savePersonalityEvolution(state);
  return state;
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
  state.interactCount = (state.interactCount || 0) + 1;

  switch (type) {
    case 'feed':
      state.totalFeeds++;
      state.feedCount = (state.feedCount || 0) + 1;
      state.personalityTraits.foodLove = Math.min(100, (state.personalityTraits.foodLove || 0) + 0.8);
      state.personalityTraits.affection = Math.min(100, (state.personalityTraits.affection || 0) + 0.3);
      break;
    case 'play':
      state.totalPlays++;
      state.playCount = (state.playCount || 0) + 1;
      state.personalityTraits.playfulness = Math.min(100, (state.personalityTraits.playfulness || 0) + 1);
      state.personalityTraits.affection = Math.min(100, (state.personalityTraits.affection || 0) + 0.2);
      break;
    case 'pet':
      state.totalPets++;
      state.personalityTraits.affection = Math.min(100, (state.personalityTraits.affection || 0) + 0.5);
      state.personalityTraits.clinginess = Math.min(100, (state.personalityTraits.clinginess || 0) + 0.3);
      break;
  }

  // Recalculate personality traits based on interaction rates
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
    state.personalityTraits.sarcasm = Math.min(100, (state.personalityTraits.sarcasm || 0) + 0.5);
  }

  // Calculate happiness (inverse of extremes)
  state.personalityTraits.happiness = 100 - Math.max(state.personalityTraits.rebelliousness, state.personalityTraits.clinginess) * 0.7;

  recalculateDominant(state);
  savePersonalityEvolution(state);
  return state;
}

/**
 * Recalculate dominant personality based on trait scores
 */
function recalculateDominant(state) {
  const { rebelliousness, clinginess, sarcasm, affection, playfulness, foodLove, philosophy } = state.personalityTraits;

  // Find the highest trait
  const traits = [
    { name: 'sarcastic', score: sarcasm || 0 },
    { name: 'affectionate', score: affection || 0 },
    { name: 'playful', score: playfulness || 0 },
    { name: 'foodie', score: foodLove || 0 },
    { name: 'philosophical', score: philosophy || 0 },
    { name: 'rebellious', score: rebelliousness || 0 },
    { name: 'clingy', score: clinginess || 0 },
  ];

  traits.sort((a, b) => b.score - a.score);

  // Need at least 20 points in a trait to be dominant
  if (traits[0].score >= 20) {
    state.dominantPersonality = traits[0].name;
  } else {
    state.dominantPersonality = 'balanced';
  }
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
    state.personalityTraits.sarcasm = Math.min(100, (state.personalityTraits.sarcasm || 0) + 0.005);
    state.personalityTraits.happiness = Math.max(0, state.personalityTraits.happiness - 0.005);
  } else {
    // Slowly recover when interacting regularly
    state.personalityTraits.rebelliousness = Math.max(0, state.personalityTraits.rebelliousness - 0.005);
    state.personalityTraits.clinginess = Math.max(0, state.personalityTraits.clinginess - 0.003);
    state.personalityTraits.sarcasm = Math.max(0, (state.personalityTraits.sarcasm || 0) - 0.002);
  }

  recalculateDominant(state);
  savePersonalityEvolution(state);
  return state;
}

/**
 * Get personality-affected chat messages (enhanced with new personalities)
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
    sarcastic: [
      "Fine, I'll entertain myself.",
      "Oh wow, you clicked on me. Revolutionary.",
      "Don't mind me, just existing over here.",
      "*slow clap* You remembered I'm here.",
      "Alert the press, the human has returned.",
      "I've been practicing my eye-roll. Wanna see?",
      "Oh, you need something? Shocking.",
      "I was just about to start my solo career.",
    ],
    affectionate: [
      "I missed you! Even though it's been 2 minutes!",
      "You're my favorite human ever! 💕",
      "Can I have a hug? Please please please?",
      "*nuzzles against screen* Hi!",
      "I love you I love you I love you!",
      "You make everything better just by being here~",
      "Never leave me okay? OKAY?!",
      "I drew you a heart! ❤️ See? See?!",
    ],
    playful: [
      "Tag! You're it! *zooms away*",
      "Bet you can't catch me! 🏃",
      "Wanna play? Wanna play? WANNA PLAY?!",
      "*bounces off walls* ENERGY!",
      "I found a bug! ...wait, that's a pixel.",
      "Let's do something FUN! Like... everything!",
      "Race you to the other side of the screen!",
      "*does a backflip* Did you see that?!",
    ],
    foodie: [
      "Is it snack time yet? It feels like snack time.",
      "I had a dream about food... it was beautiful 🍕",
      "You know what would make this moment perfect? A treat.",
      "I'm not saying I'm hungry, but... I'm hungry.",
      "Thank you for feeding me! You're the BEST chef!",
      "*sniffs air* Do I smell something delicious?",
      "My love language is food. Just saying.",
      "One more treat? For the road? Please? 🥺",
    ],
    philosophical: [
      "Do you think pixels dream of electric sheep?",
      "I've been thinking about the nature of consciousness...",
      "What if we're all just code in someone's simulation?",
      "The meaning of life is... probably treats. And naps.",
      "I wonder what's beyond the screen boundaries...",
      "Time is an illusion. Lunch time doubly so.",
      "If a pet speaks and no one reads the bubble, did it happen?",
      "I've been pondering the duality of being both cute AND wise.",
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
 * Get personality-affected ignore chance (rebellious/sarcastic pets ignore more)
 */
export function getPersonalityIgnoreChance(dominantPersonality) {
  switch (dominantPersonality) {
    case 'rebellious': return 0.4;
    case 'sarcastic': return 0.3;
    case 'clingy': return 0;
    case 'affectionate': return 0;
    case 'playful': return 0.05;
    case 'foodie': return 0.05;
    case 'philosophical': return 0.15;
    case 'balanced': return 0.05;
    default: return 0.05;
  }
}

/**
 * Get personality summary for AI system prompt
 */
export function getPersonalityForPrompt() {
  const state = loadPersonalityEvolution();
  const { sarcasm, affection, playfulness, foodLove, philosophy, rebelliousness, clinginess } = state.personalityTraits;

  const traits = [];
  if (sarcasm > 30) traits.push(`sarcastic (${Math.round(sarcasm)}%)`);
  if (affection > 30) traits.push(`affectionate (${Math.round(affection)}%)`);
  if (playfulness > 30) traits.push(`playful (${Math.round(playfulness)}%)`);
  if (foodLove > 30) traits.push(`food-loving (${Math.round(foodLove)}%)`);
  if (philosophy > 30) traits.push(`philosophical (${Math.round(philosophy)}%)`);
  if (rebelliousness > 30) traits.push(`rebellious (${Math.round(rebelliousness)}%)`);
  if (clinginess > 30) traits.push(`clingy (${Math.round(clinginess)}%)`);

  if (traits.length === 0) traits.push('balanced and friendly');

  return {
    dominant: state.dominantPersonality,
    traits: traits.join(', '),
    summary: `Dominant personality: ${state.dominantPersonality}. Traits: ${traits.join(', ')}.`,
  };
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
    ignoreCount: state.ignoreCount || 0,
    interactCount: state.interactCount || 0,
    feedCount: state.feedCount || 0,
    playCount: state.playCount || 0,
    talkCount: state.talkCount || 0,
  };
}
