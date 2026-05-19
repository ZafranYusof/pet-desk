import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function DesktopReaction({ reaction, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reaction) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [reaction, onDismiss]);

  if (!reaction) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed z-[80] pointer-events-none"
          style={{ bottom: 120, left: '50%', transform: 'translateX(-50%)' }}
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="relative max-w-[150px] px-3 py-2 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-600/50 shadow-lg">
            {/* Tail pointing down */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900/90 border-r border-b border-gray-600/50 rotate-45" />
            <p className="text-xs text-white/90 text-center leading-snug">
              {reaction.message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DesktopReaction;
