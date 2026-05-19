import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoomState, saveRoomState, placeFurniture, removeFurniture, moveFurniture, getOwnedFurniture, getCoins, getRoomBonus, ROOM_GRID_WIDTH, ROOM_GRID_HEIGHT } from '../services/housingService';
import { getFurnitureById, getAllFurniture } from '../data/furniture';
import FurnitureShop from './FurnitureShop';

// CSS keyframe animations for furniture
const furnitureAnimations = `
@keyframes lava-blob {
  0%, 100% { border-radius: 30% 30% 40% 40%; }
  25% { border-radius: 35% 25% 45% 35%; }
  50% { border-radius: 25% 35% 35% 45%; }
  75% { border-radius: 40% 30% 30% 40%; }
}
@keyframes fish-swim {
  0%, 100% { box-shadow: inset 8px 6px 0 2px #fb923c; }
  50% { box-shadow: inset -8px 4px 0 2px #fb923c; }
}
@keyframes neon-flicker {
  0%, 95%, 100% { opacity: 1; }
  96% { opacity: 0.4; }
  97% { opacity: 1; }
  98% { opacity: 0.6; }
}
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4); }
  50% { box-shadow: 0 0 30px rgba(99,102,241,0.7); }
}
@keyframes rgb-border {
  0% { border-color: #10b981; }
  33% { border-color: #6366f1; }
  66% { border-color: #f43f5e; }
  100% { border-color: #10b981; }
}
@keyframes star-twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
`;

const animationMap = {
  'lava-blob': 'lava-blob 3s ease-in-out infinite',
  'fish-swim': 'fish-swim 2s ease-in-out infinite',
  'neon-flicker': 'neon-flicker 4s ease-in-out infinite',
  'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  'rgb-border': 'rgb-border 3s linear infinite',
  'star-twinkle': 'star-twinkle 2s ease-in-out infinite',
};

