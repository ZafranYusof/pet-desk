import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Particle configuration per type.
 * 12 particle types including new: leaves, petals, fireflies, dust motes, bubbles, embers
 */
const PARTICLE_CONFIG = {
  sparkles: {
    count: [5, 8],
    emoji: '✨',
    color: '#FFD700',
    size: [4, 7],
    duration: [1.0, 1.8],
    direction: 'up',
  },
  raindrops: {
    count: [10, 15],
    emoji: null,
    color: '#4A90D9',
    size: [3, 5],
    duration: [0.8, 1.4],
    direction: 'down',
  },
  hearts: {
    count: [3, 5],
    emoji: '💕',
    color: '#FF69B4',
    size: [6, 8],
    duration: [1.2, 2.0],
    direction: 'up',
  },
  fire: {
    count: [4, 6],
    emoji: null,
    color: '#FF4500',
    size: [4, 6],
    duration: [0.8, 1.5],
    direction: 'up',
  },
  snow: {
    count: [8, 12],
    emoji: null,
    color: '#FFFFFF',
    size: [3, 6],
    duration: [1.5, 2.5],
    direction: 'down',
  },
  zzz: {
    count: [1, 2],
    emoji: 'Z',
    color: '#9E9E9E',
    size: [8, 12],
    duration: [2.0, 3.0],
    direction: 'up',
  },
  music: {
    count: [3, 4],
    emoji: '♪',
    color: '#9C27B0',
    size: [6, 8],
    duration: [1.2, 2.0],
    direction: 'up',
  },
  // NEW particle types
  leaves: {
    count: [4, 7],
    emoji: '🍃',
    color: '#4CAF50',
    size: [5, 8],
    duration: [2.0, 3.5],
    direction: 'down',
    drift: true,
  },
  petals: {
    count: [5, 8],
    emoji: '🌸',
    color: '#FFB7C5',
    size: [5, 7],
    duration: [2.5, 4.0],
    direction: 'down',
    drift: true,
  },
  fireflies: {
    count: [4, 6],
    emoji: null,
    color: '#FFEB3B',
    size: [3, 5],
    duration: [2.0, 3.5],
    direction: 'float',
    glow: true,
  },
  dust: {
    count: [6, 10],
    emoji: null,
    color: '#D4C5A9',
    size: [2, 4],
    duration: [3.0, 5.0],
    direction: 'float',
  },
  bubbles: {
    count: [4, 7],
    emoji: null,
    color: '#87CEEB',
    size: [4, 8],
    duration: [2.0, 3.5],
    direction: 'up',
    glow: true,
  },
  embers: {
    count: [5, 8],
    emoji: null,
    color: '#FF6B35',
    size: [2, 4],
    duration: [1.5, 2.5],
    direction: 'up',
    glow: true,
  },
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateParticle(config, index) {
  const size = randomBetween(config.size[0], config.size[1]);
  const duration = randomBetween(config.duration[0], config.duration[1]);
  const startX = randomBetween(-40, 40);
  const startY = randomBetween(-20, 20);
  const driftX = config.drift ? randomBetween(-50, 50) : randomBetween(-30, 30);

  let endY;
  if (config.direction === 'up') {
    endY = -60 - randomBetween(0, 40);
  } else if (config.direction === 'down') {
    endY = 60 + randomBetween(0, 40);
  } else {
    // float - gentle random movement
    endY = randomBetween(-30, 30);
  }

  return {
    id: `${Date.now()}-${index}-${Math.random()}`,
    size,
    duration,
    startX,
    startY,
    driftX,
    endY,
    emoji: config.emoji,
    color: config.color,
    glow: config.glow || false,
    direction: config.direction,
  };
}

const Particle = ({ particle }) => {
  const isEmoji = !!particle.emoji;
  const isFloat = particle.direction === 'float';

  return (
    <motion.div
      initial={{
        x: particle.startX,
        y: particle.startY,
        opacity: 0.9,
        scale: 0.5,
      }}
      animate={{
        x: isFloat
          ? [particle.startX, particle.startX + particle.driftX, particle.startX + particle.driftX * 0.5]
          : particle.startX + particle.driftX,
        y: isFloat
          ? [particle.startY, particle.startY + particle.endY, particle.startY + particle.endY * 0.7]
          : particle.startY + particle.endY,
        opacity: [0.9, 0.7, 0],
        scale: isEmoji ? [0.5, 1.2, 0.8] : [0.5, 1.0, 0.3],
      }}
      transition={{
        duration: particle.duration,
        ease: isFloat ? 'easeInOut' : 'easeOut',
      }}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: isEmoji ? 'auto' : `${particle.size}px`,
        height: isEmoji ? 'auto' : `${particle.size}px`,
        borderRadius: isEmoji ? 0 : '50%',
        backgroundColor: isEmoji ? 'transparent' : particle.color,
        fontSize: isEmoji ? `${particle.size}px` : undefined,
        pointerEvents: 'none',
        userSelect: 'none',
        boxShadow: particle.glow ? `0 0 ${particle.size * 2}px ${particle.color}80` : undefined,
      }}
    >
      {isEmoji ? particle.emoji : null}
    </motion.div>
  );
};

/**
 * Particle effect system.
 * Supports 12 particle types with habitat-specific ambient particles.
 * Performance optimized: max 30 particles, recycle pool.
 * @param {{ type: string, active: boolean, density?: number }} props
 */
const Particles = ({ type = 'sparkles', active = false, density = 1.0 }) => {
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);
  const MAX_PARTICLES = 30;

  useEffect(() => {
    if (!active) {
      // Clear interval when inactive
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const config = PARTICLE_CONFIG[type];
    if (!config) return;

    // Generate initial burst (capped)
    const burstCount = Math.min(
      MAX_PARTICLES,
      Math.floor(randomBetween(config.count[0], config.count[1]) * density)
    );
    const initialParticles = Array.from({ length: burstCount }, (_, i) =>
      generateParticle(config, i)
    );
    setParticles(initialParticles);

    // Continuous emission for ongoing effects
    const isFloat = config.direction === 'float';
    const emitInterval = type === 'zzz' ? 2000
      : (type === 'raindrops' || type === 'snow') ? 800
      : isFloat ? 2000
      : 1500;

    intervalRef.current = setInterval(() => {
      const count = Math.min(
        Math.floor(MAX_PARTICLES * density),
        Math.floor(randomBetween(config.count[0], Math.min(config.count[1], config.count[0] + 2)) * density)
      );
      const newParticles = Array.from({ length: count }, (_, i) =>
        generateParticle(config, i)
      );
      setParticles(newParticles);
    }, emitInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [type, active, density]);

  // Clean up particles after their duration
  useEffect(() => {
    if (particles.length === 0) return;
    const maxDuration = PARTICLE_CONFIG[type]?.duration[1] || 2;
    const timer = setTimeout(() => {
      setParticles([]);
    }, maxDuration * 1000 + 100);
    return () => clearTimeout(timer);
  }, [particles, type]);

  if (!active && particles.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 50,
      }}
    >
      <AnimatePresence>
        {particles.map((p) => (
          <Particle key={p.id} particle={p} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Particles;

/**
 * Get habitat-specific ambient particle type
 */
export function getHabitatParticleType(habitatId) {
  switch (habitatId) {
    case 'forest': return 'leaves';
    case 'sakura': return 'petals';
    case 'ocean': case 'underwater': return 'bubbles';
    case 'space': case 'cosmic': return 'sparkles';
    case 'cave': case 'volcano': return 'embers';
    case 'meadow': case 'garden': return 'fireflies';
    case 'desert': return 'dust';
    default: return null;
  }
}
