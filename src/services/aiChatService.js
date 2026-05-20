/**
 * PetDesk - AI Chat Service
 * OpenAI-compatible API client for AI-powered pet chat.
 * Enhanced with full desktop awareness context.
 */

import { getContextSummary } from './petContextService';
import { getPatternSummary, getInsight } from './activityLearningService';
import { getFileAwarenessSummary } from './fileAwarenessService';
import { getClipboardSummary } from './clipboardIntelligenceService';
import { getPersonalityForPrompt } from './personalityEvolution';

const AI_SETTINGS_KEY = 'petdesk-ai-settings';
const AI_CHAT_HISTORY_KEY = 'petdesk-ai-chat-history';
const MAX_CONTEXT_MESSAGES = 10;

const DEFAULT_SETTINGS = {
  baseUrl: 'https://ollama.com/api',
  model: 'gpt-oss:120b',
  apiKey: '',
  useAIForAutoChat: true,
};

/**
 * Universal AI fetch — supports both Ollama native (/api/chat) and OpenAI (/v1/chat/completions).
 */
async function aiChatFetch(settings, messages, maxTokens = 60, temperature = 0.85) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const headers = { 'Content-Type': 'application/json' };
  if (settings.apiKey) {
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  }

  // Detect if Ollama native endpoint
  const isOllama = settings.baseUrl.includes('ollama');
  const url = isOllama
    ? `${settings.baseUrl}/chat`
    : `${settings.baseUrl}/v1/chat/completions`;

  const body = isOllama
    ? { model: settings.model, messages, stream: false }
    : { model: settings.model, messages, max_tokens: maxTokens, temperature };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      // Ollama native format: data.message.content
      // OpenAI format: data.choices[0].message.content
      const reply = isOllama
        ? data.message?.content?.trim()
        : data.choices?.[0]?.message?.content?.trim();
      return reply || null;
    }
    return null;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

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
 * Initialize AI settings with API key if not already configured.
 * Call once on app startup.
 */
