import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InteractivePanel from './InteractivePanel';
import {
  getAvailableSkins, getCurrentSkin, setSkin,
  uploadCustomSkin, deleteCustomSkin, isCustomSkin, getPixelSlimeCSS
} from '../services/skinService';

function SkinSelector({ onClose, onSkinChange }) {
  const [skins, setSkins] = useState(() => getAvailableSkins());
  const [activeSkin, setActiveSkin] = useState(() => getCurrentSkin());
  const [previewSkin, setPreviewSkin] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleSelect = useCallback((skin) => {
    setPreviewSkin(skin);
  }, []);

  const handleApply = useCallback(() => {
    if (previewSkin) {
      setSkin(previewSkin.id);
      setActiveSkin(previewSkin);
      setPreviewSkin(null);
      if (onSkinChange) onSkinChange(previewSkin);
    }
  }, [previewSkin, onSkinChange]);

  const handleUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const newSkin = await uploadCustomSkin(file);
      setSkins(getAvailableSkins());
      setPreviewSkin(newSkin);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleDelete = useCallback((skinId) => {
    deleteCustomSkin(skinId);
    setSkins(getAvailableSkins());
    if (previewSkin?.id === skinId) setPreviewSkin(null);
    if (activeSkin?.id === skinId) {
      const defaultSkin = getAvailableSkins()[0];
      setActiveSkin(defaultSkin);
      if (onSkinChange) onSkinChange(defaultSkin);
    }
  }, [previewSkin, activeSkin, onSkinChange]);

  const renderSkinPreview = (skin, size = 48) => {
    if (skin.type === 'emoji') {
      return (
        <span style={{ fontSize: `${size * 0.6}px` }}>
          {skin.data || skin.preview}
        </span>
      );
    }
    if (skin.type === 'custom-image') {
      return (
        <img
          src={skin.data}
          alt={skin.name}
          className="rounded-lg object-cover"
          style={{ width: `${size}px`, height: `${size}px`, imageRendering: 'pixelated' }}
        />
      );
    }
    if (skin.type === 'css-pixel') {
      return (
        <div
          className="rounded-lg"
          style={{
            ...getPixelSlimeCSS(),
            width: `${size}px`,
            height: `${size}px`,
          }}
        />
      );
    }
    return <span className="text-2xl">❓</span>;
  };

  const displaySkin = previewSkin || activeSkin;

  return (
    <InteractivePanel>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-16 right-4 w-80 max-h-[520px] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl z-[9999]"
        style={{
          background: 'rgba(15, 15, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <h3 className="text-white font-semibold text-sm">Pet Skins</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 border-b border-white/10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            {renderSkinPreview(displaySkin, 64)}
          </div>
          <span className="text-white text-sm font-medium">{displaySkin.name}</span>
          <span className="text-gray-500 text-[10px]">{displaySkin.description}</span>
          {previewSkin && previewSkin.id !== activeSkin.id && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleApply}
              className="mt-2 px-4 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-all"
            >
              Apply Skin
            </motion.button>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-2 bg-red-500/10 border-b border-white/10"
            >
              <p className="text-red-400 text-xs">⚠️ {error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skin Grid */}
        <div className="p-4 border-b border-white/10">
          <h4 className="text-gray-400 text-xs mb-3">Built-in Skins</h4>
          <div className="grid grid-cols-4 gap-2">
            {skins.filter(s => !isCustomSkin(s.id)).map((skin) => (
              <motion.button
                key={skin.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(skin)}
                className={`relative w-full aspect-square rounded-xl flex items-center justify-center border transition-all ${
                  activeSkin.id === skin.id
                    ? 'border-green-400/50 bg-green-500/10'
                    : previewSkin?.id === skin.id
                    ? 'border-blue-400/50 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                {renderSkinPreview(skin, 32)}
                {activeSkin.id === skin.id && (
                  <span className="absolute -top-1 -right-1 text-[10px]">✓</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Skins */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-gray-400 text-xs">Custom Skins</h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-medium hover:bg-purple-500/30 transition-all disabled:opacity-50"
            >
              {uploading ? '...' : '+ Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {skins.filter(s => isCustomSkin(s.id)).length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {skins.filter(s => isCustomSkin(s.id)).map((skin) => (
                <motion.div
                  key={skin.id}
                  className="relative group"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelect(skin)}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center border transition-all ${
                      activeSkin.id === skin.id
                        ? 'border-green-400/50 bg-green-500/10'
                        : previewSkin?.id === skin.id
                        ? 'border-blue-400/50 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {renderSkinPreview(skin, 32)}
                  </motion.button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(skin.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-[10px] text-center py-3">
              No custom skins yet. Upload an image to create one!
            </p>
          )}
        </div>
      </motion.div>
    </InteractivePanel>
  );
}

export default SkinSelector;
