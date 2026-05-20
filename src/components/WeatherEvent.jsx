import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveEvent, endEvent } from '../services/weatherEventService';
import { addMaterial } from '../services/craftingService';

// Visual effect components for each weather event type
function MeteorVisual() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-8 bg-gradient-to-b from-yellow-300 to-transparent rounded-full"
          style={{ left: `${10 + i * 12}%`, top: '-20px' }}
          animate={{
            y: [0, 600],
            x: [0, 100 + i * 20],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: i * 0.8 + Math.random() * 2,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

function AuroraVisual() {
  return (
    <div className="absolute inset-x-0 top-0 h-32 pointer-events-none overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(34,197,94,0.3) 0%, rgba(168,85,247,0.2) 40%, transparent 100%)',
        }}
        animate={{
          opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
          scaleX: [1, 1.1, 0.95, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(59,130,246,0.2) 0%, rgba(34,197,94,0.15) 50%, transparent 100%)',
        }}
        animate={{
          opacity: [0.5, 0.2, 0.6, 0.3, 0.5],
          x: [-20, 20, -10, 15, -20],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function ThunderVisual() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-gray-900/30" />
      <AnimatePresence>
        {flash && (
          <motion.div
            className="absolute inset-0 bg-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.3, 0.8, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RainbowVisual() {
  return (
    <div className="absolute inset-x-0 top-4 h-24 pointer-events-none flex items-center justify-center">
      <motion.div
        className="w-[80%] h-16 rounded-t-full border-t-4 border-l-4 border-r-4"
        style={{
          borderImage: 'linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6) 1',
          opacity: 0.6,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.6, scale: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />
    </div>
  );
}

function SnowstormVisual() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-white/10" />
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-70"
          style={{ left: `${Math.random() * 100}%`, top: '-10px' }}
          animate={{
            y: [0, 500],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

function EclipseVisual() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <motion.div
        className="absolute inset-0 bg-gray-900/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 3 }}
      />
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <motion.div
          className="w-16 h-16 rounded-full bg-gray-900 border-4 border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.6)]"
          animate={{ boxShadow: ['0 0 20px rgba(251,146,60,0.4)', '0 0 40px rgba(251,146,60,0.8)', '0 0 20px rgba(251,146,60,0.4)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </div>
  );
}

const VISUAL_MAP = {
  meteors: MeteorVisual,
  aurora: AuroraVisual,
  thunder: ThunderVisual,
  rainbow: RainbowVisual,
  snowstorm: SnowstormVisual,
  eclipse: EclipseVisual,
};

function WeatherEvent({ activeEvent, onCollectReward, onEventEnd }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCollect, setShowCollect] = useState(false);
  const [collected, setCollected] = useState(false);

  useEffect(() => {
    if (!activeEvent) {
      setShowCollect(false);
      setCollected(false);
      return;
    }

    const interval = setInterval(() => {
      const event = getActiveEvent();
      if (!event) {
        setShowCollect(false);
        clearInterval(interval);
        return;
      }
      if (event.expired) {
        setShowCollect(true);
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.ceil(event.remaining || 0));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEvent?.id, activeEvent?.startTime]);

  function handleCollect() {
    if (collected) return;
    setCollected(true);
    const rewards = endEvent();
    if (rewards) {
      // Add materials from rewards
      if (rewards.materials) {
        Object.entries(rewards.materials).forEach(([mat, count]) => {
          addMaterial(mat, count);
        });
      }
      if (onCollectReward) onCollectReward(rewards);
    }
    setTimeout(() => {
      if (onEventEnd) onEventEnd();
    }, 500);
  }

  if (!activeEvent) return null;

  const VisualComponent = VISUAL_MAP[activeEvent.visual];

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <>
      {/* Visual effects layer */}
      <AnimatePresence>
        {VisualComponent && !showCollect && (
          <motion.div
            className="fixed inset-0 z-[5] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <VisualComponent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner notification */}
      <motion.div
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-700/50 shadow-xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => { if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false); }}
      >
        <span className="text-lg">{activeEvent.emoji}</span>
        <span className="text-sm text-gray-200 font-medium">{activeEvent.name}</span>
        {!showCollect && (
          <span className="text-xs text-gray-400 ml-2">{formatTime(timeLeft)}</span>
        )}
        {showCollect && !collected && (
          <button
            className="ml-2 px-3 py-1 bg-green-600/80 hover:bg-green-500/80 text-white text-xs rounded-lg transition-colors cursor-pointer"
            onClick={handleCollect}
          >
            Collect ✨
          </button>
        )}
        {collected && (
          <span className="ml-2 text-xs text-green-400">Collected!</span>
        )}
      </motion.div>
    </>
  );
}

export default WeatherEvent;
