import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDailyQuests, getWeeklyQuests, claimQuestReward,
  getStoryProgress, markChapterRead, getTotalQuestsCompleted
} from '../services/questService';

function QuestBoard({ onClose, onReward }) {
  const [tab, setTab] = useState('daily'); // daily, weekly, story
  const [dailyQuests, setDailyQuests] = useState(() => getDailyQuests());
  const [weeklyQuests, setWeeklyQuests] = useState(() => getWeeklyQuests());
  const [storyProgress, setStoryProgress] = useState(() => getStoryProgress());
  const [selectedChapter, setSelectedChapter] = useState(null);
  const totalCompleted = getTotalQuestsCompleted();

  function handleClaim(questId, isWeekly) {
    const reward = claimQuestReward(questId, isWeekly);
    if (reward && onReward) onReward(reward);
    // Refresh
    setDailyQuests(getDailyQuests());
    setWeeklyQuests(getWeeklyQuests());
    setStoryProgress(getStoryProgress());
  }

  function handleReadChapter(chapter) {
    markChapterRead(chapter.id);
    setSelectedChapter(chapter);
    setStoryProgress(getStoryProgress());
  }

  function renderQuest(quest, isWeekly) {
    const progress = Math.min(quest.progress || 0, quest.target);
    const pct = (progress / quest.target) * 100;

    return (
      <div key={quest.id} className="bg-gray-800/40 rounded-lg p-2.5 border border-gray-700/30">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white">{quest.name}</span>
          {quest.completed && !quest.claimed && (
            <button
              className="px-2 py-0.5 bg-yellow-600/80 hover:bg-yellow-500 text-white text-[10px] rounded cursor-pointer"
              onClick={() => handleClaim(quest.id, isWeekly)}
            >
              Claim
            </button>
          )}
          {quest.claimed && (
            <span className="text-[10px] text-green-400">✓ Done</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quest.completed ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400">{progress}/{quest.target}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-1">
          Reward: {quest.reward.xp}XP {quest.reward.coins ? `+ ${quest.reward.coins}🪙` : ''}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative w-[280px] max-h-[420px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-medium">📜 Quests</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">{totalCompleted} completed</span>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700/50">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'story', label: 'Story' },
          ].map(t => (
            <button
              key={t.id}
              className={`flex-1 py-2 text-xs cursor-pointer transition-colors ${
                tab === t.id ? 'text-white border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {tab === 'daily' && (
            <>
              {dailyQuests.length === 0 ? (
                <div className="text-center text-gray-500 text-xs mt-4">Loading quests...</div>
              ) : (
                dailyQuests.map(q => renderQuest(q, false))
              )}
            </>
          )}

          {tab === 'weekly' && (
            <>
              {weeklyQuests.length === 0 ? (
                <div className="text-center text-gray-500 text-xs mt-4">Loading quests...</div>
              ) : (
                weeklyQuests.map(q => renderQuest(q, true))
              )}
            </>
          )}

          {tab === 'story' && (
            <>
              {storyProgress.chapters.map(ch => (
                <div
                  key={ch.id}
                  className={`rounded-lg p-2.5 border cursor-pointer transition-colors ${
                    ch.unlocked
                      ? ch.read
                        ? 'bg-gray-800/30 border-gray-700/20'
                        : 'bg-purple-900/20 border-purple-500/30 hover:border-purple-400/50'
                      : 'bg-gray-800/20 border-gray-700/20 opacity-40'
                  }`}
                  onClick={() => ch.unlocked && handleReadChapter(ch)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{ch.unlocked ? (ch.read ? '📖' : '✨') : '🔒'}</span>
                    <div>
                      <div className="text-xs text-white">Ch.{ch.id}: {ch.title}</div>
                      <div className="text-[10px] text-gray-500">
                        {ch.unlocked ? (ch.read ? 'Read' : 'New!') : `${ch.questsRequired} quests needed`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Story chapter modal */}
        <AnimatePresence>
          {selectedChapter && (
            <motion.div
              className="absolute inset-0 bg-gray-900/98 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="text-lg mb-2">📖</div>
                <h3 className="text-white text-sm font-bold mb-2">Ch.{selectedChapter.id}: {selectedChapter.title}</h3>
                <p className="text-gray-300 text-xs leading-relaxed mb-4">{selectedChapter.text}</p>
                <button
                  className="px-4 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer"
                  onClick={() => setSelectedChapter(null)}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default QuestBoard;
