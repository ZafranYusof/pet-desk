// Arcade Service - high scores, game unlocks, stats
const ARCADE_STATE_KEY = 'petdesk_arcade_state';

const GAMES = [
  { id: 'flappyPet', name: 'Flappy Pet', icon: '🐦', unlockLevel: 1 },
  { id: 'snake', name: 'Snake', icon: '🐍', unlockLevel: 3 },
  { id: 'blockStack', name: 'Block Stack', icon: '🧱', unlockLevel: 7 },
  { id: 'tetris', name: 'Tetris Pet', icon: '🧱', unlockLevel: 5 },
  { id: 'rhythm', name: 'Rhythm Pet', icon: '🎵', unlockLevel: 8 },
  { id: 'racing', name: 'Pet Racing', icon: '🏃', unlockLevel: 4 },
];

function loadArcadeState() {
  try {
    const stored = localStorage.getItem(ARCADE_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    highScores: { flappyPet: 0, snake: 0, blockStack: 0, tetris: 0, rhythm: 0, racing: 0 },
    gamesPlayed: 0,
    totalScore: 0,
  };
}

function saveArcadeState(state) {
  try {
    localStorage.setItem(ARCADE_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export function getHighScores() {
  const state = loadArcadeState();
  return state.highScores;
}

export function saveHighScore(gameId, score) {
  const state = loadArcadeState();
  if (!state.highScores[gameId] || score > state.highScores[gameId]) {
    state.highScores[gameId] = score;
    saveArcadeState(state);
    return true; // New high score
  }
  return false;
}

export function recordGamePlayed(score = 0) {
  const state = loadArcadeState();
  state.gamesPlayed += 1;
  state.totalScore += score;
  saveArcadeState(state);
}

export function getGamesPlayed() {
  const state = loadArcadeState();
  return state.gamesPlayed;
}

export function getArcadeStats() {
  return loadArcadeState();
}

export function isGameUnlocked(gameId, level) {
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return false;
  return level >= game.unlockLevel;
}

export function getGamesList(level) {
  return GAMES.map((game) => ({
    ...game,
    unlocked: level >= game.unlockLevel,
    lockReason: level < game.unlockLevel ? `Level ${game.unlockLevel} required` : null,
  }));
}
