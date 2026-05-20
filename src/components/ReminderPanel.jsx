import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getActiveReminders,
  addReminder,
  removeReminder,
  snoozeReminder,
  completeReminder,
  quickReminder,
  dailyReminder,
  getPatternSettings,
  togglePatternReminders,
} from '../services/reminderService';

function ReminderPanel({ onClose }) {
  const [reminders, setReminders] = useState(() => getActiveReminders());
  const [showAdd, setShowAdd] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newType, setNewType] = useState('quick'); // 'quick' | 'daily'
  const [quickMinutes, setQuickMinutes] = useState(15);
  const [dailyTime, setDailyTime] = useState('15:00');
  const [patternEnabled, setPatternEnabled] = useState(() => getPatternSettings().enabled);

  const refreshReminders = useCallback(() => {
    setReminders(getActiveReminders());
  }, []);

  const handleAdd = useCallback(() => {
    if (!newMessage.trim()) return;
    if (newType === 'quick') {
      quickReminder(quickMinutes, newMessage.trim());
    } else {
      dailyReminder(dailyTime, newMessage.trim());
    }
    setNewMessage('');
    setShowAdd(false);
    refreshReminders();
  }, [newMessage, newType, quickMinutes, dailyTime, refreshReminders]);

  const handleSnooze = useCallback((id, minutes) => {
    snoozeReminder(id, minutes * 60 * 1000);
    refreshReminders();
  }, [refreshReminders]);

  const handleComplete = useCallback((id) => {
    completeReminder(id);
    refreshReminders();
  }, [refreshReminders]);

  const handleRemove = useCallback((id) => {
    removeReminder(id);
    refreshReminders();
  }, [refreshReminders]);

  const handleTogglePatterns = useCallback(() => {
    const newVal = !patternEnabled;
    setPatternEnabled(newVal);
    togglePatternReminders(newVal);
  }, [patternEnabled]);

  const handleMouseEnter = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = timestamp - now.getTime();

    if (diff < 0) return 'Due now!';
    if (diff < 60000) return 'Less than 1 min';
    if (diff < 3600000) return `${Math.ceil(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseEnter={handleMouseEnter}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-[360px] max-h-[520px] flex flex-col bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-gray-600/30 shadow-2xl shadow-black/60 overflow-hidden"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏰</span>
            <h2 className="text-sm font-bold text-white">Reminders</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {reminders.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-600/30 hover:bg-amber-500/40 text-amber-300 transition-all text-xs cursor-pointer"
            >
              +
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add reminder form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              className="p-3 border-b border-gray-800/50 bg-gray-800/30"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Reminder message..."
                className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-amber-500/50 transition-all mb-2"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              />

              {/* Type selector */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setNewType('quick')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                    newType === 'quick' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/30' : 'bg-gray-800/50 text-gray-400 border border-gray-700/30'
                  }`}
                >
                  ⏱️ Quick
                </button>
                <button
                  onClick={() => setNewType('daily')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                    newType === 'daily' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/30' : 'bg-gray-800/50 text-gray-400 border border-gray-700/30'
                  }`}
                >
                  🔁 Daily
                </button>
              </div>

              {/* Type-specific inputs */}
              {newType === 'quick' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">In</span>
                  <select
                    value={quickMinutes}
                    onChange={(e) => setQuickMinutes(parseInt(e.target.value))}
                    className="bg-gray-800/80 border border-gray-700/50 rounded-lg px-2 py-1 text-xs text-gray-200 outline-none cursor-pointer"
                  >
                    <option value={5}>5 min</option>
                    <option value={10}>10 min</option>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={!newMessage.trim()}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500/80 text-white text-[10px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">At</span>
                  <input
                    type="time"
                    value={dailyTime}
                    onChange={(e) => setDailyTime(e.target.value)}
                    className="bg-gray-800/80 border border-gray-700/50 rounded-lg px-2 py-1 text-xs text-gray-200 outline-none cursor-pointer"
                  />
                  <button
                    onClick={handleAdd}
                    disabled={!newMessage.trim()}
                    className="ml-auto px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-500/80 text-white text-[10px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Add
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminder list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">⏰</span>
              <p className="text-xs text-gray-500">No active reminders</p>
              <p className="text-[10px] text-gray-600 mt-1">Add one above or let your pet learn your patterns!</p>
            </div>
          ) : (
            reminders.map((reminder, idx) => {
              const isDue = Date.now() >= reminder.triggerTime;
              return (
                <motion.div
                  key={reminder.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isDue
                      ? 'bg-amber-900/30 border-amber-500/30 shadow-lg shadow-amber-500/10'
                      : 'bg-gray-800/40 border-gray-700/20'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 truncate">{reminder.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] ${isDue ? 'text-amber-400' : 'text-gray-500'}`}>
                          {formatTime(reminder.triggerTime)}
                        </span>
                        {reminder.recurring && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400">🔁 Daily</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(reminder.id)}
                      className="text-gray-600 hover:text-red-400 text-[10px] cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Actions for due reminders */}
                  {isDue && (
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => handleComplete(reminder.id)}
                        className="flex-1 py-1 rounded-lg bg-green-600/30 hover:bg-green-500/40 text-green-300 text-[10px] cursor-pointer transition-all"
                      >
                        ✓ Done
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 5)}
                        className="px-2 py-1 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-[10px] cursor-pointer transition-all"
                      >
                        5m
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 15)}
                        className="px-2 py-1 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-[10px] cursor-pointer transition-all"
                      >
                        15m
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 60)}
                        className="px-2 py-1 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 text-[10px] cursor-pointer transition-all"
                      >
                        1h
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pattern toggle footer */}
        <div className="p-3 border-t border-gray-800/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Smart pattern reminders</span>
          <button
            onClick={handleTogglePatterns}
            className={`w-9 h-4.5 rounded-full transition-all cursor-pointer relative ${
              patternEnabled ? 'bg-amber-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${
                patternEnabled ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ReminderPanel;
