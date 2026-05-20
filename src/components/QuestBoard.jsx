import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDailyQuests, getWeeklyQuests, claimQuestReward,
  getStoryProgress, markChapterRead, getTotalQuestsCompleted
} from '../services/questService';

function QuestBoard({ onClose, onReward }) {
  const [tab, setTab] = useState('daily');
  const [dailyQuests, setDailyQuests] = useState(() => getDailyQuests());
  const [weeklyQuests, setWeeklyQuests] = useState(() => getWeeklyQuests());
  const [storyProgress, setStoryProgress] = useState(() => getStoryProgress());
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [claimedId, setClaimedId] = useState(null);
  const totalCompleted = getTotalQuestsCompleted();

  function handleClaim(questId, isWeekly) {
    const reward = claimQuestReward(questId, isWeekly);
    if (reward && onReward) onReward(reward);
    setClaimedId(questId);
    setTimeout(() => setClaimedId(null), 1500);
    setDailyQuests(getDailyQuests());
    setWeeklyQuests(getWeeklyQuests());
    setStoryProgress(getStoryProgress());
  }

  function handleReadChapter(chapter) {
    markChapterRead(chapter.id);
    setSelectedChapter(chapter);
    setStoryProgress(getStoryProgress());
  }

  const tabs = [
    { id: 'daily', label: 'Daily', icon: '☀️' },
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'story', label: 'Story', icon: '📖' },
  ];

  function renderQuest(quest, isWeekly) {
    const progress = Math.min(quest.progress || 0, quest.target);
    const pct = (progress / quest.target) * 100;
    const justClaimed = claimedId === quest.id;

    return (
      <motion.div
        key={quest.id}
        className={`relative bg-gray-800/40 rounded-xl p-3 border transition-all ${
          quest.completed && !quest.claimed
            ? 'border-yellow-500/40 bg-yellow-900/10'
            : quest.claimed
            ? 'border-green-500/30 bg-green-900/10'
            : 'border-gray-700/30'
        }`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        layout
      >
        {/* Confetti burst on claim */}
        <AnimatePresence>
          {justClaimed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
            >
              {['🎉', '✨', '⭐', '🎊'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.2, 0],
                    x: [0, (i - 1.5) * 30],
                    y: [0, -20 - Math.random() * 20],
                  }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-white font-medium">{quest.name}</span>
          {quest.completed && !quest.claimed && (
            <motion.button
              className="px-2.5 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-[10px] font-bold rounded-lg cursor-pointer shadow-[0_0_8px_rgba(251,191,36,0.3)]"
              onClick={() => handleClaim(quest.id, isWeekly)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Claim ✨
            </motion.button>
          )}
          {quest.claimed && (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                ✓
              </motion.span>
              Done
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                quest.completed
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-400 to-indigo-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-mono min-w-[32px] text-right">
            {progress}/{quest.target}
          </span>
        </div>

        {/* Reward preview */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[9px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
            +{quest.reward.xp} XP
          </span>
          {quest.reward.coins > 0 && (
            <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
              +{quest.reward.coins} 🪙
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-[300px] max-h-[440px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="text-white text-sm font-semibold flex items-center gap-2">
            📜 Quests
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
              {totalCompleted} done
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700/60 transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs with animated underline */}
        <div className="relative flex border-b border-gray-700/40">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`flex-1 py-2.5 text-[11px] cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setTab(t.id)}
            >
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
            animate={{
              left: `${tabs.findIndex(t => t.id === tab) * (100 / 3)}%`,
              width: `${100 / 3}%`,
            }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {tab === 'daily' && (
              <motion.div
                key="daily"
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                {dailyQuests.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs mt-4">Loading quests...</div>
                ) : (
                  dailyQuests.map(q => renderQuest(q, false))
                )}
              </motion.div>
            )}

            {tab === 'weekly' && (
              <motion.div
                key="weekly"
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                {weeklyQuests.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs mt-4">Loading quests...</div>
                ) : (
                  weeklyQuests.map(q => renderQuest(q, true))
                )}
              </motion.div>
            )}

            {tab === 'story' && (
              <motion.div
                key="story"
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
              >
                {storyProgress.chapters.map((ch, idx) => (
                  <motion.div
                    key={ch.id}
                    className={`rounded-xl p-3 border cursor-pointer transition-all ${
                      ch.unlocked
                        ? ch.read
                          ? 'bg-gray-800/30 border-gray-700/20 hover:border-gray-600/40'
                          : 'bg-purple-900/20 border-purple-500/30 hover:border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                        : 'bg-gray-800/20 border-gray-700/20 opacity-40 cursor-not-allowed'
                    }`}
                    onClick={() => ch.unlocked && handleReadChapter(ch)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ch.unlocked ? (ch.read ? '📖' : '✨') : '🔒'}</span>
                      <div>
                        <div className="text-[11px] text-white font-medium">Ch.{ch.id}: {ch.title}</div>
                        <div className="text-[9px] text-gray-500">
                          {ch.unlocked ? (ch.read ? 'Completed' : '🆕 New chapter!') : `${ch.questsRequired} quests to unlock`}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Story chapter modal */}
        <AnimatePresence>
          {selectedChapter && (
            <motion.div
              className="absolute inset-0 bg-gray-900/98 backdrop-blur-sm flex items-center justify-center p-4 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center max-w-[240px]">
                <motion.div
                  className="text-2xl mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  📖
                </motion.div>
                <h3 className="text-white text-sm font-bold mb-2">Ch.{selectedChapter.id}: {selectedChapter.title}</h3>
                <p className="text-gray-300 text-xs leading-relaxed mb-4">{selectedChapter.text}</p>
                <motion.button
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs rounded-xl cursor-pointer font-medium"
                  onClick={() => setSelectedChapter(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default QuestBoard;
