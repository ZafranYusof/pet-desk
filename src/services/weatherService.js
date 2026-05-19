/**
 * Weather simulation service.
 * Simulates weather based on time of day + randomness.
 * No real API - keeps it offline. Weather persists for 2 hours via localStorage.
 */

import { getTimeOfDay } from './timeService';

const WEATHER_KEY = 'petdesk_weather';
const WEATHER_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms

const WEATHER_DISTRIBUTIONS = {
  morning: [
    { weather: 'sunny', weight: 60 },
    { weather: 'cloudy', weight: 30 },
    { weather: 'rainy', weight: 10 },
  ],
  afternoon: [
    { weather: 'sunny', weight: 50 },
    { weather: 'cloudy', weight: 30 },
    { weather: 'rainy', weight: 15 },
    { weather: 'stormy', weight: 5 },
  ],
  evening: [
    { weather: 'cloudy', weight: 40 },
    { weather: 'rainy', weight: 30 },
    { weather: 'sunny', weight: 20 },
    { weather: 'stormy', weight: 10 },
  ],
  night: [
    { weather: 'cloudy', weight: 50 },
    { weather: 'sunny', weight: 30 }, // clear skies
    { weather: 'rainy', weight: 15 },
    { weather: 'snowy', weight: 5 },
  ],
};

/**
 * Pick a random weather based on weighted distribution.
 * @param {Array<{weather: string, weight: number}>} distribution
 * @returns {string}
 */
function pickWeather(distribution) {
  const totalWeight = distribution.reduce((sum, d) => sum + d.weight, 0);
  let random = Math.random() * totalWeight;
  for (const entry of distribution) {
    random -= entry.weight;
    if (random <= 0) return entry.weather;
  }
  return distribution[0].weather;
}

/**
 * Load persisted weather from localStorage.
 * @returns {{ weather: string, timestamp: number } | null}
 */
function loadWeather() {
  try {
    const stored = localStorage.getItem(WEATHER_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Save weather to localStorage.
 * @param {string} weather
 */
function saveWeather(weather) {
  const data = { weather, timestamp: Date.now() };
  try {
    localStorage.setItem(WEATHER_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Get current weather. Changes every 2 hours.
 * @returns {'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'}
 */
export function getWeather() {
  const stored = loadWeather();
  const now = Date.now();

  // If we have a valid stored weather that hasn't expired, use it
  if (stored && (now - stored.timestamp) < WEATHER_DURATION) {
    return stored.weather;
  }

  // Generate new weather based on current time of day
  const timeOfDay = getTimeOfDay();
  const distribution = WEATHER_DISTRIBUTIONS[timeOfDay] || WEATHER_DISTRIBUTIONS.afternoon;
  const newWeather = pickWeather(distribution);
  saveWeather(newWeather);
  return newWeather;
}

/**
 * Get weather mood effect on pet.
 * @param {string} weather
 * @returns {{ happinessModifier: number, description: string }}
 */
export function getWeatherMoodEffect(weather) {
  switch (weather) {
    case 'sunny':
      return { happinessModifier: 0.5, description: 'Pet is happy!' };
    case 'cloudy':
      return { happinessModifier: 0, description: 'Pet is neutral' };
    case 'rainy':
      return { happinessModifier: -0.2, description: 'Pet is a bit sad' };
    case 'stormy':
      return { happinessModifier: -0.5, description: 'Pet is scared!' };
    case 'snowy':
      return { happinessModifier: 0.3, description: 'Pet is excited!' };
    default:
      return { happinessModifier: 0, description: '' };
  }
}

/**
 * Get weather emoji for display.
 * @param {string} weather
 * @returns {string}
 */
export function getWeatherEmoji(weather) {
  switch (weather) {
    case 'sunny': return '☀️';
    case 'cloudy': return '🌤️';
    case 'rainy': return '🌧️';
    case 'stormy': return '⛈️';
    case 'snowy': return '❄️';
    default: return '☀️';
  }
}
