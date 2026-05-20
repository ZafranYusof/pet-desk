import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractivePanel from './InteractivePanel';
import {
  getCurrentSession, getSessionDuration, getCodingStats,
  getTodayCodingMinutes, getWeeklyCodingMinutes, getLanguageBreakdown,
  getDailyChartData, getStreak, getContextualTip, checkCodingActivity,
  startPolling, stopPolling, getCodingContext
} from '../services/codeCompanionService';

function CodeCompanion({ onClose, onOpenAIChat }) {
  const [session, setSession] = useState(() => getCurrentSession());
  const [sessionMinutes, setSessionMinutes] = useState(() => getSessionDuration());
  const [todayMinutes, setTodayMinutes] = useState(() => getTodayCodingMinutes());
  const [weeklyMinutes, setWeeklyMinutes] = useState(() => getWeeklyCodingMinutes());
  const [languages, setLanguages] = useState(() => getLanguageBreakdown());
  const [chartData, setChartData] = useState(() => getDailyChartData(7));
  const [streak, setStreak] = useState(() => getStreak());
  const [tip, setTip] = useState(null);
  const [activity, setActivity] = useState(null);

  // Poll for coding activity
  useEffect(() => {
    const pollId = startPolling((act, sess) => {
      setActivity(act);
      setSession(sess);
    }, 10000);

    return () => stopPolling();
  }, []);

  // Update timer every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes(getSessionDuration());
      setTodayMinutes(getTodayCodingMinutes());
      setWeeklyMinutes(getWeeklyCodingMinutes());
      setLanguages(getLanguageBreakdown());
      setChartData(getDailyChartData(7));
      setStreak(getStreak());

      // Show tip occasionally
      const newTip = getContextualTip();
      if (newTip && Math.random() < 0.3) {
        setTip(newTip);
        setTimeout(() => setTip(null), 8000);
      }
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const maxChartValue = Math.max(...chartData.map(d => d.minutes), 1);

  const handleAskHelp = useCallback(() => {
    if (onOpenAIChat) {
      const context = getCodingContext();
      onOpenAIChat(`I'm coding in ${context.currentLanguage || 'my editor'} (${context.currentEditor || 'unknown editor'}). Been at it for ${formatTime(context.sessionDuration)}. Can you help me with something?`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOpenAIChat]);

  return (
    <InteractivePanel>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-16 right-4 w-80 max-h-[500px] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl z-[9999]"
        style={{
          background: 'rgba(15, 15, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">💻</span>
            <h3 className="text-white font-semibold text-sm">Code Companion</h3>
            {session && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Current Session */}
        <div className="p-4 border-b border-white/10">
          {session ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Current Session</span>
                <span className="text-green-400 text-xs font-mono">{formatTime(sessionMinutes)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">{session.editor}</span>
                {session.language && session.language !== 'Unknown' && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                    {session.language}
                  </span>
                )}
              </div>
              {/* Session progress bar */}
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((sessionMinutes / 120) * 100, 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-gray-500 text-xs">No coding detected</span>
              <p className="text-gray-600 text-[10px] mt-1">Open an editor to start tracking</p>
            </div>
          )}
        </div>

        {/* Tip */}
        <AnimatePresence>
          {tip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 border-b border-white/10 bg-yellow-500/5"
            >
              <p className="text-yellow-300/80 text-xs">💡 {tip}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Overview */}
        <div className="p-4 border-b border-white/10">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-white font-bold text-sm">{formatTime(todayMinutes)}</div>
              <div className="text-gray-500 text-[10px]">Today</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm">{formatTime(weeklyMinutes)}</div>
              <div className="text-gray-500 text-[10px]">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-orange-400 font-bold text-sm">{streak}🔥</div>
              <div className="text-gray-500 text-[10px]">Streak</div>
            </div>
          </div>
        </div>

        {/* Daily Chart */}
        <div className="p-4 border-b border-white/10">
          <h4 className="text-gray-400 text-xs mb-3">Last 7 Days</h4>
          <div className="flex items-end justify-between gap-1 h-16">
            {chartData.map((day, i) => (
              <div key={day.date} className="flex flex-col items-center flex-1 gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '48px' }}>
                  <motion.div
                    className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-blue-500 to-cyan-400"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((day.minutes / maxChartValue) * 48, 2)}px` }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                  />
                </div>
                <span className="text-gray-500 text-[9px]">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Breakdown */}
        {languages.length > 0 && (
          <div className="p-4 border-b border-white/10">
            <h4 className="text-gray-400 text-xs mb-2">Languages</h4>
            <div className="space-y-1.5">
              {languages.slice(0, 5).map((lang) => (
                <div key={lang.language} className="flex items-center gap-2">
                  <span className="text-white text-[11px] w-20 truncate">{lang.language}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-[10px] w-8 text-right">{lang.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask for Help Button */}
        <div className="p-4">
          <button
            onClick={handleAskHelp}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all"
          >
            🦆 Ask for Help (Rubber Duck Mode)
          </button>
        </div>
      </motion.div>
    </InteractivePanel>
  );
}

export default CodeCompanion;
