import React from 'react';
import { motion } from 'framer-motion';
import { accessories } from '../data/accessories';

/**
 * Grid of all accessories. Unlocked ones can be equipped/unequipped.
 * Can equip 1 hat + 1 glasses + 1 other simultaneously.
 */
function AccessoryShop({ equippedAccessories, unlockedAccessories, currentLevel, onEquip, onUnequip, onClose }) {
  const categories = ['hat', 'glasses', 'other'];

  function isEquipped(accId) {
    return equippedAccessories.includes(accId);
  }

  function isUnlocked(acc) {
    return unlockedAccessories.includes(acc.id);
  }

  function handleToggle(acc) {
    if (!isUnlocked(acc)) return;

    if (isEquipped(acc.id)) {
      onUnequip(acc.id);
    } else {
      // Unequip any existing accessory in same category first
      const sameCategory = accessories.find(
        (a) => a.category === acc.category && isEquipped(a.id)
      );
      if (sameCategory) {
        onUnequip(sameCategory.id);
      }
      onEquip(acc.id);
    }
  }

  return (
    <motion.div
      className="fixed left-4 top-4 w-[240px] max-h-[360px] overflow-y-auto bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4 z-50"
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -60, opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-semibold text-sm">Accessories</span>
        <button
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          onClick={onClose}
        >
          x
        </button>
      </div>

      {categories.map((category) => {
        const items = accessories.filter((a) => a.category === category);
        return (
          <div key={category} className="mb-3">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">
              {category === 'other' ? 'Other' : category === 'hat' ? 'Hats' : 'Glasses'}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {items.map((acc) => {
                const unlocked = isUnlocked(acc);
                const equipped = isEquipped(acc.id);

                return (
                  <button
                    key={acc.id}
                    className={`relative p-1.5 rounded-lg border transition-all ${
                      equipped
                        ? 'bg-blue-600/30 border-blue-500/50'
                        : unlocked
                        ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                        : 'bg-gray-800/30 border-gray-700/30 opacity-40 cursor-not-allowed'
                    }`}
                    onClick={() => handleToggle(acc)}
                    disabled={!unlocked}
                    title={unlocked ? (equipped ? 'Unequip' : 'Equip') : `Unlock at Lv.${acc.unlockLevel}`}
                  >
                    {/* Mini preview of accessory */}
                    <div className="w-full aspect-square flex items-center justify-center">
                      <div className={`${!unlocked ? 'grayscale' : ''}`}>
                        {acc.pixels.slice(0, 4).map((row, y) => (
                          <div key={y} className="flex justify-center">
                            {row.map((color, x) => (
                              <div
                                key={`${x}-${y}`}
                                style={{
                                  width: '3px',
                                  height: '3px',
                                  backgroundColor: color || 'transparent',
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center mt-1">
                      <div className="text-[9px] text-gray-300 truncate">{acc.name}</div>
                      {!unlocked && (
                        <div className="text-[8px] text-gray-500">Lv.{acc.unlockLevel}</div>
                      )}
                    </div>
                    {equipped && (
                      <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] text-white">&#10003;</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export default AccessoryShop;
