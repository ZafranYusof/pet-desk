import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sendMessage, addToConversation } from '../services/aiChatService';

const MAX_MESSAGES = 20;

function AIChatPanel({ petState, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Electron click-through handlers
  const handleMouseEnter = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false);
  };
  const handleMouseLeave = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(true);
  };

  const getPetContext = () => ({
    species: petState?.species || 'slime',
    name: petState?.name || 'Pet',
    level: petState?.level || 1,
    mood: petState?.happiness > 70 ? 'happy' : petState?.happiness < 30 ? 'sad' : 'neutral',
    happiness: petState?.happiness || 50,
    energy: petState?.energy || 50,
  });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { role: 'user', text, timestamp: Date.now() };
    setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await sendMessage(text, getPetContext());
      const petMsg = { role: 'assistant', text: reply, timestamp: Date.now() };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), petMsg]);
    } catch (e) {
      const errorMsg = { role: 'assistant', text: '*confused wiggle*', timestamp: Date.now() };
      setMessages((prev) => [...prev.slice(-(MAX_MESSAGES - 1)), errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      className="fixed bottom-20 right-6 z-50 w-[320px] h-[420px] flex flex-col bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden"
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 20 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium text-gray-200">
            Chat with {petState?.name || 'Pet'}
          </span>
        </div>
        <motion.button
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-200 hover:bg-gray-700/60 cursor-pointer transition-colors"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-xs text-center px-4">
            Say something to {petState?.name || 'your pet'}! They'll respond with their own personality~
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-purple-600/70 text-white rounded-br-sm'
                  : 'bg-gray-700/70 text-gray-200 rounded-bl-sm border border-gray-600/30'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-700/70 text-gray-400 px-3 py-2 rounded-2xl rounded-bl-sm border border-gray-600/30 text-xs">
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-700/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800/80 border border-gray-600/40 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500/60 transition-colors"
            disabled={isTyping}
          />
          <motion.button
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              input.trim() && !isTyping
                ? 'bg-purple-600/80 text-white hover:bg-purple-500/80 cursor-pointer'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
          >
            Send
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default AIChatPanel;
