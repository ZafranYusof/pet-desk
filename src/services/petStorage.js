/**
 * PetDesk - Pet State Persistence
 * Uses Electron IPC if available, localStorage fallback.
 * Supports multi-pet slots with backward-compatible migration.
 */

import { createDefaultPet } from './petEngine';

const STORAGE_KEY = 'petdesk-pet-state';
const SLOTS_KEY = 'petdesk-pet-slots';
const COMPANION_KEY = 'petdesk-companion-state';

/**
 * Load pet state (slot 0 / primary). Backward compatible.
 * If old single-pet data exists, migrates it to slot 0.
 */
export function loadPet() {
  // Try loading from multi-slot system first
  const slots = loadAllPets();
  if (slots[0]) return slots[0];

  // Fallback: old single-pet storage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const pet = JSON.parse(stored);
      // Migrate: save as slot 0
      const newSlots = [pet, null, null];
      saveAllPets(newSlots);
      return pet;
    }
  } catch (e) {
    console.warn('Failed to load pet state from localStorage:', e);
  }
  return createDefaultPet();
}

/**
 * Load pet state from electron-store (async). Call on mount.
 */
export async function loadPetAsync() {
  try {
    if (window.electronAPI && window.electronAPI.getPetState) {
      const state = await window.electronAPI.getPetState();
      if (state) {
        // Check if it's multi-slot format
        if (state.__multiSlots) {
          return state.__multiSlots[0] || loadPet();
        }
        return state;
      }
    }
  } catch (e) {
    // Fall through to localStorage
  }
  return loadPet();
}

/**
 * Save pet state to storage (slot 0 / primary).
 */
export function savePet(state) {
  // Save to legacy key for backward compat
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save pet state to localStorage:', e);
  }

  // Also update slot 0 in multi-slot storage
  const slots = loadAllPets();
  slots[0] = state;
  saveAllPets(slots);

  // Also persist to electron-store (fire and forget)
  try {
    if (window.electronAPI && window.electronAPI.savePetState) {
      window.electronAPI.savePetState(state);
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Load all pet slots. Returns array of length 3 (null for empty slots).
 */
export function loadAllPets() {
  try {
    const stored = localStorage.getItem(SLOTS_KEY);
    if (stored) {
      const slots = JSON.parse(stored);
      while (slots.length < 3) slots.push(null);
      return slots;
    }
  } catch (e) {
    console.warn('Failed to load pet slots:', e);
  }

  // Migration: check if old single-pet data exists
  try {
    const oldData = localStorage.getItem(STORAGE_KEY);
    if (oldData) {
      const pet = JSON.parse(oldData);
      const slots = [pet, null, null];
      saveAllPets(slots);
      return slots;
    }
  } catch (e) {
    // ignore
  }

  return [null, null, null];
}

/**
 * Save all pet slots.
 */
export function saveAllPets(slots) {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  } catch (e) {
    console.warn('Failed to save pet slots:', e);
  }
}

/**
 * Load companion state (which slot is summoned).
 */
export function loadCompanionState() {
  try {
    const stored = localStorage.getItem(COMPANION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Save companion state.
 */
export function saveCompanionState(state) {
  try {
    if (state === null) {
      localStorage.removeItem(COMPANION_KEY);
    } else {
      localStorage.setItem(COMPANION_KEY, JSON.stringify(state));
    }
  } catch (e) {
    // ignore
  }
}
