import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryColors = {
  Care: { accent: '#22c55e', bg: 'from-green-900/40 to-green-950/20', border: 'border-green-500/20', glow: 'rgba(34,197,94,0.3)' },
  Fun: { accent: '#a855f7', bg: 'from-purple-900/40 to-purple-950/20', border: 'border-purple-500/20', glow: 'rgba(168,85,247,0.3)' },
  Social: { accent: '#3b82f6', bg: 'from-blue-900/40 to-blue-950/20', border: 'border-blue-500/20', glow: 'rgba(59,130,246,0.3)' },
  Creative: { accent: '#ec4899', bg: 'from-pink-900/40 to-pink-950/20', border: 'border-pink-500/20', glow: 'rgba(236,72,153,0.3)' },
  Life: { accent: '#f59e0b', bg: 'from-amber-900/40 to-amber-950/20', border: 'border-amber-500/20', glow: 'rgba(245,158,11,0.3)' },
  Progress: { accent: '#06b6d4', bg: 'from-cyan-900/40 to-cyan-950/20', border: 'border-cyan-500/20', glow: 'rgba(6,182,212,0.3)' },
  Tools: { accent: '#6b7280', bg: 'from-gray-800/40 to-gray-900/20', border: 'border-gray-500/20', glow: 'rgba(107,114,128,0.3)' },
};

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
      { id: 'aichat', icon: '💬🤖', label: 'AI Chat' },
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
      { id: 'aisettings', icon: '⚙️🤖', label: 'AI' },
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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleMouseEnter = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false);
  };
  const handleMouseLeave = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(true);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onCloseRef.current();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        className="fixed z-50 min-w-[200px] bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-gray-600/30 shadow-2xl shadow-black/60 overflow-hidden"
        style={{ left: adjustedPos.x, top: adjustedPos.y }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="p-2.5">
          <motion.button
            className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-400 hover:bg-gray-700/50 rounded-xl cursor-pointer transition-all"
            onClick={() => setShowGames(false)}
            whileHover={{ x: -2 }}
          >
            <span className="text-sm">←</span>
            <span>Back</span>
          </motion.button>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {gameOptions.map((game, i) => (
              <motion.button
                key={game.id}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                  gamesDisabled
                    ? 'text-gray-600 cursor-not-allowed opacity-40'
                    : 'text-gray-200 hover:bg-purple-500/20 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 border border-transparent hover:border-purple-500/30'
                }`}
                disabled={gamesDisabled}
                onClick={() => onAction(`game:${game.id}`)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={!gamesDisabled ? { scale: 1.08, y: -2 } : {}}
                whileTap={!gamesDisabled ? { scale: 0.92 } : {}}
              >
                <span className="text-2xl mb-1">{game.icon}</span>
                <span className="text-[10px] leading-tight font-medium">{game.label}</span>
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
      className="fixed z-50 w-[290px] bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-gray-600/30 shadow-2xl shadow-black/60 overflow-hidden"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      initial={{ opacity: 0, scale: 0.75, transformOrigin: 'top left' }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-2 max-h-[440px] overflow-y-auto custom-scrollbar">
        {categories.map((cat, catIdx) => {
          const colors = categoryColors[cat.label] || categoryColors.Tools;
          return (
            <div key={cat.label}>
              {catIdx > 0 && (
                <div className="h-px mx-3 my-1.5 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
              )}
              <div className={`rounded-xl mx-1 mb-1 bg-gradient-to-r ${colors.bg} border ${colors.border} p-1.5`}>
                <div className="px-2 py-0.5 mb-1 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.accent, boxShadow: `0 0 6px ${colors.glow}` }} />
                  <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: colors.accent }}>
                    {cat.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {cat.items.map((item, itemIdx) => {
                    const disabled = item.disableCheck ? item.disableCheck(petState) : false;
                    return (
                      <motion.button
                        key={item.id}
                        className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all group ${
                          disabled
                            ? 'text-gray-600 cursor-not-allowed opacity-40'
                            : 'text-gray-200 hover:bg-white/10 cursor-pointer'
                        }`}
                        disabled={disabled}
                        onClick={() => {
                          if (item.id === 'games') {
                            setShowGames(true);
                          } else {
                            onAction(item.id);
                          }
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: catIdx * 0.03 + itemIdx * 0.02 }}
                        whileHover={!disabled ? { scale: 1.12, y: -3 } : {}}
                        whileTap={!disabled ? { scale: 0.88 } : {}}
                      >
                        <span
                          className={`text-lg transition-all duration-200 ${!disabled ? 'group-hover:scale-110' : ''}`}
                          style={!disabled ? { filter: `drop-shadow(0 0 0px transparent)` } : {}}
                          onMouseEnter={(e) => { if (!disabled) e.target.style.filter = `drop-shadow(0 0 8px ${colors.glow})`; }}
                          onMouseLeave={(e) => { if (!disabled) e.target.style.filter = 'drop-shadow(0 0 0px transparent)'; }}
                        >
                          {item.icon}
                        </span>
                        <span className="text-[9px] leading-tight mt-0.5 text-center truncate w-full opacity-80 group-hover:opacity-100 transition-opacity">
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom actions */}
        <div className="h-px mx-3 my-1.5 bg-gradient-to-r from-transparent via-gray-700/50 to-transparent" />
        <div className="grid grid-cols-4 gap-1 px-1 pb-1">
          {[
            { id: 'seasonal', icon: '🎉', label: 'Events' },
            { id: 'onboarding', icon: '❓', label: 'Help' },
            { id: 'rename', icon: '✏️', label: 'Rename' },
            { id: 'close', icon: '❌', label: 'Close' },
          ].map((item) => (
            <motion.button
              key={item.id}
              className="flex flex-col items-center justify-center p-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-white/5 cursor-pointer transition-all group"
              onClick={() => {
                if (item.id === 'close') onClose();
                else onAction(item.id);
              }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-lg group-hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.4)]">{item.icon}</span>
              <span className="text-[9px] leading-tight mt-0.5 opacity-70 group-hover:opacity-100">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default ContextMenu;
