import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PetSprite from './PetSprite';
import sprites from '../data/sprites';
import evolvedSprites from '../data/evolvedSprites';

/**
 * Full-screen evolution cutscene animation.
 * Shows old sprite → flash → new sprite with particles and text.
 */
function EvolutionAnimation({ oldSpriteKey, newSpriteKey, evolutionName, onComplete }) {
  const [phase, setPhase] = useState('glow'); // glow → flash → reveal → celebrate
  const [particles, setParticles] = useState([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const oldSprite = sprites[oldSpriteKey] || evolvedSprites[oldSpriteKey];
  const newSprite = evolvedSprites[newSpriteKey] || sprites[newSpriteKey];

  // Phase progression
  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setPhase('flash'), 1800));
    timers.push(setTimeout(() => setPhase('reveal'), 2300));
    timers.push(setTimeout(() => setPhase('celebrate'), 2800));
    timers.push(setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 7000));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Generate swirling particles
  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      pts.push({
        id: i,
        angle: (i / 24) * Math.PI * 2,
        radius: 60 + Math.random() * 40,
        size: 3 + Math.random() * 5,
        color: ['#ffd700', '#7c3aed', '#60a5fa', '#f472b6', '#34d399', '#fbbf24'][i % 6],
        speed: 0.8 + Math.random() * 0.6,
        delay: Math.random() * 0.5,
      });
    }
    setParticles(pts);
  }, []);

  // Generate confetti for celebrate phase
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#ffd700', '#ef4444', '#3b82f6', '#10b981', '#f472b6', '#8b5cf6'][i % 6],
    delay: Math.random() * 0.8,
    size: 4 + Math.random() * 6,
  }));

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onComplete}
      style={{ cursor: 'pointer' }}
    >
      {/* Dark backdrop */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.5 }}
      />

      {/* Swirling particles */}
      {(phase === 'glow' || phase === 'flash') && particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{
            x: Math.cos(p.angle) * p.radius * 2,
            y: Math.sin(p.angle) * p.radius * 2,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: [
              Math.cos(p.angle) * p.radius * 2,
              Math.cos(p.angle + Math.PI) * p.radius * 0.5,
              0,
            ],
            y: [
              Math.sin(p.angle) * p.radius * 2,
              Math.sin(p.angle + Math.PI) * p.radius * 0.5,
              0,
            ],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.8,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Old sprite with glow */}
      <AnimatePresence>
        {(phase === 'glow') && (
          <motion.div
            className="relative z-10"
            initial={{ scale: 1, opacity: 1 }}
            animate={{
              scale: [1, 1.1, 1, 1.1],
              opacity: 1,
            }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%)',
                transform: 'scale(2.5)',
              }}
              animate={{
                scale: [2, 2.8, 2, 2.8],
                opacity: [0.4, 0.8, 0.4, 0.8],
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            {oldSprite && <PetSprite sprite={oldSprite} scale={2} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* White flash */}
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div
            className="absolute inset-0 bg-white z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, times: [0, 0.3, 0.6, 1] }}
          />
        )}
      </AnimatePresence>

      {/* New sprite reveal */}
      <AnimatePresence>
        {(phase === 'reveal' || phase === 'celebrate') && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Glow behind new sprite */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)',
                top: -40,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {newSprite && <PetSprite sprite={newSprite} scale={2.5} />}

            {/* Evolution name text */}
            <motion.div
              className="text-center mt-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-yellow-400 text-xs font-medium tracking-wider uppercase mb-1">
                Evolved into
              </p>
              <p className="text-white text-xl font-bold tracking-wide">
                {evolutionName}!
              </p>
            </motion.div>

            {/* Click to dismiss hint */}
            <motion.p
              className="text-gray-500 text-xs mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Click to continue
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti burst */}
      {phase === 'celebrate' && confetti.map((c) => (
        <motion.div
          key={`confetti-${c.id}`}
          className="absolute z-30"
          style={{
            left: `${c.x}%`,
            top: '50%',
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{ y: 0, opacity: 1, rotate: 0 }}
          animate={{
            y: [0, -200 - Math.random() * 100, 400],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [1, 1, 0],
            rotate: [0, 360 + Math.random() * 360],
          }}
          transition={{
            duration: 2.5,
            delay: c.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}

export default EvolutionAnimation;
