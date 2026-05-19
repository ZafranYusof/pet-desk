import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFoods, getInventory } from '../services/foodService';

function FoodMenu({ petState, onSelectFood, onClose }) {
  const level = petState?.level || 1;
  const foods = getFoods(level);
  const inventory = getInventory();
  const [hoveredFood, setHoveredFood] = useState(null);

  function getEffectText(food) {
    const parts = [];
    if (food.effects.hunger > 0) parts.push(`+${food.effects.hunger} hunger`);
    if (food.effects.hunger < 0) parts.push(`${food.effects.hunger} hunger`);
    if (food.effects.happiness > 0) parts.push(`+${food.effects.happiness} happy`);
    if (food.effects.happiness < 0) parts.push(`${food.effects.happiness} happy`);
    if (food.effects.energy > 0) parts.push(`+${food.effects.energy} energy`);
    if (food.effects.energy < 0) parts.push(`${food.effects.energy} energy`);
    if (food.effects.xp > 0) parts.push(`+${food.effects.xp} XP`);
    if (food.duration) {
      if (food.duration.type === 'xpMultiplier') parts.push(`2x XP ${Math.floor(food.duration.seconds / 60)}min`);
      if (food.duration.type === 'speedBoost') parts.push(`Speed boost ${Math.floor(food.duration.seconds / 60)}min`);
      if (food.duration.type === 'dance') parts.push(`Dance ${food.duration.seconds}s`);
    }
    if (food.id === 'mystery_meat') return 'Random effect!';
    return parts.join(', ') || 'No effect';
  }

  function canUse(food) {
    if (!food.unlocked) return false;
    if (food.isSpecial) {
      return (inventory[food.id] || 0) > 0;
    }
    return true;
  }

  return (
    <motion.div
      className="fixed z-50 w-[260px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <span className="text-white font-semibold text-sm">🍽️ Food Menu</span>
        <button
          className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* Food Grid */}
      <div className="p-3 grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
        {foods.map((food) => {
          const usable = canUse(food);
          const locked = !food.unlocked;
          const count = food.isSpecial ? (inventory[food.id] || 0) : null;

          return (
            <motion.button
              key={food.id}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
                locked
                  ? 'bg-gray-800/50 cursor-not-allowed opacity-50'
                  : usable
                  ? 'bg-gray-800/80 hover:bg-gray-700/80 cursor-pointer'
                  : 'bg-gray-800/50 cursor-not-allowed opacity-60'
              } ${food.isSpecial && usable ? 'ring-1 ring-yellow-500/50' : ''}`}
              disabled={!usable}
              onClick={() => usable && onSelectFood(food.id)}
              onMouseEnter={() => setHoveredFood(food)}
              onMouseLeave={() => setHoveredFood(null)}
              whileHover={usable ? { scale: 1.05 } : {}}
              whileTap={usable ? { scale: 0.95 } : {}}
            >
              <span className="text-2xl mb-0.5">{food.emoji}</span>
              <span className={`text-[10px] leading-tight text-center ${locked ? 'text-gray-600' : 'text-gray-300'}`}>
                {locked ? `Lv.${food.unlockLevel}` : food.name}
              </span>
              {/* Inventory count badge for special foods */}
              {food.isSpecial && !locked && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Tooltip / Hover Info */}
      <AnimatePresence>
        {hoveredFood && (
          <motion.div
            className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm">{hoveredFood.emoji}</span>
              <span className="text-xs text-white font-medium">{hoveredFood.name}</span>
            </div>
            <p className="text-[10px] text-gray-400">{getEffectText(hoveredFood)}</p>
            {hoveredFood.speciesBonus && (
              <p className="text-[10px] text-yellow-400 mt-0.5">
                Bonus: {Object.entries(hoveredFood.speciesBonus).map(([sp, bonus]) =>
                  `${sp}: +${Object.values(bonus)[0]} ${Object.keys(bonus)[0]}`
                ).join(', ')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Effects */}
      {(() => {
        try {
          const stored = localStorage.getItem('petdesk_active_effects');
          const effects = stored ? JSON.parse(stored) : [];
          if (effects.length === 0) return null;
          return (
            <div className="px-4 py-2 border-t border-gray-700/50">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">Active Effects</span>
              {effects.map((eff, i) => (
                <div key={i} className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-300">
                    {eff.foodEmoji} {eff.type === 'xpMultiplier' ? '2x XP' : eff.type === 'speedBoost' ? 'Speed+' : 'Dance'}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono">
                    {Math.floor(eff.remainingSeconds / 60)}:{String(eff.remainingSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          );
        } catch { return null; }
      })()}
    </motion.div>
  );
}

export default FoodMenu;
