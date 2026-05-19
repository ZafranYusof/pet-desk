import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PetSprite from './PetSprite';
import {
  FILTERS,
  FRAMES,
  STICKERS,
  capturePhoto,
  savePhoto,
  deletePhoto,
  getGallery,
  getFilterCSS,
  getFrameStyle,
  formatPhotoDate,
} from '../services/photographyService';
import { getActiveHabitat } from '../services/habitatService';

const HABITAT_GRADIENTS = {
  meadow: 'linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)',
  forest: 'linear-gradient(180deg, #2d5016 0%, #1a3a0a 100%)',
  beach: 'linear-gradient(180deg, #87CEEB 0%, #f4d03f 100%)',
  space: 'linear-gradient(180deg, #0c0c2e 0%, #1a1a4e 100%)',
  city: 'linear-gradient(180deg, #4a4a6a 0%, #2a2a3a 100%)',
  volcano: 'linear-gradient(180deg, #8b0000 0%, #2d0000 100%)',
  cloud: 'linear-gradient(180deg, #e0e8ff 0%, #b8c8ff 100%)',
  ocean: 'linear-gradient(180deg, #006994 0%, #003366 100%)',
};

function PhotoMode({ petState, onClose }) {
  const [activeFilter, setActiveFilter] = useState('normal');
  const [activeFrame, setActiveFrame] = useState('none');
  const [stickers, setStickers] = useState([]);
  const [gallery, setGallery] = useState(() => getGallery());
  const [showGallery, setShowGallery] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [dragSticker, setDragSticker] = useState(null);
  const previewRef = useRef(null);

  const habitat = getActiveHabitat() || 'meadow';
  const bgGradient = HABITAT_GRADIENTS[habitat] || HABITAT_GRADIENTS.meadow;

  const handleAddSticker = useCallback((sticker) => {
    if (stickers.length >= 5) return;
    const newSticker = {
      ...sticker,
      x: 30 + Math.random() * 40, // % position
      y: 20 + Math.random() * 40,
      size: 'medium',
      instanceId: `${sticker.id}_${Date.now()}`,
    };
    setStickers((prev) => [...prev, newSticker]);
  }, [stickers.length]);

  const handleRemoveSticker = useCallback((instanceId) => {
    setStickers((prev) => prev.filter((s) => s.instanceId !== instanceId));
  }, []);

  const handleCycleStickerSize = useCallback((instanceId) => {
    setStickers((prev) => prev.map((s) => {
      if (s.instanceId !== instanceId) return s;
      const sizes = ['small', 'medium', 'large'];
      const idx = sizes.indexOf(s.size);
      return { ...s, size: sizes[(idx + 1) % sizes.length] };
    }));
  }, []);

  const handleCapture = useCallback(() => {
    const photo = capturePhoto(petState, habitat, activeFilter, activeFrame, stickers);
    const updatedGallery = savePhoto(photo);
    setGallery(updatedGallery);
    // Flash effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);
  }, [petState, habitat, activeFilter, activeFrame, stickers]);

  const handleDeletePhoto = useCallback((id) => {
    const updatedGallery = deletePhoto(id);
    setGallery(updatedGallery);
    setViewingPhoto(null);
  }, []);

  const handleClearStickers = useCallback(() => {
    setStickers([]);
  }, []);

  const stickerSizePx = { small: 16, medium: 24, large: 36 };

  // Gallery view
  if (showGallery && !viewingPhoto) {
    return (
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div
          className="relative w-[380px] max-h-[450px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🖼️</span>
              <span className="text-white text-sm font-medium">Gallery ({gallery.length}/{20})</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowGallery(false)} className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer">← Back</button>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {gallery.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">No photos yet. Capture some!</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {gallery.map((photo) => (
                  <button
                    key={photo.id}
                    className="aspect-square rounded-lg overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 cursor-pointer transition-colors relative"
                    onClick={() => setViewingPhoto(photo)}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: HABITAT_GRADIENTS[photo.habitat] || bgGradient,
                        filter: getFilterCSS(photo.filter),
                      }}
                    >
                      <span className="text-2xl">
                        {photo.petSpecies === 'cat' ? '🐱' : photo.petSpecies === 'ghost' ? '👻' : '🟢'}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-gray-300 px-1 py-0.5 text-center truncate">
                      {formatPhotoDate(photo.timestamp)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Viewing single photo
  if (viewingPhoto) {
    return (
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setViewingPhoto(null)} />
        <motion.div
          className="relative w-[320px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
            <span className="text-white text-sm">{viewingPhoto.petName} - {formatPhotoDate(viewingPhoto.timestamp)}</span>
            <button onClick={() => setViewingPhoto(null)} className="text-gray-400 hover:text-white cursor-pointer">×</button>
          </div>
          <div className="p-4">
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                background: HABITAT_GRADIENTS[viewingPhoto.habitat] || bgGradient,
                filter: getFilterCSS(viewingPhoto.filter),
                ...getFrameStyle(viewingPhoto.frame),
              }}
            >
              <PetSprite species={viewingPhoto.petSpecies} state={viewingPhoto.petState || 'idle'} level={viewingPhoto.petLevel} size={80} />
              {(viewingPhoto.stickers || []).map((s, i) => (
                <span
                  key={i}
                  className="absolute"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    fontSize: `${stickerSizePx[s.size] || 24}px`,
                  }}
                >
                  {s.emoji}
                </span>
              ))}
            </div>
          </div>
          <div className="px-4 pb-3 flex gap-2">
            <button
              onClick={() => { setViewingPhoto(null); setShowGallery(true); }}
              className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer"
            >
              ← Back
            </button>
            <button
              onClick={() => handleDeletePhoto(viewingPhoto.id)}
              className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs rounded-lg cursor-pointer"
            >
              🗑️ Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Main photo mode UI
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        className="relative w-[380px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        style={{ maxHeight: '460px' }}
      >
        {/* Flash effect */}
        <AnimatePresence>
          {flashEffect && (
            <motion.div
              className="absolute inset-0 bg-white z-50 pointer-events-none"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">📷</span>
            <span className="text-white text-sm font-medium">Photo Mode</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer">×</button>
        </div>

        {/* Preview Area */}
        <div className="px-4 pt-3 pb-2">
          <div
            ref={previewRef}
            className="w-full h-[160px] rounded-lg relative overflow-hidden flex items-center justify-center"
            style={{
              background: bgGradient,
              filter: getFilterCSS(activeFilter),
              ...(activeFilter === 'pixel' ? { imageRendering: 'pixelated' } : {}),
              ...getFrameStyle(activeFrame),
            }}
          >
            <PetSprite
              species={petState.species || 'slime'}
              state={petState.state || 'idle'}
              level={petState.level || 1}
              size={64}
            />
            {/* Stickers */}
            {stickers.map((s) => (
              <span
                key={s.instanceId}
                className="absolute cursor-pointer select-none hover:scale-110 transition-transform"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  fontSize: `${stickerSizePx[s.size] || 24}px`,
                }}
                onClick={() => handleCycleStickerSize(s.instanceId)}
                onDoubleClick={() => handleRemoveSticker(s.instanceId)}
                title="Click: resize | Double-click: remove"
              >
                {s.emoji}
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-1">
          <p className="text-[10px] text-gray-500 mb-1">Filters</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2 py-1 text-[10px] rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  activeFilter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Frames */}
        <div className="px-4 py-1">
          <p className="text-[10px] text-gray-500 mb-1">Frames</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {FRAMES.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFrame(f.id)}
                className={`px-2 py-1 text-[10px] rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  activeFrame === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stickers */}
        <div className="px-4 py-1">
          <p className="text-[10px] text-gray-500 mb-1">Stickers ({stickers.length}/5)</p>
          <div className="flex gap-1.5 flex-wrap">
            {STICKERS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleAddSticker(s)}
                disabled={stickers.length >= 5}
                className={`text-lg cursor-pointer hover:scale-125 transition-transform ${
                  stickers.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                title={`Add ${s.emoji}`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-2 flex gap-2">
          <button
            onClick={handleCapture}
            className="flex-1 px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
          >
            📸 Capture
          </button>
          <button
            onClick={() => setShowGallery(true)}
            className="flex-1 px-3 py-1.5 bg-gray-700/80 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer transition-colors"
          >
            🖼️ Gallery ({gallery.length})
          </button>
          <button
            onClick={handleClearStickers}
            className="px-3 py-1.5 bg-gray-700/80 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer transition-colors"
          >
            🗑️
          </button>
        </div>

        {/* Recent photos strip */}
        {gallery.length > 0 && (
          <div className="px-4 pb-2 border-t border-gray-700/30 pt-2">
            <div className="flex gap-1.5 overflow-x-auto">
              {gallery.slice(0, 5).map((photo) => (
                <button
                  key={photo.id}
                  className="w-[40px] h-[40px] rounded-md overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 cursor-pointer flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: HABITAT_GRADIENTS[photo.habitat] || bgGradient,
                    filter: getFilterCSS(photo.filter),
                  }}
                  onClick={() => setViewingPhoto(photo)}
                  title={formatPhotoDate(photo.timestamp)}
                >
                  <span className="text-xs">
                    {photo.petSpecies === 'cat' ? '🐱' : photo.petSpecies === 'ghost' ? '👻' : '🟢'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default PhotoMode;
