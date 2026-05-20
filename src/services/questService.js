/**
 * PetDesk - Quest Service
 * Daily and weekly quests with rewards and storyline.
 */

const QUEST_KEY = 'petdesk_quests';
const QUEST_PROGRESS_KEY = 'petdesk_quest_progress';
const QUEST_STORY_KEY = 'petdesk_quest_story';

const DAILY_QUEST_POOL = [
  { id: 'feed3', name: 'Feed pet 3 times', type: 'feed', target: 3, reward: { xp: 30, coins: 5 } },
  { id: 'feed5', name: 'Feed pet 5 times', type: 'feed', target: 5, reward: { xp: 50, coins: 8 } },
  { id: 'play2', name: 'Play 2 mini games', type: 'game', target: 2, reward: { xp: 40, coins: 6 } },
  { id: 'play3', name: 'Play 3 mini games', type: 'game', target: 3, reward: { xp: 60, coins: 10 } },
  { id: 'pet5', name: 'Pet 5 times', type: 'pet', target: 5, reward: { xp: 25, coins: 4 } },
  { id: 'pet10', name: 'Pet 10 times', type: 'pet', target: 10, reward: { xp: 50, coins: 8 } },
  { id: 'battle1', name: 'Win a battle', type: 'battle_win', target: 1, reward: { xp: 50, coins: 10 } },
  { id: 'garden1', name: 'Harvest a plant', type: 'harvest', target: 1, reward: { xp: 35, coins: 5 } },
  { id: 'craft1', name: 'Craft an item', type: 'craft', target: 1, reward: { xp: 40, coins: 7 } },
  { id: 'pomodoro1', name: 'Complete a focus session', type: 'pomodoro', target: 1, reward: { xp: 45, coins: 8 } },
];

const WEEKLY_QUEST_POOL = [
  { id: 'level_up', name: 'Level up once', type: 'levelup', target: 1, reward: { xp: 100, coins: 20, accessory: null } },
  { id: 'win5', name: 'Win 5 battles', type: 'battle_win', target: 5, reward: { xp: 150, coins: 30 } },
  { id: 'daily3', name: 'Complete 3 daily quest sets', type: 'daily_complete', target: 3, reward: { xp: 200, coins: 50 } },
  { id: 'games10', name: 'Play 10 games', type: 'game', target: 10, reward: { xp: 120, coins: 25 } },
  { id: 'feed20', name: 'Feed pet 20 times', type: 'feed', target: 20, reward: { xp: 100, coins: 20 } },
  { id: 'pet50', name: 'Pet 50 times', type: 'pet', target: 50, reward: { xp: 100, coins: 20 } },
];

const STORY_CHAPTERS = [
  { id: 1, title: 'The Awakening', text: 'Your pet opens its eyes for the first time, curious about the world around it...', questsRequired: 0 },
  { id: 2, title: 'First Steps', text: 'With growing confidence, your pet takes its first steps into the digital world.', questsRequired: 5 },
  { id: 3, title: 'Making Friends', text: 'Your pet discovers it\'s not alone - there are others out there in the vast desktop realm.', questsRequired: 15 },
  { id: 4, title: 'The Challenge', text: 'A mysterious shadow appears on the horizon. Your pet must grow stronger to face it.', questsRequired: 30 },
  { id: 5, title: 'Training Arc', text: 'Through battles and games, your pet hones its skills. Each day brings new strength.', questsRequired: 50 },
  { id: 6, title: 'The Discovery', text: 'Deep in the system files, your pet finds an ancient artifact of great power...', questsRequired: 75 },
  { id: 7, title: 'Allies Unite', text: 'Friends from across the desktop gather. Together, they are unstoppable.', questsRequired: 100 },
  { id: 8, title: 'The Storm', text: 'Dark clouds gather. The shadow grows stronger. But so does your pet.', questsRequired: 130 },
  { id: 9, title: 'Final Battle', text: 'The time has come. Your pet faces its greatest challenge yet...', questsRequired: 160 },
  { id: 10, title: 'A New Dawn', text: 'Victory! The desktop is safe. Your pet stands tall, a true hero of the digital realm.', questsRequired: 200 },
];

