import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOODS, getMoodState } from '../services/moodService';

const CORNERS = {
  'top-left': { top: 8, left: 8 },
  'top-right': { top: 8, right: 8 },
  'bottom-left': { bottom: 8, left: 8 },
  'bottom-right': { bottom: 8, right: 8 },
};

const MINI_SPRITES = {
  slime: '🟢',
  cat: '🐱',
  ghost: '👻',
};

const moodRingColors = {
  happy: '#fbbf24',
  content: '#a78bfa',
  hungry: '#f87171',
  tired: '#60a5fa',
  sad: '#93c5fd',
  excited: '#f472b6',
  neutral: '#a78bfa',
  sleepy: '#818cf8',
  calm: '#a78bfa',
};

function MiniPet({ petState, visible, onQuickFeed, onToggle, corner = 'bottom-right' }) {
  const [showActions, setShowActions] = useState(false);

  if (!visible) return null;

  const species = petState?.species || 'slime';
  const moodState = getMoodState();
  const mood = MOODS[moodState.currentMood] || MOODS.calm;
  const position = CORNERS[corner] || CORNERS['bottom-right'];
  const moodColor = moodRingColors[moodState.currentMood] || '#a78bfa';

  const happiness = petState?.happiness ?? 50;
  const energy = petState?.energy ?? 50;
  const hunger = petState?.hunger ?? 50;

  return (
    <motion.div
      className="fixed z-[60] select-none"
      style={position}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Quick actions popup */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            className="absolute bottom-full mb-3 right-0 bg-gray-900/95 backdrop-blur-2xl rounded-xl border border-white/10 shadow-2xl shadow-black/60 p-2.5 min-w-[130px]"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Mini stats with colored bars */}
            <div className="space-y-1.5 mb-2.5 px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] w-3">🍖</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${hunger}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[8px] text-gray-500 w-5 text-right font-mono">{Math.round(hunger)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] w-3">⚡</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${energy}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[8px] text-gray-500 w-5 text-right font-mono">{Math.round(energy)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] w-3">💛</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${happiness}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-[8px] text-gray-500 w-5 text-right font-mono">{Math.round(happiness)}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1.5">
              <motion.button
                className="flex-1 px-2 py-1.5 bg-green-500/15 border border-green-500/30 rounded-lg text-[10px] text-green-300 cursor-pointer hover:bg-green-500/25 transition-colors font-medium"
                onClick={() => { onQuickFeed?.(); setShowActions(false); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                🍖 Feed
              </motion.button>
              <motion.button
                className="flex-1 px-2 py-1.5 bg-red-500/15 border border-red-500/30 rounded-lg text-[10px] text-red-300 cursor-pointer hover:bg-red-500/25 transition-colors font-medium"
                onClick={() => { onToggle?.(); setShowActions(false); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
              >
                ✕ Hide
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini pet body with mood-colored ring */}
      <motion.button
        className="relative w-11 h-11 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 0 2px ${moodColor}50, 0 4px 16px rgba(0,0,0,0.4), 0 0 12px ${moodColor}20`,
        }}
        onClick={() => setShowActions(!showActions)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          y: [0, -2, 0],
          boxShadow: [
            `0 0 0 2px ${moodColor}40, 0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${moodColor}15`,
            `0 0 0 2px ${moodColor}70, 0 4px 16px rgba(0,0,0,0.4), 0 0 16px ${moodColor}30`,
            `0 0 0 2px ${moodColor}40, 0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${moodColor}15`,
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-lg">{MINI_SPRITES[species] || '🟢'}</span>

        {/* Mood indicator */}
        <motion.span
          className="absolute -top-1 -right-1 text-[10px] bg-gray-900/80 rounded-full w-4 h-4 flex items-center justify-center"
          style={{ boxShadow: `0 0 6px ${moodColor}40` }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {mood.emoji}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

export default MiniPet;
