import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createEmptySpriteSet,
  saveCustomSprite,
  loadCustomSprites,
  deleteCustomSprite,
  setActiveCustomSprite,
  getActiveCustomSprite,
  clearActiveCustomSprite,
  getSpriteStates,
  createEmptyGrid,
} from '../services/customSpriteService';
import PetSprite from './PetSprite';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#92400e', '#6b7280', '#d1d5db', '#166534', '#1e3a5f', '#fbbf24',
  null, // transparent
];

const COLOR_LABELS = [
  'Black', 'White', 'Red', 'Orange', 'Yellow',
  'Green', 'Cyan', 'Blue', 'Purple', 'Pink',
  'Brown', 'Gray', 'Light Gray', 'Dark Green', 'Navy', 'Gold',
  'Transparent',
];

const TOOLS = [
  { id: 'pencil', icon: '✏️', label: 'Pencil' },
  { id: 'eraser', icon: '🧹', label: 'Eraser' },
  { id: 'fill', icon: '🪣', label: 'Fill' },
  { id: 'picker', icon: '💉', label: 'Picker' },
];

function SpriteEditor({ onClose, onApplyCustomSprite }) {
  const [spriteSet, setSpriteSet] = useState(() => {
    const saved = loadCustomSprites();
    if (saved.length > 0) return saved[0];
    return createEmptySpriteSet();
  });
  const [spriteName, setSpriteName] = useState(spriteSet.name);
  const [activeState, setActiveState] = useState('custom_idle');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [tool, setTool] = useState('pencil');
  const [showGrid, setShowGrid] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [savedSprites, setSavedSprites] = useState(() => loadCustomSprites());
  const canvasRef = useRef(null);

  const states = getSpriteStates();
  const currentGrid = spriteSet.sprites[activeState] || createEmptyGrid();

  // Preview animation
  useEffect(() => {
    if (!showPreview) return;
    const frames = ['custom_idle', 'custom_idle2', 'custom_walk1', 'custom_walk2'];
    const timer = setInterval(() => {
      setPreviewFrame((prev) => (prev + 1) % frames.length);
    }, 400);
    return () => clearInterval(timer);
  }, [showPreview]);

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => {
      const next = [...prev, JSON.stringify(spriteSet.sprites[activeState])];
      return next.slice(-20);
    });
  }, [spriteSet, activeState]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setSpriteSet((prev) => ({
      ...prev,
      sprites: { ...prev.sprites, [activeState]: JSON.parse(last) },
    }));
  };

  const setPixel = (row, col) => {
    if (tool === 'picker') {
      const color = currentGrid[row][col];
      if (color) setCurrentColor(color);
      setTool('pencil');
      return;
    }

    if (tool === 'fill') {
      pushUndo();
      const targetColor = currentGrid[row][col];
      const fillColor = tool === 'eraser' ? null : currentColor;
      if (targetColor === fillColor) return;
      const newGrid = currentGrid.map(r => [...r]);
      floodFill(newGrid, row, col, targetColor, fillColor);
      setSpriteSet((prev) => ({
        ...prev,
        sprites: { ...prev.sprites, [activeState]: newGrid },
      }));
      return;
    }

    const color = tool === 'eraser' ? null : currentColor;
    const newGrid = currentGrid.map(r => [...r]);
    newGrid[row][col] = color;
    setSpriteSet((prev) => ({
      ...prev,
      sprites: { ...prev.sprites, [activeState]: newGrid },
    }));
  };

  const handleMouseDown = (row, col) => {
    pushUndo();
    setIsDrawing(true);
    setPixel(row, col);
  };

  const handleMouseEnter = (row, col) => {
    if (!isDrawing) return;
    if (tool === 'fill' || tool === 'picker') return;
    setPixel(row, col);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const up = () => setIsDrawing(false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const handleSave = () => {
    const name = spriteName.trim() || 'My Pet';
    const toSave = { ...spriteSet, name };
    saveCustomSprite(name, toSave);
    setSavedSprites(loadCustomSprites());
    setSpriteSet(toSave);
  };

  const handleLoad = (sprite) => {
    setSpriteSet(sprite);
    setSpriteName(sprite.name);
    setUndoStack([]);
  };

  const handleDelete = (name) => {
    deleteCustomSprite(name);
    setSavedSprites(loadCustomSprites());
  };

  const handleUseAsPet = () => {
    handleSave();
    const name = spriteName.trim() || 'My Pet';
    setActiveCustomSprite(name);
    if (onApplyCustomSprite) onApplyCustomSprite(name);
  };

  const handleRevertToDefault = () => {
    clearActiveCustomSprite();
    if (onApplyCustomSprite) onApplyCustomSprite(null);
  };

  const activeCustom = getActiveCustomSprite();
  const previewFrames = ['custom_idle', 'custom_idle2', 'custom_walk1', 'custom_walk2'];
  const previewGrid = spriteSet.sprites[previewFrames[previewFrame]] || createEmptyGrid();

  return (
    <motion.div
      className="fixed z-50 select-none"
      style={{ top: 40, right: 40 }}
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onMouseUp={handleMouseUp}
    >
      <div className="w-[350px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎨</span>
            <input
              className="bg-transparent text-white text-sm font-medium outline-none border-b border-transparent focus:border-gray-500 w-28"
              value={spriteName}
              onChange={(e) => setSpriteName(e.target.value)}
              maxLength={20}
              placeholder="Sprite name"
            />
          </div>
          <button
            className="text-gray-400 hover:text-white text-lg transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* State selector */}
        <div className="flex flex-wrap gap-1 px-3 py-1.5 border-b border-gray-700/30">
          {states.map((s) => (
            <button
              key={s.key}
              className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                activeState === s.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => { setActiveState(s.key); setUndoStack([]); }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Tools + Color */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-700/30">
          <div className="flex gap-1">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                className={`text-sm w-6 h-6 flex items-center justify-center rounded transition-colors ${
                  tool === t.id ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => setTool(t.id)}
                title={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-700" />
          <div
            className="w-5 h-5 rounded border border-gray-600"
            style={{ backgroundColor: currentColor || 'transparent', backgroundImage: !currentColor ? 'linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%)' : 'none', backgroundSize: '4px 4px', backgroundPosition: '0 0, 2px 2px' }}
          />
          <button
            className={`text-[9px] px-1.5 py-0.5 rounded ${showGrid ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            onClick={() => setShowGrid(!showGrid)}
          >
            Grid
          </button>
          <button
            className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-30"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
          >
            Undo
          </button>
        </div>

        {/* Color palette */}
        <div className="flex flex-wrap gap-0.5 px-3 py-1.5 border-b border-gray-700/30">
          {COLORS.map((color, idx) => (
            <button
              key={idx}
              className={`w-4 h-4 rounded-sm border transition-transform ${
                currentColor === color ? 'border-white scale-125' : 'border-gray-600 hover:scale-110'
              }`}
              style={{
                backgroundColor: color || 'transparent',
                backgroundImage: !color ? 'linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%), linear-gradient(45deg, #666 25%, transparent 25%, transparent 75%, #666 75%)' : 'none',
                backgroundSize: '3px 3px',
                backgroundPosition: '0 0, 1.5px 1.5px',
              }}
              onClick={() => setCurrentColor(color)}
              title={COLOR_LABELS[idx]}
            />
          ))}
        </div>

        {/* Pixel grid */}
        <div className="flex justify-center py-2 px-3">
          <div
            ref={canvasRef}
            className="inline-grid"
            style={{
              gridTemplateColumns: 'repeat(16, 1fr)',
              gap: showGrid ? '1px' : '0px',
              backgroundColor: showGrid ? '#374151' : 'transparent',
              border: showGrid ? '1px solid #374151' : 'none',
            }}
          >
            {currentGrid.map((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="w-[14px] h-[14px] cursor-crosshair"
                  style={{
                    backgroundColor: cell || (showGrid ? '#1f2937' : 'transparent'),
                    backgroundImage: !cell && !showGrid ? 'linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%), linear-gradient(45deg, #333 25%, transparent 25%, transparent 75%, #333 75%)' : 'none',
                    backgroundSize: '4px 4px',
                    backgroundPosition: '0 0, 2px 2px',
                  }}
                  onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                  onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                />
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-gray-700/30">
          <button
            className="text-[10px] px-2 py-1 rounded bg-green-700 hover:bg-green-600 text-white transition-colors"
            onClick={handleSave}
          >
            💾 Save
          </button>
          <button
            className="text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            onClick={() => setShowPreview(!showPreview)}
          >
            👁️ Preview
          </button>
          <button
            className="text-[10px] px-2 py-1 rounded bg-purple-700 hover:bg-purple-600 text-white transition-colors"
            onClick={handleUseAsPet}
          >
            🐾 Use as Pet
          </button>
          {activeCustom && (
            <button
              className="text-[10px] px-2 py-1 rounded bg-red-800 hover:bg-red-700 text-white transition-colors"
              onClick={handleRevertToDefault}
            >
              ↩ Default
            </button>
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="px-3 py-2 border-t border-gray-700/30 flex items-center gap-3">
            <span className="text-[9px] text-gray-400">Preview:</span>
            <div className="bg-gray-800 rounded p-1">
              <PetSprite sprite={previewGrid} scale={0.5} />
            </div>
          </div>
        )}

        {/* Saved sprites list */}
        {savedSprites.length > 0 && (
          <div className="px-3 py-2 border-t border-gray-700/30">
            <div className="text-[9px] text-gray-400 mb-1">Saved ({savedSprites.length}/5):</div>
            <div className="flex flex-wrap gap-1">
              {savedSprites.map((s) => (
                <div key={s.name} className="flex items-center gap-0.5">
                  <button
                    className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                      s.name === spriteName ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => handleLoad(s)}
                  >
                    {s.name}
                  </button>
                  <button
                    className="text-[8px] text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(s.name)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Flood fill helper
function floodFill(grid, row, col, targetColor, fillColor) {
  if (row < 0 || row >= 16 || col < 0 || col >= 16) return;
  if (grid[row][col] !== targetColor) return;
  if (grid[row][col] === fillColor) return;

  const stack = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop();
    if (r < 0 || r >= 16 || c < 0 || c >= 16) continue;
    if (grid[r][c] !== targetColor) continue;
    grid[r][c] = fillColor;
    stack.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
}

export default SpriteEditor;
