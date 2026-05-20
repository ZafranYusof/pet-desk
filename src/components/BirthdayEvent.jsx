import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Confetti particle component
function Confetti({ count = 50 }) {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0'];
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          animate={{
            y: [0, window.innerHeight + 50],
            x: [0, (Math.random() - 0.5) * 100],
            rotate: [p.rotation, p.rotation + 720],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeIn',
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Firework burst
function Fireworks({ active }) {
  if (!active) return null;

  const bursts = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 40,
    delay: i * 0.4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {bursts.map((burst) => (
        <motion.div
          key={burst.id}
          className="absolute"
          style={{ left: `${burst.x}%`, top: `${burst.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, delay: burst.delay, ease: 'easeOut' }}
        >
          {Array.from({ length: 8 }, (_, j) => (
            <motion.div
              key={j}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][j % 5],
              }}
              animate={{
                x: [0, Math.cos((j * Math.PI) / 4) * 40],
                y: [0, Math.sin((j * Math.PI) / 4) * 40],
                opacity: [1, 0],
                scale: [1, 0.3],
              }}
              transition={{ duration: 0.8, delay: burst.delay + 0.2, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function BirthdayEvent({ petName, petAge, rewards, onCelebrate, onDismiss }) {
  const [showFireworks, setShowFireworks] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const dismissTimerRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Auto-dismiss after 10s
  useEffect(() => {
    dismissTimerRef.current = setTimeout(() => {
      if (!celebrated) {
        onDismissRef.current();
      }
    }, 10000);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [celebrated]);

  function handleCelebrate() {
    setCelebrated(true);
    setShowFireworks(true);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    onCelebrate();

    // Dismiss after fireworks
    setTimeout(() => {
      onDismiss();
    }, 4000);
  }

  const years = Math.max(1, Math.floor((petAge?.days || 365) / 365));

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => !celebrated && onDismiss()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Confetti */}
      <Confetti count={60} />

      {/* Fireworks */}
      <Fireworks active={showFireworks} />

      {/* Card */}
      <motion.div
        className="relative z-10 bg-gray-900/95 border border-yellow-500/50 rounded-3xl p-8 max-w-[320px] w-full text-center shadow-2xl"
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.7, y: 30 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Party hat emoji */}
        <motion.div
          className="text-5xl mb-2"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          🎂
        </motion.div>

        {/* Header */}
        <motion.h2
          className="text-2xl font-bold text-yellow-300 mb-2"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Happy Birthday!
        </motion.h2>

        {/* Pet name and age */}
        <p className="text-gray-300 text-sm mb-4">
          <span className="text-white font-semibold">{petName || 'Your pet'}</span> is now{' '}
          <span className="text-yellow-300 font-bold">{years} year{years > 1 ? 's' : ''}</span> old!
        </p>

        {/* Rewards */}
        <div className="bg-gray-800/80 rounded-xl p-3 mb-4 text-left space-y-1.5">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Birthday Rewards</p>
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <span>⭐</span>
            <span>+{rewards.xp} XP</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-200">
            <span>✨</span>
            <span>Golden Apple x{rewards.foodCount}</span>
          </div>
        </div>

        {/* Celebrate button */}
        {!celebrated ? (
          <motion.button
            className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl text-sm hover:from-yellow-400 hover:to-orange-400 transition-all"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCelebrate}
          >
            🎉 Celebrate!
          </motion.button>
        ) : (
          <motion.p
            className="text-yellow-300 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🎆 Happy Birthday! 🎆
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default BirthdayEvent;
