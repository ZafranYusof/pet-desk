import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const emoteSymbols = {
  heart: '❤️',
  zzz: '💤',
  music: '🎵',
  sweat: '💧',
  star: '⭐',
};

let emoteId = 0;

const Emotes = ({ emoteQueue = [] }) => {
  return (
    <div className="emotes-container" style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 100 }}>
      <AnimatePresence>
        {emoteQueue.slice(0, 3).map((emote) => (
          <motion.div
            key={emote.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -50, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              fontSize: '20px',
              left: `${emote.offsetX || 0}px`,
              userSelect: 'none',
            }}
          >
            {emoteSymbols[emote.type] || '✨'}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook to manage emote queue externally
export const useEmotes = () => {
  const [emoteQueue, setEmoteQueue] = useState([]);

  const addEmote = useCallback((type) => {
    const id = ++emoteId;
    const offsetX = Math.random() * 40 - 20; // random spread
    setEmoteQueue((prev) => {
      const next = [...prev, { id, type, offsetX }];
      // Keep max 3
      return next.slice(-3);
    });

    // Auto-remove after animation
    setTimeout(() => {
      setEmoteQueue((prev) => prev.filter((e) => e.id !== id));
    }, 1600);
  }, []);

  return { emoteQueue, addEmote };
};

export default Emotes;
