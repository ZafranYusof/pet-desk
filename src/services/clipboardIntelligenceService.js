/**
 * PetDesk - Clipboard Intelligence Service
 * Monitors clipboard changes and detects content types.
 * Provides smart reactions based on clipboard content.
 */

const CLIPBOARD_STATE_KEY = 'petdesk-clipboard-intel';
const THROTTLE_MS = 2 * 60 * 1000; // 2 minutes between reactions

let lastReactionTime = 0;
let clipboardMonitorActive = false;
let clipboardCheckInterval = null;
let lastClipboardText = '';
let onClipboardCallback = null;

/**
 * Detect the type of clipboard content.
 * @param {string} text - Clipboard text
 * @returns {{ type: string, confidence: number, details?: string }}
 */
export function detectContentType(text) {
  if (!text || text.trim().length === 0) {
    return { type: 'empty', confidence: 1 };
  }

  const trimmed = text.trim();

  // Error detection
  const errorPatterns = [
    /error[:\s]/i,
    /exception[:\s]/i,
    /traceback/i,
    /stack trace/i,
    /at\s+[\w.]+\(.*:\d+:\d+\)/,  // JS stack trace
    /File ".*", line \d+/,          // Python traceback
    /FATAL/i,
    /panic:/i,
    /undefined is not/i,
    /cannot read propert/i,
    /null pointer/i,
    /segmentation fault/i,
  ];
  const errorMatch = errorPatterns.some((p) => p.test(trimmed));
  if (errorMatch) {
    // Extract error type if possible
    const errorTypeMatch = trimmed.match(/([\w.]+Error|[\w.]+Exception|FATAL|panic)[:.\s]/i);
    return {
      type: 'error',
      confidence: 0.9,
      details: errorTypeMatch ? errorTypeMatch[1] : 'unknown error',
    };
  }

  // URL detection
  if (/^https?:\/\/[^\s]+$/i.test(trimmed) || /^www\.[^\s]+$/i.test(trimmed)) {
    return { type: 'url', confidence: 1, details: trimmed.slice(0, 100) };
  }

  // Code detection
  const codeIndicators = [
    /^(import|from|require|export|const|let|var|function|class|def|pub|fn|async)\s/m,
    /[{}\[\]();].*[{}\[\]();]/,
    /=>/,
    /\(\) =>/,
    /^\s*(if|else|for|while|switch|try|catch)\s*[\({]/m,
    /^\s*<\/?[a-zA-Z][\w-]*[\s/>]/m, // HTML/JSX
    /console\.(log|error|warn)/,
    /document\.(get|query)/,
    /\$\(.*\)/,
  ];
  const codeScore = codeIndicators.filter((p) => p.test(trimmed)).length;
  if (codeScore >= 2) {
    // Try to detect language
    let lang = 'code';
    if (/^(import|from)\s.*\n/m.test(trimmed) && /def\s|class\s.*:/m.test(trimmed)) lang = 'Python';
    else if (/const|let|var|=>|function/.test(trimmed)) lang = 'JavaScript';
    else if (/fn\s|let\s+mut|impl\s/.test(trimmed)) lang = 'Rust';
    else if (/public\s+(static|class|void)/.test(trimmed)) lang = 'Java';
    else if (/<[a-zA-Z][\w-]*[\s/>]/.test(trimmed)) lang = 'HTML/JSX';
    return { type: 'code', confidence: Math.min(1, codeScore * 0.3), details: lang };
  }

  // JSON detection
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return { type: 'json', confidence: 1 };
    } catch (e) { /* not valid JSON */ }
  }

  // File path detection
  if (/^[A-Z]:\\|^\/[\w/]|^~\//.test(trimmed) && trimmed.split('\n').length === 1) {
    return { type: 'filepath', confidence: 0.8, details: trimmed };
  }

  // Email detection
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(trimmed)) {
    return { type: 'email', confidence: 1 };
  }

  // Long text (paragraph)
  if (trimmed.length > 200 && trimmed.split(/\s+/).length > 30) {
    return { type: 'text', confidence: 0.8, details: 'long text' };
  }

  return { type: 'text', confidence: 0.5, details: 'plain text' };
}

/**
 * Get a reaction message based on clipboard content type.
 * @param {string} text - Clipboard text
 * @returns {{ message: string, type: string, shouldOffer?: string } | null}
 */
