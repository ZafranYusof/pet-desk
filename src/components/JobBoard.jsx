import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getJobs, startJob, getJobProgress, collectJobReward, cancelJob, isOnJob, getCooldownRemaining } from '../services/jobService';

function JobBoard({ petState, onClose, onReward }) {
  const [progress, setProgress] = useState(() => getJobProgress());
  const [cooldown, setCooldown] = useState(() => getCooldownRemaining());
  const [message, setMessage] = useState(null);

  const level = petState?.level || 1;
  const stats = {
    gardenUnlocked: true, // assume unlocked if they have garden
    battlesWon: petState?.battlesWon || 0,
    storyChapter: petState?.storyChapter || 0,
  };

  const jobs = getJobs(level, stats);

  // Update progress every second
  useEffect(() => {
    const interval = setInterval(() => {
      const p = getJobProgress();
      setProgress(p);
      setCooldown(getCooldownRemaining());

      // Auto-check completion
      if (p && p.complete) {
        // Job is done, ready to collect
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleStartJob(jobId) {
    const result = startJob(jobId);
    if (result.success) {
      setProgress(getJobProgress());
      setMessage('Started shift! 💼');
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage(result.reason);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function handleCollect() {
    const rewards = collectJobReward();
    if (rewards) {
      setProgress(null);
      if (onReward) onReward(rewards);
      const parts = [`+${rewards.xp} XP`];
      if (rewards.material) parts.push(`+1 ${rewards.material}`);
      if (rewards.attackBonus) parts.push(`+${rewards.attackBonus} ATK`);
      if (rewards.goldDust) parts.push(`+${rewards.goldDust} Gold Dust`);
      if (rewards.rareFood) parts.push('🍖 Rare Food!');
      setMessage(`Rewards: ${parts.join(', ')}`);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  function handleCancel() {
    cancelJob();
    setProgress(null);
    setCooldown(30);
    setMessage('Job cancelled. 30min cooldown.');
    setTimeout(() => setMessage(null), 3000);
  }

  function formatTime(minutes) {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${minutes}m`;
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[300px] max-h-[400px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <span className="text-white font-bold text-sm">💼 Job Board</span>
          <button
            className="text-gray-400 hover:text-white text-lg cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* Message toast */}
          <AnimatePresence>
            {message && (
              <motion.div
                className="text-xs text-center text-yellow-300 bg-yellow-900/30 rounded-lg px-2 py-1"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current job progress */}
          {progress && (
            <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-600/30">
              <div className="text-xs text-gray-400 mb-1">Currently Working</div>
              <div className="text-sm text-white font-medium mb-2">
                {progress.jobIcon} {progress.jobName}
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-1">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{progress.percent}%</span>
                <span>{progress.complete ? 'Done!' : `${formatTime(progress.remainingMin)} left`}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {progress.complete ? (
                  <button
                    className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
                    onClick={handleCollect}
                  >
                    ✨ Collect Reward
                  </button>
                ) : (
                  <button
                    className="flex-1 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/60 text-red-300 text-xs rounded-lg cursor-pointer transition-colors"
                    onClick={handleCancel}
                  >
                    Cancel Job
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cooldown notice */}
          {!progress && cooldown > 0 && (
            <div className="text-xs text-center text-orange-300 bg-orange-900/20 rounded-lg px-2 py-1.5">
              ⏳ Cooldown: {cooldown} min remaining
            </div>
          )}

          {/* Available jobs */}
          <div className="text-xs text-gray-500 uppercase tracking-wide">Available Jobs</div>
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`rounded-xl p-3 border transition-colors ${
                job.unlocked
                  ? 'bg-gray-800/40 border-gray-600/30 hover:border-gray-500/50'
                  : 'bg-gray-800/20 border-gray-700/20 opacity-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white">
                  {job.icon} {job.name}
                </span>
                <span className="text-xs text-gray-400">
                  {job.shiftHours >= 1 ? `${job.shiftHours}h` : `${job.shiftHours * 60}m`}
                </span>
              </div>
              <div className="text-xs text-gray-400 mb-1">
                +{job.rewards.xp} XP
                {job.rewards.materialChance > 0 && (
                  <span className="text-gray-500">
                    {' '}• {Math.round(job.rewards.materialChance * 100)}% {job.rewards.material}
                  </span>
                )}
                {job.rewards.attackBonus && (
                  <span className="text-orange-400"> • +{job.rewards.attackBonus} ATK</span>
                )}
                {job.rewards.goldDust && (
                  <span className="text-yellow-400"> • +{job.rewards.goldDust} Gold</span>
                )}
              </div>
              <div className="text-xs text-gray-500 italic mb-2">"{job.flavor}"</div>
              {job.unlocked ? (
                <button
                  className={`w-full px-2 py-1 text-xs rounded-lg cursor-pointer transition-colors ${
                    progress || cooldown > 0
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600/80 hover:bg-blue-500 text-white'
                  }`}
                  disabled={!!progress || cooldown > 0}
                  onClick={() => handleStartJob(job.id)}
                >
                  {progress ? 'Already Working' : cooldown > 0 ? 'On Cooldown' : 'Start Shift'}
                </button>
              ) : (
                <div className="text-xs text-red-400">🔒 {job.lockReason}</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default JobBoard;
