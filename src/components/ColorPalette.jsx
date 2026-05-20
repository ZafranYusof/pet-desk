import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PALETTES, loadPalette, savePalette, getPaletteFilter } from '../services/paletteService';

function ColorPalette({ onClose, onApply }) {
  const [currentPalette, setCurrentPalette] = useState(() => loadPalette());
  const [customHue, setCustomHue] = useState(currentPalette.customHue || 0);

  const handleSelect = (paletteId) => {
    const newPalette = { id: paletteId, customHue };
    setCurrentPalette(newPalette);
    savePalette(newPalette);
    if (onApply) onApply(newPalette);
  };

  const handleCustomHue = (e) => {
    const hue = parseInt(e.target.value, 10);
    setCustomHue(hue);
    const newPalette = { id: 'custom', customHue: hue };
    setCurrentPalette(newPalette);
    savePalette(newPalette);
    if (onApply) onApply(newPalette);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl w-80 overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            🎨 Color Palette
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Palette grid */}
        <div className="p-4 grid grid-cols-2 gap-3">
          {PALETTES.map((palette) => (
            <button
              key={palette.id}
              onClick={() => handleSelect(palette.id)}
              className={`p-3 rounded-xl border transition-all text-left ${
                currentPalette.id === palette.id
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
              }`}
            >
              {/* Preview swatch */}
              <div
                className="w-8 h-8 rounded-lg mb-2 bg-green-400"
                style={{ filter: getPaletteFilter(palette.id) }}
              />
              <p className="text-white text-sm font-medium">{palette.name}</p>
              <p className="text-gray-500 text-xs">{palette.description}</p>
            </button>
          ))}
        </div>

        {/* Custom hue slider */}
        <div className="px-4 pb-4">
          <label className="text-gray-400 text-sm block mb-2">Custom Hue Shift</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="360"
              value={customHue}
              onChange={handleCustomHue}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
              }}
            />
            <span className="text-gray-300 text-sm font-mono w-10">{customHue}°</span>
          </div>
          <button
            onClick={() => handleSelect('custom')}
            className={`mt-2 w-full py-1.5 rounded-lg text-sm transition-all ${
              currentPalette.id === 'custom'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Apply Custom
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ColorPalette;
