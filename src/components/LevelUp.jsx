import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Particle({ delay }) {
  const angle = Math.random() * 360;
  const distance = 80 + Math.random() * 120;
  const x = Math.cos((angle * Math.PI) / 180) * distance;
  const y = Math.sin((angle * Math.PI) / 180) * distance;
  const colors = ['bg-yellow-400', 'bg-pink-500', 'bg-blue-400', 'bg-green-400', 'bg-purple-500', 'bg-red-400'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 4 + Math.random() * 6;

  return (
    <motion.div
      className={`absolute ${color} rounded-sm`}
      style={{ width: size, height: size, left: '50%', top: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0.3, rotate: Math.random() * 360 }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
    />
  );
}

function LevelUp({ level, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    console.log('[PetDesk] 🎵 Level up sound effect!');
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 24 }, (_, i) => i);

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
          {/* Particles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {particles.map((i) => (
              <Particle key={i} delay={i * 0.03} />
            ))}
          </div>

          {/* Level Up Text */}
          <div className="flex flex-col items-center gap-2">
            <motion.div
              className="text-3xl font-black text-yellow-400 drop-shadow-lg"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              ⭐ LEVEL UP! ⭐
            </motion.div>
            <motion.div
              className="text-5xl font-black text-white drop-shadow-lg"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 250, damping: 12, delay: 0.3 }}
            >
              {level}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LevelUp;
