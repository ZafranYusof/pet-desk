import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Auto-save indicator - flashes briefly when pet state is saved
 */
function AutoSaveIndicator({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-4 right-4 z-[60] flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-700/50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <motion.svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-400"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.4 }}
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </motion.svg>
          <span className="text-green-400 text-xs font-medium">Saved</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AutoSaveIndicator;
