import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { canBreed, breed, getBreedCooldown, getHybridSpecies, getBreedCost } from '../services/breedingService';
import { hybridSpeciesConfig } from '../data/hybridSprites';
import { getPetSlots } from '../services/multiPetService';
import { getCoins } from '../services/housingService';

function BreedingLab({ petState, onBreedComplete, onClose }) {
  const [slots, setSlots] = useState(() => getPetSlots());
  const [breeding, setBreeding] = useState(false);
  const [breedResult, setBreedResult] = useState(null);
  const [cooldown, setCooldown] = useState(() => getBreedCooldown());
  const [coins, setCoins] = useState(() => getCoins());

  // Get available parents (non-null slots with base species)
  const parents = useMemo(() => {
    return slots.filter(s => s !== null && !hybridSpeciesConfig[s.species]);
  }, [slots]);

  const parent1 = parents[0] || null;
  const parent2 = parents[1] || null;

  // Check breed eligibility
  const breedCheck = useMemo(() => {
    if (!parent1 || !parent2) return { canBreed: false, reason: 'Need 2 pets to breed' };
    return canBreed(parent1, parent2);
  }, [parent1, parent2]);

  // Preview hybrid
  const previewHybrid = useMemo(() => {
    if (!parent1 || !parent2) return null;
    const species = getHybridSpecies(parent1.species, parent2.species);
    if (!species) return null;
    return hybridSpeciesConfig[species];
  }, [parent1, parent2]);

  // Update cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldown(getBreedCooldown());
      setCoins(getCoins());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function formatCooldown(ms) {
    if (ms <= 0) return 'Ready!';
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m left`;
  }

  function handleBreed() {
    if (!breedCheck.canBreed || breeding) return;
    setBreeding(true);

    // Breeding animation delay
    setTimeout(() => {
      const result = breed(parent1, parent2);
      if (result) {
        setBreedResult(result);
        setTimeout(() => {
          onBreedComplete(result);
        }, 3000);
      }
      setBreeding(false);
    }, 2500);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative w-[320px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-medium flex items-center gap-2">
            <span>??</span> Breeding Lab
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Parents */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            {/* Parent 1 */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 bg-gray-800/60 rounded-lg flex items-center justify-center border border-gray-700/30">
                {parent1 ? (
                  <div className="text-2xl">{parent1.species === 'slime' ? '??' : parent1.species === 'cat' ? '??' : '??'}</div>
                ) : (
                  <div className="text-gray-600 text-xs">Empty</div>
                )}
              </div>
              <span className="text-xs text-gray-300">
                {parent1 ? `${parent1.name} Lv.${parent1.level || 1}` : 'No pet'}
              </span>
            </div>

            {/* Plus sign */}
            <div className="text-gray-500 text-lg font-bold">+</div>

            {/* Parent 2 */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 bg-gray-800/60 rounded-lg flex items-center justify-center border border-gray-700/30">
                {parent2 ? (
                  <div className="text-2xl">{parent2.species === 'slime' ? '??' : parent2.species === 'cat' ? '??' : '??'}</div>
                ) : (
                  <div className="text-gray-600 text-xs">Empty</div>
                )}
              </div>
              <span className="text-xs text-gray-300">
                {parent2 ? `${parent2.name} Lv.${parent2.level || 1}` : 'No pet'}
              </span>
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center mb-2">
            <div className="text-gray-500 text-sm">? ------- ?</div>
          </div>

          {/* Result preview */}
          <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/30 mb-3">
            <AnimatePresence mode="wait">
              {breeding ? (
                <motion.div
                  key="breeding"
                  className="flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="text-3xl"
                    animate={{ rotate: [0, 360], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ??
                  </motion.div>
                  <span className="text-xs text-purple-300">Breeding in progress...</span>
                </motion.div>
              ) : breedResult ? (
                <motion.div
                  key="result"
                  className="flex flex-col items-center gap-2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                >
                  <div className="text-3xl">{hybridSpeciesConfig[breedResult.species]?.emoji || '?'}</div>
                  <span className="text-sm text-green-300 font-medium">
                    {hybridSpeciesConfig[breedResult.species]?.name || 'Hybrid'}!
                  </span>
                  <span className="text-xs text-gray-400">
                    {hybridSpeciesConfig[breedResult.species]?.desc}
                  </span>
                </motion.div>
              ) : previewHybrid ? (
                <motion.div
                  key="preview"
                  className="flex flex-col items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-2xl">{previewHybrid.emoji}</div>
                  <span className="text-sm text-gray-200">{previewHybrid.name}</span>
                  <span className="text-xs text-gray-400">{previewHybrid.desc}</span>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="flex flex-col items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-2xl text-gray-600">?</div>
                  <span className="text-xs text-gray-500">Select 2 base species pets</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>Cost: {getBreedCost()} coins</span>
            <span>Have: {coins} coins</span>
          </div>
          <div className="text-xs text-gray-400 mb-3">
            Cooldown: {formatCooldown(cooldown)}
          </div>

          {/* Status message */}
          {!breedCheck.canBreed && (
            <div className="text-xs text-amber-400/80 mb-3 bg-amber-900/20 rounded px-2 py-1">
              {breedCheck.reason}
            </div>
          )}

          {/* Breed button */}
          <button
            onClick={handleBreed}
            disabled={!breedCheck.canBreed || breeding || breedResult}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
              breedCheck.canBreed && !breeding && !breedResult
                ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {breeding ? '?? Breeding...' : breedResult ? '? Success!' : '?? BREED'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BreedingLab;
