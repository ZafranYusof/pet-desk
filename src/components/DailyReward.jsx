import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { checkDailyReward, claimReward, dismissReward, getWeekStatus, getStreak } from '../services/dailyRewards';

function DailyReward({ petState, onClaim, onClose }) {
  const [claimed, setClaimed] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);
  const reward = checkDailyReward();
  const weekStatus = getWeekStatus();
  const streak = getStreak();

  if (!reward && !claimed) {
    return null;
  }

  const handleClaim = () => {
    const { petState: updated, reward: claimedReward } = claimReward(petState);
    setRewardInfo(claimedReward);
    setClaimed(true);
    onClaim(updated);

    // Auto close after 2.5s
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <motion.div
      className="fixed z-[90] w-[250px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-orange-500/50 shadow-2xl overflow-hidden"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="p-4 flex flex-col items-center gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-bold text-orange-300">
            {claimed ? 'Reward Claimed!' : 'Daily Reward'}
          </span>
          <span className="text-lg">🔥</span>
        </div>

        {/* Streak counter */}
        <div className="text-center">
          <span className="text-2xl font-bold text-orange-400">
            {claimed ? rewardInfo?.streak || streak : streak + 1}
          </span>
          <p className="text-[10px] text-gray-400">day streak</p>
        </div>

        {/* Week calendar strip */}
        <div className="flex gap-1 w-full justify-center">
          {weekStatus.map((day) => (
            <div
              key={day.date}
              className={`flex flex-col items-center px-1.5 py-1 rounded-md text-[9px] ${
                day.isToday
                  ? claimed
                    ? 'bg-green-800/40 border border-green-500/50'
                    : 'bg-orange-800/40 border border-orange-500/50'
                  : day.claimed
                    ? 'bg-green-900/30'
                    : 'bg-gray-800/40'
              }`}
            >
              <span className="text-gray-500">{day.day}</span>
              <span className="text-sm">
                {day.claimed || (day.isToday && claimed) ? '✅' : day.isToday ? '🎁' : '⬜'}
              </span>
            </div>
          ))}
        </div>

        {/* Reward info */}
        {!claimed && reward && (
          <div className="text-center">
            <p className="text-xs text-gray-300">Day {reward.day} Reward:</p>
            <p className="text-sm font-medium text-yellow-300">{reward.description}</p>
            {reward.multiplier > 1 && (
              <p className="text-[10px] text-orange-400">×{reward.multiplier} streak bonus!</p>
            )}
          </div>
        )}

        {/* Claimed reward display */}
        {claimed && rewardInfo && (
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
          >
            <p className="text-sm font-medium text-green-300">+{rewardInfo.xp} XP</p>
            {rewardInfo.accessory && (
              <p className="text-xs text-purple-300">🎁 New accessory unlocked!</p>
            )}
            {rewardInfo.badge && (
              <p className="text-xs text-yellow-300">🏅 Streak Master badge!</p>
            )}
          </motion.div>
        )}

        {/* Claim button */}
        {!claimed && (
          <motion.button
            className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors"
            onClick={handleClaim}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Claim Reward!
          </motion.button>
        )}

        {/* Close button */}
        <button
          onClick={() => { if (!claimed) dismissReward(); onClose(); }}
          className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer"
        >
          {claimed ? 'Nice!' : 'Skip'}
        </button>
      </div>
    </motion.div>
  );
}

export default DailyReward;
