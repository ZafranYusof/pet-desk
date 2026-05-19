import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { id: 'feed', icon: '🍖', label: 'Feed', disableCheck: (state) => state?.hunger > 90 },
  { id: 'play', icon: '🎮', label: 'Play', disableCheck: (state) => state?.energy < 10 },
  { id: 'sleep', icon: '😴', label: 'Sleep' },
  { id: 'stats', icon: '📊', label: 'Stats' },
  { id: 'rename', icon: '✏️', label: 'Rename' },
  { id: 'close', icon: '❌', label: 'Close' },
];

function ContextMenu({ x = 0, y = 0, petState, onAction, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.9, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -5 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      <div className="py-1">
        {menuItems.map((item) => {
          const disabled = item.disableCheck ? item.disableCheck(petState) : false;
          return (
            <button
              key={item.id}
              className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                disabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-200 hover:bg-gray-700/60 cursor-pointer'
              }`}
              disabled={disabled}
              onClick={() => {
                if (item.id === 'close') {
                  onClose();
                } else {
                  onAction(item.id);
                }
              }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ContextMenu;
