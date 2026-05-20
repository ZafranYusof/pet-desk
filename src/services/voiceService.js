/**
 * PetDesk - Voice Service (TTS)
 * Uses browser's built-in Web Speech API (speechSynthesis)
 * Pet "speaks" chat messages aloud with configurable voice settings.
 */

const VOICE_SETTINGS_KEY = 'petdesk_voice_settings';

const DEFAULT_SETTINGS = {
  enabled: false,
  voiceURI: '', // empty = use default system voice
  pitch: 1.0,
  rate: 1.0,
  autoSpeak: true, // auto-speak when pet says something
  muted: false,
};

/**
 * Load voice settings from localStorage
 */
export function getVoiceSettings() {
  try {
    const stored = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save voice settings to localStorage
 */
export function saveVoiceSettings(settings) {
  try {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

/**
 * Get available system voices
 * @returns {SpeechSynthesisVoice[]}
 */
export function getAvailableVoices() {
  if (!window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Wait for voices to load (they load async in some browsers)
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
export function waitForVoices() {
  return new Promise((resolve) => {
    const voices = getAvailableVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Voices load asynchronously in Chrome
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(getAvailableVoices());
    };
    // Timeout fallback
    setTimeout(() => resolve(getAvailableVoices()), 1000);
  });
}

/**
 * Speak a message using the configured voice settings
 * @param {string} text - Text to speak
 * @param {object} [overrideSettings] - Optional settings override
 * @returns {SpeechSynthesisUtterance|null}
 */
export function speak(text, overrideSettings) {
  if (!window.speechSynthesis) return null;

  const settings = overrideSettings || getVoiceSettings();

  if (!settings.enabled || settings.muted) return null;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = settings.pitch;
  utterance.rate = settings.rate;

  // Find the selected voice
  if (settings.voiceURI) {
    const voices = getAvailableVoices();
    const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if speech synthesis is currently speaking
 * @returns {boolean}
 */
export function isSpeaking() {
  return window.speechSynthesis ? window.speechSynthesis.speaking : false;
}

/**
 * Auto-speak a chat message if auto-speak is enabled
 * @param {string} message - The chat message to speak
 */
export function autoSpeak(message) {
  const settings = getVoiceSettings();
  if (settings.enabled && settings.autoSpeak && !settings.muted) {
    speak(message, settings);
  }
}
