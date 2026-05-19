import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import plants, { getPlantById } from '../data/plants';
import {
  getGarden,
  plantSeed,
  waterPlant,
  harvestPlant,
  removeWithered,
  getPlantStage,
  getGrowthProgress,
  needsWater,
  isWithered,
  tickGarden,
  isPlotUnlocked,
  getPlotUnlockLevel,
  getTimeRemaining,
  formatTime,
} from '../services/gardenService';

function PlotVisual({ plot, plant, stage }) {
  if (!plot.plantId) return null;

  if (plot.isWithered) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <span className="text-2xl opacity-50 grayscale">🥀</span>
        <span className="text-[9px] text-gray-500 mt-0.5">Withered</span>
      </div>
    );
  }

  if (stage === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="w-3 h-3 rounded-full bg-amber-800/80" />
        <span className="text-[9px] text-gray-400 mt-1">Seed</span>
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="w-1 h-5 bg-green-500 rounded-full" />
        <div className="w-3 h-2 bg-green-400 rounded-full -mt-1" />
        <span className="text-[9px] text-gray-400 mt-0.5">Sprout</span>
      </div>
    );
  }

  if (stage === 2) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full">
        <div className="w-1.5 h-7 bg-green-600 rounded-full" />
        <div className="w-5 h-3 bg-green-500 rounded-full -mt-1" />
        <div className="w-4 h-2 bg-green-400 rounded-full -mt-0.5" />
        <span className="text-[9px] text-gray-400 mt-0.5">Growing</span>
      </div>
    );
  }

  // Stage 3 - Ready
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <motion.span
        className="text-2xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {plant?.emoji || '🌱'}
      </motion.span>
      <span className="text-[9px] text-green-400 mt-0.5 font-medium">Ready!</span>
    </div>
  );
}

