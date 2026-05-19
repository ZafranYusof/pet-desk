import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getGamesList, getHighScores, getArcadeStats } from '../services/arcadeService';

function Arcade({ petState, onClose, onPlayGame }) {
  const level = petState?.level || 1;
  const games = getGamesList(level);
  const highScores = getHighScores();
  const stats = getArcadeStats();

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[280px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <span className="text-white font-bold text-sm">🕹️ Arcade</span>
          <button
            className="text-gray-400 hover:text-white text-lg cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Games list */}
        <div className="px-4 py-3 space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className={`rounded-xl p-3 border transition-colors ${
                game.unlocked
                  ? 'bg-gray-800/40 border-gray-600/30 hover:border-gray-500/50'
                  : 'bg-gray-800/20 border-gray-700/20 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{game.icon}</span>
                  <div>
                    <div className="text-sm text-white font-medium">{game.name}</div>
                    <div className="text-xs text-gray-400">
                      High: {highScores[game.id] || 0}
                    </div>
                  </div>
                </div>
                {game.unlocked ? (
                  <button
                    className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
                    onClick={() => onPlayGame(game.id)}
                  >
                    Play
                  </button>
                ) : (
                  <span className="text-xs text-red-400">🔒 Lv{game.unlockLevel}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats footer */}
        <div className="px-4 py-2 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 text-center">
            Games played: {stats.gamesPlayed} • Total score: {stats.totalScore}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Arcade;
