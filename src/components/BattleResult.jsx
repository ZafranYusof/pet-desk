import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { getBattleRewards, getBattleLossPenalty, getWinStreak } from '../services/battleService';

function BattleResult({ result, opponent, playerLevel, onAction }) {
  const isWin = result === 'win';
  const rewards = isWin ? getBattleRewards(opponent?.level || playerLevel) : null;
  const penalty = !isWin && result === 'lose' ? getBattleLossPenalty() : null;
  const streak = getWinStreak();

  return (
    <motion.div
      className="absolute inset-0 z-[110] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        className="relative bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-8 w-[360px] text-center"
        initial={{ scale: 0.5, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.5, y: 30 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        {/* Header */}
        <motion.div
          className={`text-3xl font-bold mb-4 ${isWin ? 'text-yellow-400' : 'text-gray-400'}`}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isWin ? '🏆 Victory!' : '💀 Defeat...'}
        </motion.div>

        {/* Confetti for win */}
        {isWin && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#fbbf24', '#4ade80', '#60a5fa', '#f472b6', '#a78bfa'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                }}
                animate={{
                  y: [0, 400],
                  x: [0, (Math.random() - 0.5) * 100],
                  rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Results */}
        <motion.div
          className="space-y-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {isWin && rewards && (
            <>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300 text-sm">XP Gained</span>
                <span className="text-yellow-400 font-bold">+{rewards.xp}</span>
              </div>

              {rewards.food && (
                <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg">
                  <span className="text-gray-300 text-sm">Item Found</span>
                  <span className="text-green-400 font-medium">
                    {rewards.food === 'golden_apple' ? '🍎 Golden Apple' : '🍪 Cookie'}
                  </span>
                </div>
              )}

              {rewards.accessory && (
                <div className="flex items-center justify-between px-4 py-2 bg-purple-900/30 rounded-lg border border-purple-700/30">
                  <span className="text-purple-300 text-sm">Accessory!</span>
                  <span className="text-purple-200 font-medium">👑 Battle Crown</span>
                </div>
              )}

              <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300 text-sm">Win Streak</span>
                <span className="text-orange-400 font-bold">🔥 {rewards.streak}</span>
              </div>
            </>
          )}

          {result === 'lose' && (
            <>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300 text-sm">Happiness</span>
                <span className="text-red-400 font-medium">-10</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300 text-sm">Win Streak</span>
                <span className="text-gray-500">Reset to 0</span>
              </div>
              <p className="text-gray-500 text-xs mt-2">Don't worry, no XP lost. Try again!</p>
            </>
          )}

          {result === 'flee' && (
            <p className="text-gray-400 text-sm">Got away safely. No rewards this time.</p>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-colors"
            onClick={() => onAction('again')}
          >
            ⚔️ Battle Again
          </button>
          <button
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-medium text-sm transition-colors"
            onClick={() => onAction('leave')}
          >
            Leave
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default BattleResult;
