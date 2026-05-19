/**
 * PetDesk - Pet State Persistence
 * Uses Electron IPC (electron-store) if available, localStorage fallback.
 */

import { createDefaultPet } from './petEngine';

const STORAGE_KEY = 'petdesk-pet-state';

/**
 * Load pet state. Creates default pet if none exists.
 */
export function loadPet() {
  try {
    // Try electron API first
    if (window.electronAPI && window.electronAPI.getPetState) {
      const state = window.electronAPI.getPetState();
      if (state) return state;
    }
  } catch (e) {
    // Fall through to localStorage
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load pet state from localStorage:', e);
  }

  // No saved state - create default pet
  return createDefaultPet();
}

/**
 * Save pet state to storage.
 */
export function savePet(state) {
  try {
    // Try electron API first
    if (window.electronAPI && window.electronAPI.savePetState) {
      window.electronAPI.savePetState(state);
    }
  } catch (e) {
    // Fall through to localStorage
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save pet state to localStorage:', e);
  }
}
