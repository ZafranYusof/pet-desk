import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportPet, importPet, downloadExport, readImportFile, generatePetCard } from '../services/importExportService';

const SPECIES_EMOJI = { slime: '🟢', cat: '🐱', ghost: '👻' };

function PetCard({ petState }) {
  const card = generatePetCard(petState);

  return (
    <div className="bg-gradient-to-br from-purple-900/60 to-blue-900/60 rounded-xl border border-purple-500/40 p-3 shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-full bg-gray-800/60 border-2 border-purple-400/50 flex items-center justify-center text-2xl">
          {SPECIES_EMOJI[card.species] || '🟢'}
        </div>
        <div>
          <div className="text-sm font-bold text-purple-200">{card.name}</div>
          <div className="text-[10px] text-gray-400">Lv.{card.level} {card.species}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800/40 rounded-lg p-1.5">
          <div className="text-[9px] text-gray-500">❤️ Happy</div>
          <div className="text-xs text-gray-200">{card.happiness}%</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-1.5">
          <div className="text-[9px] text-gray-500">⚡ Energy</div>
          <div className="text-xs text-gray-200">{card.energy}%</div>
        </div>
        <div className="bg-gray-800/40 rounded-lg p-1.5">
          <div className="text-[9px] text-gray-500">🍖 Hunger</div>
          <div className="text-xs text-gray-200">{card.hunger}%</div>
        </div>
      </div>

      <div className="flex justify-between mt-2 text-[9px] text-gray-500">
        <span>📅 {card.daysAlive} days old</span>
        <span>🎀 {card.accessories} accessories</span>
        <span>✋ {card.totalPets} pets</span>
      </div>
    </div>
  );
}

function ImportExport({ petState, onImport, onClose }) {
  const [tab, setTab] = useState('card'); // card, export, import
  const [message, setMessage] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const fileInputRef = useRef(null);

  const showMessage = (msg, isError = false) => {
    setMessage({ text: msg, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = () => {
    const success = downloadExport(petState);
    if (success) {
      showMessage('Pet exported successfully!');
    } else {
      showMessage('Export failed!', true);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const encoded = await readImportFile(file);
      const result = importPet(encoded);
      if (result.success) {
        setImportPreview(result);
      } else {
        showMessage(result.reason, true);
      }
    } catch (err) {
      showMessage('Failed to read file', true);
    }
  };

  const handleConfirmImport = () => {
    if (importPreview?.pet) {
      onImport(importPreview.pet);
      setImportPreview(null);
      showMessage('Pet imported successfully!');
    }
  };

  return (
    <motion.div
      className="fixed z-50 w-[300px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base">📦</span>
          <span className="text-sm font-medium text-gray-200">Import / Export</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2">
        {[
          { id: 'card', label: '🎴 Card' },
          { id: 'export', label: '📤 Export' },
          { id: 'import', label: '📥 Import' },
        ].map((t) => (
          <button
            key={t.id}
            className={`px-2 py-1 rounded-lg text-xs cursor-pointer transition-all ${
              tab === t.id
                ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40'
                : 'bg-gray-800/40 text-gray-400 border border-gray-700/30 hover:bg-gray-700/40'
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className={`mx-3 mt-2 px-2 py-1 rounded-lg text-xs text-center ${
              message.isError ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'
            }`}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-3">
        {tab === 'card' && (
          <div>
            <PetCard petState={petState} />
            <p className="text-[10px] text-gray-500 mt-2 text-center">Your pet's shareable card</p>
          </div>
        )}

        {tab === 'export' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Export your pet as a file. Includes species, level, accessories, achievements, stats, and personality.
            </p>
            <motion.button
              className="w-full px-3 py-2 bg-purple-600/40 text-purple-200 border border-purple-500/40 rounded-lg text-sm cursor-pointer hover:bg-purple-600/60"
              onClick={handleExport}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              📤 Export Pet File
            </motion.button>
            <p className="text-[9px] text-gray-500 text-center">
              File will be saved as .petdesk format
            </p>
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-3">
            {!importPreview ? (
              <>
                <p className="text-xs text-gray-400">
                  Import a pet from a .petdesk file. This will replace your current pet!
                </p>
                <motion.button
                  className="w-full px-3 py-2 bg-blue-600/40 text-blue-200 border border-blue-500/40 rounded-lg text-sm cursor-pointer hover:bg-blue-600/60"
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  📁 Choose File
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".petdesk,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </>
            ) : (
              <>
                <p className="text-xs text-yellow-300 mb-2">⚠️ Preview - confirm to replace current pet:</p>
                <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/40 text-xs text-gray-300 space-y-1">
                  <div>🏷️ Name: {importPreview.pet.name}</div>
                  <div>{SPECIES_EMOJI[importPreview.pet.species]} Species: {importPreview.pet.species}</div>
                  <div>⭐ Level: {importPreview.pet.level}</div>
                  <div>📅 Exported: {new Date(importPreview.exportedAt).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 px-3 py-2 bg-green-600/40 text-green-200 border border-green-500/40 rounded-lg text-xs cursor-pointer hover:bg-green-600/60"
                    onClick={handleConfirmImport}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✓ Confirm Import
                  </motion.button>
                  <motion.button
                    className="flex-1 px-3 py-2 bg-gray-700/40 text-gray-300 border border-gray-600/40 rounded-lg text-xs cursor-pointer hover:bg-gray-700/60"
                    onClick={() => setImportPreview(null)}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✕ Cancel
                  </motion.button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ImportExport;
