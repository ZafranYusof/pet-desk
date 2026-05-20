/**
 * PetDesk - Productivity Service
 * Detects active apps and makes pet react to them.
 */

const PRODUCTIVITY_KEY = 'petdesk_productivity';
const REACTION_COOLDOWN = 5 * 60 * 1000; // 5 minutes between reactions

const APP_CATEGORIES = {
  work: {
    keywords: ['excel', 'word', 'powerpoint', 'outlook', 'teams', 'slack', 'notion', 'spreadsheet', 'docs'],
    reactions: [
      'Zzz... spreadsheets...',
      'Working hard I see!',
      'So productive today!',
      'All work and no play...',
      'You\'re on a roll!',
    ],
    emoji: '📊',
  },
  play: {
    keywords: ['steam', 'game', 'minecraft', 'valorant', 'league', 'fortnite', 'roblox', 'epic games', 'discord'],
    reactions: [
      'Ooh a game! Can I watch?',
      'Gaming time! Let\'s go!',
      'I wanna play too!',
      'Nice! What are we playing?',
      'Game mode activated!',
    ],
    emoji: '🎮',
  },
  browse: {
    keywords: ['chrome', 'firefox', 'edge', 'safari', 'browser', 'opera', 'brave'],
    reactions: [
      'What are we researching?',
      'Ooh what\'s that website?',
      'Browsing again~',
      'Find anything cool?',
      'The internet is vast!',
    ],
    emoji: '🌐',
  },
  create: {
    keywords: ['vscode', 'code', 'visual studio', 'intellij', 'sublime', 'atom', 'figma', 'photoshop', 'illustrator', 'blender', 'unity'],
    reactions: [
      'Creating something cool?',
      'I love watching you code!',
      'Build build build!',
      'Ooh what are we making?',
      'Creative mode!',
    ],
    emoji: '💻',
  },
  music: {
    keywords: ['spotify', 'music', 'itunes', 'soundcloud', 'youtube music'],
    reactions: [
      '♪ I can hear the music! ♪',
      'Good taste!',
      'Let\'s dance!',
      'This is a bop!',
    ],
    emoji: '🎵',
  },
};

function loadProductivityState() {
  try {
    const stored = localStorage.getItem(PRODUCTIVITY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    lastReactionTime: 0,
    dailyUsage: { work: 0, play: 0, browse: 0, create: 0, music: 0, other: 0 },
    lastUsageDate: null,
    lastDetectedApp: null,
  };
}

function saveProductivityState(state) {
  try {
    localStorage.setItem(PRODUCTIVITY_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/**
 * Categorize an app/window title into a category.
 */
export function categorizeApp(windowTitle) {
  if (!windowTitle) return 'other';
  const lower = windowTitle.toLowerCase();

  for (const [category, data] of Object.entries(APP_CATEGORIES)) {
    for (const keyword of data.keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'other';
}

/**
 * Get a reaction for an app switch.
 * Returns null if cooldown hasn't elapsed or same app.
 */
export function getAppReaction(windowTitle) {
  const state = loadProductivityState();
  const now = Date.now();

  // Check cooldown
  if (now - state.lastReactionTime < REACTION_COOLDOWN) {
    return null;
  }

  const category = categorizeApp(windowTitle);
  if (category === 'other') return null;

  // Don't react to same category
  if (category === state.lastDetectedApp) return null;

  const catData = APP_CATEGORIES[category];
  if (!catData) return null;

  // Pick random reaction
  const reaction = catData.reactions[Math.floor(Math.random() * catData.reactions.length)];

  // Update state
  state.lastReactionTime = now;
  state.lastDetectedApp = category;

  // Track daily usage
  const today = new Date().toISOString().split('T')[0];
  if (state.lastUsageDate !== today) {
    state.dailyUsage = { work: 0, play: 0, browse: 0, create: 0, music: 0, other: 0 };
    state.lastUsageDate = today;
  }
  state.dailyUsage[category] = (state.dailyUsage[category] || 0) + 1;

  saveProductivityState(state);

  return {
    text: reaction,
    emoji: catData.emoji,
    category,
  };
}

/**
 * Record time spent in a category (called periodically).
 */
export function recordAppTime(windowTitle, minutes = 5) {
  const state = loadProductivityState();
  const category = categorizeApp(windowTitle);
  const today = new Date().toISOString().split('T')[0];

  if (state.lastUsageDate !== today) {
    state.dailyUsage = { work: 0, play: 0, browse: 0, create: 0, music: 0, other: 0 };
    state.lastUsageDate = today;
  }

  state.dailyUsage[category] = (state.dailyUsage[category] || 0) + minutes;
  saveProductivityState(state);
}

/**
 * Get daily usage stats.
 */
export function getDailyUsage() {
  const state = loadProductivityState();
  const today = new Date().toISOString().split('T')[0];
  if (state.lastUsageDate !== today) {
    return { work: 0, play: 0, browse: 0, create: 0, music: 0, other: 0 };
  }
  return state.dailyUsage;
}

/**
 * Get productivity summary for the day.
 */
export function getProductivitySummary() {
  const usage = getDailyUsage();
  const total = Object.values(usage).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const topCategory = Object.entries(usage).sort((a, b) => b[1] - a[1])[0];
  return {
    topCategory: topCategory[0],
    topTime: topCategory[1],
    totalTracked: total,
    breakdown: usage,
  };
}
