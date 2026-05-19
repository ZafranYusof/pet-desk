/**
 * PetDesk - Pet Chat Service
 * Template-based pet chat with personality and variety.
 */

const CHAT_HISTORY_KEY = 'petdesk-chat-history';
const LAST_MESSAGES_KEY = 'petdesk-chat-last5';
const MAX_HISTORY = 20;

// Response templates per species and trigger
const responses = {
  slime: {
    idle_happy: ["Boing boing!", "Life is jiggly and good!", "I love being a blob!", "Wobble wobble~", "Squish squish!"],
    idle_sad: ["I feel flat today...", "Need some bouncing...", "So hungry...", "Why so still..."],
    feed: ["Yummy! I absorbed it!", "Nom nom! More please!", "That was goopy good!", "Slurp! Delicious!"],
    play: ["Wheee! Again again!", "That was so bouncy!", "I'm all jiggly now!", "Boing boing boing!"],
    pet: ["Squish! That tickles!", "I'm melting with happiness!", "Pat the blob!", "So squishy~"],
    levelup: ["I'm a bigger blob now!", "MEGA BOING!", "Growing stronger!", "Level up squish!"],
    night: ["Zzz... blob dreams...", "Goodnight, I'll be a puddle...", "Sleepy slime...", "Melting into sleep..."],
    morning: ["Good morning! Boing!", "Rise and wobble!", "New day, new bounces!"],
    battle_win: ["Slime SMASH!", "Too jiggly to hit!", "Boing power!"],
    battle_lose: ["Splat...", "I got squished...", "Need more wobble power..."],
  },
  cat: {
    idle_happy: ["*purrs*", "This spot is acceptable.", "I suppose today is fine.", "*stretches*", "Hmm."],
    idle_sad: ["*hiss*", "You've been ignoring me.", "I'm not mad. Just disappointed.", "...whatever."],
    feed: ["Hmph. It'll do.", "Finally.", "*eats elegantly*", "Acceptable cuisine."],
    play: ["I allowed that. Once.", "Don't expect this often.", "*pretends not to enjoy it*", "...fine. Again."],
    pet: ["I'll permit this.", "*purrs reluctantly*", "5 more seconds. No more.", "Don't get used to it."],
    levelup: ["As expected of me.", "I've always been superior.", "Naturally.", "About time."],
    night: ["*curls up*", "Don't disturb me.", "My beauty sleep is sacred.", "Goodnight. Leave."],
    morning: ["You're late with breakfast.", "*yawns regally*", "Another day of tolerating you."],
    battle_win: ["Obviously.", "Was there ever any doubt?", "Pathetic opponent."],
    battle_lose: ["I let them win.", "This changes nothing.", "...rematch. Now."],
  },
  ghost: {
    idle_happy: ["Wooooo~", "The void is nice today.", "I see beyond...", "*floats peacefully*", "Boo~"],
    idle_sad: ["The emptiness...", "Nobody can see me...", "I'm fading...", "So cold..."],
    feed: ["I consumed its essence.", "Interesting flavor in the void.", "Spectral nutrition!", "Absorbed~"],
    play: ["Haunting is fun!", "BOO! Did I scare you?", "Phasing through walls!", "Spooky play time!"],
    pet: ["You... touched me?", "I felt that! Somehow!", "Warm... unusual.", "How did you...?"],
    levelup: ["My power grows...", "The veil thins...", "Ascending...", "Spectral evolution!"],
    night: ["This is MY time.", "The darkness welcomes me.", "Peak haunting hours!", "Finally... night."],
    morning: ["The light... it burns...", "Must I be awake?", "Daytime is overrated..."],
    battle_win: ["They couldn't even see me!", "Phantom strike!", "Boo! Victory!"],
    battle_lose: ["I'll haunt them later...", "Retreating to the void...", "Next time..."],
  },
};

// Hybrid responses mix both parent pools
// Hybrid parent mapping (avoids circular import)
const hybridParents = {
  slimecat: ['slime', 'cat'],
  ectoplasm: ['slime', 'ghost'],
  phantomcat: ['cat', 'ghost'],
  megaslime: ['slime', 'slime'],
  twintail: ['cat', 'cat'],
  poltergeist: ['ghost', 'ghost'],
};

function getHybridResponses(species) {
  const parents = hybridParents[species];
  if (!parents) return responses.slime; // fallback

  const [p1, p2] = parents;
  const r1 = responses[p1] || responses.slime;
  const r2 = responses[p2] || responses.slime;

  // Merge: for each key, combine both arrays
  const merged = {};
  const allKeys = new Set([...Object.keys(r1), ...Object.keys(r2)]);
  for (const key of allKeys) {
    merged[key] = [...(r1[key] || []), ...(r2[key] || [])];
  }
  return merged;
}

function getResponsePool(species) {
  if (responses[species]) return responses[species];
  return getHybridResponses(species);
}

// Track last 5 messages to avoid repeats
function getLastMessages() {
  try {
    const stored = localStorage.getItem(LAST_MESSAGES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

function addToLastMessages(msg) {
  const last = getLastMessages();
  last.push(msg);
  if (last.length > 5) last.shift();
  try {
    localStorage.setItem(LAST_MESSAGES_KEY, JSON.stringify(last));
  } catch (e) { /* ignore */ }
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  const last = getLastMessages();
  // Filter out recently used messages
  const available = arr.filter(m => !last.includes(m));
  const pool = available.length > 0 ? available : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Generate a message based on pet state and event.
 */
export function generateMessage(petState, event) {
  const species = petState.species || 'slime';
  const pool = getResponsePool(species);

  let category = null;

  switch (event) {
    case 'feed':
      category = 'feed';
      break;
    case 'play':
      category = 'play';
      break;
    case 'pet':
      category = 'pet';
      break;
    case 'levelup':
      category = 'levelup';
      break;
    case 'battle_win':
      category = 'battle_win';
      break;
    case 'battle_lose':
      category = 'battle_lose';
      break;
    default:
      // Idle based on mood
      if (petState.happiness > 60) {
        category = 'idle_happy';
      } else {
        category = 'idle_sad';
      }
  }

  const messages = pool[category] || pool.idle_happy || ["..."];
  const msg = pickRandom(messages);
  if (msg) addToLastMessages(msg);
  return msg;
}

/**
 * Get greeting based on time of day.
 */
export function getGreeting(petState, timeOfDay) {
  const species = petState.species || 'slime';
  const pool = getResponsePool(species);

  if (timeOfDay === 'night' || timeOfDay === 'lateNight') {
    const msgs = pool.night || ["Zzz..."];
    return pickRandom(msgs);
  }

  const msgs = pool.morning || ["Hello!"];
  return pickRandom(msgs);
}

/**
 * Get reaction to a specific event.
 */
export function getReaction(petState, event) {
  return generateMessage(petState, event);
}

/**
 * Get random idle chatter.
 */
export function getIdleChat(petState) {
  return generateMessage(petState, 'idle');
}

/**
 * Get chat history (last 20 messages).
 */
export function getChatHistory() {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Save a chat message to history.
 */
export function saveChatMessage(message) {
  const history = getChatHistory();
  history.push({
    text: message,
    timestamp: Date.now(),
  });
  // Keep only last MAX_HISTORY
  while (history.length > MAX_HISTORY) {
    history.shift();
  }
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (e) { /* ignore */ }
}

/**
 * Clear chat history.
 */
export function clearChatHistory() {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(LAST_MESSAGES_KEY);
  } catch (e) { /* ignore */ }
}
