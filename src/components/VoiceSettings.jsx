import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getVoiceSettings, saveVoiceSettings, waitForVoices, speak, stopSpeaking } from '../services/voiceService';

function VoiceSettings({ onClose }) {
  const [settings, setSettings] = useState(() => getVoiceSettings());
  const [voices, setVoices] = useState([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    waitForVoices().then((v) => setVoices(v));
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      saveVoiceSettings(updated);
      return updated;
    });
  }, []);

  const handleTest = useCallback(() => {
    setIsTesting(true);
    const testMessages = [
      "Hello! I'm your pet!",
      "Woof woof! Feed me!",
      "I love hanging out with you~",
      "Let's play together!",
    ];
    const msg = testMessages[Math.floor(Math.random() * testMessages.length)];
    const utterance = speak(msg, settings);
    if (utterance) {
      utterance.onend = () => setIsTesting(false);
      utterance.onerror = () => setIsTesting(false);
    } else {
      setIsTesting(false);
    }
  }, [settings]);

  const handleMouseEnter = () => {
    if (window.electronAPI?.setIgnoreMouse) window.electronAPI.setIgnoreMouse(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseEnter={handleMouseEnter}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-[340px] max-h-[480px] overflow-y-auto bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-gray-600/30 shadow-2xl shadow-black/60 p-5"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔊</span>
            <h2 className="text-sm font-bold text-white">Voice Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-all text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
          <span className="text-xs text-gray-300">Enable Voice</span>
          <button
            onClick={() => updateSetting('enabled', !settings.enabled)}
            className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
              settings.enabled ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                settings.enabled ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Mute toggle */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
          <span className="text-xs text-gray-300">Mute</span>
          <button
            onClick={() => { updateSetting('muted', !settings.muted); if (!settings.muted) stopSpeaking(); }}
            className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
              settings.muted ? 'bg-red-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                settings.muted ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Auto-speak toggle */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
          <span className="text-xs text-gray-300">Auto-speak chat</span>
          <button
            onClick={() => updateSetting('autoSpeak', !settings.autoSpeak)}
            className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${
              settings.autoSpeak ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                settings.autoSpeak ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Voice selector */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1.5 block">Voice</label>
          <select
            value={settings.voiceURI}
            onChange={(e) => updateSetting('voiceURI', e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700/50 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none focus:border-purple-500/50 transition-all cursor-pointer"
          >
            <option value="">System Default</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Pitch slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">Pitch</label>
            <span className="text-xs text-gray-500">{settings.pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => updateSetting('pitch', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Rate slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">Speed</label>
            <span className="text-xs text-gray-500">{settings.rate.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.rate}
            onChange={(e) => updateSetting('rate', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500"
          />
          <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Test button */}
        <motion.button
          onClick={handleTest}
          disabled={!settings.enabled || settings.muted || isTesting}
          className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all ${
            !settings.enabled || settings.muted || isTesting
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-purple-600/80 hover:bg-purple-500/80 text-white cursor-pointer shadow-lg shadow-purple-500/20'
          }`}
          whileHover={settings.enabled && !settings.muted && !isTesting ? { scale: 1.02 } : {}}
          whileTap={settings.enabled && !settings.muted && !isTesting ? { scale: 0.98 } : {}}
        >
          {isTesting ? '🔊 Speaking...' : '🎤 Test Voice'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default VoiceSettings;
