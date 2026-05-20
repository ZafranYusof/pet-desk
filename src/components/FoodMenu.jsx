import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFoods, getInventory } from '../services/foodService';

const foodCategories = ['All', 'Meals', 'Snacks', 'Treats', 'Special'];

function FoodMenu({ petState, onSelectFood, onClose }) {
  const level = petState?.level || 1;
  const foods = getFoods(level);
  const inventory = getInventory();
  const [hoveredFood, setHoveredFood] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

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
      if (food.duration.type === 'speedBoost') parts.push(`Speed+ ${Math.floor(food.duration.seconds / 60)}min`);
      if (food.duration.type === 'dance') parts.push(`Dance ${food.duration.seconds}s`);
    }
    if (food.id === 'mystery_meat') return 'Random effect!';
    return parts.join(', ') || 'No effect';
  }

  function getFoodCategory(food) {
    if (food.isSpecial) return 'Special';
    if (food.effects.hunger >= 30) return 'Meals';
    if (food.effects.happiness > food.effects.hunger) return 'Treats';
    return 'Snacks';
  }

  function canUse(food) {
    if (!food.unlocked) return false;
    if (food.isSpecial) {
      return (inventory[food.id] || 0) > 0;
    }
    return true;
  }

  const filteredFoods = activeTab === 'All'
    ? foods
    : foods.filter(f => getFoodCategory(f) === activeTab);

  return (
    <motion.div
      className="fixed z-50 w-[300px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden"
      style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 10 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
        <span className="text-white font-semibold text-sm">🍽️ Food Menu</span>
        <button
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-gray-700/60 transition-all"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-0.5 px-3 py-2 border-b border-gray-700/30 overflow-x-auto">
        {foodCategories.map(cat => (
          <button
            key={cat}
            className={`relative px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition-all whitespace-nowrap ${
              activeTab === cat
                ? 'text-white bg-purple-600/50 border border-purple-500/40'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
            onClick={() => setActiveTab(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Food Grid */}
      <div className="p-3 grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto custom-scrollbar">
        {filteredFoods.map((food) => {
          const usable = canUse(food);
          const locked = !food.unlocked;
          const count = food.isSpecial ? (inventory[food.id] || 0) : null;

          return (
            <motion.button
              key={food.id}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                locked
                  ? 'bg-gray-800/30 border-gray-700/20 cursor-not-allowed opacity-40'
                  : usable
                  ? 'bg-gray-800/60 border-gray-700/30 hover:border-purple-500/40 cursor-pointer'
                  : 'bg-gray-800/30 border-gray-700/20 cursor-not-allowed opacity-50'
              } ${food.isSpecial && usable ? 'border-yellow-500/40 bg-yellow-900/10' : ''}`}
              disabled={!usable}
              onClick={() => usable && onSelectFood(food.id)}
              onMouseEnter={() => setHoveredFood(food)}
              onMouseLeave={() => setHoveredFood(null)}
              whileHover={usable ? { scale: 1.08, y: -3 } : {}}
              whileTap={usable ? { scale: 0.92 } : {}}
            >
              <span className="text-2xl mb-0.5 drop-shadow-sm">{food.emoji}</span>
              <span className={`text-[9px] leading-tight text-center truncate w-full ${locked ? 'text-gray-600' : 'text-gray-300'}`}>
                {locked ? `🔒 Lv.${food.unlockLevel}` : food.name}
              </span>
              {/* Inventory count badge */}
              {food.isSpecial && !locked && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_6px_rgba(251,191,36,0.4)]">
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
            className="px-4 py-2.5 border-t border-gray-700/40 bg-gray-800/40"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.12 }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm">{hoveredFood.emoji}</span>
              <span className="text-xs text-white font-medium">{hoveredFood.name}</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-medium">{getEffectText(hoveredFood)}</p>
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
            <div className="px-4 py-2 border-t border-gray-700/40">
              <span className="text-[9px] text-gray-500 uppercase tracking-wide font-medium">Active Effects</span>
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
