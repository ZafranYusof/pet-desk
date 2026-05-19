import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

function AchievementPopup({ achievement, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!achievement) return null;

  return (
    <motion.div
      className="fixed top-4 left-1/2 z-[100] w-[220px] pointer-events-none"
      style={{ x: '-50%' }}
      initial={{ opacity: 0, y: -40, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="relative bg-gray-900/95 backdrop-blur-md rounded-xl border-2 border-yellow-500/70 shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-yellow-400/5 animate-pulse" />

        <div className="relative p-3 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
            Achievement Unlocked!
          </span>
          <motion.span
            className="text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          >
            {achievement.icon}
          </motion.span>
          <span className="text-sm font-medium text-yellow-300">{achievement.name}</span>
          <span className="text-[10px] text-gray-400 text-center">{achievement.description}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default AchievementPopup;
