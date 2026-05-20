import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGamesList, getHighScores, getArcadeStats } from '../services/arcadeService';

function Arcade({ petState, onClose, onPlayGame }) {
  const level = petState?.level || 1;
  const games = getGamesList(level);
  const highScores = getHighScores();
  const stats = getArcadeStats();
  const [hoveredGame, setHoveredGame] = useState(null);
  const [activeGame, setActiveGame] = useState(null);

  const gameEmojis = {
    flappyPet: '🐦',
    snake: '🐍',
    blockStack: '🧱',
    tetris: '🟦',
    rhythm: '🎵',
    racing: '🏎️',
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-[300px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕹️</span>
            <span className="text-white font-bold text-sm">Arcade</span>
          </div>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700/60 transition-all cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Games Grid */}
        <div className="px-3 py-3 grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto custom-scrollbar">
          {games.map((game, idx) => (
            <motion.div
              key={game.id}
              className={`relative rounded-xl border overflow-hidden transition-all ${
                game.unlocked
                  ? 'bg-gray-800/50 border-gray-600/30 hover:border-purple-500/50 cursor-pointer'
                  : 'bg-gray-800/20 border-gray-700/20 opacity-50 cursor-not-allowed'
              }`}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              whileHover={game.unlocked ? { scale: 1.03, y: -2 } : {}}
              whileTap={game.unlocked ? { scale: 0.97 } : {}}
              onClick={() => game.unlocked && onPlayGame(game.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              {/* Game thumbnail area */}
              <div className="h-16 flex items-center justify-center bg-gradient-to-br from-gray-800/80 to-gray-900/80 relative">
                <motion.span
                  className="text-3xl"
                  animate={hoveredGame === game.id && game.unlocked ? { rotateY: 180 } : { rotateY: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {game.icon || gameEmojis[game.id] || '🎮'}
                </motion.span>
                {/* Now Playing indicator */}
                {activeGame === game.id && (
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-green-500/80 px-1.5 py-0.5 rounded-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[7px] text-white font-bold">LIVE</span>
                  </div>
                )}
                {/* Locked overlay */}
                {!game.unlocked && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-lg">🔒</span>
                      <div className="text-[9px] text-red-300 font-medium">Lv.{game.unlockLevel}</div>
                    </div>
                  </div>
                )}
              </div>
              {/* Game info */}
              <div className="p-2">
                <div className="text-[11px] text-white font-medium truncate">{game.name}</div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[9px] text-gray-500">High: {highScores[game.id] || 0}</span>
                  {game.unlocked && (
                    <span className="text-[8px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                      Play →
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats footer */}
        <div className="px-4 py-2.5 border-t border-gray-700/40 bg-gray-800/20">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <span>🎮 {stats.gamesPlayed} played</span>
            <span>⭐ {stats.totalScore} pts</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Arcade;
