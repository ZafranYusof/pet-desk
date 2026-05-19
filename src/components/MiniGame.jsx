import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CatchFood from '../games/CatchFood';
import MemoryMatch from '../games/MemoryMatch';
import QuickTap from '../games/QuickTap';

const games = {
  catchFood: { name: 'Catch Food', component: CatchFood },
  memoryMatch: { name: 'Memory Match', component: MemoryMatch },
  quickTap: { name: 'Quick Tap', component: QuickTap },
};

function MiniGame({ gameId, onClose, onComplete }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const game = games[gameId];
  if (!game) return null;

  const GameComponent = game.component;

  const handleGameEnd = (finalScore, xp) => {
    setScore(finalScore);
    setXpEarned(xp);
    setGameOver(true);
    onComplete(xp);

    // Auto-close after 3 seconds
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <motion.div
      className="fixed z-[100] top-1/2 left-1/2"
      style={{ width: 200, height: 250, marginLeft: -100, marginTop: -125 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="w-full h-full bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-700/50">
          <span className="text-xs font-medium text-gray-200 truncate">{game.name}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-sm leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 relative overflow-hidden">
          {!gameOver ? (
            <GameComponent onGameEnd={handleGameEnd} />
          ) : (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-2xl">🎉</span>
              <span className="text-sm font-bold text-gray-200">Game Over!</span>
              <span className="text-xs text-gray-400">Score: {score}</span>
              <span className="text-xs text-yellow-400">+{xpEarned} XP</span>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {!gameOver && (
          <div className="px-3 py-1 border-t border-gray-700/50">
            <span className="text-[10px] text-gray-400">Score: {score}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default MiniGame;
