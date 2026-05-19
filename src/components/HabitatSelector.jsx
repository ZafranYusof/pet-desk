import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHabitats } from '../services/habitatService';

const habitatPreviewColors = {
  desktop: '#1a1a2e',
  forest: '#2d5a27',
  space: '#1a0533',
  ocean: '#0e5f8a',
  castle: '#3d3d3d',
  neon: '#0a0a0f',
};

const habitatIcons = {
  desktop: '🖥️',
  forest: '🌲',
  space: '🚀',
  ocean: '🌊',
  castle: '🏰',
  neon: '🌃',
};

function HabitatSelector({ currentLevel, activeHabitat, onSelect, onClose }) {
  const habitats = getHabitats(currentLevel);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-[280px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-200">🏠 Habitats</h2>
          <button
            className="text-gray-400 hover:text-gray-200 text-lg leading-none cursor-pointer"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div className="p-3 grid grid-cols-2 gap-2 max-h-[260px] overflow-y-auto">
          {habitats.map((habitat, index) => {
            const isActive = habitat.id === activeHabitat;
            const isLocked = !habitat.unlocked;

            return (
              <motion.button
                key={habitat.id}
                className={`relative p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'border-green-500/70 bg-green-500/10'
                    : isLocked
                    ? 'border-gray-700/50 bg-gray-800/50 opacity-60'
                    : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-500/50 hover:bg-gray-700/50'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (!isLocked) onSelect(habitat.id);
                }}
                disabled={isLocked}
              >
                {/* Preview color swatch */}
                <div
                  className="w-full h-10 rounded-lg mb-1.5 flex items-center justify-center text-lg"
                  style={{ backgroundColor: habitatPreviewColors[habitat.id] }}
                >
                  {habitatIcons[habitat.id]}
                </div>

                {/* Name */}
                <p className="text-xs font-medium text-gray-200 truncate">
                  {habitat.name}
                </p>

                {/* Status */}
                {isLocked ? (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    🔒 Level {habitat.unlockLevel}
                  </p>
                ) : isActive ? (
                  <p className="text-[10px] text-green-400 mt-0.5">
                    ✓ Active
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {habitat.description}
                  </p>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default HabitatSelector;
