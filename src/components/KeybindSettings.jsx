import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadKeybinds, saveKeybinds, getDefaultKeybinds, getKeybindLabel, resetKeybinds, isValidKey } from '../services/keybindService';

function KeybindSettings({ onClose }) {
  const [keybinds, setKeybinds] = useState(() => loadKeybinds());
  const [editingAction, setEditingAction] = useState(null);
  const [listeningKey, setListeningKey] = useState(null);

  useEffect(() => {
    if (!editingAction) return;

    function handleKeyDown(e) {
      e.preventDefault();
      e.stopPropagation();

      let key = '';
      if (e.ctrlKey) key += 'Ctrl+';
      if (e.altKey) key += 'Alt+';
      if (e.shiftKey) key += 'Shift+';

      // Get the actual key
      if (e.key.startsWith('F') && e.key.length <= 3) {
        key = e.key; // F1-F12 (override modifiers for function keys)
      } else if (e.key.length === 1) {
        key += e.key.toUpperCase();
      } else if (e.key === 'Escape') {
        setEditingAction(null);
        setListeningKey(null);
        return;
      } else {
        return; // Ignore other keys
      }

      if (isValidKey(key)) {
        const updated = { ...keybinds, [editingAction]: key };
        setKeybinds(updated);
        saveKeybinds(updated);
        setListeningKey(key);
        setTimeout(() => {
          setEditingAction(null);
          setListeningKey(null);
        }, 300);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingAction, keybinds]);

  const handleReset = () => {
    const defaults = resetKeybinds();
    setKeybinds(defaults);
  };

  const actions = Object.keys(keybinds);

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
            ⌨️ Keybinds
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Keybind list */}
        <div className="p-4 space-y-3">
          {actions.map((action) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">{getKeybindLabel(action)}</span>
              <button
                onClick={() => setEditingAction(action)}
                className={`px-3 py-1 rounded-lg text-sm font-mono transition-all ${
                  editingAction === action
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                } border border-gray-600`}
              >
                {editingAction === action ? 'Press key...' : keybinds[action]}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50 flex justify-between">
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Reset Defaults
          </button>
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

export default KeybindSettings;
