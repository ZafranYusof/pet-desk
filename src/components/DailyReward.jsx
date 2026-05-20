import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkDailyReward, claimReward, dismissReward, getWeekStatus, getStreak } from '../services/dailyRewards';

function Sparkle({ delay, x, y }) {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        y: [0, -20],
      }}
      transition={{ duration: 1.2, delay, repeat: Infinity, repeatDelay: 2 }}
    />
  );
}

function GiftBox({ opened }) {
  return (
    <motion.div className="relative text-4xl" animate={opened ? { scale: [1, 1.3, 1] } : {}}>
      <motion.span
        animate={!opened ? {
          rotate: [-3, 3, -3],
          y: [0, -2, 0],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="inline-block"
      >
        {opened ? '✨' : '🎁'}
      </motion.span>
    </motion.div>
  );
}

const rarityGlow = {
  common: 'shadow-[0_0_20px_rgba(255,255,255,0.1)]',
  rare: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500/50',
  epic: 'shadow-[0_0_24px_rgba(168,85,247,0.4)] border-purple-500/50',
  legendary: 'shadow-[0_0_28px_rgba(251,191,36,0.5)] border-yellow-500/50',
};

function DailyReward({ petState, onClaim, onClose }) {
  const [claimed, setClaimed] = useState(false);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [animating, setAnimating] = useState(false);
  const reward = checkDailyReward();
  const weekStatus = getWeekStatus();
  const streak = getStreak();

  if (!reward && !claimed) {
    return null;
  }

  const handleClaim = () => {
    setAnimating(true);
    setTimeout(() => {
      const { petState: updated, reward: claimedReward } = claimReward(petState);
      setRewardInfo(claimedReward);
      setClaimed(true);
      setAnimating(false);
      onClaim(updated);

      setTimeout(() => {
        onClose();
      }, 3000);
    }, 600);
  };

  const rarity = rewardInfo?.rarity || 'common';

  return (
    <motion.div
      className={`fixed z-[90] w-[270px] bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-orange-500/40 overflow-hidden ${claimed ? rarityGlow[rarity] || '' : 'shadow-2xl shadow-black/60'}`}
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.7, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: 30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      {/* Top gradient accent */}
      <div className="h-[2px] bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500" />

      {/* Sparkle particles when claimed */}
      {claimed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <Sparkle
              key={i}
              delay={i * 0.15}
              x={15 + Math.random() * 70}
              y={10 + Math.random() * 80}
            />
          ))}
        </div>
      )}

      <div className="p-5 flex flex-col items-center gap-3 relative">
        {/* Header */}
        <div className="flex items-center gap-2">
          <motion.span
            className="text-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🔥
          </motion.span>
          <span className="text-sm font-bold text-orange-300">
            {claimed ? 'Reward Claimed!' : 'Daily Reward'}
          </span>
          <motion.span
            className="text-lg"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            🔥
          </motion.span>
        </div>

        {/* Gift box / Streak counter */}
        <div className="relative">
          {!claimed ? (
            <GiftBox opened={false} />
          ) : (
            <GiftBox opened={true} />
          )}
        </div>

        {/* Streak */}
        <div className="text-center">
          <motion.span
            className="text-3xl font-black bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent"
            key={claimed ? 'claimed' : 'pending'}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {claimed ? rewardInfo?.streak || streak : streak + 1}
          </motion.span>
          <p className="text-[10px] text-gray-400 mt-0.5">day streak</p>
        </div>

        {/* Week calendar strip */}
        <div className="flex gap-1.5 w-full justify-center">
          {weekStatus.map((day, i) => (
            <motion.div
              key={day.date}
              className={`flex flex-col items-center px-2 py-1.5 rounded-lg text-[9px] transition-all ${
                day.isToday
                  ? claimed
                    ? 'bg-green-500/20 border border-green-500/40 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
                    : 'bg-orange-500/20 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                  : day.claimed
                    ? 'bg-green-900/30 border border-green-800/30'
                    : 'bg-white/5 border border-white/5'
              }`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <span className="text-gray-500 font-medium">{day.day}</span>
              <span className="text-sm mt-0.5">
                {day.claimed || (day.isToday && claimed) ? '✅' : day.isToday ? '🎁' : '⬜'}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Reward info */}
        {!claimed && reward && (
          <motion.div
            className="text-center bg-white/5 rounded-xl px-4 py-2 border border-white/5 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[11px] text-gray-400">Day {reward.day} Reward:</p>
            <p className="text-sm font-medium text-yellow-300 mt-0.5">{reward.description}</p>
            {reward.multiplier > 1 && (
              <p className="text-[10px] text-orange-400 mt-0.5">×{reward.multiplier} streak bonus!</p>
            )}
          </motion.div>
        )}

        {/* Claimed reward display */}
        {claimed && rewardInfo && (
          <motion.div
            className="text-center"
            initial={{ scale: 0, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
          >
            <p className="text-lg font-bold text-green-300">+{rewardInfo.xp} XP</p>
            {rewardInfo.accessory && (
              <p className="text-xs text-purple-300 mt-1">🎁 New accessory unlocked!</p>
            )}
            {rewardInfo.badge && (
              <p className="text-xs text-yellow-300 mt-1">🏅 Streak Master badge!</p>
            )}
          </motion.div>
        )}

        {/* Claim button */}
        {!claimed && (
          <motion.button
            className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-white text-sm font-bold rounded-xl cursor-pointer transition-all shadow-[0_0_16px_rgba(249,115,22,0.3)] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)]"
            onClick={handleClaim}
            disabled={animating}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {animating ? '...' : '🎉 Claim Reward!'}
          </motion.button>
        )}

        {/* Close/skip */}
        <button
          onClick={() => { if (!claimed) dismissReward(); onClose(); }}
          className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
        >
          {claimed ? 'Nice!' : 'Skip for now'}
        </button>
      </div>
    </motion.div>
  );
}

export default DailyReward;
