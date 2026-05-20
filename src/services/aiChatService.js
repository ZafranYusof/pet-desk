/**
 * PetDesk - AI Chat Service
 * OpenAI-compatible API client for AI-powered pet chat.
 */

const AI_SETTINGS_KEY = 'petdesk-ai-settings';
const AI_CHAT_HISTORY_KEY = 'petdesk-ai-chat-history';
const MAX_CONTEXT_MESSAGES = 10;

const DEFAULT_SETTINGS = {
  baseUrl: 'https://ollama.com/api',
  model: 'gpt-oss:120b',
  apiKey: '',
  useAIForAutoChat: false,
};

const FALLBACK_RESPONSES = [
  "*wiggles happily*",
  "Hmm? What's that?",
  "*tilts head curiously*",
  "I'm just vibing~",
  "Pet me more!",
  "*bounces around*",
  "Hehe~",
  "I love hanging out with you!",
];

/**
 * Get AI settings from localStorage.
 */
export function getAISettings() {
  try {
    const stored = localStorage.getItem(AI_SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save AI settings to localStorage.
 */
export function saveAISettings(settings) {
  try {
    localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) { /* ignore */ }
}

/**
 * Build system prompt based on pet context.
 */
function buildSystemPrompt(petContext) {
  const { species, name, level, mood, happiness, energy } = petContext;
  return `You are a virtual desktop pet. Your species is ${species || 'slime'}. Your name is ${name || 'Pet'}. You are level ${level || 1}. Your current mood is ${mood || 'neutral'}. Your happiness is ${happiness || 50}/100 and energy is ${energy || 50}/100.

Respond in 1-2 short sentences. Be cute, playful, and match your mood. If tired, be sleepy. If happy, be energetic. If hungry, mention food. Keep responses under 30 words. Use occasional emoji (1 max per message).`;
}

/**
 * Get conversation history for context.
 */
function getConversationHistory() {
  try {
    const stored = localStorage.getItem(AI_CHAT_HISTORY_KEY);
    if (stored) {
      const history = JSON.parse(stored);
      return history.slice(-MAX_CONTEXT_MESSAGES);
    }
  } catch (e) { /* ignore */ }
  return [];
}

/**
 * Save conversation history.
 */
function saveConversationHistory(history) {
  try {
    const trimmed = history.slice(-MAX_CONTEXT_MESSAGES);
    localStorage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) { /* ignore */ }
}

/**
 * Add a message to conversation history.
 */
export function addToConversation(role, content) {
  const history = getConversationHistory();
  history.push({ role, content });
  saveConversationHistory(history);
}

/**
 * Clear AI conversation history.
 */
export function clearAIHistory() {
  try {
    localStorage.removeItem(AI_CHAT_HISTORY_KEY);
  } catch (e) { /* ignore */ }
}

/**
 * Get a random fallback response.
 */
function getFallbackResponse() {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

/**
 * Send a message to the AI and get a response.
 * @param {string} userMsg - The user's message
 * @param {object} petContext - { species, name, level, mood, happiness, energy }
 * @returns {Promise<string>} The AI response text
 */
export async function sendMessage(userMsg, petContext) {
  const settings = getAISettings();
  const systemPrompt = buildSystemPrompt(petContext);
  const history = getConversationHistory();

  // Add user message to history
  addToConversation('user', userMsg);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMsg },
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const headers = { 'Content-Type': 'application/json' };
    if (settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: 60,
        temperature: 0.8,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (reply) {
      addToConversation('assistant', reply);
      return reply;
    }

    return getFallbackResponse();
  } catch (e) {
    // On timeout or error, return fallback
    return getFallbackResponse();
  }
}

/**
 * Generate an idle chat message using AI.
 * @param {object} petContext - { species, name, level, mood, happiness, energy }
 * @returns {Promise<string>} AI-generated idle message
 */
export async function generateIdleChat(petContext) {
  const settings = getAISettings();
  const systemPrompt = buildSystemPrompt(petContext);

  const idlePrompts = [
    "Say something random and cute to your owner who is working on their computer.",
    "Make a short comment about how you're feeling right now.",
    "Say something playful to get attention.",
    "Make a cute observation about your surroundings.",
    "Express your current mood in a short, cute way.",
  ];

  const prompt = idlePrompts[Math.floor(Math.random() * idlePrompts.length)];

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const headers = { 'Content-Type': 'application/json' };
    if (settings.apiKey) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }

    const response = await fetch(`${settings.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: 50,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (reply) return reply;
    return getFallbackResponse();
  } catch (e) {
    return getFallbackResponse();
  }
}
