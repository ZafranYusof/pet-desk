import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Particle configuration per type.
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
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateParticle(config, index) {
  const size = randomBetween(config.size[0], config.size[1]);
  const duration = randomBetween(config.duration[0], config.duration[1]);
  const startX = randomBetween(-40, 40);
  const startY = randomBetween(-20, 20);
  const driftX = randomBetween(-30, 30);

  const endY = config.direction === 'up' ? -60 - randomBetween(0, 40) : 60 + randomBetween(0, 40);

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
  };
}

const Particle = ({ particle }) => {
  const isEmoji = !!particle.emoji;

  return (
    <motion.div
      initial={{
        x: particle.startX,
        y: particle.startY,
        opacity: 0.9,
        scale: 0.5,
      }}
      animate={{
        x: particle.startX + particle.driftX,
        y: particle.startY + particle.endY,
        opacity: 0,
        scale: isEmoji ? 1.2 : 0.8,
      }}
      transition={{
        duration: particle.duration,
        ease: 'easeOut',
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
      }}
    >
      {isEmoji ? particle.emoji : null}
    </motion.div>
  );
};

/**
 * Particle effect system.
 * @param {{ type: string, active: boolean, position?: { x: number, y: number } }} props
 */
const Particles = ({ type = 'sparkles', active = false }) => {
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);

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

    // Generate initial burst
    const burstCount = Math.floor(randomBetween(config.count[0], config.count[1]));
    const initialParticles = Array.from({ length: burstCount }, (_, i) =>
      generateParticle(config, i)
    );
    setParticles(initialParticles);

    // Continuous emission for ongoing effects
    const emitInterval = type === 'zzz' ? 2000 : type === 'raindrops' || type === 'snow' ? 800 : 1500;

    intervalRef.current = setInterval(() => {
      const count = Math.floor(randomBetween(config.count[0], Math.min(config.count[1], config.count[0] + 2)));
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
  }, [type, active]);

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
