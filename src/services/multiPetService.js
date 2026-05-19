/**
 * PetDesk - Multi-Pet Service
 * Manages multiple pet slots (max 3), companion summoning, and slot unlocks.
 */

import { createDefaultPet } from './petEngine';

const SLOTS_KEY = 'petdesk-pet-slots';
const COMPANION_KEY = 'petdesk-companion-state';
const MAX_SLOTS = 3;

// Unlock conditions for each slot
const SLOT_UNLOCK_LEVELS = [0, 10, 20]; // Slot 0 always available, slot 1 at level 10, slot 2 at level 20

/**
 * Get all pet slots from storage.
 * Returns array of pet states (null for empty/locked slots).
 */
export function getPetSlots() {
  try {
    const stored = localStorage.getItem(SLOTS_KEY);
    if (stored) {
      const slots = JSON.parse(stored);
      // Ensure we always have MAX_SLOTS entries
      while (slots.length < MAX_SLOTS) {
        slots.push(null);
      }
      return slots;
    }
  } catch (e) {
    console.warn('Failed to load pet slots:', e);
  }
  return [null, null, null];
}

/**
 * Save all pet slots to storage.
 */
export function savePetSlots(slots) {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  } catch (e) {
    console.warn('Failed to save pet slots:', e);
  }

  // Also persist to electron-store
  try {
    if (window.electronAPI && window.electronAPI.savePetState) {
      window.electronAPI.savePetState({ __multiSlots: slots });
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Create a new pet in the next available slot.
 * Returns updated slots array or null if no slot available.
 */
export function createNewPet(species, name, primaryLevel = 1) {
  const slots = getPetSlots();

  // Find next available slot that is unlocked and empty
  for (let i = 0; i < MAX_SLOTS; i++) {
    if (slots[i] === null && isSlotUnlocked(i, primaryLevel)) {
      const newPet = createDefaultPet();
      newPet.species = species;
      newPet.name = name;
      newPet.unlockedSpecies = ['slime', 'cat', 'ghost']; // Companions get all species
      slots[i] = newPet;
      savePetSlots(slots);
      return slots;
    }
  }
  return null; // No available slot
}

/**
 * Delete a pet from a slot (cannot delete slot 0 / primary).
 */
export function deletePet(slotIndex) {
  if (slotIndex === 0) return null; // Can't delete primary
  const slots = getPetSlots();
  slots[slotIndex] = null;
  savePetSlots(slots);

  // If deleted pet was companion, dismiss it
  const companion = getCompanion();
  if (companion === slotIndex) {
    dismissCompanion();
  }

  return slots;
}

/**
 * Get the active/primary pet (slot 0).
 */
export function getActivePet() {
  const slots = getPetSlots();
  return slots[0] || null;
}

/**
 * Get the currently summoned companion slot index (or null).
 */
export function getCompanion() {
  try {
    const stored = localStorage.getItem(COMPANION_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return data.slotIndex ?? null;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Summon a companion from a slot.
 * Only slots 1 and 2 can be companions.
 */
export function summonCompanion(slotIndex) {
  if (slotIndex === 0) return false; // Primary can't be companion
  const slots = getPetSlots();
  if (!slots[slotIndex]) return false; // Empty slot

  try {
    localStorage.setItem(COMPANION_KEY, JSON.stringify({ slotIndex }));
  } catch (e) {
    console.warn('Failed to save companion state:', e);
    return false;
  }
  return true;
}

/**
 * Dismiss the current companion from screen.
 */
export function dismissCompanion() {
  try {
    localStorage.removeItem(COMPANION_KEY);
  } catch (e) {
    // ignore
  }
}

/**
 * Check if a slot is unlocked based on primary pet level.
 */
export function isSlotUnlocked(slotIndex, primaryLevel) {
  if (slotIndex < 0 || slotIndex >= MAX_SLOTS) return false;
  return primaryLevel >= SLOT_UNLOCK_LEVELS[slotIndex];
}

/**
 * Get unlock level requirement for a slot.
 */
export function getSlotUnlockLevel(slotIndex) {
  return SLOT_UNLOCK_LEVELS[slotIndex] || 0;
}

/**
 * Get max slots constant.
 */
export function getMaxSlots() {
  return MAX_SLOTS;
}

/**
 * Save a specific slot's state (used for companion tick updates).
 */
export function saveSlotState(slotIndex, state) {
  const slots = getPetSlots();
  if (slotIndex >= 0 && slotIndex < MAX_SLOTS) {
    slots[slotIndex] = state;
    savePetSlots(slots);
  }
}
