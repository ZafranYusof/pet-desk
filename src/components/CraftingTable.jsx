import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMaterials, getRecipes, getAllRecipes, canCraft, craft, isRecipeDiscovered, canSeeRecipe, getMaterialInfo, getRecipeById } from '../services/craftingService';

function CraftingTable({ petLevel = 1, onCraftResult, onClose }) {
  const [materials, setMaterials] = useState(() => getMaterials());
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [craftAnimation, setCraftAnimation] = useState(false);
  const [toast, setToast] = useState(null);
  const materialInfo = getMaterialInfo();

  // Refresh materials on mount
  useEffect(() => {
    setMaterials(getMaterials());
  }, []);

  const availableRecipes = getRecipes(petLevel);
  const allRecipes = getAllRecipes();

  function handleCraft(recipeId) {
    if (!canCraft(recipeId)) return;

    setCraftAnimation(true);
    setTimeout(() => {
      const result = craft(recipeId);
      setCraftAnimation(false);
      setMaterials(getMaterials());

      if (result) {
        const recipe = getRecipeById(recipeId);
        setToast(`Crafted ${recipe.name}! ${recipe.icon}`);
        setTimeout(() => setToast(null), 3000);
        if (onCraftResult) onCraftResult(result, recipe);
      }
    }, 1200);
  }

  function getRecipeDisplay(recipe) {
    const discovered = isRecipeDiscovered(recipe.id);
    const canSee = canSeeRecipe(recipe.id);
    const levelLocked = recipe.unlockLevel > petLevel;

    if (levelLocked) {
      return { name: '???', icon: '🔒', hint: `Unlocks at Lv.${recipe.unlockLevel}`, locked: true };
    }
    if (!discovered && !canSee) {
      return { name: '???', icon: '❓', hint: 'Gather materials to reveal...', locked: true };
    }
    return { name: recipe.name, icon: recipe.icon, hint: null, locked: false };
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="relative w-[320px] h-[380px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <span className="text-sm font-medium text-gray-200">🔨 Crafting Table</span>
          <button
            className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Materials bar */}
        <div className="px-4 py-2 border-b border-gray-800/50">
          <div className="flex flex-wrap gap-2 text-xs text-gray-300">
            {Object.entries(materialInfo).map(([key, info]) => (
              <span key={key} className={materials[key] > 0 ? 'text-gray-200' : 'text-gray-600'}>
                {info.emoji}{materials[key] || 0}
              </span>
            ))}
          </div>
        </div>

        {/* Recipe list + detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Recipe list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin">
            {allRecipes.map((recipe) => {
              const display = getRecipeDisplay(recipe);
              const craftable = !display.locked && canCraft(recipe.id);
              const isSelected = selectedRecipe?.id === recipe.id;

              return (
                <button
                  key={recipe.id}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-gray-700/80 border border-gray-600/50'
                      : 'hover:bg-gray-800/60 border border-transparent'
                  } ${display.locked ? 'opacity-50' : ''}`}
                  onClick={() => !display.locked && setSelectedRecipe(recipe)}
                  disabled={display.locked}
                >
                  <span className="text-base">{display.icon}</span>
                  <span className={`flex-1 ${craftable ? 'text-green-300' : 'text-gray-300'}`}>
                    {display.name}
                  </span>
                  {display.hint && (
                    <span className="text-[10px] text-gray-500">{display.hint}</span>
                  )}
                  {!display.locked && (
                    <span className="flex gap-1 text-[10px] text-gray-500">
                      {Object.entries(recipe.materials).map(([mat, count]) => (
                        <span key={mat} className={(materials[mat] || 0) >= count ? 'text-green-400' : 'text-red-400'}>
                          {materialInfo[mat]?.emoji}{count}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected recipe detail */}
          {selectedRecipe && (
            <div className="px-4 py-3 border-t border-gray-700/50 bg-gray-800/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{selectedRecipe.icon}</span>
                <span className="text-sm font-medium text-gray-200">{selectedRecipe.name}</span>
                <span className="text-[10px] text-gray-500 ml-auto">
                  {selectedRecipe.result.type === 'accessory' && '🎀 Accessory'}
                  {selectedRecipe.result.type === 'food' && '🍽️ Food'}
                  {selectedRecipe.result.type === 'boost' && '⚡ Boost'}
                  {selectedRecipe.result.type === 'special' && '✨ Special'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-gray-400">Needs:</span>
                {Object.entries(selectedRecipe.materials).map(([mat, count]) => (
                  <span
                    key={mat}
                    className={`text-xs ${(materials[mat] || 0) >= count ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {materialInfo[mat]?.emoji}{materials[mat] || 0}/{count}
                  </span>
                ))}
              </div>
              <button
                className={`w-full py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  canCraft(selectedRecipe.id)
                    ? 'bg-green-600/80 hover:bg-green-500/80 text-white'
                    : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!canCraft(selectedRecipe.id) || craftAnimation}
                onClick={() => handleCraft(selectedRecipe.id)}
              >
                {craftAnimation ? '✨ Crafting...' : 'CRAFT'}
              </button>
            </div>
          )}
        </div>

        {/* Craft animation overlay */}
        <AnimatePresence>
          {craftAnimation && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-4xl"
                animate={{ rotate: [0, 360], scale: [1, 1.5, 1] }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              >
                ✨
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-green-800/90 text-green-100 text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default CraftingTable;
