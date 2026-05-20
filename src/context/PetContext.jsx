import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadPet, loadPetAsync, savePet } from '../services/petStorage';
import { createDefaultPet } from '../services/petEngine';

const PetContext = createContext(null);

/**
 * PetContext Provider - Centralizes pet state management
 * Wraps the app and provides pet state + localStorage persistence
 */
export function PetProvider({ children }) {
  const [petState, setPetState] = useState(() => loadPet());
  const [lastSaveTime, setLastSaveTime] = useState(Date.now());
  const [saveIndicator, setSaveIndicator] = useState(false);

  // Load from electron-store on mount
  useEffect(() => {
    loadPetAsync().then((state) => {
      if (state) {
        setPetState((prev) => ({
          species: 'slime',
          accessories: [],
          unlockedSpecies: ['slime'],
          unlockedAccessories: ['party-hat'],
          ...state,
        }));
      }
    });
  }, []);

  // Auto-save whenever petState changes
  useEffect(() => {
    savePet(petState);
    setLastSaveTime(Date.now());

    // Trigger save indicator
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 500);
    return () => clearTimeout(timer);
  }, [petState]);

  // Update pet state with a partial update
  const updatePet = useCallback((updates) => {
    setPetState((prev) => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
  }, []);

  // Reset pet to defaults
  const resetPet = useCallback(() => {
    const defaultPet = createDefaultPet();
    setPetState(defaultPet);
  }, []);

  const value = {
    petState,
    setPetState,
    updatePet,
    resetPet,
    lastSaveTime,
    saveIndicator,
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
}

/**
 * Hook to access pet context
 */
export function usePetContext() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePetContext must be used within a PetProvider');
  }
  return context;
}

export default PetContext;
