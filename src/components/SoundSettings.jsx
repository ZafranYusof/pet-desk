import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, X } from 'lucide-react';
import { packList } from '../services/soundPacks';
import { getVolume, setVolume, getMuted, setMute, getActivePack, setSoundPack, previewPack, playSound } from '../services/soundService';

function SoundSettings({ onClose }) {
  const [volume, setVolumeState] = useState(getVolume());
  const [muted, setMutedState] = useState(getMuted());
  const [activePack, setActivePackState] = useState(getActivePack());

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolumeState(val);
    setVolume(val);
  };

  const handleMuteToggle = () => {
    const newMuted = !muted;
    setMutedState(newMuted);
    setMute(newMuted);
  };

  const handlePackSelect = (packId) => {
    setActivePackState(packId);
    setSoundPack(packId);
    // Play a quick preview sound
    playSound('pet');
  };

  const handlePreview = (e, packId) => {
    e.stopPropagation();
    // Temporarily switch pack for preview
    const currentPack = getActivePack();
    setSoundPack(packId);
    previewPack(packId);
    setSoundPack(currentPack);
  };

  return (
    <motion.div
      className="fixed z-50 top-1/2 left-1/2"
      style={{ width: 250, height: 'auto', maxHeight: 320 }}
      initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
      animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
      exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
      transition={{ duration: 0.15 }}
    >
      <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl p-4 overflow-y-auto" style={{ maxHeight: 320 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-200">🔊 Sound Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Volume slider */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={handleMuteToggle}
              className="text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-400
                [&::-webkit-slider-thumb]:cursor-pointer"
              style={{ accentColor: '#4ade80' }}
            />
            <span className="text-xs text-gray-400 w-7 text-right">{volume}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700/50 mb-3" />

        {/* Sound packs */}
        <div className="space-y-2">
          {packList.map((pack) => (
            <div
              key={pack.id}
              onClick={() => handlePackSelect(pack.id)}
              className={`p-2 rounded-lg cursor-pointer transition-all border ${
                activePack === pack.id
                  ? 'border-green-500/60 bg-green-900/20'
                  : 'border-gray-700/30 bg-gray-800/40 hover:bg-gray-700/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-200">{pack.name}</div>
                  <div className="text-[10px] text-gray-400">{pack.description}</div>
                </div>
                <button
                  onClick={(e) => handlePreview(e, pack.id)}
                  className="text-[10px] px-2 py-0.5 rounded bg-gray-700/60 text-gray-300 hover:bg-gray-600/60 transition-colors cursor-pointer"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default SoundSettings;
