import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  startPomodoro, stopPomodoro, getPomodoroStatus, tickPomodoro,
  getPomodoroStats, getPomodoroSettings, getFocusMessage, getBreakMessage
} from '../services/pomodoroService';
import { playSound } from '../services/soundService';

function PomodoroMode({ onClose, onSessionComplete }) {
  const [status, setStatus] = useState(() => getPomodoroStatus());
  const [settings, setSettings] = useState(() => getPomodoroSettings());
  const [stats, setStats] = useState(() => getPomodoroStats());
  const [message, setMessage] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [workMin, setWorkMin] = useState(settings.workMinutes);
  const [breakMin, setBreakMin] = useState(settings.breakMinutes);
  const [showConfetti, setShowConfetti] = useState(false);
  const tickRef = useRef(null);
  const onSessionCompleteRef = useRef(onSessionComplete);
  onSessionCompleteRef.current = onSessionComplete;

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const event = tickPomodoro();
      const newStatus = getPomodoroStatus();
      setStatus(newStatus);

      if (event === 'work_complete') {
        playSound('levelUp');
        setMessage(getBreakMessage());
        setStats(getPomodoroStats());
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
        if (onSessionCompleteRef.current) onSessionCompleteRef.current(15);
        setTimeout(() => setMessage(null), 4000);
      } else if (event === 'break_complete') {
        playSound('bounce');
        setMessage('Break over! Ready for another round?');
        setTimeout(() => setMessage(null), 4000);
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  function handleStart() {
    startPomodoro(workMin, breakMin);
    setStatus(getPomodoroStatus());
    setMessage(getFocusMessage());
    setTimeout(() => setMessage(null), 3000);
  }

  function handleStop() {
    stopPomodoro();
    setStatus(getPomodoroStatus());
    setMessage(null);
  }

  function formatTime(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  const isWork = status.mode === 'work';
  const progress = status.progress || 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Session dots
  const sessionDots = Array.from({ length: Math.min(stats.sessionsToday, 8) }, (_, i) => i);

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-[260px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti overlay */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
            >
              {['🎉', '✨', '🎊', '⭐', '🌟', '💫'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-xl"
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    x: [0, (Math.random() - 0.5) * 120],
                    y: [0, (Math.random() - 0.5) * 120],
                    rotate: [0, Math.random() * 360],
                  }}
                  transition={{ duration: 1.2, delay: i * 0.1 }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/40">
          <h2 className="text-white text-sm font-semibold">🍅 Pomodoro</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700/60 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-5">
          {/* Timer Ring */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Background ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  stroke="rgba(55, 65, 81, 0.4)"
                  strokeWidth="6"
                />
                {/* Progress ring */}
                {status.active && (
                  <motion.circle
                    cx="60" cy="60" r={radius}
                    fill="none"
                    stroke={isWork ? 'url(#pomodoroWorkGrad)' : 'url(#pomodoroBreakGrad)'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                )}
                <defs>
                  <linearGradient id="pomodoroWorkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                  <linearGradient id="pomodoroBreakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Pulse animation during focus */}
              {status.active && isWork && (
                <motion.div
                  className="absolute inset-3 rounded-full border-2 border-red-500/20"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Center content */}
              <div className="text-center z-10">
                {/* Pet emoji in center */}
                <motion.div
                  className="text-2xl mb-1"
                  animate={status.active && !isWork ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  {status.active ? (isWork ? '🔥' : '🎉') : '🐾'}
                </motion.div>
                <div className="text-xl font-bold text-white font-mono tracking-wider">
                  {status.active ? formatTime(status.timeLeft) : formatTime(workMin * 60 * 1000)}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {status.active ? (isWork ? 'Focus Time' : '☕ Break') : 'Ready'}
                </div>
              </div>
            </div>

            {/* Session dots */}
            {sessionDots.length > 0 && (
              <div className="flex items-center gap-1.5 mt-3">
                {sessionDots.map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-red-400 to-orange-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                  />
                ))}
                {stats.sessionsToday > 8 && (
                  <span className="text-[9px] text-gray-500">+{stats.sessionsToday - 8}</span>
                )}
              </div>
            )}
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                className="text-center text-[11px] text-yellow-300/90 mb-3 px-3 py-1.5 bg-yellow-500/5 rounded-lg border border-yellow-500/10"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                "{message}"
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex justify-center gap-2 mb-4">
            {!status.active ? (
              <>
                <motion.button
                  className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-sm rounded-xl cursor-pointer font-medium shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                  onClick={handleStart}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Start Focus
                </motion.button>
                <motion.button
                  className="px-3 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 text-sm rounded-xl cursor-pointer border border-gray-700/40"
                  onClick={() => setShowSettings(!showSettings)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  ⚙️
                </motion.button>
              </>
            ) : (
              <motion.button
                className="px-5 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-white text-sm rounded-xl cursor-pointer border border-gray-700/40"
                onClick={handleStop}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Stop
              </motion.button>
            )}
          </div>

          {/* Settings */}
          <AnimatePresence>
            {showSettings && !status.active && (
              <motion.div
                className="space-y-2.5 mb-4 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Work</span>
                  <div className="flex items-center gap-2">
                    <button className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs flex items-center justify-center cursor-pointer" onClick={() => setWorkMin(Math.max(5, workMin - 5))}>-</button>
                    <span className="text-xs text-white w-8 text-center font-mono">{workMin}m</span>
                    <button className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs flex items-center justify-center cursor-pointer" onClick={() => setWorkMin(Math.min(60, workMin + 5))}>+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Break</span>
                  <div className="flex items-center gap-2">
                    <button className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs flex items-center justify-center cursor-pointer" onClick={() => setBreakMin(Math.max(1, breakMin - 1))}>-</button>
                    <span className="text-xs text-white w-8 text-center font-mono">{breakMin}m</span>
                    <button className="w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-xs flex items-center justify-center cursor-pointer" onClick={() => setBreakMin(Math.min(15, breakMin + 1))}>+</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800/30 rounded-xl p-2 border border-gray-700/20">
              <div className="text-sm font-bold text-white">{stats.sessionsToday}</div>
              <div className="text-[9px] text-gray-500">Today</div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-2 border border-gray-700/20">
              <div className="text-sm font-bold text-white">{stats.totalSessions}</div>
              <div className="text-[9px] text-gray-500">Total</div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-2 border border-gray-700/20">
              <div className="text-sm font-bold text-white">{stats.streakDays}</div>
              <div className="text-[9px] text-gray-500">Streak 🔥</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PomodoroMode;
