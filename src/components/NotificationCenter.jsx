import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getNotifications, getUnreadCount, markAsRead,
  markAllAsRead, clearAllNotifications, getCategories
} from '../services/notificationCenterService';

function NotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState(() => getNotifications());
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [activeCategory, setActiveCategory] = useState(null);

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

  const categoryIcons = {
    system: '⚙️',
    quests: '📜',
    events: '🎉',
    pet: '🐾',
    garden: '🌱',
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative w-[280px] max-h-[400px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-medium flex items-center gap-2">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
        </div>

        {/* Category filters */}
        <div className="flex gap-1 px-3 py-2 border-b border-gray-700/30 overflow-x-auto">
          <button
            className={`px-2 py-1 text-[10px] rounded cursor-pointer transition-colors ${
              !activeCategory ? 'bg-purple-600/60 text-white' : 'bg-gray-800/40 text-gray-400 hover:text-white'
            }`}
            onClick={() => handleCategoryFilter(null)}
          >
            All
          </button>
          {getCategories().map(cat => (
            <button
              key={cat}
              className={`px-2 py-1 text-[10px] rounded cursor-pointer transition-colors whitespace-nowrap ${
                activeCategory === cat ? 'bg-purple-600/60 text-white' : 'bg-gray-800/40 text-gray-400 hover:text-white'
              }`}
              onClick={() => handleCategoryFilter(cat)}
            >
              {categoryIcons[cat]} {cat}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-3 py-1.5">
          <button
            className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </button>
          <button
            className="text-[10px] text-gray-500 hover:text-red-400 cursor-pointer"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 text-xs mt-8">
              No notifications yet!
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`rounded-lg p-2 border cursor-pointer transition-colors ${
                  notif.read
                    ? 'bg-gray-800/20 border-gray-700/20'
                    : 'bg-gray-800/50 border-gray-600/30'
                }`}
                onClick={() => handleMarkRead(notif.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${notif.read ? 'text-gray-400' : 'text-white'}`}>
                        {notif.title}
                      </span>
                      {!notif.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">{notif.message}</p>
                    <span className="text-[9px] text-gray-600">{formatTime(notif.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default NotificationCenter;
