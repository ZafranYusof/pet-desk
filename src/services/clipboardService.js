/**
 * PetDesk - Clipboard Service
 * Monitors clipboard changes and generates pet reactions.
 */

const CLIPBOARD_KEY = 'petdesk_clipboard';
const REACTION_COOLDOWN = 30 * 1000; // 30 seconds between reactions

function loadClipboardState() {
  try {
    const stored = localStorage.getItem(CLIPBOARD_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    enabled: true,
    lastReactionTime: 0,
    lastContent: '',
  };
}

function saveClipboardState(state) {
  try {
    localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

/**
 * Detect content type from clipboard text.
 */
function detectContentType(text) {
  if (!text || text.length < 10) return 'short'; // Too short, no reaction

  // URL detection
  if (/^https?:\/\//i.test(text.trim()) || /^www\./i.test(text.trim())) {
    return 'url';
  }

  // Code detection (common patterns)
  if (/[{}\[\]();]/.test(text) && (/function|const|let|var|import|export|class|def|return|if\s*\(/.test(text))) {
    return 'code';
  }

  // Number/math detection
  if (/^\s*[\d\s+\-*/=.,()%]+\s*$/.test(text) && text.length > 3) {
    return 'numbers';
  }

  // Long text
  if (text.length > 200) {
    return 'longText';
  }

  return 'short'; // Default - no reaction
}

const REACTIONS = {
  url: [
    "Ooh where are we going?",
    "A link! Adventure awaits!",
    "Click it click it!",
    "I wonder what's there...",
  ],
  code: [
    "Looks like code to me!",
    "Beep boop... code detected!",
    "Are you hacking? Cool!",
    "That's some fancy code!",
    "Syntax looks good to me!",
  ],
  numbers: [
    "Math time!",
    "Numbers numbers numbers!",
    "Calculating...",
    "Is that the answer to everything?",
  ],
  longText: [
    "That's a lot of words!",
    "Writing an essay?",
    "So much text!",
    "That's quite a paragraph!",
    "Ctrl+C champion!",
  ],
};

/**
 * Check clipboard content and return a reaction if appropriate.
 * Returns null if no reaction should be shown.
 */
export function getClipboardReaction(clipboardText) {
  const state = loadClipboardState();

  if (!state.enabled) return null;

  const now = Date.now();

  // Check cooldown
  if (now - state.lastReactionTime < REACTION_COOLDOWN) return null;

  // Check if content is same as last
  if (clipboardText === state.lastContent) return null;

  const contentType = detectContentType(clipboardText);

  // No reaction for short text
  if (contentType === 'short') {
    state.lastContent = clipboardText;
    saveClipboardState(state);
    return null;
  }

  const reactions = REACTIONS[contentType];
  if (!reactions) return null;

  const reaction = reactions[Math.floor(Math.random() * reactions.length)];

  // Update state
  state.lastReactionTime = now;
  state.lastContent = clipboardText;
  saveClipboardState(state);

  return {
    text: reaction,
    type: contentType,
    emoji: contentType === 'url' ? '🔗' : contentType === 'code' ? '💻' : contentType === 'numbers' ? '🔢' : '📝',
  };
}

/**
 * Toggle clipboard monitoring.
 */
export function toggleClipboardMonitoring() {
  const state = loadClipboardState();
  state.enabled = !state.enabled;
  saveClipboardState(state);
  return state.enabled;
}

/**
 * Check if clipboard monitoring is enabled.
 */
export function isClipboardEnabled() {
  const state = loadClipboardState();
  return state.enabled;
}

/**
 * Set clipboard monitoring enabled/disabled.
 */
export function setClipboardEnabled(enabled) {
  const state = loadClipboardState();
  state.enabled = enabled;
  saveClipboardState(state);
}