export function getClipboardReaction(text) {
  const now = Date.now();
  if (now - lastReactionTime < THROTTLE_MS) return null;

  const detected = detectContentType(text);
  if (detected.type === 'empty') return null;

  lastReactionTime = now;

  switch (detected.type) {
    case 'error':
      return {
        message: `That looks like an error${detected.details ? ` (${detected.details})` : ''}. Want me to help debug? 🐛`,
        type: 'error',
        shouldOffer: 'debug',
      };
    case 'url':
      return {
        message: 'Saved that link! 🔗',
        type: 'url',
      };
    case 'code':
      const codeMessages = [
        `Nice ${detected.details || 'code'} snippet! 💻`,
        `Ooh, ${detected.details || 'code'}! Want me to explain it?`,
        `Copied some ${detected.details || 'code'}~ Working hard!`,
      ];
      return {
        message: codeMessages[Math.floor(Math.random() * codeMessages.length)],
        type: 'code',
        shouldOffer: 'explain',
      };
    case 'json':
      return {
        message: 'JSON data copied! Looks structured 📋',
        type: 'json',
      };
    case 'filepath':
      return {
        message: 'Got that file path! 📁',
        type: 'filepath',
      };
    case 'email':
      return {
        message: 'Email address copied! ✉️',
        type: 'email',
      };
    case 'text':
      if (detected.details === 'long text') {
        return {
          message: 'That\'s a lot of text! Writing something? ✍️',
          type: 'text',
        };
      }
      // Don't react to short plain text
      return null;
    default:
      return null;
  }
}

/**
 * Start clipboard monitoring.
 * Uses the electronAPI clipboard-change event if available,
 * otherwise falls back to polling.
 */
export function startClipboardMonitor(callback) {
  if (clipboardMonitorActive) return;
  clipboardMonitorActive = true;
  onClipboardCallback = callback;

  // Use electron's clipboard-change event (already set up in main process)
  if (window.electronAPI?.onClipboardChange) {
    window.electronAPI.onClipboardChange((text) => {
      if (text && text !== lastClipboardText) {
        lastClipboardText = text;
        if (onClipboardCallback) {
          const reaction = getClipboardReaction(text);
          onClipboardCallback(text, reaction);
        }
      }
    });
  }
}

/**
 * Stop clipboard monitoring.
 */
export function stopClipboardMonitor() {
  clipboardMonitorActive = false;
  onClipboardCallback = null;
  if (clipboardCheckInterval) {
    clearInterval(clipboardCheckInterval);
    clipboardCheckInterval = null;
  }
}

/**
 * Get the last clipboard content.
 */
export function getLastClipboard() {
  return lastClipboardText;
}

/**
 * Analyze clipboard text and return structured info.
 * @param {string} text - Text to analyze
 * @returns {{ type: string, confidence: number, details?: string, summary: string }}
 */
export function analyzeClipboard(text) {
  const detected = detectContentType(text);
  let summary = '';

  switch (detected.type) {
    case 'error':
      summary = `Error detected: ${detected.details || 'unknown'}`;
      break;
    case 'url':
      summary = `URL: ${text.slice(0, 80)}${text.length > 80 ? '...' : ''}`;
      break;
    case 'code':
      const lines = text.split('\n').length;
      summary = `${detected.details || 'Code'} snippet (${lines} line${lines > 1 ? 's' : ''})`;
      break;
    case 'json':
      try {
        const parsed = JSON.parse(text);
        const keys = Array.isArray(parsed) ? `array[${parsed.length}]` : `{${Object.keys(parsed).slice(0, 3).join(', ')}...}`;
        summary = `JSON: ${keys}`;
      } catch {
        summary = 'JSON data';
      }
      break;
    case 'filepath':
      summary = `File path: ${text}`;
      break;
    case 'email':
      summary = `Email: ${text}`;
      break;
    default:
      summary = `Text (${text.length} chars)`;
  }

  return { ...detected, summary };
}

/**
 * Get clipboard summary for AI context.
 */
export function getClipboardSummary() {
  if (!lastClipboardText) return 'No recent clipboard content';
  const analysis = analyzeClipboard(lastClipboardText);
  return `Recent clipboard: ${analysis.type} - ${analysis.summary}`;
}
