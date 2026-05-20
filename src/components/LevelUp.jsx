import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Particle({ delay, index }) {
  const angle = (index / 30) * 360 + Math.random() * 30;
  const distance = 100 + Math.random() * 140;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  const colors = ['bg-yellow-400', 'bg-pink-500', 'bg-blue-400', 'bg-green-400', 'bg-purple-500', 'bg-red-400', 'bg-amber-300'];
  const color = colors[index % colors.length];
  const size = 4 + Math.random() * 8;
  const isSquare = Math.random() > 0.5;

  return (
    <motion.div
      className={`absolute ${color} ${isSquare ? 'rounded-sm' : 'rounded-full'}`}
      style={{ width: size, height: size, left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0.2, rotate: Math.random() * 540 }}
      transition={{ duration: 1.5, delay, ease: 'easeOut' }}
    />
  );
}

function StarBurst({ delay }) {
  const angle = Math.random() * 360;
  const distance = 60 + Math.random() * 80;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;

  return (
    <motion.div
      className="absolute text-yellow-300"
      style={{ left: '50%', top: '50%', fontSize: 12 + Math.random() * 8 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
      animate={{ x, y, opacity: 0, scale: 1.5 }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    >
      ✦
    </motion.div>
  );
}

function LevelUp({ level, onComplete }) {
  const [visible, setVisible] = useState(true);
  const prevLevel = level - 1;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onCompleteRef.current?.();
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const particles = Array.from({ length: 30 }, (_, i) => i);
  const stars = Array.from({ length: 8 }, (_, i) => i);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Screen flash */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8 }}
          />

          {/* Expanding ring of light */}
          <motion.div
            className="absolute rounded-full border-2 border-yellow-400/60"
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 300, height: 300, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute rounded-full border border-purple-400/40"
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.1 }}
          />

          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {particles.map((i) => (
              <Particle key={i} delay={i * 0.025} index={i} />
            ))}
          </div>

          {/* Star bursts */}
          <div className="absolute inset-0 flex items-center justify-center">
            {stars.map((i) => (
              <StarBurst key={i} delay={0.2 + i * 0.08} />
            ))}
          </div>

          {/* Level Up Text */}
          <div className="flex flex-col items-center gap-3 relative">
            <motion.div
              className="text-2xl font-black uppercase tracking-wider"
              style={{
                background: 'linear-gradient(to right, #fbbf24, #f59e0b, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.6))',
              }}
              initial={{ scale: 0, rotate: -10, y: 20 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.1 }}
            >
              ⭐ LEVEL UP! ⭐
            </motion.div>

            {/* Number counter animation */}
            <div className="flex items-center gap-3">
              <motion.span
                className="text-2xl font-bold text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: [0, 1, 0.4] }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {prevLevel}
              </motion.span>
              <motion.span
                className="text-lg text-yellow-400"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                →
              </motion.span>
              <motion.div
                className="text-5xl font-black text-white"
                style={{ textShadow: '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(168,85,247,0.3)' }}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: [0, 1.3, 1], y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {level}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LevelUp;
