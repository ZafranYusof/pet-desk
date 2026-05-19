import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLeaderboard, getPlayerRank, getMotivationalMessage, getCategoryInfo, CATEGORIES } from '../services/leaderboardService';

function Leaderboard({ petName = 'You', onClose }) {
  const [activeCategory, setActiveCategory] = useState('level');

  const leaderboard = useMemo(() => getLeaderboard(activeCategory, petName), [activeCategory, petName]);
  const playerRank = useMemo(() => getPlayerRank(activeCategory), [activeCategory]);
  const message = useMemo(() => getMotivationalMessage(activeCategory, petName), [activeCategory, petName]);

  // Show top 10 + 5 around player if not in top 10
  const visibleEntries = useMemo(() => {
    if (playerRank <= 10) {
      return leaderboard.slice(0, 15);
    }
    const top10 = leaderboard.slice(0, 10);
    const playerIdx = playerRank - 1;
    const start = Math.max(10, playerIdx - 2);
    const end = Math.min(leaderboard.length, playerIdx + 3);
    const aroundPlayer = leaderboard.slice(start, end);
    return [...top10, { separator: true }, ...aroundPlayer];
  }, [leaderboard, playerRank]);

  const categoryInfo = getCategoryInfo(activeCategory);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="relative w-[320px] h-[420px] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 className="text-white text-base font-bold flex items-center gap-2">
            <span>🏅</span> Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 px-3 pb-2 flex-wrap">
          {CATEGORIES.map((cat) => {
            const info = getCategoryInfo(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/80 text-white shadow-md'
                    : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
                }`}
              >
                {info.icon} {info.label}
              </button>
            );
          })}
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto px-3 pb-2 scrollbar-thin scrollbar-thumb-gray-700">
          <div className="space-y-0.5">
            {visibleEntries.map((entry, idx) => {
              if (entry.separator) {
                return (
                  <div key="sep" className="flex items-center justify-center py-1">
                    <span className="text-gray-600 text-xs">• • •</span>
                  </div>
                );
              }

              const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;

              return (
                <motion.div
                  key={entry.name + entry.rank}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                    entry.isPlayer
                      ? 'bg-indigo-500/20 border border-indigo-400/40'
                      : 'hover:bg-gray-800/40'
                  }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.15 }}
                >
                  {/* Rank */}
                  <span className={`w-7 text-right text-xs font-mono ${
                    entry.isPlayer ? 'text-indigo-300' : 'text-gray-500'
                  }`}>
                    #{entry.rank}
                  </span>

                  {/* Medal or spacer */}
                  <span className="w-5 text-center text-sm">
                    {medal || ''}
                  </span>

                  {/* Name */}
                  <span className={`flex-1 truncate ${
                    entry.isPlayer ? 'text-indigo-200 font-semibold' : 'text-gray-300'
                  }`}>
                    {entry.name}
                  </span>

                  {/* Score */}
                  <span className={`text-xs font-medium ${
                    entry.isPlayer ? 'text-indigo-300' : 'text-gray-500'
                  }`}>
                    {categoryInfo.format(entry.score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-900/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-400 text-xs">Your Rank:</span>
            <span className="text-indigo-300 text-xs font-bold">#{playerRank} / {leaderboard.length}</span>
          </div>
          <p className="text-gray-400 text-xs text-center italic">{message}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Leaderboard;
