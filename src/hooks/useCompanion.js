import { useState, useEffect, useCallback, useRef } from 'react';
import { getPetSlots, savePetSlots, createNewPet, deletePet, summonCompanion, dismissCompanion, getCompanion, saveSlotState } from '../services/multiPetService';
import { tick, calculateLevel } from '../services/petEngine';
import { pickInteraction } from '../components/PetInteraction';

export function useCompanion(petState, setPetState) {
  const [petSlots, setPetSlots] = useState(() => getPetSlots());
  const [companionSlot, setCompanionSlot] = useState(() => getCompanion());
  const [companionState, setCompanionState] = useState(null);
  const [currentInteraction, setCurrentInteraction] = useState(null);
  const [primaryPosition, setPrimaryPosition] = useState({ x: 200, y: 400 });
  const [companionPosition, setCompanionPosition] = useState({ x: 600, y: 400 });
  const interactionTimerRef = useRef(null);

  // Load companion on mount
  useEffect(() => {
    const slots = getPetSlots();
    setPetSlots(slots);
    const compSlot = getCompanion();
    if (compSlot !== null && slots[compSlot]) {
      setCompanionSlot(compSlot);
      setCompanionState(slots[compSlot]);
    }
  }, []);

  // Companion tick (same as primary but independent)
  useEffect(() => {
    if (!companionState) return;
    const interval = setInterval(() => {
      setCompanionState((prev) => {
        if (!prev) return prev;
        const updated = tick(prev, 0);
        if (companionSlot !== null) {
          saveSlotState(companionSlot, updated);
        }
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [companionState !== null, companionSlot]);

  // Pet-to-pet interaction timer (30-60s random interval)
  useEffect(() => {
    if (!companionState) {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
        interactionTimerRef.current = null;
      }
      return;
    }

    function scheduleInteraction() {
      const delay = 30000 + Math.random() * 30000;
      interactionTimerRef.current = setTimeout(() => {
        const interaction = pickInteraction(
          petState.species || 'slime',
          companionState?.species || 'slime'
        );
        setCurrentInteraction(interaction);

        setTimeout(() => {
          setPetState((prev) => {
            const updated = { ...prev };
            updated.happiness = Math.min(100, updated.happiness + 2);
            updated.xp += 5;
            updated.level = calculateLevel(updated.xp);
            return updated;
          });
          setCompanionState((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            updated.happiness = Math.min(100, updated.happiness + 2);
            updated.xp += 5;
            updated.level = calculateLevel(updated.xp);
            if (companionSlot !== null) {
              saveSlotState(companionSlot, updated);
            }
            return updated;
          });
        }, (interaction.duration || 4000) + 500);

        scheduleInteraction();
      }, delay);
    }

    scheduleInteraction();
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    };
  }, [companionState !== null, petState.species]);

  // Sync pet slots when primary state changes
  useEffect(() => {
    const slots = getPetSlots();
    slots[0] = petState;
    setPetSlots(slots);
  }, [petState]);

  const handleSummonCompanion = useCallback((slotIndex) => {
    const slots = getPetSlots();
    if (!slots[slotIndex]) return;
    summonCompanion(slotIndex);
    setCompanionSlot(slotIndex);
    setCompanionState(slots[slotIndex]);
  }, []);

  const handleDismissCompanion = useCallback(() => {
    dismissCompanion();
    setCompanionSlot(null);
    setCompanionState(null);
    setCurrentInteraction(null);
  }, []);

  const handleCreatePet = useCallback((species, name) => {
    const updatedSlots = createNewPet(species, name, petState.level || 1);
    if (updatedSlots) {
      setPetSlots(updatedSlots);
    }
  }, [petState.level]);

  const handleDeletePet = useCallback((slotIndex) => {
    const updatedSlots = deletePet(slotIndex);
    if (updatedSlots) {
      setPetSlots(updatedSlots);
      if (companionSlot === slotIndex) {
        handleDismissCompanion();
      }
    }
  }, [companionSlot]);

  return {
    petSlots,
    setPetSlots,
    companionSlot,
    companionState,
    setCompanionState,
    currentInteraction,
    setCurrentInteraction,
    primaryPosition,
    setPrimaryPosition,
    companionPosition,
    setCompanionPosition,
    handleSummonCompanion,
    handleDismissCompanion,
    handleCreatePet,
    handleDeletePet,
  };
}
