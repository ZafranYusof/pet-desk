import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sprites, speciesConfig } from '../data/sprites';
import PetSprite from './PetSprite';

/**
 * Small floating panel showing unlocked pets as thumbnails.
 * Click to switch active pet. Locked pets shown greyed out.
 */
function PetSelector({ currentSpecies, unlockedSpecies, currentLevel, onSelect, onClose }) {
  const allSpecies = Object.entries(speciesConfig);

  return (
    <motion.div
      className="fixed left-4 top-4 w-[200px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4 z-50"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-semibold text-sm">Choose Pet</span>
        <button
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          onClick={onClose}
        >
          x
        </button>
      </div>

      <div className="space-y-2">
        {allSpecies.map(([id, config]) => {
          const isUnlocked = unlockedSpecies.includes(id);
          const isCurrent = currentSpecies === id;
          const spriteKey = `${config.prefix}_idle`;
          const spriteData = sprites[spriteKey];

          return (
            <button
              key={id}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                isCurrent
                  ? 'bg-blue-600/30 border border-blue-500/50'
                  : isUnlocked
                  ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-transparent'
                  : 'bg-gray-800/30 border border-transparent opacity-50 cursor-not-allowed'
              }`}
              onClick={() => isUnlocked && onSelect(id)}
              disabled={!isUnlocked}
              title={isUnlocked ? `Switch to ${config.name}` : `Unlock at Level ${config.unlockLevel}`}
            >
              <div className={`w-10 h-10 flex items-center justify-center ${!isUnlocked ? 'grayscale' : ''}`}>
                {spriteData && <PetSprite sprite={spriteData} scale={0.5} />}
              </div>
              <div className="text-left">
                <div className={`text-xs font-medium ${isCurrent ? 'text-blue-300' : isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                  {config.name}
                </div>
                <div className="text-xs text-gray-500">
                  {isUnlocked
                    ? isCurrent ? 'Active' : 'Click to switch'
                    : `Unlock at Lv.${config.unlockLevel}`
                  }
                </div>
              </div>
              {isCurrent && (
                <div className="ml-auto w-2 h-2 rounded-full bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default PetSelector;
