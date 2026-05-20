import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  getTimeOfDay, getTimeGradient, getCurrentSeason, getParticleConfig,
  getAmbientSettings, getParticleKeyframes, getParticleAnimationDuration,
  getAnimationName
} from '../services/ambientBackgroundService';

/**
 * AmbientBackground - renders behind pet on transparent Electron window.
 * All elements are pointer-events: none so they don't interfere with desktop.
 * Uses CSS animations for performance (no JS animation loops).
 */
function AmbientBackground() {
  const [settings, setSettings] = useState(() => getAmbientSettings());
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
  const [gradient, setGradient] = useState(() => getTimeGradient());
  const [particleConfig, setParticleConfig] = useState(() => getParticleConfig());
  const styleRef = useRef(null);

  // Update time/weather every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
      setGradient(getTimeGradient());
      setParticleConfig(getParticleConfig());
      setSettings(getAmbientSettings());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Inject keyframe styles
  useEffect(() => {
    if (!particleConfig || particleConfig.type === 'none') return;

    const keyframes = getParticleKeyframes(particleConfig.type);
    if (!keyframes) return;

    // Create or update style element
    let styleEl = document.getElementById('ambient-keyframes');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'ambient-keyframes';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = keyframes;

    return () => {
      // Don't remove on cleanup - other instances might need it
    };
  }, [particleConfig]);

  // Generate particles with random positions and delays
  const particles = useMemo(() => {
    if (!particleConfig || particleConfig.type === 'none') return [];
    if (!settings.enabled || !settings.showParticles) return [];

    const count = Math.round(particleConfig.count * (settings.particleIntensity || 1));
    const clamped = Math.min(count, 30); // Max 30 particles
    const duration = getParticleAnimationDuration(particleConfig.speed);
    const animName = getAnimationName(particleConfig.type);

    return Array.from({ length: clamped }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * duration.max;
      const dur = duration.min + Math.random() * (duration.max - duration.min);
      const size = getParticleSize(particleConfig.type);

      return {
        id: i,
        style: {
          position: 'absolute',
          left: `${left}%`,
          top: particleConfig.type === 'fireflies' || particleConfig.type === 'stars'
            ? `${Math.random() * 80 + 10}%`
            : '-5%',
          width: `${size.w}px`,
          height: `${size.h}px`,
          backgroundColor: particleConfig.color,
          borderRadius: getBorderRadius(particleConfig.type),
          animation: `${animName} ${dur}s ${delay}s infinite`,
          animationTimingFunction: getTimingFunction(particleConfig.type),
          opacity: 0,
          pointerEvents: 'none',
          ...getExtraStyles(particleConfig.type),
        },
      };
    });
  }, [particleConfig, settings.enabled, settings.showParticles, settings.particleIntensity]);

  if (!settings.enabled) return null;

  return (
    <div
      className="fixed inset-0 z-[1] overflow-hidden"
      style={{ pointerEvents: 'none' }}
    >
      {/* Time-based gradient overlay */}
      {settings.showGradient && (
        <div
          className="absolute inset-0 transition-all duration-[5000ms]"
          style={{
            background: gradient,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Particles */}
      {particles.map((particle) => (
        <div key={particle.id} style={particle.style} />
      ))}
    </div>
  );
}

// --- Helper functions ---

function getParticleSize(type) {
  switch (type) {
    case 'rain': return { w: 2, h: 12 };
    case 'snow': return { w: 4, h: 4 };
    case 'sakura': return { w: 6, h: 6 };
    case 'leaves': return { w: 8, h: 5 };
    case 'fireflies': return { w: 4, h: 4 };
    case 'stars': return { w: 2, h: 2 };
    case 'sunrays': return { w: 3, h: 80 };
    default: return { w: 4, h: 4 };
  }
}

function getBorderRadius(type) {
  switch (type) {
    case 'rain': return '0 0 2px 2px';
    case 'snow': return '50%';
    case 'sakura': return '50% 0 50% 50%';
    case 'leaves': return '50% 0 50% 0';
    case 'fireflies': return '50%';
    case 'stars': return '50%';
    case 'sunrays': return '2px';
    default: return '50%';
  }
}

function getTimingFunction(type) {
  switch (type) {
    case 'rain': return 'linear';
    case 'snow': return 'ease-in-out';
    case 'sakura': return 'ease-in-out';
    case 'leaves': return 'ease-in-out';
    case 'fireflies': return 'ease-in-out';
    case 'stars': return 'ease-in-out';
    case 'sunrays': return 'ease-in-out';
    default: return 'linear';
  }
}

function getExtraStyles(type) {
  switch (type) {
    case 'fireflies':
      return {
        boxShadow: '0 0 6px 2px rgba(255, 230, 100, 0.4)',
      };
    case 'stars':
      return {
        boxShadow: '0 0 3px 1px rgba(255, 255, 255, 0.3)',
      };
    case 'sunrays':
      return {
        transformOrigin: 'top center',
        background: 'linear-gradient(180deg, rgba(255,220,100,0.15) 0%, transparent 100%)',
        backgroundColor: 'transparent',
      };
    case 'sakura':
      return {
        background: 'radial-gradient(ellipse, rgba(255,180,200,0.6) 0%, rgba(255,150,180,0.3) 100%)',
        backgroundColor: 'transparent',
      };
    case 'leaves':
      return {
        background: `hsl(${20 + Math.random() * 30}, 70%, 45%)`,
      };
    default:
      return {};
  }
}

export default AmbientBackground;
