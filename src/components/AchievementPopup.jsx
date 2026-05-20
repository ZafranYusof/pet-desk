import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rarityConfig = {
  common: { border: 'border-gray-400/60', glow: 'rgba(156,163,175,0.2)', label: 'Common', color: 'text-gray-300' },
  rare: { border: 'border-blue-400/70', glow: 'rgba(96,165,250,0.3)', label: 'Rare', color: 'text-blue-300' },
  epic: { border: 'border-purple-400/70', glow: 'rgba(192,132,252,0.4)', label: 'Epic', color: 'text-purple-300' },
  legendary: { border: 'border-yellow-400/80', glow: 'rgba(251,191,36,0.5)', label: 'Legendary', color: 'text-yellow-300' },
};

function ConfettiParticle({ delay, index }) {
  const colors = ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-red-400'];
  const color = colors[index % colors.length];
  const startX = -20 + Math.random() * 40;
  const endX = startX + (Math.random() - 0.5) * 80;
  const endY = 60 + Math.random() * 40;
  const rotation = Math.random() * 720 - 360;
  const size = 3 + Math.random() * 4;

  return (
    <motion.div
      className={`absolute ${color} rounded-sm`}
      style={{ width: size, height: size, left: '50%', top: '40%' }}
      initial={{ x: startX, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ x: endX, y: endY, opacity: 0, scale: 0.5, rotate: rotation }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

function AchievementPopup({ achievement, onDismiss }) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismissRef.current();
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  if (!achievement) return null;

  const rarity = achievement.rarity || 'common';
  const config = rarityConfig[rarity] || rarityConfig.common;
  const showConfetti = rarity === 'epic' || rarity === 'legendary';

  return (
    <motion.div
      className="fixed top-4 left-1/2 z-[100] w-[240px] pointer-events-none"
      style={{ x: '-50%' }}
      initial={{ opacity: 0, y: -60, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 350, damping: 20 }}
    >
      <div
        className={`relative bg-gray-900/95 backdrop-blur-2xl rounded-2xl border-2 ${config.border} overflow-hidden`}
        style={{ boxShadow: `0 8px 32px ${config.glow}, 0 0 0 1px rgba(255,255,255,0.05)` }}
      >
        {/* Confetti for epic/legendary */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticle key={i} delay={i * 0.04} index={i} />
            ))}
          </div>
        )}

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 30%, ${config.glow} 50%, transparent 70%)`,
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['-200% center', '200% center'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative p-4 flex flex-col items-center gap-1.5">
          {/* Rarity label */}
          <span className={`text-[9px] font-bold uppercase tracking-widest ${config.color}`}>
            {config.label} Achievement
          </span>

          {/* Icon with bounce */}
          <motion.span
            className="text-3xl"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 500, damping: 15 }}
          >
            {achievement.icon}
          </motion.span>

          {/* Name */}
          <motion.span
            className="text-sm font-bold text-white"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {achievement.name}
          </motion.span>

          {/* Description */}
          <span className="text-[10px] text-gray-400 text-center leading-relaxed">
            {achievement.description}
          </span>

          {/* Auto-dismiss progress bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4.5, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default AchievementPopup;
