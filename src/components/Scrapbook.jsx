import React from 'react';
import { motion } from 'framer-motion';
import { getScrapbookEntries } from '../services/scrapbookService';

function Scrapbook({ onClose }) {
  const entries = getScrapbookEntries();

  return (
    <motion.div
      className="fixed z-50 w-[280px] h-[350px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base">📸</span>
          <span className="text-sm font-medium text-gray-200">Scrapbook</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-700">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-3xl mb-2">📖</span>
            <p className="text-sm text-gray-400">Your pet's story starts here...</p>
            <p className="text-[10px] text-gray-600 mt-1">Milestones will appear as you play!</p>
          </div>
        ) : (
          <div className="relative pl-4">
            {/* Vertical timeline line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-700/50 rounded-full" />

            {entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="relative mb-3 last:mb-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                {/* Timeline dot */}
                <div className="absolute -left-4 top-1.5 w-[10px] h-[10px] rounded-full bg-gray-700 border-2 border-gray-500 z-10" />

                {/* Entry card */}
                <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/30">
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0">{entry.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium text-gray-200 truncate">
                          {entry.title}
                        </span>
                        <span className="text-[9px] text-gray-600 flex-shrink-0">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                        {entry.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export default Scrapbook;
