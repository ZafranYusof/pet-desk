/**
 * PetDesk - Mood Service
 * Complex mood system with 8 moods determined by stats, time, interactions, and weather.
 * Moods affect walk speed, chat messages, emote frequency, and game performance.
 */

const MOOD_KEY = 'petdesk_mood_state';
const MOOD_HISTORY_KEY = 'petdesk_mood_history';

export const MOODS = {
  happy: { id: 'happy', emoji: '😊', label: 'Happy', color: '#FFD700', aura: 'sparkle' },
  excited: { id: 'excited', emoji: '🤩', label: 'Excited', color: '#FF6B6B', aura: 'burst' },
  calm: { id: 'calm', emoji: '😌', label: 'Calm', color: '#87CEEB', aura: 'wave' },
  bored: { id: 'bored', emoji: '😐', label: 'Bored', color: '#9E9E9E', aura: 'none' },
  hungry: { id: 'hungry', emoji: '🤤', label: 'Hungry', color: '#FF9800', aura: 'rumble' },
  tired: { id: 'tired', emoji: '😴', label: 'Tired', color: '#7B68EE', aura: 'zzz' },
  lonely: { id: 'lonely', emoji: '🥺', label: 'Lonely', color: '#6A5ACD', aura: 'drip' },
  playful: { id: 'playful', emoji: '😜', label: 'Playful', color: '#FF69B4', aura: 'bounce' },
};

/**
 * Load mood state
 */
