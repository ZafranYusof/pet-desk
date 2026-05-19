/**
 * PetDesk - Pet State Persistence
 * Uses Electron IPC if available, localStorage fallback.
 */

import { createDefaultPet } from './petEngine';

const STORAGE_KEY = 'petdesk-pet-state';

/**
 * Load pet state. Creates default pet if none exists.
 * Note: This is sync for initial load (uses localStorage),
 * then async IPC syncs in background.
 */
export function loadPet() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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
      if (state) return state;
    }
  } catch (e) {
    // Fall through to localStorage
  }
  return loadPet();
}

/**
 * Save pet state to storage.
 */
export function savePet(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save pet state to localStorage:', e);
  }

  // Also persist to electron-store (fire and forget)
  try {
    if (window.electronAPI && window.electronAPI.savePetState) {
      window.electronAPI.savePetState(state);
    }
  } catch (e) {
    // ignore
  }
}
