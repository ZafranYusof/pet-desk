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
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      const event = tickPomodoro();
      const newStatus = getPomodoroStatus();
      setStatus(newStatus);

      if (event === 'work_complete') {
        playSound('levelUp');
        setMessage(getBreakMessage());
        setStats(getPomodoroStats());
        if (onSessionComplete) onSessionComplete(15); // bonus XP
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
  const progressColor = isWork ? 'bg-red-500' : 'bg-green-500';
  const ringColor = isWork ? 'border-red-500/30' : 'border-green-500/30';

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative w-[260px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-medium">🍅 Pomodoro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
        </div>

        <div className="px-4 py-4">
          {/* Timer display */}
          <div className="flex flex-col items-center mb-4">
            <div className={`w-32 h-32 rounded-full border-4 ${ringColor} flex items-center justify-center relative`}>
              {/* Progress ring */}
              {status.active && (
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
                  <circle
                    cx="64" cy="64" r="58"
                    fill="none"
                    stroke={isWork ? '#ef4444' : '#22c55e'}
                    strokeWidth="4"
                    strokeDasharray={`${status.progress * 364} 364`}
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
              )}
              <div className="text-center z-10">
                <div className="text-2xl font-bold text-white font-mono">
                  {status.active ? formatTime(status.timeLeft) : formatTime(workMin * 60 * 1000)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {status.active ? (isWork ? '🔥 Focus' : '☕ Break') : 'Ready'}
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                className="text-center text-xs text-yellow-300 mb-3 px-2"
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
                <button
                  className="px-4 py-2 bg-red-600/80 hover:bg-red-500 text-white text-sm rounded-lg cursor-pointer transition-colors"
                  onClick={handleStart}
                >
                  Start Focus
                </button>
                <button
                  className="px-3 py-2 bg-gray-700/60 hover:bg-gray-600 text-gray-300 text-sm rounded-lg cursor-pointer transition-colors"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  ⚙️
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 bg-gray-700/80 hover:bg-gray-600 text-white text-sm rounded-lg cursor-pointer transition-colors"
                onClick={handleStop}
              >
                Stop
              </button>
            )}
          </div>

          {/* Settings */}
          <AnimatePresence>
            {showSettings && !status.active && (
              <motion.div
                className="space-y-2 mb-3 p-2 bg-gray-800/40 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Work</span>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-white cursor-pointer" onClick={() => setWorkMin(Math.max(5, workMin - 5))}>-</button>
                    <span className="text-xs text-white w-8 text-center">{workMin}m</span>
                    <button className="text-gray-400 hover:text-white cursor-pointer" onClick={() => setWorkMin(Math.min(60, workMin + 5))}>+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Break</span>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-white cursor-pointer" onClick={() => setBreakMin(Math.max(1, breakMin - 1))}>-</button>
                    <span className="text-xs text-white w-8 text-center">{breakMin}m</span>
                    <button className="text-gray-400 hover:text-white cursor-pointer" onClick={() => setBreakMin(Math.min(15, breakMin + 1))}>+</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-800/30 rounded-lg p-2">
              <div className="text-sm font-bold text-white">{stats.sessionsToday}</div>
              <div className="text-[10px] text-gray-500">Today</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-2">
              <div className="text-sm font-bold text-white">{stats.totalSessions}</div>
              <div className="text-[10px] text-gray-500">Total</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-2">
              <div className="text-sm font-bold text-white">{stats.streakDays}</div>
              <div className="text-[10px] text-gray-500">Streak</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PomodoroMode;