export function getMoodState() {
  try {
    const stored = localStorage.getItem(MOOD_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    currentMood: 'calm',
    targetMood: 'calm',
    transitionProgress: 1.0, // 0 = just started transitioning, 1 = fully in current mood
    lastInteraction: Date.now(),
    moodStartedAt: Date.now(),
  };
}

/**
 * Save mood state
 */
export function saveMoodState(state) {
  try {
    localStorage.setItem(MOOD_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/**
 * Calculate what mood the pet should be in based on all factors
 */
export function calculateMood(petState, weather, timeOfDay) {
  const hunger = petState.hunger ?? 50;
  const energy = petState.energy ?? 50;
  const happiness = petState.happiness ?? 50;
  const state = petState.state || 'idle';

  const moodState = getMoodState();
  const timeSinceInteraction = Date.now() - (moodState.lastInteraction || Date.now());
  const minutesSinceInteraction = timeSinceInteraction / 60000;

  // Priority-based mood determination
  // 1. Sleeping = tired
  if (state === 'sleeping') return 'tired';

  // 2. Very hungry
  if (hunger < 20) return 'hungry';

  // 3. Very low energy
  if (energy < 15) return 'tired';

  // 4. No interaction for a long time = lonely
  if (minutesSinceInteraction > 30) return 'lonely';

  // 5. No interaction for medium time = bored
  if (minutesSinceInteraction > 15 && happiness < 60) return 'bored';

  // 6. High happiness + recent interaction = excited
  if (happiness > 85 && minutesSinceInteraction < 5) return 'excited';

  // 7. Playing state = playful
  if (state === 'playing' || state === 'dancing') return 'playful';

  // 8. Good weather + good stats = happy
  if (happiness > 60 && energy > 40 && (weather === 'sunny' || weather === 'snowy')) return 'happy';

  // 9. Medium stats, calm time = calm
  if (energy > 30 && happiness > 40 && (timeOfDay === 'evening' || timeOfDay === 'night')) return 'calm';

  // 10. Good overall = happy
  if (happiness > 50 && energy > 30 && hunger > 30) return 'happy';

  // 11. Low happiness = bored
  if (happiness < 40) return 'bored';

  // Default
  return 'calm';
}

/**
 * Tick the mood system - call every few seconds for gradual transitions
 */
export function tickMood(petState, weather, timeOfDay) {
  const state = getMoodState();
  const targetMood = calculateMood(petState, weather, timeOfDay);

  if (targetMood !== state.currentMood) {
    // Start transitioning to new mood
    if (state.targetMood !== targetMood) {
      state.targetMood = targetMood;
      state.transitionProgress = 0;
    } else {
      // Continue transition (gradual, takes ~15 seconds)
      state.transitionProgress = Math.min(1.0, state.transitionProgress + 0.07);
      if (state.transitionProgress >= 1.0) {
        // Transition complete
        state.currentMood = targetMood;
        state.moodStartedAt = Date.now();
        // Record to history
        recordMoodHistory(targetMood);
      }
    }
  } else {
    state.targetMood = targetMood;
    state.transitionProgress = 1.0;
  }

  saveMoodState(state);
  return state;
}

/**
 * Record interaction (resets lonely/bored timers)
 */
export function recordMoodInteraction() {
  const state = getMoodState();
  state.lastInteraction = Date.now();
  saveMoodState(state);
}

/**
 * Get mood effects on gameplay
 */
export function getMoodEffects(mood) {
  switch (mood) {
    case 'happy':
      return { walkSpeed: 1.0, emoteFrequency: 1.2, gameBonus: 1.1, chatTone: 'cheerful' };
    case 'excited':
      return { walkSpeed: 1.4, emoteFrequency: 2.0, gameBonus: 1.2, chatTone: 'enthusiastic' };
    case 'calm':
      return { walkSpeed: 0.8, emoteFrequency: 0.7, gameBonus: 1.0, chatTone: 'peaceful' };
    case 'bored':
      return { walkSpeed: 0.6, emoteFrequency: 0.4, gameBonus: 0.9, chatTone: 'disinterested' };
    case 'hungry':
      return { walkSpeed: 0.7, emoteFrequency: 1.0, gameBonus: 0.8, chatTone: 'whiny' };
    case 'tired':
      return { walkSpeed: 0.4, emoteFrequency: 0.3, gameBonus: 0.7, chatTone: 'sleepy' };
    case 'lonely':
      return { walkSpeed: 0.5, emoteFrequency: 0.5, gameBonus: 0.85, chatTone: 'needy' };
    case 'playful':
      return { walkSpeed: 1.3, emoteFrequency: 1.8, gameBonus: 1.15, chatTone: 'silly' };
    default:
      return { walkSpeed: 1.0, emoteFrequency: 1.0, gameBonus: 1.0, chatTone: 'neutral' };
  }
}

/**
 * Get mood aura/particle config
 */
export function getMoodAura(mood) {
  const moodData = MOODS[mood];
  if (!moodData) return null;

  switch (moodData.aura) {
    case 'sparkle':
      return { type: 'sparkle', color: moodData.color, count: 3, speed: 1.5 };
    case 'burst':
      return { type: 'burst', color: moodData.color, count: 5, speed: 2.0 };
    case 'wave':
      return { type: 'wave', color: moodData.color, count: 2, speed: 0.8 };
    case 'bounce':
      return { type: 'bounce', color: moodData.color, count: 4, speed: 1.8 };
    case 'zzz':
      return { type: 'float', color: moodData.color, count: 1, speed: 0.5 };
    case 'drip':
      return { type: 'drip', color: moodData.color, count: 2, speed: 0.6 };
    case 'rumble':
      return { type: 'shake', color: moodData.color, count: 0, speed: 1.0 };
    default:
      return null;
  }
}

/**
 * Record mood to history (for graph display)
 */
function recordMoodHistory(mood) {
  try {
    const stored = localStorage.getItem(MOOD_HISTORY_KEY);
    let history = stored ? JSON.parse(stored) : [];

    history.push({
      mood,
      timestamp: Date.now(),
    });

    // Keep last 100 entries
    if (history.length > 100) {
      history = history.slice(-100);
    }

    localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(history));
  } catch (e) { /* ignore */ }
}

/**
 * Get mood history for graph display
 */
export function getMoodHistory() {
  try {
    const stored = localStorage.getItem(MOOD_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Get current mood emoji for display
 */
export function getCurrentMoodEmoji() {
  const state = getMoodState();
  const moodData = MOODS[state.currentMood];
  return moodData ? moodData.emoji : '😊';
}

/**
 * Get current mood label
 */
export function getCurrentMoodLabel() {
  const state = getMoodState();
  const moodData = MOODS[state.currentMood];
  return moodData ? moodData.label : 'Neutral';
}
