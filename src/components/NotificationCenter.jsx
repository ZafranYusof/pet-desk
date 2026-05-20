import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getNotifications, getUnreadCount, markAsRead,
  markAllAsRead, clearAllNotifications, getCategories
} from '../services/notificationCenterService';

const categoryColors = {
  system: 'border-l-blue-400',
  quests: 'border-l-amber-400',
  events: 'border-l-purple-400',
  pet: 'border-l-pink-400',
  garden: 'border-l-green-400',
};

const categoryIcons = {
  system: '⚙️',
  quests: '📜',
  events: '🎉',
  pet: '🐾',
  garden: '🌱',
};

function NotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [activeCategory, setActiveCategory] = useState(null);
  const [dismissing, setDismissing] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(getNotifications(activeCategory));
      setUnreadCount(getUnreadCount());
    }, 2000);
    return () => clearInterval(interval);
  }, [activeCategory]);

  function handleMarkRead(id) {
    markAsRead(id);
    setNotifications(getNotifications(activeCategory));
    setUnreadCount(getUnreadCount());
  }

  function handleDismiss(id) {
    setDismissing(id);
    setTimeout(() => {
      handleMarkRead(id);
      setDismissing(null);
    }, 200);
  }

  function handleMarkAllRead() {
    markAllAsRead();
    setNotifications(getNotifications(activeCategory));
    setUnreadCount(getUnreadCount());
  }

  function handleClearAll() {
    clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  }

  function handleCategoryFilter(cat) {
    setActiveCategory(cat === activeCategory ? null : cat);
    setNotifications(getNotifications(cat === activeCategory ? null : cat));
  }

  function formatTime(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        className="relative w-[300px] h-[440px] mr-4 mb-4 bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="text-white text-sm font-semibold flex items-center gap-2">
            🔔 Notifications
            {unreadCount > 0 && (
              <motion.span
                className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                {unreadCount}
              </motion.span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700/60 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Category filters */}
        <div className="flex gap-1 px-3 py-2 border-b border-gray-700/30 overflow-x-auto">
          <button
            className={`px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition-all ${
              !activeCategory ? 'bg-purple-600/50 text-white border border-purple-500/40' : 'bg-gray-800/40 text-gray-400 hover:text-white'
            }`}
            onClick={() => handleCategoryFilter(null)}
          >
            All
          </button>
          {getCategories().map(cat => (
            <button
              key={cat}
              className={`px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition-all whitespace-nowrap ${
                activeCategory === cat ? 'bg-purple-600/50 text-white border border-purple-500/40' : 'bg-gray-800/40 text-gray-400 hover:text-white'
              }`}
              onClick={() => handleCategoryFilter(cat)}
            >
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-3 py-1.5">
          <button
            className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </button>
          <button
            className="text-[10px] text-gray-500 hover:text-red-400 cursor-pointer transition-colors"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 custom-scrollbar">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center h-full text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-4xl mb-2">😴</span>
                <span className="text-sm text-gray-400 font-medium">All caught up!</span>
                <span className="text-[10px] text-gray-600 mt-1">Your pet is happy you checked in</span>
              </motion.div>
            ) : (
              notifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  className={`relative rounded-xl p-2.5 border-l-[3px] border border-gray-700/30 transition-all ${
                    categoryColors[notif.category] || 'border-l-gray-400'
                  } ${
                    notif.read
                      ? 'bg-gray-800/20'
                      : 'bg-gray-800/50'
                  }`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{
                    opacity: dismissing === notif.id ? 0 : 1,
                    x: dismissing === notif.id ? 100 : 0,
                  }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  onClick={() => handleMarkRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                          {notif.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!notif.read && (
                            <motion.div
                              className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                          <button
                            className="text-gray-600 hover:text-red-400 text-xs transition-colors cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id); }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{notif.message}</p>
                      <span className="text-[9px] text-gray-600">{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default NotificationCenter;
