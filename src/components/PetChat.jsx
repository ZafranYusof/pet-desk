import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatHistory } from '../services/petChatService';

const bubbleColors = {
  slime: { border: 'border-green-500/40', bg: 'bg-green-950/90', glow: 'rgba(34,197,94,0.15)' },
  cat: { border: 'border-orange-500/40', bg: 'bg-orange-950/90', glow: 'rgba(249,115,22,0.15)' },
  ghost: { border: 'border-purple-500/40', bg: 'bg-purple-950/90', glow: 'rgba(168,85,247,0.15)' },
  slimecat: { border: 'border-green-500/40', bg: 'bg-green-950/90', glow: 'rgba(34,197,94,0.15)' },
  ectoplasm: { border: 'border-green-400/40', bg: 'bg-emerald-950/90', glow: 'rgba(52,211,153,0.15)' },
  phantomcat: { border: 'border-purple-500/40', bg: 'bg-purple-950/90', glow: 'rgba(168,85,247,0.15)' },
  megaslime: { border: 'border-green-700/40', bg: 'bg-green-950/90', glow: 'rgba(21,128,61,0.15)' },
  twintail: { border: 'border-orange-500/40', bg: 'bg-orange-950/90', glow: 'rgba(249,115,22,0.15)' },
  poltergeist: { border: 'border-red-500/40', bg: 'bg-gray-950/90', glow: 'rgba(239,68,68,0.15)' },
};

const moodStyles = {
  happy: { border: 'border-yellow-400/50', bg: 'bg-yellow-950/90', glow: 'rgba(250,204,21,0.2)' },
  excited: { border: 'border-pink-400/50', bg: 'bg-pink-950/90', glow: 'rgba(244,114,182,0.2)' },
  sad: { border: 'border-blue-400/50', bg: 'bg-blue-950/90', glow: 'rgba(96,165,250,0.15)' },
  tired: { border: 'border-indigo-400/40', bg: 'bg-indigo-950/90', glow: 'rgba(129,140,248,0.12)' },
  hungry: { border: 'border-red-400/40', bg: 'bg-red-950/90', glow: 'rgba(248,113,113,0.15)' },
};

/**
 * Chat bubble that appears above the pet with typewriter effect.
 */
function ChatBubble({ message, species, mood, onDismiss, petPosition }) {
  const [displayText, setDisplayText] = useState('');
  const [complete, setComplete] = useState(false);
  const timerRef = useRef(null);
  const dismissRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Use mood-based style if available, otherwise species-based
  const moodStyle = mood && moodStyles[mood];
  const speciesStyle = bubbleColors[species] || { border: 'border-gray-500/40', bg: 'bg-gray-900/90', glow: 'rgba(107,114,128,0.15)' };
  const style = moodStyle || speciesStyle;

  useEffect(() => {
    if (!message) return;
    setDisplayText('');
    setComplete(false);

    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      if (i <= message.length) {
        setDisplayText(message.slice(0, i));
      } else {
        clearInterval(timerRef.current);
        setComplete(true);
      }
    }, 18);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [message]);

  // Auto-dismiss after 5 seconds once complete
  useEffect(() => {
    if (complete) {
      dismissRef.current = setTimeout(() => {
        onDismissRef.current();
      }, 5000);
    }
    return () => {
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [complete]);

  if (!message) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: petPosition ? petPosition.x + 32 : '50%',
        top: petPosition ? Math.max(10, petPosition.y - 90) : 100,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: 220,
        boxShadow: `0 8px 32px ${style.glow}, 0 0 0 1px rgba(255,255,255,0.05)`,
      }}
      className={`px-3.5 py-2.5 rounded-2xl border backdrop-blur-xl cursor-pointer ${style.border} ${style.bg}`}
      initial={{ opacity: 0, y: 20, scale: 0.7 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      onClick={onDismiss}
    >
      <p className="text-xs text-white leading-relaxed">
        {displayText}
        {!complete && (
          <motion.span
            className="inline-block w-[2px] h-3 bg-white/70 ml-0.5 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </p>

      {/* Idle breathing animation when complete */}
      {complete && (
        <motion.div
          className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Speech bubble arrow pointing down */}
      <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2">
        <div className={`w-3.5 h-3.5 rotate-45 border-r border-b ${style.border} ${style.bg}`} />
      </div>
    </motion.div>
  );
}

/**
 * Chat log panel (opened from context menu).
 */
function ChatLog({ species, petName, onClose }) {
  const [history, setHistory] = useState(() => getChatHistory());
  const scrollRef = useRef(null);

  const speciesStyle = bubbleColors[species] || { border: 'border-gray-500/40', bg: 'bg-gray-900/90', glow: 'rgba(107,114,128,0.15)' };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(getChatHistory());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-[300px] h-[400px] bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Decorative top line */}
        <div className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h2 className="text-white text-sm font-medium flex items-center gap-2">
            <span>💬</span> {petName || 'Pet'} Chat
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 custom-scrollbar">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 text-xs mt-8">
              <span className="text-2xl block mb-2">💭</span>
              No messages yet. Your pet will talk soon!
            </div>
          ) : (
            history.map((msg, i) => (
              <motion.div
                key={i}
                className="flex flex-col"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <div className={`inline-block max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm border text-xs text-white ${speciesStyle.border} ${speciesStyle.bg}`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-gray-600 mt-0.5 ml-2">
                  {formatTime(msg.timestamp)}
                </span>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5">
          <p className="text-[10px] text-gray-500 text-center">
            Your pet speaks on its own ~ check back often!
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export { ChatBubble, ChatLog };
export default ChatBubble;
