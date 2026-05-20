/**
 * Weather service.
 * Supports both simulated weather AND real weather via wttr.in (no API key needed).
 * Settings toggle between real and simulated. Fallback to simulated if fetch fails.
 */

import { getTimeOfDay } from './timeService';

const WEATHER_KEY = 'petdesk_weather';
const WEATHER_SETTINGS_KEY = 'petdesk_weather_settings';
const REAL_WEATHER_KEY = 'petdesk_real_weather';
const WEATHER_DURATION = 2 * 60 * 60 * 1000; // 2 hours in ms
const REAL_WEATHER_FETCH_INTERVAL = 30 * 60 * 1000; // 30 minutes

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
 * Get weather settings
 */
export function getWeatherSettings() {
  try {
    const stored = localStorage.getItem(WEATHER_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { useRealWeather: false, location: '' };
}

/**
 * Save weather settings
 */
export function saveWeatherSettings(settings) {
  try {
    localStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

/**
 * Map real weather condition codes to our weather states
 */
function mapRealWeatherToState(code, description) {
  const desc = (description || '').toLowerCase();
  const codeNum = parseInt(code, 10);

  // WMO weather codes from wttr.in
  if (codeNum === 113) return 'sunny'; // Clear
  if (codeNum >= 116 && codeNum <= 122) return 'cloudy'; // Partly cloudy, Cloudy, Overcast
  if (codeNum >= 176 && codeNum <= 263) return 'rainy'; // Light rain, drizzle
  if (codeNum >= 266 && codeNum <= 356) return 'rainy'; // Rain
  if (codeNum >= 359 && codeNum <= 395) {
    if (desc.includes('snow') || desc.includes('blizzard') || desc.includes('sleet') || desc.includes('ice')) return 'snowy';
    if (desc.includes('thunder')) return 'stormy';
    return 'rainy';
  }
  if (desc.includes('thunder') || desc.includes('storm')) return 'stormy';
  if (desc.includes('snow') || desc.includes('ice') || desc.includes('frost') || desc.includes('blizzard')) return 'snowy';
  if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) return 'rainy';
  if (desc.includes('cloud') || desc.includes('overcast') || desc.includes('mist') || desc.includes('fog')) return 'cloudy';
  return 'sunny';
}

/**
 * Fetch real weather from wttr.in (no API key needed)
 */
export async function fetchRealWeather(location) {
  try {
    const loc = location || ''; // Empty = auto-detect by IP
    const url = `https://wttr.in/${encodeURIComponent(loc)}?format=j1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const current = data.current_condition?.[0];
    if (!current) throw new Error('No current condition');

    const code = current.weatherCode;
    const description = current.weatherDesc?.[0]?.value || '';
    const tempC = parseInt(current.temp_C, 10);
    const feelsLikeC = parseInt(current.FeelsLikeC, 10);
    const humidity = parseInt(current.humidity, 10);
    const windKmph = parseInt(current.windspeedKmph, 10);

    const mappedWeather = mapRealWeatherToState(code, description);

    const realWeatherData = {
      weather: mappedWeather,
      description,
      tempC,
      feelsLikeC,
      humidity,
      windKmph,
      code,
      location: data.nearest_area?.[0]?.areaName?.[0]?.value || loc || 'Auto',
      timestamp: Date.now(),
    };

    // Cache it
    try {
      localStorage.setItem(REAL_WEATHER_KEY, JSON.stringify(realWeatherData));
    } catch { /* ignore */ }

    return realWeatherData;
  } catch (e) {
    console.warn('Failed to fetch real weather:', e.message);
    return null;
  }
}

/**
 * Get cached real weather data
 */
export function getCachedRealWeather() {
  try {
    const stored = localStorage.getItem(REAL_WEATHER_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Valid if fetched within last 30 minutes
      if (Date.now() - data.timestamp < REAL_WEATHER_FETCH_INTERVAL) {
        return data;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Get current weather. Uses real weather if enabled, otherwise simulated.
 * @returns {'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'}
 */
export function getWeather() {
  const settings = getWeatherSettings();

  if (settings.useRealWeather) {
    const cached = getCachedRealWeather();
    if (cached) return cached.weather;
    // Fallback to simulated if no cached real weather
  }

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
