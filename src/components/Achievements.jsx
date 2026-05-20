import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAchievements, getStats, getAchievementProgress, getAchievementRarity, getTotalAchievementPoints, getShowcase, pinToShowcase, unpinFromShowcase, RARITY } from '../services/achievementService';

function Achievements({ onClose }) {
  const [achievements, setAchievements] = useState(() => getAchievements());
  const stats = getStats();
  const [showcase, setShowcase] = useState(() => getShowcase());
  const [filter, setFilter] = useState('all'); // all, common, rare, epic, legendary, unlocked
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = getTotalAchievementPoints();

  const filteredAchievements = achievements.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unlocked') return a.unlocked;
    return (a.rarity || 'common') === filter;
  });

  const handlePin = (achievementId) => {
    if (showcase.includes(achievementId)) {
      setShowcase(unpinFromShowcase(achievementId));
    } else {
      setShowcase(pinToShowcase(achievementId));
    }
  };

  const showcaseAchievements = achievements.filter(a => showcase.includes(a.id) && a.unlocked);

  return (
    <motion.div
      className="fixed z-50 w-[320px] h-[420px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
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
          <span className="text-xs text-yellow-400">⭐ {totalPoints} pts</span>
          <span className="text-xs text-gray-400">{unlockedCount}/{achievements.length}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer">✕</button>
        </div>
      </div>

      {/* Showcase */}
      {showcaseAchievements.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-700/30 bg-gray-800/30">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Showcase</div>
          <div className="flex gap-2">
            {showcaseAchievements.map((a) => {
              const rarity = getAchievementRarity(a);
              return (
                <motion.div
                  key={a.id}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${rarity.bgColor} ${rarity.borderColor}`}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-sm">{a.icon}</span>
                  <span className={`text-[9px] font-medium ${rarity.color}`}>{a.name}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-gray-700/30 overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'unlocked', label: '✓' },
          { id: 'common', label: 'C', color: 'text-gray-400' },
          { id: 'rare', label: 'R', color: 'text-blue-400' },
          { id: 'epic', label: 'E', color: 'text-purple-400' },
          { id: 'legendary', label: 'L', color: 'text-yellow-400' },
        ].map((f) => (
          <button
            key={f.id}
            className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-all ${
              filter === f.id
                ? 'bg-purple-600/40 text-purple-200'
                : `bg-gray-800/40 ${f.color || 'text-gray-400'} hover:bg-gray-700/40`
            }`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Achievement list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-700">
        {filteredAchievements.map((achievement) => {
          const progress = getAchievementProgress(achievement, stats);
          const rarity = getAchievementRarity(achievement);
          const isPinned = showcase.includes(achievement.id);

          return (
            <motion.div
              key={achievement.id}
              className={`flex items-start gap-2 p-2 rounded-lg transition-colors border ${
                achievement.unlocked
                  ? `${rarity.bgColor} ${rarity.borderColor}`
                  : 'bg-gray-800/40 border-gray-700/30 opacity-60'
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <span className={`text-lg ${achievement.unlocked ? '' : 'grayscale'}`}>
                {achievement.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${achievement.unlocked ? rarity.color : 'text-gray-400'}`}>
                    {achievement.name}
                  </span>
                  <span className={`text-[8px] px-1 rounded ${rarity.bgColor} ${rarity.color}`}>
                    {rarity.label}
                  </span>
                  {achievement.unlocked && (
                    <span className="text-[9px] text-gray-500 ml-auto">
                      +{rarity.points}pts
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">{achievement.description}</p>
                {progress && (
                  <div className="mt-1">
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          rarity.id === 'legendary' ? 'bg-yellow-500/70' :
                          rarity.id === 'epic' ? 'bg-purple-500/70' :
                          rarity.id === 'rare' ? 'bg-blue-500/70' : 'bg-gray-400/70'
                        }`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-500">{progress.current}/{progress.target}</span>
                  </div>
                )}
              </div>
              {/* Pin button */}
              {achievement.unlocked && (
                <button
                  className={`text-[10px] cursor-pointer transition-all ${isPinned ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`}
                  onClick={() => handlePin(achievement.id)}
                  title={isPinned ? 'Unpin from showcase' : 'Pin to showcase'}
                >
                  📌
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default Achievements;
