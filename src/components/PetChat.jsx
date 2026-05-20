import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatHistory } from '../services/petChatService';

// Bubble colors per species
const bubbleColors = {
  slime: 'border-green-500/40 bg-green-950/90',
  cat: 'border-orange-500/40 bg-orange-950/90',
  ghost: 'border-purple-500/40 bg-purple-950/90',
  slimecat: 'border-green-500/40 bg-green-950/90',
  ectoplasm: 'border-green-400/40 bg-emerald-950/90',
  phantomcat: 'border-purple-500/40 bg-purple-950/90',
  megaslime: 'border-green-700/40 bg-green-950/90',
  twintail: 'border-orange-500/40 bg-orange-950/90',
  poltergeist: 'border-red-500/40 bg-gray-950/90',
};

/**
 * Chat bubble that appears above the pet with typewriter effect.
 */
function ChatBubble({ message, species, onDismiss, petPosition }) {
  const [displayText, setDisplayText] = useState('');
  const [complete, setComplete] = useState(false);
  const timerRef = useRef(null);
  const dismissRef = useRef(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const colorClass = bubbleColors[species] || 'border-gray-500/40 bg-gray-900/90';

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
    }, 20);

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
        maxWidth: 200,
      }}
      className={`px-3 py-2 rounded-xl border backdrop-blur-sm cursor-pointer ${colorClass}`}
      initial={{ opacity: 0, y: 10, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      onClick={onDismiss}
    >
      <p className="text-xs text-white leading-relaxed">{displayText}</p>
      {/* Speech bubble tail */}
      <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b ${colorClass}`} />
    </motion.div>
  );
}

/**
 * Chat log panel (opened from context menu).
 */
function ChatLog({ species, petName, onClose }) {
  const [history, setHistory] = useState(() => getChatHistory());
  const scrollRef = useRef(null);

  const colorClass = bubbleColors[species] || 'border-gray-500/40 bg-gray-900/90';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Refresh history periodically
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        className="relative w-[280px] h-[380px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-white text-sm font-medium flex items-center gap-2">
            <span>??</span> {petName || 'Pet'} Chat
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer"
          >
            �
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 text-xs mt-8">
              No messages yet. Your pet will talk soon!
            </div>
          ) : (
            history.map((msg, i) => (
              <div key={i} className="flex flex-col">
                <div className={`inline-block max-w-[85%] px-3 py-1.5 rounded-xl border text-xs text-white ${colorClass}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-600 mt-0.5 ml-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-700/50">
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
