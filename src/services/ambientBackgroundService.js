/**
 * Ambient Background Service
 * Manages time-based, weather-based, and seasonal ambient effects.
 */

const AMBIENT_SETTINGS_KEY = 'petdesk_ambient_settings';

// --- Time of Day ---

export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 22) return 'dusk';
  return 'night';
}

export function getTimeGradient() {
  const time = getTimeOfDay();
  const gradients = {
    dawn: 'linear-gradient(180deg, rgba(255,140,50,0.12) 0%, rgba(255,100,80,0.08) 50%, rgba(30,20,60,0.05) 100%)',
    morning: 'linear-gradient(180deg, rgba(255,200,100,0.08) 0%, rgba(135,206,235,0.06) 100%)',
    afternoon: 'linear-gradient(180deg, rgba(135,206,250,0.06) 0%, rgba(255,255,200,0.04) 100%)',
    evening: 'linear-gradient(180deg, rgba(180,100,200,0.10) 0%, rgba(255,100,50,0.08) 50%, rgba(30,20,80,0.06) 100%)',
    dusk: 'linear-gradient(180deg, rgba(100,50,150,0.12) 0%, rgba(200,80,100,0.08) 50%, rgba(20,10,40,0.06) 100%)',
    night: 'linear-gradient(180deg, rgba(10,10,40,0.15) 0%, rgba(20,20,60,0.10) 50%, rgba(5,5,20,0.08) 100%)',
  };
  return gradients[time] || gradients.night;
}

// --- Season ---

export function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

// --- Particle Configs ---

export function getParticleConfig() {
  const time = getTimeOfDay();
  const season = getCurrentSeason();
  const weather = getCurrentWeather();

  // Weather takes priority
  if (weather === 'rainy' || weather === 'stormy') {
    return {
      type: 'rain',
      count: weather === 'stormy' ? 25 : 15,
      color: 'rgba(150, 200, 255, 0.4)',
      speed: weather === 'stormy' ? 'fast' : 'medium',
    };
  }

  if (weather === 'snowy') {
    return {
      type: 'snow',
      count: 20,
      color: 'rgba(255, 255, 255, 0.6)',
      speed: 'slow',
    };
  }

  // Time-based
  if (time === 'night' || time === 'dusk') {
    return {
      type: 'stars',
      count: 25,
      color: 'rgba(255, 255, 255, 0.5)',
      speed: 'very-slow',
    };
  }

  if (time === 'evening') {
    return {
      type: 'fireflies',
      count: 12,
      color: 'rgba(255, 230, 100, 0.6)',
      speed: 'slow',
    };
  }

  // Season-based for daytime
  if (season === 'spring') {
    return {
      type: 'sakura',
      count: 15,
      color: 'rgba(255, 180, 200, 0.5)',
      speed: 'slow',
    };
  }

  if (season === 'autumn') {
    return {
      type: 'leaves',
      count: 12,
      color: 'rgba(200, 120, 50, 0.5)',
      speed: 'medium',
    };
  }

  if (season === 'summer') {
    return {
      type: 'sunrays',
      count: 5,
      color: 'rgba(255, 220, 100, 0.15)',
      speed: 'very-slow',
    };
  }

  if (season === 'winter') {
    return {
      type: 'snow',
      count: 10,
      color: 'rgba(255, 255, 255, 0.4)',
      speed: 'slow',
    };
  }

  return {
    type: 'none',
    count: 0,
    color: 'transparent',
    speed: 'slow',
  };
}

// --- Weather integration ---

function getCurrentWeather() {
  try {
    const stored = localStorage.getItem('petdesk_weather');
    if (stored) {
      const data = JSON.parse(stored);
      return data.weather || 'sunny';
    }
  } catch (e) { /* ignore */ }
  return 'sunny';
}

// --- Settings ---

export function getAmbientSettings() {
  try {
    const stored = localStorage.getItem(AMBIENT_SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    enabled: true,
    showGradient: true,
    showParticles: true,
    particleIntensity: 1.0, // 0.5 = half, 1.0 = normal, 1.5 = more
  };
}

export function saveAmbientSettings(settings) {
  localStorage.setItem(AMBIENT_SETTINGS_KEY, JSON.stringify(settings));
}

export function toggleAmbient() {
  const settings = getAmbientSettings();
  settings.enabled = !settings.enabled;
  saveAmbientSettings(settings);
  return settings.enabled;
}

// --- CSS Animation Keyframes (to be injected) ---

export function getParticleKeyframes(type) {
  switch (type) {
    case 'rain':
      return `
        @keyframes rain-fall {
          0% { transform: translateY(-20px) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) translateX(-20px); opacity: 0; }
        }
      `;
    case 'snow':
      return `
        @keyframes snow-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(50vh) translateX(20px) rotate(180deg); }
          90% { opacity: 0.8; }
          100% { transform: translateY(100vh) translateX(-10px) rotate(360deg); opacity: 0; }
        }
      `;
    case 'sakura':
      return `
        @keyframes sakura-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          25% { transform: translateY(25vh) translateX(30px) rotate(90deg); }
          50% { transform: translateY(50vh) translateX(-10px) rotate(180deg); }
          75% { transform: translateY(75vh) translateX(20px) rotate(270deg); }
          100% { transform: translateY(100vh) translateX(0) rotate(360deg); opacity: 0; }
        }
      `;
    case 'leaves':
      return `
        @keyframes leaf-fall {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg) scale(1); opacity: 0; }
          10% { opacity: 1; }
          30% { transform: translateY(30vh) translateX(40px) rotate(120deg) scale(0.9); }
          60% { transform: translateY(60vh) translateX(-20px) rotate(240deg) scale(0.8); }
          100% { transform: translateY(100vh) translateX(10px) rotate(360deg) scale(0.7); opacity: 0; }
        }
      `;
    case 'fireflies':
      return `
        @keyframes firefly-float {
          0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          25% { transform: translate(20px, -15px) scale(1.2); opacity: 0.8; }
          50% { transform: translate(-10px, -30px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(15px, -10px) scale(1.1); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
        }
      `;
    case 'stars':
      return `
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `;
    case 'sunrays':
      return `
        @keyframes sunray-pulse {
          0%, 100% { opacity: 0.05; transform: scaleY(1); }
          50% { opacity: 0.15; transform: scaleY(1.1); }
        }
      `;
    default:
      return '';
  }
}

export function getParticleAnimationDuration(speed) {
  switch (speed) {
    case 'very-slow': return { min: 8, max: 15 };
    case 'slow': return { min: 5, max: 10 };
    case 'medium': return { min: 3, max: 6 };
    case 'fast': return { min: 1, max: 3 };
    default: return { min: 4, max: 8 };
  }
}

export function getAnimationName(type) {
  const map = {
    rain: 'rain-fall',
    snow: 'snow-fall',
    sakura: 'sakura-fall',
    leaves: 'leaf-fall',
    fireflies: 'firefly-float',
    stars: 'star-twinkle',
    sunrays: 'sunray-pulse',
  };
  return map[type] || 'none';
}
