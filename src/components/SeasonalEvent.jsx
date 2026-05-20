import React from 'react';
import { motion } from 'framer-motion';
import { getActiveSeasonalEvent, hasClaimedReward, claimSeasonalReward } from '../services/seasonalService';

function SeasonalEvent({ petState, onClaimReward, onClose }) {
  const event = getActiveSeasonalEvent();

  if (!event) return null;

  const claimed = hasClaimedReward(event.id);

  const handleClaim = () => {
    if (claimed) return;
    const reward = claimSeasonalReward(event.id);
    if (reward && onClaimReward) {
      onClaimReward(reward);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className={`relative bg-gradient-to-br ${event.bgColor} backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl w-80 overflow-hidden`}
        initial={{ scale: 0.8, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 30 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Header */}
        <div className="p-6 text-center">
          <motion.div
            className="text-5xl mb-3"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {event.emoji}
          </motion.div>
          <h2 className="text-white text-xl font-bold">{event.name}</h2>
          <p className="text-gray-300 text-sm mt-1">{event.banner}</p>
        </div>

        {/* Rewards */}
        <div className="px-6 pb-4">
          <div className="bg-black/30 rounded-xl p-4 space-y-2">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Event Bonuses</p>
            <div className="flex items-center gap-2 text-white text-sm">
              <span>⚡</span>
              <span>{event.xpMultiplier}x XP Multiplier</span>
            </div>
            {event.accessories.length > 0 && (
              <div className="flex items-center gap-2 text-white text-sm">
                <span>🎁</span>
                <span>Limited accessory: {event.accessories[0]}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white text-sm">
              <span>✨</span>
              <span>Special {event.particles} particles</span>
            </div>
          </div>
        </div>

        {/* Claim button */}
        <div className="p-6 pt-2">
          {claimed ? (
            <div className="w-full py-3 rounded-xl bg-gray-700/50 text-gray-400 text-center text-sm">
              ✅ Reward Claimed
            </div>
          ) : (
            <motion.button
              onClick={handleClaim}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🎁 Claim Reward (+50 XP)
            </motion.button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
}

/**
 * Small banner that shows at top when event is active
 */
export function SeasonalBanner({ onOpen }) {
  const event = getActiveSeasonalEvent();
  if (!event) return null;

  return (
    <motion.div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] cursor-pointer"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      whileHover={{ scale: 1.05 }}
    >
      <div className={`bg-gradient-to-r ${event.bgColor} backdrop-blur-md px-4 py-2 rounded-full border border-gray-600/50 shadow-lg`}>
        <span className="text-white text-sm">
          {event.emoji} {event.name} — {event.xpMultiplier}x XP Active!
        </span>
      </div>
    </motion.div>
  );
}

export default SeasonalEvent;
