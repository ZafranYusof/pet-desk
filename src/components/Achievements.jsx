import React from 'react';
import { motion } from 'framer-motion';
import { getAchievements, getStats, getAchievementProgress } from '../services/achievementService';

function Achievements({ onClose }) {
  const achievements = getAchievements();
  const stats = getStats();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <motion.div
      className="fixed z-50 w-[280px] h-[350px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base">🏆</span>
          <span className="text-sm font-medium text-gray-200">Achievements</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{unlockedCount}/{achievements.length}</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Achievement grid */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-700">
        {achievements.map((achievement) => {
          const progress = getAchievementProgress(achievement, stats);
          return (
            <div
              key={achievement.id}
              className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                achievement.unlocked
                  ? 'bg-yellow-900/20 border border-yellow-600/30'
                  : 'bg-gray-800/40 border border-gray-700/30 opacity-60'
              }`}
            >
              <span className={`text-lg ${achievement.unlocked ? '' : 'grayscale'}`}>
                {achievement.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${achievement.unlocked ? 'text-yellow-300' : 'text-gray-400'}`}>
                    {achievement.name}
                  </span>
                  {achievement.unlocked && (
                    <span className="text-[10px] text-gray-500">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">{achievement.description}</p>
                {progress && (
                  <div className="mt-1">
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500/70 rounded-full transition-all"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-500">{progress.current}/{progress.target}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default Achievements;