function PetRoom({ petLevel = 1, onClose }) {
  const [roomState, setRoomState] = useState(() => getRoomState());
  const [editMode, setEditMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showBonuses, setShowBonuses] = useState(false);
  const [showPlaceList, setShowPlaceList] = useState(false);
  const [coins, setCoins] = useState(() => getCoins());
  const [dragOffset, setDragOffset] = useState(null);

  const cellW = 350 / ROOM_GRID_WIDTH; // ~43.75px per cell
  const cellH = 240 / ROOM_GRID_HEIGHT; // 40px per cell
  const roomBonus = getRoomBonus();

  useEffect(() => {
    setCoins(getCoins());
  }, [showShop]);

  const refreshRoom = useCallback(() => {
    setRoomState(getRoomState());
    setCoins(getCoins());
  }, []);

  const handleCellClick = (x, y) => {
    if (!editMode) return;

    // Check if clicking on existing furniture
    const idx = roomState.furniture.findIndex((item) => {
      const def = getFurnitureById(item.id);
      if (!def || !def.size) return false;
      return x >= item.position.x && x < item.position.x + def.size.w &&
             y >= item.position.y && y < item.position.y + def.size.h;
    });

    if (idx >= 0) {
      setSelectedIndex(idx);
    } else {
      setSelectedIndex(null);
    }
  };

  const handleMove = (direction) => {
    if (selectedIndex === null) return;
    const item = roomState.furniture[selectedIndex];
    if (!item) return;

    const newPos = { ...item.position };
    switch (direction) {
      case 'up': newPos.y = Math.max(0, newPos.y - 1); break;
      case 'down': newPos.y += 1; break;
      case 'left': newPos.x = Math.max(0, newPos.x - 1); break;
      case 'right': newPos.x += 1; break;
    }

    if (moveFurniture(selectedIndex, newPos)) {
      refreshRoom();
    }
  };

  const handleRemove = () => {
    if (selectedIndex === null) return;
    removeFurniture(selectedIndex);
    setSelectedIndex(null);
    refreshRoom();
  };

  const handlePlaceItem = (furnitureId) => {
    // Find first available position
    const def = getFurnitureById(furnitureId);
    if (!def || !def.size) return;

    for (let y = 0; y <= ROOM_GRID_HEIGHT - def.size.h; y++) {
      for (let x = 0; x <= ROOM_GRID_WIDTH - def.size.w; x++) {
        if (placeFurniture(furnitureId, { x, y })) {
          refreshRoom();
          setShowPlaceList(false);
          return;
        }
      }
    }
    // No space available
    setShowPlaceList(false);
  };

  const wallpaperDef = getFurnitureById(roomState.wallpaper);
  const floorDef = getFurnitureById(roomState.floor);

  const ownedFurniture = getOwnedFurniture();
  const placeableFurniture = ownedFurniture
    .map((id) => getFurnitureById(id))
    .filter((f) => f && f.size && f.category !== 'floor' && f.category !== 'wallpaper');

  if (showShop) {
    return <FurnitureShop petLevel={petLevel} onClose={() => { setShowShop(false); refreshRoom(); }} />;
  }

  return (
    <motion.div
      className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <style>{furnitureAnimations}</style>
      <div className="w-[380px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏠</span>
            <span className="text-white font-medium text-sm">Pet Room</span>
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

        {/* Room View */}
        <div className="p-3">
          <div
            className="relative w-[350px] h-[240px] rounded-lg overflow-hidden border border-gray-600/50"
            style={{ ...wallpaperDef?.cssStyle }}
          >
            {/* Floor (bottom 40%) */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[40%]"
              style={{ ...floorDef?.cssStyle }}
            />

            {/* Grid overlay in edit mode */}
            {editMode && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                {Array.from({ length: ROOM_GRID_HEIGHT }).map((_, y) =>
                  Array.from({ length: ROOM_GRID_WIDTH }).map((_, x) => (
                    <div
                      key={`${x}-${y}`}
                      className="absolute border border-white/10"
                      style={{
                        left: x * cellW,
                        top: y * cellH,
                        width: cellW,
                        height: cellH,
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {/* Click grid for edit mode */}
            {editMode && (
              <div className="absolute inset-0" style={{ zIndex: 5 }}>
                {Array.from({ length: ROOM_GRID_HEIGHT }).map((_, y) =>
                  Array.from({ length: ROOM_GRID_WIDTH }).map((_, x) => (
                    <div
                      key={`click-${x}-${y}`}
                      className="absolute cursor-pointer hover:bg-white/5"
                      style={{
                        left: x * cellW,
                        top: y * cellH,
                        width: cellW,
                        height: cellH,
                      }}
                      onClick={() => handleCellClick(x, y)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Furniture items */}
            {roomState.furniture.map((item, idx) => {
              const def = getFurnitureById(item.id);
              if (!def || !def.size) return null;

              const isSelected = editMode && selectedIndex === idx;
              const style = {
                ...def.cssStyle,
                position: 'absolute',
                left: item.position.x * cellW,
                top: item.position.y * cellH,
                width: def.size.w * cellW - 2,
                height: def.size.h * cellH - 2,
                zIndex: isSelected ? 10 : 2,
                transition: 'left 0.2s, top 0.2s',
                ...(def.animation && animationMap[def.animation] ? { animation: animationMap[def.animation] } : {}),
                ...(isSelected ? { outline: '2px solid #60a5fa', outlineOffset: '2px' } : {}),
              };

              return (
                <div key={idx} style={style} title={def.name}>
                  {/* Emoji label */}
                  <span className="absolute top-0 left-0 text-xs opacity-70 select-none pointer-events-none">
                    {def.emoji}
                  </span>
                </div>
              );
            })}

            {/* Pet sprite placeholder (small dot walking) */}
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-green-400 shadow-lg shadow-green-400/50"
              style={{ zIndex: 3 }}
              animate={{
                x: [140, 180, 200, 160, 140],
                y: [180, 175, 185, 190, 180],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Edit mode controls */}
        {editMode && selectedIndex !== null && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2 bg-gray-800/80 rounded-lg p-2">
              <span className="text-xs text-gray-300 flex-1">
                {getFurnitureById(roomState.furniture[selectedIndex]?.id)?.name || 'Item'}
              </span>
              <div className="flex gap-1">
                <button onClick={() => handleMove('left')} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white cursor-pointer">←</button>
                <button onClick={() => handleMove('up')} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white cursor-pointer">↑</button>
                <button onClick={() => handleMove('down')} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white cursor-pointer">↓</button>
                <button onClick={() => handleMove('right')} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white cursor-pointer">→</button>
              </div>
              <button
                onClick={handleRemove}
                className="px-2 py-1 bg-red-600/80 hover:bg-red-500 rounded text-xs text-white cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {/* Place furniture list */}
        <AnimatePresence>
          {showPlaceList && (
            <motion.div
              className="px-3 pb-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="bg-gray-800/80 rounded-lg p-2 max-h-[100px] overflow-y-auto">
                <div className="text-xs text-gray-400 mb-1">Place furniture:</div>
                <div className="flex flex-wrap gap-1">
                  {placeableFurniture.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => handlePlaceItem(f.id)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white cursor-pointer"
                      title={f.name}
                    >
                      {f.emoji} {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bonuses tooltip */}
        <AnimatePresence>
          {showBonuses && (
            <motion.div
              className="px-3 pb-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="bg-gray-800/80 rounded-lg p-2">
                <div className="text-xs text-gray-400 mb-1">Room Bonuses:</div>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-400">⚡ Energy +{Math.round(roomBonus.energy * 100)}%</span>
                  <span className="text-blue-400">✨ XP +{Math.round(roomBonus.xp * 100)}%</span>
                  <span className="text-pink-400">💖 Happy +{Math.round(roomBonus.happiness * 100)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom buttons */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-700/50">
          <button
            onClick={() => { setEditMode(!editMode); setSelectedIndex(null); setShowPlaceList(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              editMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {editMode ? '✓ Done' : '✏️ Edit'}
          </button>
          {editMode && (
            <button
              onClick={() => setShowPlaceList(!showPlaceList)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 cursor-pointer"
            >
              + Place
            </button>
          )}
          <button
            onClick={() => setShowShop(true)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 cursor-pointer"
          >
            🛒 Shop
          </button>
          <button
            onClick={() => setShowBonuses(!showBonuses)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              showBonuses ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📊 Bonuses
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default PetRoom;
