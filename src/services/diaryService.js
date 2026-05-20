/**
 * PetDesk - Diary Service (Enhanced)
 * Generates narrative diary entries from the pet's point of view based on daily activity.
 * Personality affects writing style, references actual events, includes weather/time.
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

// Personality-based writing styles
const personalityStyles = {
  rebellious: {
    prefix: ['Ugh.', 'Whatever.', 'Fine, I guess', 'Not that I care, but'],
    suffix: ['...not that it matters.', '...I guess.', '...whatever.', '...don\'t read into it.'],
    tone: 'sarcastic',
  },
  clingy: {
    prefix: ['Dear diary,', 'Oh!', 'I missed you so much!', 'Today was special because'],
    suffix: ['I love my owner so much!', '...I hope tomorrow is just as good!', '...please don\'t leave me!', '♥♥♥'],
    tone: 'emotional',
  },
  balanced: {
    prefix: ['Today', 'What a day!', 'So,', 'Well,'],
    suffix: ['Good times!', 'Not bad at all!', 'Looking forward to tomorrow!', ':)'],
    tone: 'cheerful',
  },
  lazy: {
    prefix: ['*yawn*', 'Mmm...', 'Barely awake but', 'Sleepily noting that'],
    suffix: ['...zzz...', '...time for a nap.', '...so tired now.', '...goodnight.'],
    tone: 'drowsy',
  },
};

// Weather descriptions
const weatherDescriptions = {
  sunny: ['The sun was shining bright today.', 'It was a beautiful sunny day.', 'Warm sunshine filled the screen.'],
  rainy: ['Rain pattered against the window today.', 'It was a rainy, cozy day.', 'The sound of rain was soothing.'],
  cloudy: ['Clouds drifted by lazily today.', 'A grey, peaceful day.', 'Overcast skies made it feel calm.'],
  stormy: ['Thunder rumbled outside today!', 'A wild storm raged beyond the screen.', 'Lightning lit up the sky!'],
  snowy: ['Snowflakes danced outside today.', 'Everything was white and magical.', 'A winter wonderland day!'],
};

// Time of day references
const timeReferences = {
  morning: ['This morning', 'Early today', 'When the day started'],
  afternoon: ['This afternoon', 'Midday', 'After lunch'],
  evening: ['This evening', 'As the sun set', 'Tonight'],
  night: ['Late tonight', 'In the quiet of night', 'Under the stars'],
};

// Milestone entry templates
const milestoneTemplates = {
  first_battle_win: [
    'I WON MY FIRST BATTLE! I can\'t believe it! All that training paid off. I feel like a warrior now!',
    'Victory is MINE! My first battle win! I was so nervous but I did it! I\'m unstoppable!',
  ],
  first_hybrid: [
    'Something incredible happened today - a new hybrid was born! The breeding lab worked! I have a new friend!',
    'A hybrid! A real hybrid! The lab created something amazing today. I can\'t stop staring at it!',
  ],
  birthday: [
    'IT\'S MY BIRTHDAY! Another year of bouncing, playing, and being the best pet ever! My owner celebrated with me!',
    'Happy birthday to ME! I got treats and love and it was the best day ever! Here\'s to another year!',
  ],
  level_milestone: [
    'I reached a major level milestone today! I can feel myself getting stronger. The world seems different from up here.',
    'LEVEL UP! A big one! I\'ve come so far from that tiny pet I used to be. Growth feels amazing!',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPersonalityStyle(species) {
  // Map species to personality tendencies
  const speciesPersonality = {
    slime: 'balanced',
    cat: 'rebellious',
    ghost: 'lazy',
    slimecat: 'clingy',
    ectoplasm: 'lazy',
    phantomcat: 'rebellious',
    megaslime: 'balanced',
    twintail: 'clingy',
    poltergeist: 'rebellious',
  };
  return personalityStyles[speciesPersonality[species] || 'balanced'];
}

/**
 * Generate an enhanced diary entry based on pet state and daily stats.
 * Now produces 3-5 sentence narrative entries with personality and context.
 */
