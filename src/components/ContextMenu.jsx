import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  {
    label: 'Care',
    items: [
      { id: 'food', icon: '🍽️', label: 'Feed' },
      { id: 'stats', icon: '📊', label: 'Stats' },
      { id: 'sleep', icon: '😴', label: 'Sleep' },
    ],
  },
  {
    label: 'Fun',
    items: [
      { id: 'play', icon: '🎮', label: 'Play', disableCheck: (s) => s?.energy < 10 },
      { id: 'games', icon: '🕹️', label: 'Games', disableCheck: (s) => s?.energy < 10 },
      { id: 'arcade', icon: '👾', label: 'Arcade' },
      { id: 'battle', icon: '⚔️', label: 'Battle', disableCheck: (s) => s?.energy < 10 },
      { id: 'dungeon', icon: '🏰', label: 'Dungeon', disableCheck: (s) => s?.energy < 20 },
    ],
  },
  {
    label: 'Social',
    items: [
      { id: 'breed', icon: '🧬', label: 'Breed', disableCheck: (s) => (s?.level || 1) < 10 },
      { id: 'chat', icon: '💬', label: 'Chat' },
      { id: 'leaderboard', icon: '🏅', label: 'Ranks' },
      { id: 'pets', icon: '👥', label: 'Pets' },
    ],
  },
  {
    label: 'Creative',
    items: [
      { id: 'photo', icon: '📷', label: 'Photo' },
      { id: 'spriteEditor', icon: '🎨', label: 'Sprites' },
      { id: 'palette', icon: '🖌️', label: 'Colors' },
    ],
  },
  {
    label: 'Life',
    items: [
      { id: 'garden', icon: '🌱', label: 'Garden' },
      { id: 'jobs', icon: '💼', label: 'Jobs' },
      { id: 'craft', icon: '🔨', label: 'Craft' },
      { id: 'room', icon: '🏠', label: 'Room' },
      { id: 'decorate', icon: '🪑', label: 'Decor' },
      { id: 'habitat', icon: '🏡', label: 'Habitat' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { id: 'evolution', icon: '🧬', label: 'Evolve' },
      { id: 'skills', icon: '📘', label: 'Skills' },
      { id: 'quests', icon: '📜', label: 'Quests' },
      { id: 'achievements', icon: '🏆', label: 'Achieve' },
      { id: 'diary', icon: '📖', label: 'Diary' },
      { id: 'scrapbook', icon: '📸', label: 'Scrap' },
      { id: 'story', icon: '✨', label: 'Story' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'pomodoro', icon: '🍅', label: 'Focus' },
      { id: 'importExport', icon: '📦', label: 'Backup' },
      { id: 'miniPet', icon: '🐾', label: 'Mini' },
      { id: 'keybinds', icon: '⌨️', label: 'Keys' },
      { id: 'sound', icon: '🔊', label: 'Sound' },
      { id: 'notifications', icon: '🔔', label: 'Inbox' },
      { id: 'activityLog', icon: '📋', label: 'Log' },
      { id: 'widget', icon: '📊', label: 'Widget' },
    ],
  },
];

const gameOptions = [
  { id: 'catchFood', icon: '🍎', label: 'Catch Food' },
  { id: 'memoryMatch', icon: '🃏', label: 'Memory Match' },
  { id: 'quickTap', icon: '🎯', label: 'Quick Tap' },
];

function ContextMenu({ x = 0, y = 0, petState, onAction, onClose }) {
  const menuRef = useRef(null);
  const [showGames, setShowGames] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust position to stay on screen
  const [adjustedPos, setAdjustedPos] = useState({ x, y });
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;
      if (x + rect.width > window.innerWidth) newX = window.innerWidth - rect.width - 8;
      if (y + rect.height > window.innerHeight) newY = window.innerHeight - rect.height - 8;
      if (newX < 4) newX = 4;
      if (newY < 4) newY = 4;
      setAdjustedPos({ x: newX, y: newY });
    }
  }, [x, y]);

  if (showGames) {
    const gamesDisabled = petState?.energy < 10;
    return (
      <motion.div
        ref={menuRef}
        className="fixed z-50 min-w-[180px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden"
        style={{ left: adjustedPos.x, top: adjustedPos.y }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="p-2">
          <button
            className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-400 hover:bg-gray-700/50 rounded-lg cursor-pointer transition-all"
            onClick={() => setShowGames(false)}
          >
            <span className="text-sm">←</span>
            <span>Back</span>
          </button>
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {gameOptions.map((game) => (
              <motion.button
                key={game.id}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  gamesDisabled
                    ? 'text-gray-600 cursor-not-allowed opacity-40'
                    : 'text-gray-200 hover:bg-gray-700/60 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10'
                }`}
                disabled={gamesDisabled}
                onClick={() => onAction(`game:${game.id}`)}
                whileHover={!gamesDisabled ? { scale: 1.08 } : {}}
                whileTap={!gamesDisabled ? { scale: 0.92 } : {}}
              >
                <span className="text-xl mb-0.5">{game.icon}</span>
                <span className="text-[9px] leading-tight">{game.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 w-[280px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      initial={{ opacity: 0, scale: 0.75, transformOrigin: 'top left' }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="p-2 max-h-[420px] overflow-y-auto custom-scrollbar">
        {categories.map((cat, catIdx) => (
          <div key={cat.label}>
            {catIdx > 0 && <div className="h-px bg-gray-700/40 mx-2 my-1.5" />}
            <div className="px-2 py-1">
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                {cat.label}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 px-1">
              {cat.items.map((item) => {
                const disabled = item.disableCheck ? item.disableCheck(petState) : false;
                return (
                  <motion.button
                    key={item.id}
                    className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all group ${
                      disabled
                        ? 'text-gray-600 cursor-not-allowed opacity-40'
                        : 'text-gray-200 hover:bg-gray-700/50 cursor-pointer'
                    }`}
                    disabled={disabled}
                    onClick={() => {
                      if (item.id === 'games') {
                        setShowGames(true);
                      } else {
                        onAction(item.id);
                      }
                    }}
                    onMouseEnter={() => setTooltip(item.label)}
                    onMouseLeave={() => setTooltip(null)}
                    whileHover={!disabled ? { scale: 1.1, y: -2 } : {}}
                    whileTap={!disabled ? { scale: 0.9 } : {}}
                  >
                    <span className={`text-lg transition-all ${!disabled ? 'group-hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]' : ''}`}>
                      {item.icon}
                    </span>
                    <span className="text-[9px] leading-tight mt-0.5 text-center truncate w-full">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom actions */}
        <div className="h-px bg-gray-700/40 mx-2 my-1.5" />
        <div className="grid grid-cols-4 gap-1 px-1 pb-1">
          {[
            { id: 'seasonal', icon: '🎉', label: 'Events' },
            { id: 'onboarding', icon: '❓', label: 'Help' },
            { id: 'rename', icon: '✏️', label: 'Rename' },
            { id: 'close', icon: '❌', label: 'Close' },
          ].map((item) => (
            <motion.button
              key={item.id}
              className="flex flex-col items-center justify-center p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 cursor-pointer transition-all group"
              onClick={() => {
                if (item.id === 'close') onClose();
                else onAction(item.id);
              }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-lg group-hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]">{item.icon}</span>
              <span className="text-[9px] leading-tight mt-0.5">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default ContextMenu;
