import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const gameOptions = [
  { id: 'catchFood', icon: '🍎', label: 'Catch Food' },
  { id: 'memoryMatch', icon: '🃏', label: 'Memory Match' },
  { id: 'quickTap', icon: '🎯', label: 'Quick Tap' },
];

const menuItems = [
  { id: 'food', icon: '🍽️', label: 'Food', disableCheck: (state) => state?.hunger > 90 },
  { id: 'play', icon: '🎮', label: 'Play', disableCheck: (state) => state?.energy < 10 },
  { id: 'games', icon: '🕹️', label: 'Play Game', disableCheck: (state) => state?.energy < 10 },
  { id: 'jobs', icon: '??', label: 'Jobs' },
  { id: 'arcade', icon: '???', label: 'Arcade' },
  { id: 'battle', icon: '⚔️', label: 'Battle', disableCheck: (state) => state?.energy < 10 },
  { id: 'breed', icon: '??', label: 'Breed', disableCheck: (state) => (state?.level || 1) < 10 },
  { id: 'chat', icon: '??', label: 'Chat' },
  { id: 'dungeon', icon: '??', label: 'Dungeon', disableCheck: (state) => state?.energy < 20 },
  { id: 'photo', icon: '??', label: 'Photo' },
  { id: 'sleep', icon: '😴', label: 'Sleep' },
  { id: 'pets', icon: '👥', label: 'Pets' },
  { id: 'widget', icon: '📊', label: 'Widget' },
  { id: 'spriteEditor', icon: '🎨', label: 'Sprite Editor' },
  { id: 'story', icon: '??', label: 'Story' },
  { id: 'diary', icon: '📖', label: 'Diary' },
  { id: 'achievements', icon: '🏆', label: 'Achievements' },
  { id: 'scrapbook', icon: '📸', label: 'Scrapbook' },
  { id: 'craft', icon: '??', label: 'Craft' },
  { id: 'garden', icon: '🌱', label: 'Garden' },
  { id: 'room', icon: '??', label: 'Room' },
  { id: 'habitat', icon: '🏠', label: 'Habitat' },
  { id: 'sound', icon: '🔊', label: 'Sound' },
  { id: 'leaderboard', icon: '??', label: 'Leaderboard' },
  { id: 'lifetimeStats', icon: '📈', label: 'Stats' },
  { id: 'rename', icon: '✏️', label: 'Rename' },
  { id: 'close', icon: '❌', label: 'Close' },
];

function ContextMenu({ x = 0, y = 0, petState, onAction, onClose }) {
  const menuRef = useRef(null);
  const [showGames, setShowGames] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (showGames) {
    const gamesDisabled = petState?.energy < 10;
    return (
      <motion.div
        ref={menuRef}
        className="fixed z-50 min-w-[160px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden"
        style={{ left: x, top: y }}
        initial={{ opacity: 0, scale: 0.9, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -5 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        <div className="py-1">
          <button
            className="w-full px-4 py-2 flex items-center gap-3 text-sm text-gray-400 hover:bg-gray-700/60 cursor-pointer"
            onClick={() => setShowGames(false)}
          >
            <span className="text-base">←</span>
            <span>Back</span>
          </button>
          {gameOptions.map((game) => (
            <button
              key={game.id}
              className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                gamesDisabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-200 hover:bg-gray-700/60 cursor-pointer'
              }`}
              disabled={gamesDisabled}
              onClick={() => onAction(`game:${game.id}`)}
            >
              <span className="text-base">{game.icon}</span>
              <span>{game.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.9, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -5 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      <div className="py-1">
        {menuItems.map((item) => {
          const disabled = item.disableCheck ? item.disableCheck(petState) : false;
          return (
            <button
              key={item.id}
              className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-200 hover:bg-gray-700/60 cursor-pointer'
              }`}
              disabled={disabled}
              onClick={() => {
                if (item.id === 'close') {
                  onClose();
                } else if (item.id === 'games') {
                  setShowGames(true);
                } else {
                  onAction(item.id);
                }
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ContextMenu;

