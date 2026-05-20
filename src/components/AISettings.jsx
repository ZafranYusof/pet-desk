import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAISettings, saveAISettings } from '../services/aiChatService';

function AISettings({ onClose }) {
  const [settings, setSettings] = useState(() => getAISettings());
  const [saved, setSaved] = useState(false);

  // Electron click-through handlers
  const handleMouseEnter = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false);
  };
  const handleMouseLeave = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(true);
  };

  const handleSave = () => {
    saveAISettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[340px] bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-600/40 shadow-2xl shadow-black/50 overflow-hidden"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️🤖</span>
          <span className="text-sm font-medium text-gray-200">AI Settings</span>
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

      {/* Settings form */}
      <div className="p-4 space-y-4">
        {/* API URL */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">API URL</label>
          <input
            type="text"
            value={settings.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            placeholder="https://ollama.com/api"
            className="w-full bg-gray-800/80 border border-gray-600/40 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">Model</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => handleChange('model', e.target.value)}
            placeholder="gpt-oss:120b"
            className="w-full bg-gray-800/80 border border-gray-600/40 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-400 font-medium">API Key (optional)</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="Leave empty if not needed"
            className="w-full bg-gray-800/80 border border-gray-600/40 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500/60 transition-colors"
          />
        </div>

        {/* Auto-chat toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <span className="text-xs text-gray-200 font-medium">Use AI for auto-chat</span>
            <p className="text-[10px] text-gray-500">Replace idle messages with AI-generated ones</p>
          </div>
          <motion.button
            className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${
              settings.useAIForAutoChat ? 'bg-purple-600' : 'bg-gray-700'
            }`}
            onClick={() => handleChange('useAIForAutoChat', !settings.useAIForAutoChat)}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"
              animate={{ left: settings.useAIForAutoChat ? '22px' : '2px' }}
              transition={{ duration: 0.15 }}
            />
          </motion.button>
        </div>

        {/* Save button */}
        <motion.button
          className={`w-full py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            saved
              ? 'bg-green-600/80 text-white'
              : 'bg-purple-600/80 text-white hover:bg-purple-500/80'
          }`}
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default AISettings;
