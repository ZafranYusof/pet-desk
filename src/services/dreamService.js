/**
 * PetDesk - Dream Service
 * Random dream sequences when pet sleeps.
 */

const DREAM_LOG_KEY = 'petdesk_dream_log';
const DREAM_STATE_KEY = 'petdesk_dream_state';

const DREAM_SCENARIOS = [
  {
    id: 'flying',
    title: 'Flying Through Clouds',
    emoji: '☁️',
    frames: [
      'I spread my tiny wings...',
      'The clouds are so fluffy up here!',
      'I can see the whole world below!',
      'Wheee! Loop-de-loop through a rainbow!',
      'A bird waves at me as I fly past!',
    ],
    mood: 'happy',
    moodBoost: 8,
  },
  {
    id: 'underwater',
    title: 'Underwater Adventure',
    emoji: '🐠',
    frames: [
      'Bubble bubble... I can breathe underwater!',
      'A friendly fish shows me a coral castle!',
      'We find a treasure chest full of sparkles!',
      'A whale sings a beautiful song...',
      'I ride a sea turtle back to shore!',
    ],
    mood: 'happy',
    moodBoost: 6,
  },
  {
    id: 'food_land',
    title: 'Giant Food Land',
    emoji: '🍕',
    frames: [
      'Everything here is made of food!',
      'Mountains of ice cream everywhere!',
      'I slide down a chocolate waterfall!',
      'Pizza trees! Candy bushes! Soda rivers!',
      'I eat until I\'m the happiest pet ever!',
    ],
    mood: 'happy',
    moodBoost: 10,
  },
  {
    id: 'space',
    title: 'Space Exploration',
    emoji: '🚀',
    frames: [
      '3... 2... 1... BLAST OFF!',
      'The stars are so beautiful up close!',
      'I land on a planet made of crystals!',
      'Friendly aliens teach me a dance!',
      'I collect stardust in my pockets!',
    ],
    mood: 'happy',
    moodBoost: 7,
  },
  {
    id: 'forest_maze',
    title: 'Enchanted Forest Maze',
    emoji: '🌲',
    frames: [
      'I wander into a magical forest...',
      'Glowing mushrooms light the path!',
      'A wise owl gives me a riddle...',
      'I solve it! The maze opens up!',
      'A fairy grants me a wish!',
    ],
    mood: 'happy',
    moodBoost: 5,
  },
  {
    id: 'volcano',
    title: 'Volcano Escape',
    emoji: '🌋',
    frames: [
      'The ground is shaking!',
      'Lava is rising! I need to run!',
      'Jump! Jump! Over the lava streams!',
      'A friendly dragon carries me to safety!',
      'Phew! That was close! My heart is racing!',
    ],
    mood: 'nightmare',
    moodBoost: -3,
  },
  {
    id: 'ice_kingdom',
    title: 'Ice Kingdom',
    emoji: '❄️',
    frames: [
      'Everything is frozen and sparkling...',
      'I slide across a mirror-like ice lake!',
      'An ice palace appears in the distance!',
      'The Ice Queen gives me a crystal crown!',
      'I build the biggest snowman ever!',
    ],
    mood: 'happy',
    moodBoost: 6,
  },
  {
    id: 'haunted_castle',
    title: 'Haunted Castle',
    emoji: '🏚️',
    frames: [
      'Creeeeak... the door opens by itself...',
      'Shadows move on the walls!',
      'A ghost appears! But... it just wants to play!',
      'We play hide and seek in the castle!',
      'The ghost gives me a spooky but cool hat!',
    ],
    mood: 'nightmare',
    moodBoost: -2,
  },
  {
    id: 'concert',
    title: 'Rock Star Concert',
    emoji: '🎸',
    frames: [
      'I\'m on a huge stage!',
      'Thousands of fans are cheering!',
      'I grab the guitar and SHRED!',
      'The crowd goes wild!',
      'Best. Concert. EVER!',
    ],
    mood: 'happy',
    moodBoost: 9,
  },
  {
    id: 'tiny_world',
    title: 'Shrunk to Tiny Size',
    emoji: '🔬',
    frames: [
      'Wait... everything is HUGE!',
      'I\'m the size of an ant!',
      'I ride a ladybug like a horse!',
      'A dewdrop is like a swimming pool!',
      'Being tiny is actually pretty fun!',
    ],
    mood: 'happy',
    moodBoost: 5,
  },
];

/**
 * Check if a dream should trigger (10% chance per sleep cycle check).
 */
export function shouldDream() {
  return Math.random() < 0.10;
}

/**
 * Get a random dream scenario.
 */
export function getRandomDream() {
  const idx = Math.floor(Math.random() * DREAM_SCENARIOS.length);
  return DREAM_SCENARIOS[idx];
}

/**
 * Get dream mood effect.
 */
export function getDreamMoodEffect(dream) {
  return {
    happiness: dream.moodBoost || 0,
    isNightmare: dream.mood === 'nightmare',
  };
}

/**
 * Save a dream to the log.
 */
export function saveDreamToLog(dream) {
  try {
    const log = getDreamLog();
    log.unshift({
      id: dream.id,
      title: dream.title,
      emoji: dream.emoji,
      mood: dream.mood,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
    });
    // Keep last 20 dreams
    const trimmed = log.slice(0, 20);
    localStorage.setItem(DREAM_LOG_KEY, JSON.stringify(trimmed));
  } catch (e) { /* ignore */ }
}

/**
 * Get dream log.
 */
export function getDreamLog() {
  try {
    const stored = localStorage.getItem(DREAM_LOG_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Get current dream state (for active dream).
 */
export function getActiveDream() {
  try {
    const stored = localStorage.getItem(DREAM_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * Set active dream state.
 */
export function setActiveDream(dream) {
  try {
    if (dream) {
      localStorage.setItem(DREAM_STATE_KEY, JSON.stringify(dream));
    } else {
      localStorage.removeItem(DREAM_STATE_KEY);
    }
  } catch (e) { /* ignore */ }
}

/**
 * Get all dream scenarios (for dream log display).
 */
export function getAllDreamScenarios() {
  return DREAM_SCENARIOS;
}
