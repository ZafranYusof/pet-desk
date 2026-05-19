import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startDungeon,
  loadDungeonState,
  moveToRoom,
  doCombatAction,
  buyPotion,
  endDungeon,
  getHighestFloor,
  getRoomInfo,
} from '../services/dungeonService';

function DungeonCrawler({ petState, onClose, onReward }) {
  const [dungeon, setDungeon] = useState(() => loadDungeonState());
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);

  // Start new dungeon if none active
  useEffect(() => {
    if (!dungeon) {
      const newState = startDungeon(petState);
      setDungeon(newState);
    }
  }, []);

  const handleMove = useCallback((x, y) => {
    if (!dungeon || dungeon.inCombat || dungeon.gameOver) return;
    const newState = moveToRoom(dungeon, x, y);
    setDungeon({ ...newState });
  }, [dungeon]);

  const handleCombatAction = useCallback((action) => {
    if (!dungeon || !dungeon.inCombat) return;
    const newState = doCombatAction(dungeon, action);
    // Trigger animations
    if (action === 'attack') {
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 300);
    }
    if (newState.hp < dungeon.hp) {
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 300);
    }
    setDungeon({ ...newState });
  }, [dungeon]);

  const handleBuyPotion = useCallback(() => {
    if (!dungeon) return;
    const newState = buyPotion(dungeon);
    setDungeon({ ...newState });
  }, [dungeon]);

  const handleEndRun = useCallback(() => {
    if (!dungeon) return;
    const rewards = endDungeon(dungeon);
    onReward(rewards);
    onClose();
  }, [dungeon, onReward, onClose]);

  const handleNewRun = useCallback(() => {
    const newState = startDungeon(petState);
    setDungeon(newState);
  }, [petState]);

  if (!dungeon) return null;

  const { map, currentRoom, explored, hp, maxHp, potions, currentFloor, inCombat, currentEnemy, combatLog, roomMessage, gameOver, victory, coins, inventory } = dungeon;

  // Determine which rooms are visible (visited + adjacent to current)
  const isVisible = (x, y) => {
    if (explored.includes(`${x},${y}`)) return true;
    // Adjacent to current room
    const dx = Math.abs(x - currentRoom.x);
    const dy = Math.abs(y - currentRoom.y);
    return dx + dy === 1;
  };

  const isExplored = (x, y) => explored.includes(`${x},${y}`);
  const isCurrent = (x, y) => x === currentRoom.x && y === currentRoom.y;
  const isAdjacent = (x, y) => {
    const dx = Math.abs(x - currentRoom.x);
    const dy = Math.abs(y - currentRoom.y);
    return dx + dy === 1;
  };

  const hpPercent = Math.round((hp / maxHp) * 100);
  const hpColor = hpPercent > 60 ? 'bg-green-500' : hpPercent > 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        className="relative w-[350px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        style={{ maxHeight: '420px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏰</span>
            <span className="text-white text-sm font-medium">Dungeon - Floor {currentFloor}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* HP & Potions */}
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>HP</span>
              <span>{hp}/{maxHp}</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${hpColor} rounded-full`}
                animate={{ width: `${hpPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            {Array.from({ length: potions }, (_, i) => (
              <span key={i}>🧪</span>
            ))}
            {potions === 0 && <span className="text-gray-500 text-xs">No potions</span>}
          </div>
        </div>

        {/* Coins */}
        <div className="px-4 pb-1 flex items-center gap-2 text-xs text-yellow-400">
          <span>💰 {coins || 0} coins</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">Best: Floor {getHighestFloor()}</span>
        </div>

        {/* Map Grid */}
        {!gameOver && (
          <div className="px-4 py-2">
            <div className="grid gap-[2px] mx-auto" style={{ gridTemplateColumns: `repeat(${map.size}, 1fr)`, width: 'fit-content' }}>
              {Array.from({ length: map.size }, (_, y) =>
                Array.from({ length: map.size }, (_, x) => {
                  const visible = isVisible(x, y);
                  const current = isCurrent(x, y);
                  const adjacent = isAdjacent(x, y);
                  const explored2 = isExplored(x, y);
                  const room = map.grid[y][x];
                  const roomInfo = getRoomInfo(room.type);

                  let cellContent = '';
                  let cellBg = 'bg-gray-800/40';
                  let cellBorder = 'border-gray-700/30';
                  let clickable = false;

                  if (current) {
                    cellContent = '★';
                    cellBg = 'bg-indigo-600/60';
                    cellBorder = 'border-indigo-400/60';
                  } else if (visible && explored2) {
                    cellContent = roomInfo.symbol;
                    cellBg = 'bg-gray-700/40';
                  } else if (visible && !explored2) {
                    cellContent = '?';
                    cellBg = 'bg-gray-700/20';
                    cellBorder = 'border-gray-600/40';
                    clickable = !inCombat;
                  } else {
                    cellContent = '';
                    cellBg = 'bg-gray-900/80';
                  }

                  return (
                    <button
                      key={`${x}-${y}`}
                      className={`w-[30px] h-[30px] flex items-center justify-center text-xs border rounded ${cellBg} ${cellBorder} ${
                        clickable ? 'cursor-pointer hover:bg-gray-600/40' : 'cursor-default'
                      } transition-colors`}
                      onClick={() => clickable && handleMove(x, y)}
                      disabled={!clickable}
                    >
                      {cellContent}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Room Message */}
        <div className="px-4 py-1">
          <p className="text-xs text-gray-300 italic text-center">{roomMessage}</p>
        </div>

        {/* Combat UI */}
        {inCombat && currentEnemy && (
          <div className="px-4 py-2 border-t border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <motion.div
                animate={shakeEnemy ? { x: [0, -4, 4, -4, 0] } : {}}
                transition={{ duration: 0.3 }}
              >
                <span className="text-sm text-red-400 font-medium">{currentEnemy.name}</span>
              </motion.div>
              <span className="text-xs text-gray-400">
                HP: {currentEnemy.hp}/{currentEnemy.maxHp}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-300"
                style={{ width: `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%` }}
              />
            </div>
            {/* Combat log (last 2 entries) */}
            <div className="mb-2 max-h-[32px] overflow-hidden">
              {combatLog.slice(-2).map((msg, i) => (
                <p key={i} className="text-[10px] text-gray-400">{msg}</p>
              ))}
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleCombatAction('attack')}
                className="flex-1 px-2 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
              >
                ⚔️ Attack
              </button>
              <button
                onClick={() => handleCombatAction('heal')}
                disabled={potions <= 0}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                  potions > 0
                    ? 'bg-green-600/80 hover:bg-green-500 text-white cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                🧪 Heal ({potions})
              </button>
              <button
                onClick={() => handleCombatAction('flee')}
                className="flex-1 px-2 py-1.5 bg-gray-600/80 hover:bg-gray-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
              >
                🏃 Flee
              </button>
            </div>
          </div>
        )}

        {/* Shop UI */}
        {!inCombat && !gameOver && map.grid[currentRoom.y]?.[currentRoom.x]?.type === 'shop' && (
          <div className="px-4 py-2 border-t border-gray-700/50">
            <button
              onClick={handleBuyPotion}
              disabled={(coins || 0) < 20}
              className={`w-full px-3 py-1.5 text-xs rounded-lg transition-colors ${
                (coins || 0) >= 20
                  ? 'bg-yellow-600/80 hover:bg-yellow-500 text-white cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              🧪 Buy Potion (20 coins)
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="px-4 py-3 border-t border-gray-700/50 text-center">
            <p className="text-sm font-medium mb-1 text-white">
              {victory ? '🎉 Dungeon Conquered!' : '💀 Defeated!'}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Reached Floor {currentFloor} | {coins || 0} coins | {(inventory || []).length} items
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEndRun}
                className="flex-1 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
              >
                Collect Rewards
              </button>
              <button
                onClick={handleNewRun}
                className="flex-1 px-3 py-1.5 bg-gray-600/80 hover:bg-gray-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loot summary (when not in combat) */}
        {!inCombat && !gameOver && (inventory || []).length > 0 && (
          <div className="px-4 py-1 border-t border-gray-700/30">
            <p className="text-[10px] text-gray-500">
              Loot: {inventory.slice(-3).map((item, i) => (
                <span key={i} className="text-gray-400">
                  {item.name || `${item.quantity} coins`}{i < Math.min(inventory.length, 3) - 1 ? ', ' : ''}
                </span>
              ))}
              {inventory.length > 3 && <span className="text-gray-500"> +{inventory.length - 3} more</span>}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default DungeonCrawler;