function loadQuestState() {
  try {
    const stored = localStorage.getItem(QUEST_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    dailyQuests: [],
    weeklyQuests: [],
    lastDailyReset: null,
    lastWeeklyReset: null,
    totalQuestsCompleted: 0,
    dailySetsCompleted: 0,
  };
}

function saveQuestState(state) {
  try {
    localStorage.setItem(QUEST_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

function loadQuestProgress() {
  try {
    const stored = localStorage.getItem(QUEST_PROGRESS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {};
}

function saveQuestProgress(progress) {
  try {
    localStorage.setItem(QUEST_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) { /* ignore */ }
}

function loadStoryState() {
  try {
    const stored = localStorage.getItem(QUEST_STORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return { unlockedChapter: 1, readChapters: [] };
}

function saveStoryState(state) {
  try {
    localStorage.setItem(QUEST_STORY_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get or generate daily quests (3 per day).
 */
export function getDailyQuests() {
  const state = loadQuestState();
  const today = new Date().toISOString().split('T')[0];

  if (state.lastDailyReset !== today) {
    // Generate new daily quests
    state.dailyQuests = pickRandom(DAILY_QUEST_POOL, 3).map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
    }));
    state.lastDailyReset = today;
    saveQuestState(state);

    // Reset daily progress
    const progress = loadQuestProgress();
    Object.keys(progress).forEach(key => {
      if (key.startsWith('daily_')) delete progress[key];
    });
    saveQuestProgress(progress);
  }

  return state.dailyQuests;
}

/**
 * Get or generate weekly quests (2 per week).
 */
export function getWeeklyQuests() {
  const state = loadQuestState();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekKey = weekStart.toISOString().split('T')[0];

  if (state.lastWeeklyReset !== weekKey) {
    state.weeklyQuests = pickRandom(WEEKLY_QUEST_POOL, 2).map(q => ({
      ...q,
      progress: 0,
      completed: false,
      claimed: false,
    }));
    state.lastWeeklyReset = weekKey;
    saveQuestState(state);
  }

  return state.weeklyQuests;
}

/**
 * Record progress toward quests.
 */
export function recordQuestProgress(type, amount = 1) {
  const state = loadQuestState();
  let anyCompleted = false;

  // Update daily quests
  state.dailyQuests = state.dailyQuests.map(q => {
    if (q.type === type && !q.completed) {
      const newProgress = Math.min(q.target, (q.progress || 0) + amount);
      const completed = newProgress >= q.target;
      if (completed && !q.completed) anyCompleted = true;
      return { ...q, progress: newProgress, completed };
    }
    return q;
  });

  // Update weekly quests
  state.weeklyQuests = state.weeklyQuests.map(q => {
    if (q.type === type && !q.completed) {
      const newProgress = Math.min(q.target, (q.progress || 0) + amount);
      const completed = newProgress >= q.target;
      if (completed && !q.completed) anyCompleted = true;
      return { ...q, progress: newProgress, completed };
    }
    return q;
  });

  // Check if all daily quests are complete
  const allDailyDone = state.dailyQuests.every(q => q.completed);
  if (allDailyDone && state.dailyQuests.length > 0) {
    // Record daily set completion for weekly quest
    state.dailySetsCompleted = (state.dailySetsCompleted || 0) + 1;
    state.weeklyQuests = state.weeklyQuests.map(q => {
      if (q.type === 'daily_complete' && !q.completed) {
        const newProgress = Math.min(q.target, (q.progress || 0) + 1);
        return { ...q, progress: newProgress, completed: newProgress >= q.target };
      }
      return q;
    });
  }

  saveQuestState(state);
  return anyCompleted;
}

/**
 * Claim a quest reward.
 */
export function claimQuestReward(questId, isWeekly = false) {
  const state = loadQuestState();
  const quests = isWeekly ? state.weeklyQuests : state.dailyQuests;

  const quest = quests.find(q => q.id === questId);
  if (!quest || !quest.completed || quest.claimed) return null;

  quest.claimed = true;
  state.totalQuestsCompleted = (state.totalQuestsCompleted || 0) + 1;
  saveQuestState(state);

  // Check story progression
  checkStoryProgression(state.totalQuestsCompleted);

  return quest.reward;
}

/**
 * Check and unlock story chapters.
 */
function checkStoryProgression(totalCompleted) {
  const story = loadStoryState();
  let updated = false;

  for (const chapter of STORY_CHAPTERS) {
    if (chapter.id > story.unlockedChapter && totalCompleted >= chapter.questsRequired) {
      story.unlockedChapter = chapter.id;
      updated = true;
    }
  }

  if (updated) saveStoryState(story);
  return updated;
}

/**
 * Get story state.
 */
export function getStoryProgress() {
  const story = loadStoryState();
  return {
    ...story,
    chapters: STORY_CHAPTERS.map(ch => ({
      ...ch,
      unlocked: ch.id <= story.unlockedChapter,
      read: story.readChapters.includes(ch.id),
    })),
  };
}

/**
 * Mark a chapter as read.
 */
export function markChapterRead(chapterId) {
  const story = loadStoryState();
  if (!story.readChapters.includes(chapterId)) {
    story.readChapters.push(chapterId);
    saveStoryState(story);
  }
}

/**
 * Get total quests completed.
 */
export function getTotalQuestsCompleted() {
  const state = loadQuestState();
  return state.totalQuestsCompleted || 0;
}

/**
 * Get number of unclaimed completed quests (for badge).
 */
export function getUnclaimedQuestCount() {
  const state = loadQuestState();
  const dailyUnclaimed = (state.dailyQuests || []).filter(q => q.completed && !q.claimed).length;
  const weeklyUnclaimed = (state.weeklyQuests || []).filter(q => q.completed && !q.claimed).length;
  return dailyUnclaimed + weeklyUnclaimed;
}