function GardenPlot({ plot, index, level, selectedPlant, onPlant, onWater, onHarvest, onRemove }) {
  const unlocked = isPlotUnlocked(index, level);
  const plant = plot.plantId ? getPlantById(plot.plantId) : null;
  const stage = plot.plantId ? getPlantStage(plot) : -1;
  const waterNeeded = plot.plantId && !plot.isWithered ? needsWater(plot) : false;
  const progress = plot.plantId ? getGrowthProgress(plot) : 0;
  const timeLeft = plot.plantId && !plot.isWithered ? getTimeRemaining(plot) : null;

  if (!unlocked) {
    return (
      <div className="w-[88px] h-[88px] rounded-lg bg-gray-800/60 border border-gray-700/40 flex flex-col items-center justify-center gap-1 cursor-not-allowed">
        <span className="text-lg opacity-50">🔒</span>
        <span className="text-[9px] text-gray-500">Level {getPlotUnlockLevel(index)}</span>
      </div>
    );
  }

  // Empty plot
  if (!plot.plantId) {
    return (
      <motion.div
        className={`w-[88px] h-[88px] rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
          selectedPlant
            ? 'bg-amber-900/40 border-amber-600/60 hover:bg-amber-900/60'
            : 'bg-amber-900/20 border-gray-700/40 hover:bg-amber-900/30'
        }`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => selectedPlant && onPlant(index, selectedPlant)}
      >
        <span className="text-lg opacity-40">➕</span>
        <span className="text-[9px] text-gray-500">
          {selectedPlant ? 'Click to plant' : 'Empty'}
        </span>
      </motion.div>
    );
  }

  // Planted plot
  return (
    <motion.div
      className={`w-[88px] h-[88px] rounded-lg border relative flex flex-col items-center justify-center overflow-hidden ${
        stage === 3
          ? 'bg-green-900/30 border-green-500/60 shadow-[0_0_8px_rgba(34,197,94,0.3)]'
          : plot.isWithered
          ? 'bg-gray-800/40 border-gray-600/40'
          : 'bg-amber-900/20 border-gray-700/40'
      }`}
      whileHover={{ scale: 1.03 }}
    >
      {/* Water needed indicator */}
      <AnimatePresence>
        {waterNeeded && !plot.isWithered && (
          <motion.div
            className="absolute top-1 right-1"
            animate={{ y: [0, -2, 0], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <span className="text-sm">💧</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {!plot.isWithered && stage < 3 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/60">
          <motion.div
            className="h-full bg-green-500/80 rounded-r"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Plant visual */}
      <PlotVisual plot={plot} plant={plant} stage={stage} />

      {/* Time remaining */}
      {!plot.isWithered && stage < 3 && timeLeft !== null && (
        <span className="absolute bottom-1.5 text-[8px] text-gray-400">
          {formatTime(timeLeft)}
        </span>
      )}

      {/* Action overlay on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/50 rounded-lg flex items-center justify-center">
        {plot.isWithered ? (
          <button
            className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded cursor-pointer"
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        ) : stage === 3 ? (
          <button
            className="text-[10px] bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded cursor-pointer font-medium"
            onClick={() => onHarvest(index)}
          >
            ✨ Harvest
          </button>
        ) : waterNeeded ? (
          <button
            className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded cursor-pointer"
            onClick={() => onWater(index)}
          >
            💧 Water
          </button>
        ) : (
          <span className="text-[10px] text-gray-300">Growing...</span>
        )}
      </div>
    </motion.div>
  );
}

function Garden({ level, onClose, onReward }) {
  const [gardenPlots, setGardenPlots] = useState(() => getGarden());
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [harvestPopup, setHarvestPopup] = useState(null);
  const [waterAnim, setWaterAnim] = useState(null);

  // Tick garden every 10 seconds to update stages
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = tickGarden();
      setGardenPlots([...updated]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Refresh on mount
  useEffect(() => {
    const updated = tickGarden();
    setGardenPlots([...updated]);
  }, []);

  const availablePlants = plants.filter((p) => level >= p.unlockLevel);

  const handlePlant = useCallback((plotIndex, plantId) => {
    const updated = plantSeed(plotIndex, plantId);
    setGardenPlots([...updated]);
    setSelectedPlant(null);
  }, []);

  const handleWater = useCallback((plotIndex) => {
    const updated = waterPlant(plotIndex);
    setGardenPlots([...updated]);
    setWaterAnim(plotIndex);
    setTimeout(() => setWaterAnim(null), 1000);
  }, []);

  const handleHarvest = useCallback((plotIndex) => {
    const { plots, reward } = harvestPlant(plotIndex);
    setGardenPlots([...plots]);
    if (reward) {
      setHarvestPopup(reward);
      onReward(reward);
      setTimeout(() => setHarvestPopup(null), 2500);
    }
  }, [onReward]);

  const handleRemove = useCallback((plotIndex) => {
    const updated = removeWithered(plotIndex);
    setGardenPlots([...updated]);
  }, []);

  return (
    <motion.div
      className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-[340px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-medium text-gray-200">Garden</span>
          </div>
          <button
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Garden grid */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 justify-items-center">
            {gardenPlots.map((plot, i) => (
              <GardenPlot
                key={i}
                plot={plot}
                index={i}
                level={level}
                selectedPlant={selectedPlant}
                onPlant={handlePlant}
                onWater={handleWater}
                onHarvest={handleHarvest}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>

        {/* Plant selector */}
        <div className="px-4 pb-3 border-t border-gray-700/40 pt-3">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 block">
            Select a seed to plant
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700">
            {availablePlants.map((plant) => (
              <motion.button
                key={plant.id}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  selectedPlant === plant.id
                    ? 'bg-green-900/40 border-green-500/60'
                    : 'bg-gray-800/40 border-gray-700/40 hover:bg-gray-700/40'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPlant(selectedPlant === plant.id ? null : plant.id)}
              >
                <span className="text-base">{plant.emoji}</span>
                <span className="text-[9px] text-gray-300 whitespace-nowrap">{plant.name}</span>
                <span className="text-[8px] text-gray-500">{formatTime(plant.growthTime)}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Water animation overlay */}
        <AnimatePresence>
          {waterAnim !== null && (
            <motion.div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full"
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 60,
                    y: Math.random() * 40 + 20,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Harvest popup */}
        <AnimatePresence>
          {harvestPopup && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
            >
              <div className="bg-gray-800/95 border border-green-500/60 rounded-xl px-4 py-3 shadow-xl text-center">
                <div className="text-2xl mb-1">✨ {harvestPopup.plantEmoji}</div>
                <div className="text-sm text-green-400 font-medium">Harvested!</div>
                <div className="text-xs text-gray-300 mt-1">
                  {harvestPopup.type === 'food' && `Got ${harvestPopup.foodName}`}
                  {harvestPopup.type === 'stats' && (
                    <>
                      {harvestPopup.happiness && `+${harvestPopup.happiness} happiness `}
                      {harvestPopup.xp && `+${harvestPopup.xp} XP `}
                      {harvestPopup.energy && `+${harvestPopup.energy} energy`}
                    </>
                  )}
                  {harvestPopup.type === 'accessory' && 'Unlocked an accessory!'}
                  {harvestPopup.type === 'accessory_special' && `Unlocked ${harvestPopup.accessoryName}!`}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Garden;
