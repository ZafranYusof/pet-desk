/**
 * PetDesk - Diary Service
 * Generates diary entries from the pet's point of view based on daily activity.
 */

const DIARY_STORAGE_KEY = 'petdesk_diary';
const MAX_ENTRIES = 30;

const moodEmojis = {
  happy: '😊',
  sad: '😢',
  hungry: '🍖',
  sleepy: '😴',
  neutral: '😐',
  excited: '🎉',
  lazy: '😪',
};

// Species-specific templates
const speciesTemplates = {
  slime: {
    happy: [
      "Boing boing! Today was bouncy and fun!",
      "I jiggled with joy all day! Everything is squishy and wonderful!",
      "Splashed around the desktop like a happy puddle! Best day ever!",
    ],
    hungry: [
      "My gooey tummy is rumbling... need food to keep my bounce going!",
      "I'm deflating from hunger... feed me and I'll bounce twice as high!",
    ],
    lazy: [
      "Spent the day as a happy puddle. No bouncing needed. Just vibes.",
      "Melted into a flat blob today. Very relaxing. 10/10 would blob again.",
    ],
    active: [
      "So much bouncing today! I explored every corner of the screen!",
      "Boing! Boing! Boing! I couldn't stop moving! What a rush!",
    ],
    levelUp: [
      "I LEVELED UP! I feel bouncier and shinier! Level {level} blob!",
      "NEW LEVEL! My goo is sparkling! I'm level {level} now!",
    ],
    fed: [
      "Master fed me {count} times today! My goo is so full and happy!",
      "Nom nom nom! Got fed {count} times! I'm a well-fed blob!",
    ],
    played: [
      "Master played with me {count} times! I bounced so high!",
      "We had {count} play sessions today! I'm the happiest slime!",
    ],
    ignored: [
      "Nobody bounced with me today... I just jiggled alone...",
      "I waited and waited but no one came to play... *sad wobble*",
    ],
  },
  cat: {
    happy: [
      "The human was acceptable today. I allowed them to exist near me.",
      "I suppose today wasn't terrible. The sun was warm. I'll permit another day.",
      "Graciously allowed the human to pet me. They should feel honored.",
    ],
    hungry: [
      "The audacity. My bowl has been empty for MINUTES. Unacceptable.",
      "I stared at the human until they fed me. Took them long enough.",
    ],
    lazy: [
      "Napped in 7 different spots today. Each one perfect. I am perfect.",
      "Spent 23 hours sleeping. The other hour I spent judging.",
    ],
    active: [
      "Had a burst of energy at 3am. Knocked things off the desktop. No regrets.",
      "Ran around like a maniac for exactly 4 minutes. Now I'm exhausted. Worth it.",
    ],
    levelUp: [
      "Level {level}. Obviously. I was always destined for greatness.",
      "Reached level {level}. The human seems impressed. As they should be.",
    ],
    fed: [
      "Was fed {count} times. The portions were... adequate. Barely.",
      "The human offered food {count} times. I accepted. Reluctantly.",
    ],
    played: [
      "The human tried to play with me {count} times. I participated on MY terms.",
      "Allowed {count} play sessions today. The human needs the exercise more than me.",
    ],
    ignored: [
      "The human ignored me today. Fine. I didn't want attention anyway. *knocks something off desk*",
      "No interaction today. I shall remember this slight.",
    ],
  },
  ghost: {
    happy: [
      "Drifted through the void today. Saw interesting things beyond the screen.",
      "The ethereal plane was peaceful today. I flickered with contentment.",
      "Phased through several windows. The digital realm is beautiful from the other side.",
    ],
    hungry: [
      "Even spirits need sustenance... my essence grows thin...",
      "Hunger is strange when you're already dead. Yet here we are.",
    ],
    lazy: [
      "Floated in place all day. Time means nothing when you're eternal.",
      "Existed between dimensions. Neither here nor there. It was nice.",
    ],
    active: [
      "Teleported across the screen many times today. The living world is fascinating.",
      "Flickered in and out of existence repeatedly. It's my cardio.",
    ],
    levelUp: [
      "My spectral energy grows... Level {level}... I transcend further...",
      "Level {level}. My ghostly form grows more powerful. The veil thins.",
    ],
    fed: [
      "Consumed {count} offerings today. They dissolve into my essence...",
      "The mortal fed me {count} times. Curious that spirits can hunger.",
    ],
    played: [
      "Played {count} times with the living one. They cannot see my true form.",
      "The human engaged with me {count} times. Our worlds briefly aligned.",
    ],
    ignored: [
      "No one noticed me today. Perhaps I've become too transparent...",
      "Drifted alone through the void. The silence is familiar, but still cold.",
    ],
  },
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a diary entry based on pet state and daily stats.
 * @param {object} petState - current pet state
 * @param {object} dailyStats - { timesFed, timesPlayed, timesPetted, gamesPlayed, minutesAsleep, moodHistory }
 * @returns {object} diary entry { date, moodEmoji, text, species }
 */
export function generateEntry(petState, dailyStats) {
  const species = petState.species || 'slime';
  const templates = speciesTemplates[species] || speciesTemplates.slime;
  const now = new Date();

  // Determine the dominant mood/activity for the day
  let category = 'happy';
  let moodKey = 'happy';

  const totalInteractions = (dailyStats.timesFed || 0) + (dailyStats.timesPlayed || 0) + (dailyStats.timesPetted || 0);

  if (totalInteractions === 0) {
    category = 'ignored';
    moodKey = 'sad';
  } else if (petState.level > (dailyStats.previousLevel || petState.level)) {
    category = 'levelUp';
    moodKey = 'excited';
  } else if ((dailyStats.minutesAsleep || 0) > 120) {
    category = 'lazy';
    moodKey = 'lazy';
  } else if ((dailyStats.timesPlayed || 0) + (dailyStats.gamesPlayed || 0) > 3) {
    category = 'active';
    moodKey = 'happy';
  } else if (petState.hunger < 40) {
    category = 'hungry';
    moodKey = 'hungry';
  } else if ((dailyStats.timesFed || 0) > 2) {
    category = 'fed';
    moodKey = 'happy';
  } else if ((dailyStats.timesPlayed || 0) > 0) {
    category = 'played';
    moodKey = 'happy';
  } else {
    category = 'happy';
    moodKey = 'neutral';
  }

  let text = pickRandom(templates[category] || templates.happy);

  // Replace placeholders
  text = text.replace('{level}', petState.level || 1);
  text = text.replace('{count}', dailyStats.timesFed || dailyStats.timesPlayed || 0);

  const entry = {
    date: now.toISOString().split('T')[0],
    timestamp: now.getTime(),
    moodEmoji: moodEmojis[moodKey] || '😐',
    text,
    species,
  };

  return entry;
}

/**
 * Get all diary entries from localStorage.
 * @returns {Array} diary entries, most recent first
 */
export function getDiaryEntries() {
  try {
    const stored = localStorage.getItem(DIARY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[diary] Failed to load entries:', e);
  }
  return [];
}

/**
 * Save a new diary entry to localStorage.
 * Keeps only the last 30 entries.
 * @param {object} entry
 */
export function saveDiaryEntry(entry) {
  try {
    const entries = getDiaryEntries();
    entries.unshift(entry); // Most recent first
    const trimmed = entries.slice(0, MAX_ENTRIES);
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (e) {
    console.error('[diary] Failed to save entry:', e);
    return getDiaryEntries();
  }
}

/**
 * Check if a diary entry has already been generated today.
 * @returns {boolean}
 */
export function hasEntryToday() {
  const entries = getDiaryEntries();
  if (entries.length === 0) return false;
  const today = new Date().toISOString().split('T')[0];
  return entries[0].date === today;
}
