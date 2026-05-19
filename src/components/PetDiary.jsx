import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDiaryEntries } from '../services/diaryService';

function PetDiary({ onClose }) {
  const entries = getDiaryEntries();

  return (
    <motion.div
      className="fixed z-50 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden"
      style={{
        width: 250,
        height: 300,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <span className="text-sm font-medium text-gray-200">📖 Pet Diary</span>
        <button
          className="text-gray-400 hover:text-gray-200 text-xs cursor-pointer"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Entries */}
      <div className="overflow-y-auto h-[256px] px-3 py-2 space-y-3">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-xs text-center italic">
              No diary entries yet. Check back tomorrow!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry, index) => (
              <motion.div
                key={entry.timestamp || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="border-b border-gray-800/50 pb-2 last:border-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">{entry.date}</span>
                  <span className="text-sm">{entry.moodEmoji}</span>
                </div>
                <p className="text-xs text-gray-300 italic leading-relaxed">
                  {entry.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

export default PetDiary;
