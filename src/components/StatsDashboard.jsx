import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { getStats, getWeeklyTrend, getFunFacts, formatPlaytime, getDaysActive } from '../services/statsService';

function StatsDashboard({ onClose }) {
  const [stats, setStats] = useState(() => getStats());
  const [weeklyTrend, setWeeklyTrend] = useState(() => getWeeklyTrend());
  const [funFacts, setFunFacts] = useState(() => getFunFacts());

  useEffect(() => {
    setStats(getStats());
    setWeeklyTrend(getWeeklyTrend());
    setFunFacts(getFunFacts());
  }, []);

  const maxInteractions = Math.max(1, ...weeklyTrend.map((d) => d.interactions));

  return (
    <motion.div
      className="fixed z-50 top-1/2 left-1/2"
      style={{ width: 320 }}
      initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
      animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
      exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
      transition={{ duration: 0.15 }}
    >
      <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl p-4 overflow-y-auto" style={{ maxHeight: 400 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-200">📈 Lifetime Stats</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-800/60 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">Playtime</div>
            <div className="text-sm font-medium text-gray-200">{formatPlaytime(stats.totalPlaytime)}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">Days</div>
            <div className="text-sm font-medium text-gray-200">{getDaysActive()}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">Actions</div>
            <div className="text-sm font-medium text-gray-200">{stats.totalInteractions.toLocaleString()}</div>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="mb-3">
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Last 7 Days</div>
          <div className="space-y-1">
            {weeklyTrend.map((day) => (
              <div key={day.date} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-7">{day.dayLabel}</span>
                <div className="flex-1 h-3 bg-gray-800/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(2, (day.interactions / maxInteractions) * 100)}%`,
                      background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-5 text-right">{day.interactions}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Counters Grid */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <CounterItem icon="🍖" label="Feeds" value={stats.totalFeeds} />
          <CounterItem icon="🎮" label="Plays" value={stats.totalPlays} />
          <CounterItem icon="❤️" label="Pets" value={stats.totalPets} />
          <CounterItem icon="🎯" label="Games" value={stats.totalGamesPlayed} />
          <CounterItem icon="⬆️" label="Level Ups" value={stats.totalLevelUps} />
          <CounterItem icon="🏆" label="Achievements" value={stats.totalAchievements} />
        </div>

        {/* Fun Facts */}
        {funFacts.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Fun Facts</div>
            <div className="space-y-1">
              {funFacts.slice(0, 3).map((fact, i) => (
                <div key={i} className="text-[11px] text-gray-300 bg-gray-800/40 rounded px-2 py-1">
                  {fact}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Records */}
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Records</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-gray-800/40 rounded px-2 py-1">
              <div className="text-[10px] text-gray-400">Highest Level</div>
              <div className="text-xs font-medium text-gray-200">{stats.highestLevel || '-'}</div>
            </div>
            <div className="bg-gray-800/40 rounded px-2 py-1">
              <div className="text-[10px] text-gray-400">Total XP</div>
              <div className="text-xs font-medium text-gray-200">{stats.totalXPEarned.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/40 rounded px-2 py-1">
              <div className="text-[10px] text-gray-400">Win Rate</div>
              <div className="text-xs font-medium text-gray-200">
                {stats.totalGamesPlayed > 0
                  ? `${Math.round((stats.totalGamesWon / stats.totalGamesPlayed) * 100)}%`
                  : '-'}
              </div>
            </div>
            <div className="bg-gray-800/40 rounded px-2 py-1">
              <div className="text-[10px] text-gray-400">Best Streak</div>
              <div className="text-xs font-medium text-gray-200">
                {stats.highestStreak > 0 ? `${stats.highestStreak} days` : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CounterItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-800/40 rounded px-2 py-1">
      <span className="text-xs">{icon}</span>
      <span className="text-[10px] text-gray-400">{label}:</span>
      <span className="text-[11px] font-medium text-gray-200 ml-auto">{value.toLocaleString()}</span>
    </div>
  );
}

export default StatsDashboard;