export function initAISettings() {
  const settings = getAISettings();
  if (!settings.apiKey) {
    // Set default key on first run
    saveAISettings({ ...settings, apiKey: atob('MWNjYmMzNGM2N2U3NGRkOWJkNDc5MTA2MjUxYTQwZGQuTk40NFd4Y0hReGZGU3QxeEg2V1ozQUVS') });
  }
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
 * Build system prompt based on pet context with full desktop awareness.
 */
function buildSystemPrompt(petContext, activityContext) {
  const { species, name, level, mood, happiness, energy } = petContext;

  // Gather all context sources
  let contextSummary = '';
  let patternSummary = '';
  let fileAwareness = '';
  let clipboardInfo = '';

  try { contextSummary = getContextSummary(); } catch (e) { /* ignore */ }
  try { patternSummary = getPatternSummary(); } catch (e) { /* ignore */ }
  try { fileAwareness = getFileAwarenessSummary(); } catch (e) { /* ignore */ }
  try { clipboardInfo = getClipboardSummary(); } catch (e) { /* ignore */ }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dayStr = now.toLocaleDateString([], { weekday: 'long' });

  let prompt = `You are a virtual desktop pet assistant. Here's what you know about your owner:
- Species: ${species || 'slime'}, Name: ${name || 'Pet'}, Level: ${level || 1}
- Current mood: ${mood || 'neutral'}, Happiness: ${happiness || 50}/100, Energy: ${energy || 50}/100
- Time: ${timeStr} (${dayStr})`;

  if (contextSummary) {
    prompt += `\n\nOwner context:\n${contextSummary}`;
  }

  if (activityContext) {
    prompt += `\n\nCurrent activity: ${activityContext.processName || 'unknown app'} (${activityContext.category || 'unknown'}). Window: "${activityContext.windowTitle || ''}". Duration: ${activityContext.durationMinutes || 0} min.`;
  }

  if (patternSummary && patternSummary !== 'Not enough data yet') {
    prompt += `\n\nActivity patterns: ${patternSummary}`;
  }

  // Get insight for this time
  let insight = '';
  try { insight = getInsight(); } catch (e) { /* ignore */ }
  if (insight) {
    prompt += `\nPattern insight: ${insight}`;
  }

  if (fileAwareness && fileAwareness !== 'No file data yet') {
    prompt += `\n\nFile awareness:\n${fileAwareness}`;
  }

  if (clipboardInfo && clipboardInfo !== 'No recent clipboard content') {
    prompt += `\n\n${clipboardInfo}`;
  }

  // Include personality traits
  let personalityInfo = '';
  try { personalityInfo = getPersonalityForPrompt().summary; } catch (e) { /* ignore */ }
  if (personalityInfo) {
    prompt += `\n\nYour evolved personality: ${personalityInfo}`;
    prompt += `\nRespond in character based on your personality traits. If sarcastic, be witty and dry. If affectionate, be warm and clingy. If playful, be energetic. If philosophical, be thoughtful. If foodie, mention food often.`;
  }

  prompt += `\n\nBe helpful, suggest things based on context. Keep responses short (1-2 sentences). Match your personality and mood. Use occasional emoji (1 max per message).`;
  return prompt;
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
 * @param {object} [activityContext] - { processName, windowTitle, category, durationMinutes }
 * @returns {Promise<string>} The AI response text
 */
export async function sendMessage(userMsg, petContext, activityContext) {
  const settings = getAISettings();
  const systemPrompt = buildSystemPrompt(petContext, activityContext);
  const history = getConversationHistory();

  // Add user message to history
  addToConversation('user', userMsg);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMsg },
  ];

  try {
    const reply = await aiChatFetch(settings, messages, 60, 0.8);

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
 * @param {object} [activityContext] - { processName, windowTitle, category, durationMinutes }
 * @returns {Promise<string>} AI-generated idle message
 */
export async function generateIdleChat(petContext, activityContext) {
  const settings = getAISettings();
  const systemPrompt = buildSystemPrompt(petContext, activityContext);

  const idlePrompts = [
    "Say something random and cute to your owner who is working on their computer.",
    "Make a short comment about how you're feeling right now.",
    "Say something playful to get attention.",
    "Make a cute observation about your surroundings.",
    "Express your current mood in a short, cute way.",
  ];

  // If activity context is available, add activity-aware prompts
  if (activityContext) {
    idlePrompts.push(
      `Comment helpfully on what the user is doing (${activityContext.category}). Be relevant and supportive.`,
      `The user has been ${activityContext.category === 'coding' ? 'coding' : activityContext.category === 'browsing' ? 'browsing the web' : 'busy'} for ${activityContext.durationMinutes || 0} minutes. Say something relevant.`,
    );
  }

  const prompt = idlePrompts[Math.floor(Math.random() * idlePrompts.length)];

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  try {
    const reply = await aiChatFetch(settings, messages, 50, 0.9);
    if (reply) return reply;
    return getFallbackResponse();
  } catch (e) {
    return getFallbackResponse();
  }
}

// Hardcoded activity comments (fallback when AI is not enabled)
const ACTIVITY_COMMENTS = {
  coding: [
    "Ooh, coding time! You're so smart~ 💻",
    "*watches you type* So many words!",
    "Bug hunting? I believe in you!",
    "That code looks cool... I think?",
    "You've been coding a while! Don't forget to rest~",
  ],
  browsing: [
    "Find anything interesting? 👀",
    "*peeks at screen* Whatcha looking at?",
    "Browsing time~ Don't fall into a rabbit hole!",
    "Ooh, research mode activated!",
  ],
  gaming: [
    "Game time! Have fun! 🎮",
    "*cheers you on* You got this!",
    "Ooh, can I watch? 👀",
    "Win it for me~!",
    "Nice! Gaming break!",
  ],
  creative: [
    "Making something pretty? 🎨",
    "*watches in awe* So creative!",
    "Artist mode! I love it~",
    "Ooh, what are you designing?",
  ],
  communication: [
    "Chatting with friends? Say hi for me! 💬",
    "*waves* Tell them I said hi~",
    "Social time! Don't forget about me though 🥺",
  ],
  productivity: [
    "Working hard! You're doing great 📝",
    "*quietly supports you* Go go go~",
    "Productive mode! I'll be quiet... mostly.",
    "Documents! Important stuff happening!",
  ],
  media: [
    "Ooh, music time! 🎵",
    "*vibes along* Good taste~",
    "Watching something fun?",
    "Entertainment break! You deserve it~",
  ],
  idle: [
    "Hey, you still there? 👋",
    "Taking a break? Remember to stretch!",
    "*pokes* Don't forget about me~",
    "It's been quiet... everything okay?",
    "Break time! Drink some water 💧",
  ],
};

/**
 * Generate an activity-based comment.
 * Uses AI if enabled, otherwise returns a hardcoded comment.
 * @param {object} activity - { processName, windowTitle, category, durationMinutes }
 * @param {object} petContext - { species, name, level, mood, happiness, energy }
 * @returns {Promise<string|null>} Activity comment or null
 */
export async function generateActivityComment(activity, petContext) {
  if (!activity) return null;

  const settings = getAISettings();

  // Try AI-generated comment if enabled
  if (settings.useAIForAutoChat && settings.baseUrl) {
    try {
      const systemPrompt = buildSystemPrompt(petContext, activity);

      let userPrompt = '';
      if (activity.category === 'coding') {
        if (activity.windowTitle && (activity.windowTitle.toLowerCase().includes('error') || activity.windowTitle.toLowerCase().includes('failed'))) {
          userPrompt = "The user seems to have an error in their code. Offer to help debug in a cute, short way.";
        } else {
          userPrompt = "Comment on the user's coding session. Be supportive and brief.";
        }
      } else if (activity.category === 'browsing') {
        if (activity.windowTitle && activity.windowTitle.toLowerCase().includes('stack overflow')) {
          userPrompt = "The user is researching on Stack Overflow. Offer to help explain in a cute way.";
        } else {
          userPrompt = "Comment on the user browsing the web. Be curious and brief.";
        }
      } else if (activity.category === 'idle') {
        userPrompt = `The user has been idle for ${activity.durationMinutes || 5}+ minutes. Say something encouraging about taking a break.`;
      } else if (activity.category === 'gaming') {
        userPrompt = "The user is playing a game. Cheer them on briefly!";
      } else {
        userPrompt = `The user switched to ${activity.category}. Make a brief, relevant comment.`;
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const reply = await aiChatFetch(settings, messages, 40, 0.85);
      if (reply) {
        console.log('[PetDesk AI] Activity comment generated successfully');
        return reply;
      }
    } catch (e) {
      console.log('[PetDesk AI] Activity comment failed:', e.message);
      // Fall through to hardcoded
    }
  }

  // Fallback: hardcoded comments
  const category = activity.category || 'idle';
  const comments = ACTIVITY_COMMENTS[category] || ACTIVITY_COMMENTS.idle;
  return comments[Math.floor(Math.random() * comments.length)];
}
