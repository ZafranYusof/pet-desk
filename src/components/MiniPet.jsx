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

function MiniPet({ petState, visible, onQuickFeed, onToggle, corner = 'bottom-right' }) {
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const species = petState?.species || 'slime';
  const moodState = getMoodState();
  const mood = MOODS[moodState.currentMood] || MOODS.calm;
  const position = CORNERS[corner] || CORNERS['bottom-right'];

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
            className="absolute bottom-full mb-2 right-0 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700/50 shadow-xl p-2 min-w-[120px]"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.12 }}
          >
            {/* Mini stats */}
            <div className="space-y-1 mb-2 px-1">
              <div className="flex items-center gap-1">
                <span className="text-[9px]">❤️</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${happiness}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">⚡</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${energy}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px]">🍖</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${hunger}%` }} />
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1">
              <motion.button
                className="flex-1 px-2 py-1 bg-green-900/40 border border-green-700/40 rounded text-[10px] text-green-300 cursor-pointer hover:bg-green-800/40"
                onClick={() => { onQuickFeed?.(); setShowActions(false); }}
                whileTap={{ scale: 0.9 }}
              >
                🍖 Feed
              </motion.button>
              <motion.button
                className="flex-1 px-2 py-1 bg-red-900/40 border border-red-700/40 rounded text-[10px] text-red-300 cursor-pointer hover:bg-red-800/40"
                onClick={() => { onToggle?.(); setShowActions(false); }}
                whileTap={{ scale: 0.9 }}
              >
                ✕ Hide
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini pet body */}
      <motion.button
        className="relative w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur-sm border-2 border-gray-600/50 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-purple-500/20"
        onClick={() => setShowActions(!showActions)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          y: [0, -2, 0],
          borderColor: [mood.color + '60', mood.color + '90', mood.color + '60'],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-lg">{MINI_SPRITES[species] || '🟢'}</span>

        {/* Mood indicator */}
        <motion.span
          className="absolute -top-1 -right-1 text-[10px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {mood.emoji}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

export default MiniPet;
