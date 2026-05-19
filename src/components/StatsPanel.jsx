import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StatusBars from './StatusBars';

const moodEmojis = {
  happy: '😊',
  content: '🙂',
  hungry: '😫',
  tired: '😴',
  sad: '😢',
  excited: '🤩',
};

function StatsPanel({ petState, onClose, onRename }) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(petState?.name || 'Pet');

  const mood = petState?.mood || 'content';
  const level = petState?.level || 1;
  const xp = petState?.xp || 0;
  const xpToNext = petState?.xpToNext || 100;
  const stats = petState?.stats || {};

  function handleNameSubmit() {
    if (nameInput.trim()) {
      onRename?.(nameInput.trim());
    }
    setEditing(false);
  }

  return (
    <motion.div
      className="fixed right-4 top-4 w-[220px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4 z-40"
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 60, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <input
              className="bg-gray-800 text-white text-sm rounded px-2 py-0.5 w-24 outline-none border border-gray-600 focus:border-blue-500"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
          ) : (
            <span
              className="text-white font-semibold text-sm cursor-pointer hover:text-blue-400 transition-colors"
              onClick={() => setEditing(true)}
              title="Click to rename"
            >
              {petState?.name || 'Pet'}
            </span>
          )}
          <span className="text-xs bg-blue-600/80 text-white px-1.5 py-0.5 rounded-full font-medium">
            Lv.{level}
          </span>
        </div>
        <button
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* Mood */}
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
        <span className="text-lg">{moodEmojis[mood] || '🙂'}</span>
        <span className="capitalize">{mood}</span>
      </div>

      {/* Status Bars */}
      <div className="mb-3">
        <StatusBars
          hunger={petState?.hunger ?? 50}
          energy={petState?.energy ?? 50}
          happiness={petState?.happiness ?? 50}
        />
      </div>

      {/* XP Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>XP</span>
          <span>{xp}/{xpToNext}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-500 rounded-full"
            animate={{ width: `${Math.min(100, (xp / xpToNext) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-700/50 pt-2 space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Total Pets</span>
          <span>{stats.totalPets || 0}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Days Alive</span>
          <span>{stats.daysAlive || 0}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>Times Fed</span>
          <span>{stats.timesFed || 0}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default StatsPanel;
