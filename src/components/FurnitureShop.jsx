import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getAllFurniture, getFurnitureByCategory, getCategories } from '../data/furniture';
import { getOwnedFurniture, buyFurniture, getCoins } from '../services/housingService';

const categoryLabels = {
  all: '🏷️ All',
  bed: '🛏️ Beds',
  table: '🪑 Tables',
  decoration: '🎨 Decor',
  floor: '🟫 Floor',
  wallpaper: '🖼️ Wall',
};

function FurnitureShop({ petLevel = 1, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [coins, setCoins] = useState(() => getCoins());
  const [owned, setOwned] = useState(() => getOwnedFurniture());
  const [hoveredItem, setHoveredItem] = useState(null);
  const [buyMessage, setBuyMessage] = useState(null);

  const items = activeCategory === 'all'
    ? getAllFurniture()
    : getFurnitureByCategory(activeCategory);

  const handleBuy = (item) => {
    if (owned.includes(item.id)) return;
    if (petLevel < item.unlockLevel) return;
    if (coins < item.cost) {
      setBuyMessage('Not enough coins!');
      setTimeout(() => setBuyMessage(null), 2000);
      return;
    }

    const success = buyFurniture(item.id);
    if (success) {
      setCoins(getCoins());
      setOwned(getOwnedFurniture());
      setBuyMessage(`Bought ${item.name}!`);
      setTimeout(() => setBuyMessage(null), 2000);
    }
  };

  return (
    <motion.div
      className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-[320px] h-[380px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛒</span>
            <span className="text-white font-medium text-sm">Furniture Shop</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-yellow-400 text-xs font-medium">💰 {coins}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-700/30">
          {['all', ...getCategories()].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-1 rounded-md text-xs whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/60 text-gray-400 hover:bg-gray-600/60 hover:text-gray-200'
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>

        {/* Buy message toast */}
        {buyMessage && (
          <div className="px-3 py-1">
            <div className="bg-gray-800 rounded-md px-2 py-1 text-xs text-center text-yellow-300">
              {buyMessage}
            </div>
          </div>
        )}

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => {
              const isOwned = owned.includes(item.id);
              const isLocked = petLevel < item.unlockLevel;
              const cantAfford = !isOwned && !isLocked && coins < item.cost;

              return (
                <div
                  key={item.id}
                  className={`relative flex flex-col items-center p-2 rounded-lg border transition-all ${
                    isOwned
                      ? 'border-green-600/50 bg-green-900/20'
                      : isLocked
                      ? 'border-gray-700/30 bg-gray-800/30 opacity-50'
                      : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500/70 hover:bg-gray-700/50'
                  }`}
                  onMouseEnter={() => setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Item preview */}
                  <div
                    className="w-10 h-10 rounded-md mb-1 flex items-center justify-center"
                    style={item.size ? item.cssStyle : { ...item.cssStyle, width: '100%', height: '100%' }}
                  >
                    <span className="text-lg">{item.emoji}</span>
                  </div>

                  {/* Name */}
                  <span className="text-[10px] text-gray-300 text-center leading-tight truncate w-full">
                    {item.name}
                  </span>

                  {/* Status / Price */}
                  {isOwned ? (
                    <span className="text-[10px] text-green-400 mt-0.5">✓ Owned</span>
                  ) : isLocked ? (
                    <span className="text-[10px] text-gray-500 mt-0.5">🔒 Lvl {item.unlockLevel}</span>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      className={`mt-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer transition-colors ${
                        cantAfford
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-600/80 hover:bg-yellow-500 text-white'
                      }`}
                      disabled={cantAfford}
                    >
                      💰 {item.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredItem && (
          <div className="px-3 py-2 border-t border-gray-700/50 bg-gray-800/80">
            <div className="flex items-start gap-2">
              <span className="text-base">{hoveredItem.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white font-medium">{hoveredItem.name}</div>
                <div className="text-[10px] text-gray-400">{hoveredItem.description}</div>
                {hoveredItem.bonus && (
                  <div className="text-[10px] text-purple-300 mt-0.5">
                    Bonus: +{Math.round(hoveredItem.bonus.value * 100)}% {hoveredItem.bonus.type}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default FurnitureShop;
