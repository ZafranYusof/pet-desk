// Weather Event Service - Rare weather events with rewards

const EVENT_STATE_KEY = 'petdesk_weather_events';

const WEATHER_EVENTS = [
  {
    id: 'meteor-shower',
    name: 'Meteor Shower',
    emoji: '🌠',
    chance: 0.05,
    duration: 300, // 5 minutes in seconds
    condition: () => true, // any time
    rewards: { xp: 50, materials: { starFragment: 1 } },
    petReaction: 'excited',
    visual: 'meteors',
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    emoji: '🌌',
    chance: 0.04,
    duration: 600, // 10 minutes
    condition: (timeOfDay) => timeOfDay === 'night',
    rewards: { happiness: 30, materials: { crystal: 1 } },
    petReaction: 'mesmerized',
    visual: 'aurora',
  },
  {
    id: 'thunderstorm',
    name: 'Thunderstorm',
    emoji: '⛈️',
    chance: 0.08,
    duration: 180, // 3 minutes
    condition: () => true,
    rewards: { energy: 20, materials: { shadowEssence: 1 } },
    petReaction: 'scared-brave',
    visual: 'thunder',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    emoji: '🌈',
    chance: 0.06,
    duration: 480, // 8 minutes
    condition: (timeOfDay, weather) => weather === 'rainy' || weather === 'stormy',
    rewards: { happiness: 40, materials: { goldDust: 1 } },
    petReaction: 'happy-dance',
    visual: 'rainbow',
  },
  {
    id: 'snowstorm',
    name: 'Snowstorm',
    emoji: '❄️',
    chance: 0.03,
    duration: 420, // 7 minutes
    condition: (timeOfDay) => timeOfDay === 'night',
    rewards: { materials: { crystal: 1, fabric: 1 }, freezeEnergy: true },
    petReaction: 'shiver',
    visual: 'snowstorm',
  },
  {
    id: 'solar-eclipse',
    name: 'Solar Eclipse',
    emoji: '🌑',
    chance: 0.01,
    duration: 120, // 2 minutes
    condition: (timeOfDay) => timeOfDay === 'day' || timeOfDay === 'morning' || timeOfDay === 'afternoon',
    rewards: { xp: 100, materials: { shadowEssence: 2, starFragment: 1 } },
    petReaction: 'awe',
    visual: 'eclipse',
  },
];

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours between events

function loadState() {
  try {
    const stored = localStorage.getItem(EVENT_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    lastCheck: 0,
    lastEventEnd: 0,
    activeEvent: null,
    eventHistory: [],
  };
}

function saveState(state) {
  try {
    localStorage.setItem(EVENT_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

export function checkForEvent(timeOfDay, currentWeather) {
  const state = loadState();
  const now = Date.now();

  // If there's an active event, check if it's expired
  if (state.activeEvent) {
    const elapsed = (now - state.activeEvent.startTime) / 1000;
    if (elapsed >= state.activeEvent.duration) {
      // Event ended naturally
      return null;
    }
    return state.activeEvent;
  }

  // Cooldown check
  if (now - state.lastEventEnd < COOLDOWN_MS) {
    return null;
  }

  // Roll for each event
  for (const event of WEATHER_EVENTS) {
    if (!event.condition(timeOfDay, currentWeather)) continue;
    if (Math.random() < event.chance) {
      // Start this event
      const activeEvent = {
        id: event.id,
        name: event.name,
        emoji: event.emoji,
        startTime: now,
        duration: event.duration,
        visual: event.visual,
        petReaction: event.petReaction,
      };
      state.activeEvent = activeEvent;
      state.lastCheck = now;
      saveState(state);
      return activeEvent;
    }
  }

  state.lastCheck = now;
  saveState(state);
  return null;
}

export function getActiveEvent() {
  const state = loadState();
  if (!state.activeEvent) return null;

  const now = Date.now();
  const elapsed = (now - state.activeEvent.startTime) / 1000;
  if (elapsed >= state.activeEvent.duration) {
    // Expired but not collected
    return { ...state.activeEvent, expired: true };
  }
  return { ...state.activeEvent, remaining: state.activeEvent.duration - elapsed };
}

export function startEvent(eventId) {
  const event = WEATHER_EVENTS.find((e) => e.id === eventId);
  if (!event) return null;

  const state = loadState();
  const now = Date.now();
  const activeEvent = {
    id: event.id,
    name: event.name,
    emoji: event.emoji,
    startTime: now,
    duration: event.duration,
    visual: event.visual,
    petReaction: event.petReaction,
  };
  state.activeEvent = activeEvent;
  saveState(state);
  return activeEvent;
}

export function endEvent() {
  const state = loadState();
  if (!state.activeEvent) return null;

  const eventDef = WEATHER_EVENTS.find((e) => e.id === state.activeEvent.id);
  const rewards = eventDef ? eventDef.rewards : {};

  // Add to history
  state.eventHistory.push({
    id: state.activeEvent.id,
    date: Date.now(),
  });
  // Keep only last 20
  if (state.eventHistory.length > 20) {
    state.eventHistory = state.eventHistory.slice(-20);
  }

  state.lastEventEnd = Date.now();
  state.activeEvent = null;
  saveState(state);

  return rewards;
}

export function getEventRewards(eventId) {
  const event = WEATHER_EVENTS.find((e) => e.id === eventId);
  return event ? event.rewards : {};
}

export function getEventHistory() {
  const state = loadState();
  return state.eventHistory;
}

export function getEventInfo(eventId) {
  return WEATHER_EVENTS.find((e) => e.id === eventId) || null;
}

export function getAllEvents() {
  return WEATHER_EVENTS;
}
