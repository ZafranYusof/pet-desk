import React from 'react';
import { motion } from 'framer-motion';
import { getActivityLog } from '../services/activityLogService';

function ActivityLog({ onClose }) {
  const log = getActivityLog();

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl w-80 max-h-[500px] flex flex-col overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="text-white text-lg font-bold flex items-center gap-2">
            📋 Activity Log
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {log.length === 0 ? (
            <div className="text-gray-500 text-center py-8 text-sm">
              No activities yet. Your pet's adventures will show up here!
            </div>
          ) : (
            log.map((entry) => (
              <motion.div
                key={entry.id}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="text-xl flex-shrink-0 mt-0.5">{entry.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{entry.message}</p>
                  <p className="text-gray-500 text-xs">{formatTime(entry.timestamp)}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {log.length > 0 && (
          <div className="p-3 border-t border-gray-700/50 text-center">
            <span className="text-gray-500 text-xs">{log.length} / 50 entries</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default ActivityLog;
