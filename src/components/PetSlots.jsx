import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PetSprite from './PetSprite';
import { isSlotUnlocked, getSlotUnlockLevel, getMaxSlots } from '../services/multiPetService';

const SPECIES_OPTIONS = [
  { id: 'slime', name: 'Slime', icon: '🟢' },
  { id: 'cat', name: 'Cat', icon: '🐱' },
  { id: 'ghost', name: 'Ghost', icon: '👻' },
];

function PetSlots({ slots, primaryLevel, companionSlot, onSummon, onDismiss, onCreate, onDelete, onClose }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSlotIndex, setCreateSlotIndex] = useState(null);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('slime');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const maxSlots = getMaxSlots();

  function handleCreateClick(slotIndex) {
    setCreateSlotIndex(slotIndex);
    setNewPetName('');
    setNewPetSpecies('slime');
    setShowCreateForm(true);
  }

  function handleCreateSubmit() {
    if (!newPetName.trim()) return;
    onCreate(newPetSpecies, newPetName.trim());
    setShowCreateForm(false);
    setCreateSlotIndex(null);
  }

  function handleDeleteClick(slotIndex) {
    setConfirmDelete(slotIndex);
  }

  function handleDeleteConfirm() {
    if (confirmDelete !== null) {
      onDelete(confirmDelete);
      setConfirmDelete(null);
    }
  }

  return (
    <motion.div
      className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-5"
        style={{ width: 320, minHeight: 220 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-semibold">👥 My Pets</h2>
          <button
            className="text-gray-400 hover:text-white text-xs cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Slots */}
        <div className="space-y-2">
          {Array.from({ length: maxSlots }).map((_, i) => {
            const pet = slots[i];
            const unlocked = isSlotUnlocked(i, primaryLevel);
            const isCompanion = companionSlot === i;
            const isPrimary = i === 0;

            if (!unlocked) {
              // Locked slot
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30 opacity-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-lg">
                    🔒
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs">
                      Unlock at Level {getSlotUnlockLevel(i)}
                    </p>
                  </div>
                </div>
              );
            }

            if (!pet) {
              // Empty unlocked slot
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-dashed border-gray-600/50 cursor-pointer hover:border-green-500/50 hover:bg-gray-800/70 transition-colors"
                  onClick={() => handleCreateClick(i)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-lg">
                    ➕
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-xs">Create New Pet</p>
                  </div>
                </div>
              );
            }

            // Filled slot
            const borderColor = isPrimary
              ? 'border-green-500/60'
              : isCompanion
              ? 'border-blue-500/60'
              : 'border-gray-700/30';

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border ${borderColor} transition-colors`}
              >
                {/* Mini sprite */}
                <div className="w-10 h-10 rounded-lg bg-gray-700/30 flex items-center justify-center overflow-hidden">
                  <div style={{ transform: 'scale(0.6)' }}>
                    <PetSprite
                      spriteKey={`${pet.species || 'slime'}_idle`}
                      size={40}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{pet.name}</p>
                  <p className="text-gray-400 text-[10px]">
                    Lv.{pet.level || 1} • {(pet.species || 'slime').charAt(0).toUpperCase() + (pet.species || 'slime').slice(1)}
                    {isPrimary && <span className="text-green-400 ml-1">★ Primary</span>}
                    {isCompanion && <span className="text-blue-400 ml-1">♦ Companion</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {!isPrimary && !isCompanion && (
                    <button
                      className="px-2 py-1 text-[10px] bg-blue-600/80 hover:bg-blue-500 text-white rounded-md cursor-pointer transition-colors"
                      onClick={() => onSummon(i)}
                      title="Summon as companion"
                    >
                      📢
                    </button>
                  )}
                  {isCompanion && (
                    <button
                      className="px-2 py-1 text-[10px] bg-gray-600/80 hover:bg-gray-500 text-white rounded-md cursor-pointer transition-colors"
                      onClick={onDismiss}
                      title="Dismiss companion"
                    >
                      👋
                    </button>
                  )}
                  {!isPrimary && (
                    <button
                      className="px-2 py-1 text-[10px] bg-red-900/60 hover:bg-red-700 text-red-300 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleDeleteClick(i)}
                      title="Delete pet"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              className="mt-3 p-3 rounded-xl bg-gray-800/80 border border-gray-600/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-white text-xs font-medium mb-2">New Pet</p>

              {/* Species selection */}
              <div className="flex gap-2 mb-2">
                {SPECIES_OPTIONS.map((sp) => (
                  <button
                    key={sp.id}
                    className={`flex-1 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      newPetSpecies === sp.id
                        ? 'bg-green-600/80 text-white border border-green-400/50'
                        : 'bg-gray-700/50 text-gray-300 border border-gray-600/30 hover:bg-gray-700'
                    }`}
                    onClick={() => setNewPetSpecies(sp.id)}
                  >
                    {sp.icon} {sp.name}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                type="text"
                className="w-full px-3 py-1.5 rounded-lg bg-gray-700/50 border border-gray-600/30 text-white text-xs placeholder-gray-500 outline-none focus:border-green-500/50"
                placeholder="Pet name..."
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                maxLength={16}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()}
                autoFocus
              />

              {/* Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 py-1.5 rounded-lg text-xs bg-green-600/80 hover:bg-green-500 text-white cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleCreateSubmit}
                  disabled={!newPetName.trim()}
                >
                  Create
                </button>
                <button
                  className="flex-1 py-1.5 rounded-lg text-xs bg-gray-700/50 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {confirmDelete !== null && (
            <motion.div
              className="mt-3 p-3 rounded-xl bg-red-900/30 border border-red-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-red-300 text-xs mb-2">
                Delete {slots[confirmDelete]?.name || 'this pet'}? This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-1.5 rounded-lg text-xs bg-red-700/80 hover:bg-red-600 text-white cursor-pointer transition-colors"
                  onClick={handleDeleteConfirm}
                >
                  Delete
                </button>
                <button
                  className="flex-1 py-1.5 rounded-lg text-xs bg-gray-700/50 hover:bg-gray-600 text-gray-300 cursor-pointer transition-colors"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default PetSlots;
