import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRandomDream, getDreamMoodEffect, saveDreamToLog, getDreamLog } from '../services/dreamService';

/**
 * Dream sequence component - shows when pet is sleeping and dream triggers.
 */
function DreamSequence({ onComplete, onMoodEffect }) {
  const [dream, setDream] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [showTitle, setShowTitle] = useState(true);
  const timerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onMoodEffectRef = useRef(onMoodEffect);
  onMoodEffectRef.current = onMoodEffect;

  useEffect(() => {
    const d = getRandomDream();
    setDream(d);
    saveDreamToLog(d);

    // Show title for 2 seconds, then start frames
    const titleTimer = setTimeout(() => {
      setShowTitle(false);
    }, 2000);

    return () => clearTimeout(titleTimer);
  }, []);

  // Advance frames
  useEffect(() => {
    if (showTitle || !dream) return;

    timerRef.current = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= dream.frames.length - 1) {
          clearInterval(timerRef.current);
          // Dream complete - apply mood effect and close
          setTimeout(() => {
            const effect = getDreamMoodEffect(dream);
            if (onMoodEffectRef.current) onMoodEffectRef.current(effect);
            if (onCompleteRef.current) onCompleteRef.current();
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showTitle, dream]);

  if (!dream) return null;

  const isNightmare = dream.mood === 'nightmare';
  const bgGradient = isNightmare
    ? 'from-red-950/95 via-gray-950/95 to-purple-950/95'
    : 'from-indigo-950/95 via-purple-950/95 to-blue-950/95';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient}`} />

      {/* Stars / particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${isNightmare ? 'bg-red-400/40' : 'bg-white/40'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 w-[260px] text-center"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Dream title */}
        <AnimatePresence mode="wait">
          {showTitle ? (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-4xl mb-3">{dream.emoji}</div>
              <h2 className="text-white text-lg font-bold mb-2">{dream.title}</h2>
              <p className="text-gray-400 text-xs">💤 Dreaming...</p>
            </motion.div>
          ) : (
            <motion.div
              key={`frame-${frameIndex}`}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-3xl mb-4">{dream.emoji}</div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-700/30 px-4 py-3">
                <p className="text-white text-sm leading-relaxed">
                  {dream.frames[frameIndex]}
                </p>
              </div>
              <div className="flex justify-center gap-1 mt-3">
                {dream.frames.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i <= frameIndex
                        ? isNightmare ? 'bg-red-400' : 'bg-purple-400'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button */}
        <motion.button
          className="mt-6 px-4 py-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            const effect = getDreamMoodEffect(dream);
            if (onMoodEffectRef.current) onMoodEffectRef.current(effect);
            if (onCompleteRef.current) onCompleteRef.current();
          }}
        >
          Skip Dream →
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/**
 * Dream Log panel - shows past dreams.
 */
function DreamLogPanel({ onClose }) {
  const [dreams, setDreams] = useState(() => getDreamLog());

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative w-[260px] max-h-[380px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-medium">💤 Dream Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {dreams.length === 0 ? (
            <div className="text-center text-gray-500 text-xs mt-8">
              No dreams yet. Your pet will dream while sleeping!
            </div>
          ) : (
            dreams.map((dream, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/30">
                <span className="text-lg">{dream.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{dream.title}</div>
                  <div className="text-[10px] text-gray-500">{formatDate(dream.timestamp)}</div>
                </div>
                <span className="text-xs">{dream.mood === 'nightmare' ? '😰' : '😊'}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export { DreamSequence, DreamLogPanel };
export default DreamSequence;