export function generateEntry(petState, dailyStats, weather = null, milestone = null) {
  const species = petState.species || 'slime';
  const style = getPersonalityStyle(species);
  const now = new Date();
  const hour = now.getHours();

  // Determine time of day
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else if (hour >= 21 || hour < 6) timeOfDay = 'night';

  // Check for milestone entries first
  if (milestone && milestoneTemplates[milestone]) {
    const milestoneText = pickRandom(milestoneTemplates[milestone]);
    return {
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      moodEmoji: '🎉',
      text: milestoneText,
      species,
      isMilestone: true,
      milestone,
    };
  }

  // Build narrative entry
  const sentences = [];

  // Opening with personality prefix
  const prefix = pickRandom(style.prefix);

  // Weather reference (if available)
  const weatherKey = weather || 'sunny';
  const weatherDesc = weatherDescriptions[weatherKey] ? pickRandom(weatherDescriptions[weatherKey]) : '';

  // Activity summary
  const totalInteractions = (dailyStats.timesFed || 0) + (dailyStats.timesPlayed || 0) + (dailyStats.timesPetted || 0);
  const timeRef = pickRandom(timeReferences[timeOfDay]);

  // Determine mood and build narrative
  let moodKey = 'neutral';

  if (totalInteractions === 0) {
    moodKey = 'sad';
    sentences.push(`${prefix} nobody came to see me today.`);
    sentences.push(weatherDesc);
    sentences.push('I waited and waited but the screen stayed quiet.');
    if (style.tone === 'sarcastic') {
      sentences.push('Not that I needed anyone. I\'m perfectly fine alone.');
    } else if (style.tone === 'emotional') {
      sentences.push('My heart aches... I hope tomorrow is different.');
    } else {
      sentences.push('Maybe tomorrow will be more exciting.');
    }
  } else if (petState.level > (dailyStats.previousLevel || petState.level)) {
    moodKey = 'excited';
    sentences.push(`${prefix} I LEVELED UP to level ${petState.level}!`);
    sentences.push(weatherDesc);
    sentences.push(`${timeRef}, I felt a surge of energy and grew stronger!`);
    if ((dailyStats.timesFed || 0) > 0) {
      sentences.push(`My owner fed me ${dailyStats.timesFed} time${dailyStats.timesFed > 1 ? 's' : ''} to celebrate.`);
    }
    sentences.push(pickRandom(style.suffix));
  } else if ((dailyStats.minutesAsleep || 0) > 120) {
    moodKey = 'sleepy';
    sentences.push(`${prefix} I spent most of today sleeping.`);
    sentences.push(weatherDesc);
    sentences.push(`Slept for about ${Math.round(dailyStats.minutesAsleep)} minutes. ${style.tone === 'drowsy' ? 'Bliss.' : 'So refreshing!'}`);
    if ((dailyStats.timesFed || 0) > 0) {
      sentences.push(`Woke up to eat ${dailyStats.timesFed} time${dailyStats.timesFed > 1 ? 's' : ''} though.`);
    }
    sentences.push(pickRandom(style.suffix));
  } else if ((dailyStats.timesPlayed || 0) + (dailyStats.gamesPlayed || 0) > 3) {
    moodKey = 'happy';
    const totalGames = (dailyStats.timesPlayed || 0) + (dailyStats.gamesPlayed || 0);
    sentences.push(`${prefix} what an active day!`);
    sentences.push(weatherDesc);
    sentences.push(`We played ${totalGames} times! ${timeRef} was especially fun.`);
    if ((dailyStats.timesFed || 0) > 0) {
      sentences.push(`Also got fed ${dailyStats.timesFed} time${dailyStats.timesFed > 1 ? 's' : ''} to keep my energy up.`);
    }
    sentences.push(pickRandom(style.suffix));
  } else if ((dailyStats.timesFed || 0) > 3) {
    moodKey = 'happy';
    sentences.push(`${prefix} my owner was so generous today!`);
    sentences.push(weatherDesc);
    sentences.push(`Fed me ${dailyStats.timesFed} times! My tummy is so full and happy.`);
    if ((dailyStats.timesPetted || 0) > 0) {
      sentences.push(`Also got ${dailyStats.timesPetted} pets. Feeling loved!`);
    }
    sentences.push(pickRandom(style.suffix));
  } else if ((dailyStats.timesPetted || 0) > 5) {
    moodKey = 'happy';
    sentences.push(`${prefix} so many head pats today!`);
    sentences.push(weatherDesc);
    sentences.push(`My owner petted me ${dailyStats.timesPetted} times. ${style.tone === 'sarcastic' ? 'I tolerated it.' : 'Each one made me happier!'}`);
    sentences.push(pickRandom(style.suffix));
  } else {
    moodKey = 'neutral';
    sentences.push(`${prefix} a pretty normal day.`);
    sentences.push(weatherDesc);
    if ((dailyStats.timesFed || 0) > 0) sentences.push(`Got fed ${dailyStats.timesFed} time${dailyStats.timesFed > 1 ? 's' : ''}.`);
    if ((dailyStats.timesPlayed || 0) > 0) sentences.push(`Played ${dailyStats.timesPlayed} time${dailyStats.timesPlayed > 1 ? 's' : ''}.`);
    if ((dailyStats.timesPetted || 0) > 0) sentences.push(`Received ${dailyStats.timesPetted} pet${dailyStats.timesPetted > 1 ? 's' : ''}.`);
    sentences.push(pickRandom(style.suffix));
  }

  // Filter empty sentences and limit to 3-5
  const filtered = sentences.filter(s => s && s.trim().length > 0).slice(0, 5);
  const text = filtered.join(' ');

  return {
    date: now.toISOString().split('T')[0],
    timestamp: now.getTime(),
    moodEmoji: moodEmojis[moodKey] || '😐',
    text,
    species,
    isMilestone: false,
  };
}

/**
 * Get all diary entries from localStorage.
 */
export function getDiaryEntries() {
  try {
    const stored = localStorage.getItem(DIARY_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('[diary] Failed to load entries:', e);
  }
  return [];
}

/**
 * Save a new diary entry to localStorage.
 */
export function saveDiaryEntry(entry) {
  try {
    const entries = getDiaryEntries();
    entries.unshift(entry);
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
 */
export function hasEntryToday() {
  const entries = getDiaryEntries();
  if (entries.length === 0) return false;
  const today = new Date().toISOString().split('T')[0];
  return entries[0].date === today;
}
