import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FURNITURE_CATALOG, GRID_COLS, GRID_ROWS,
  getDecoRoom, saveDecoRoom, getOwnedDecorations, buyDecoration,
  canPlace, getDecoFurnitureById, getDecorationBonuses
} from '../services/decorationService';
import { getCoins, spendCoins } from '../services/housingService';

function HomeDecorator({ onClose }) {
  const [room, setRoom] = useState(() => getDecoRoom());
  const [owned, setOwned] = useState(() => getOwnedDecorations());
  const [coins, setCoins] = useState(() => getCoins());
  const [selectedItem, setSelectedItem] = useState(null);
  const [dragItem, setDragItem] = useState(null);
  const [shopTab, setShopTab] = useState(false);
  const [message, setMessage] = useState(null);

  const bonuses = getDecorationBonuses();

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleBuy = (itemId) => {
    const item = FURNITURE_CATALOG.find(f => f.id === itemId);
    if (!item) return;
    if (coins < item.cost) {
      showMessage('Not enough coins!');
      return;
    }
    const result = buyDecoration(itemId, coins);
    if (result.success) {
      spendCoins(result.cost);
      setCoins(getCoins());
      setOwned(getOwnedDecorations());
      showMessage(`Bought ${item.name}!`);
    } else {
      showMessage(result.reason);
    }
  };

  const handleGridClick = (x, y) => {
    if (!selectedItem) return;

    if (canPlace(room, selectedItem, x, y)) {
      const newRoom = { ...room, placed: [...room.placed, { id: selectedItem, x, y }] };
      saveDecoRoom(newRoom);
      setRoom(newRoom);
      setSelectedItem(null);
      showMessage('Placed!');
    } else {
      showMessage('Can\'t place here!');
    }
  };

  const handleRemove = (index) => {
    const newRoom = { ...room, placed: room.placed.filter((_, i) => i !== index) };
    saveDecoRoom(newRoom);
    setRoom(newRoom);
    showMessage('Removed!');
  };

  // Get items placed at each grid cell for rendering
  const getGridContent = () => {
    const grid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
    room.placed.forEach((placed, idx) => {
      const item = FURNITURE_CATALOG.find(f => f.id === placed.id);
      if (!item) return;
      // Mark the top-left cell with the item info
      if (placed.y < GRID_ROWS && placed.x < GRID_COLS) {
        grid[placed.y][placed.x] = { item, idx, isOrigin: true };
      }
      // Mark other cells as occupied
      for (let dy = 0; dy < item.size.h; dy++) {
        for (let dx = 0; dx < item.size.w; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = placed.y + dy, nx = placed.x + dx;
          if (ny < GRID_ROWS && nx < GRID_COLS) {
            grid[ny][nx] = { item, idx, isOrigin: false };
          }
        }
      }
    });
    return grid;
  };

  const gridContent = getGridContent();

  // Available items to place (owned but not all placed)
  const placedIds = room.placed.map(p => p.id);
  const availableToPlace = owned.filter(id => {
    const count = placedIds.filter(pid => pid === id).length;
    return count === 0; // Can only place each item once
  });

  return (
    <motion.div
      className="fixed z-50 w-[380px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: '480px' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base">🏠</span>
          <span className="text-sm font-medium text-gray-200">Home Decorator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-400">🪙 {coins}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer">✕</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2">
        <button
          className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-all ${!shopTab ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40' : 'bg-gray-800/40 text-gray-400 border border-gray-700/30'}`}
          onClick={() => setShopTab(false)}
        >
          🏠 Room
        </button>
        <button
          className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-all ${shopTab ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40' : 'bg-gray-800/40 text-gray-400 border border-gray-700/30'}`}
          onClick={() => setShopTab(true)}
        >
          🛒 Shop
        </button>
      </div>

      {/* Message toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="mx-3 mt-2 px-2 py-1 bg-gray-800/80 rounded-lg text-xs text-center text-gray-300"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {!shopTab ? (
        <div className="p-3 flex-1 overflow-y-auto">
          {/* Bonuses display */}
          <div className="flex gap-2 mb-2 text-[10px] text-gray-400">
            {bonuses.energy > 0 && <span>⚡+{bonuses.energy.toFixed(1)}/tick</span>}
            {bonuses.happiness > 0 && <span>😊+{bonuses.happiness.toFixed(1)}/tick</span>}
            {bonuses.xp > 0 && <span>✨+{bonuses.xp.toFixed(1)}/tick</span>}
          </div>

          {/* Grid */}
          <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/40 mb-3">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
              {Array(GRID_ROWS).fill(null).map((_, row) =>
                Array(GRID_COLS).fill(null).map((_, col) => {
                  const cell = gridContent[row][col];
                  const isHighlight = selectedItem && canPlace(room, selectedItem, col, row);

                  return (
                    <motion.button
                      key={`${row}-${col}`}
                      className={`aspect-square rounded border flex items-center justify-center text-sm cursor-pointer transition-all ${
                        cell?.isOrigin
                          ? 'bg-purple-900/30 border-purple-500/40'
                          : cell
                          ? 'bg-gray-700/30 border-gray-600/20'
                          : isHighlight
                          ? 'bg-green-900/30 border-green-500/40 hover:bg-green-800/40'
                          : 'bg-gray-800/40 border-gray-700/20 hover:bg-gray-700/30'
                      }`}
                      onClick={() => {
                        if (cell?.isOrigin) {
                          handleRemove(cell.idx);
                        } else if (!cell) {
                          handleGridClick(col, row);
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={cell?.isOrigin ? `${cell.item.name} (click to remove)` : selectedItem ? 'Click to place' : ''}
                    >
                      {cell?.isOrigin && <span>{cell.item.emoji}</span>}
                      {!cell && isHighlight && <span className="text-[8px] text-green-400">+</span>}
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>

          {/* Available items to place */}
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Available to Place</div>
          <div className="grid grid-cols-5 gap-1">
            {availableToPlace.map((itemId) => {
              const item = FURNITURE_CATALOG.find(f => f.id === itemId);
              if (!item) return null;
              const isSelected = selectedItem === itemId;
              return (
                <motion.button
                  key={itemId}
                  className={`flex flex-col items-center p-1.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-900/40 border-purple-500/50'
                      : 'bg-gray-800/40 border-gray-700/30 hover:bg-gray-700/40'
                  }`}
                  onClick={() => setSelectedItem(isSelected ? null : itemId)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={`${item.name} (${item.size.w}x${item.size.h})`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-[8px] text-gray-400 truncate w-full text-center">{item.name}</span>
                </motion.button>
              );
            })}
            {availableToPlace.length === 0 && (
              <span className="col-span-5 text-[10px] text-gray-500 text-center py-2">No items available. Buy from shop!</span>
            )}
          </div>
        </div>
      ) : (
        /* Shop */
        <div className="p-3 flex-1 overflow-y-auto space-y-1.5">
          {FURNITURE_CATALOG.map((item) => {
            const isOwned = owned.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  isOwned ? 'bg-green-900/10 border-green-700/30' : 'bg-gray-800/40 border-gray-700/30'
                }`}
              >
                <span className="text-lg">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-200">{item.name}</div>
                  <div className="text-[9px] text-gray-500">{item.description} • {item.size.w}x{item.size.h}</div>
                  <div className="text-[9px] text-purple-400">
                    {item.bonus.type === 'energy' && `⚡ +${item.bonus.value} energy/tick`}
                    {item.bonus.type === 'happiness' && `😊 +${item.bonus.value} happiness/tick`}
                    {item.bonus.type === 'xp' && `✨ +${item.bonus.value} xp/tick`}
                  </div>
                </div>
                {isOwned ? (
                  <span className="text-[10px] text-green-400">Owned ✓</span>
                ) : (
                  <motion.button
                    className={`px-2 py-1 rounded-lg text-[10px] cursor-pointer ${
                      coins >= item.cost
                        ? 'bg-yellow-600/40 text-yellow-200 border border-yellow-500/40 hover:bg-yellow-600/60'
                        : 'bg-gray-700/40 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                    }`}
                    onClick={() => handleBuy(item.id)}
                    disabled={coins < item.cost}
                    whileHover={coins >= item.cost ? { scale: 1.05 } : {}}
                    whileTap={coins >= item.cost ? { scale: 0.95 } : {}}
                  >
                    🪙 {item.cost}
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default HomeDecorator;
