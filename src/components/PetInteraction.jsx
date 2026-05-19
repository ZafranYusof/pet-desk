import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Pet-to-Pet Interaction System
 * Handles visual interactions between primary pet and companion.
 */

// Interaction definitions
const INTERACTIONS = [
  { id: 'play', label: 'Play together', weight: 25, duration: 4000 },
  { id: 'chase', label: 'Chase', weight: 20, duration: 5000 },
  { id: 'nap', label: 'Nap together', weight: 15, duration: 5000 },
  { id: 'dance', label: 'Dance together', weight: 20, duration: 4000 },
  { id: 'argue', label: 'Argue', weight: 10, duration: 3500 },
  { id: 'gift', label: 'Gift', weight: 10, duration: 3000 },
];

// Species-specific interactions (override or add to base)
const SPECIES_INTERACTIONS = {
  'slime+slime': { id: 'merge', label: 'Merge', duration: 4000 },
  'cat+cat': { id: 'groom', label: 'Mutual grooming', duration: 4000 },
  'ghost+ghost': { id: 'phase', label: 'Phase through', duration: 3500 },
  'cat+slime': { id: 'bat', label: 'Cat bats slime', duration: 3500 },
  'slime+cat': { id: 'bat', label: 'Cat bats slime', duration: 3500 },
  'ghost+cat': { id: 'scare', label: 'Ghost scares', duration: 3000 },
  'ghost+slime': { id: 'scare', label: 'Ghost scares', duration: 3000 },
  'cat+ghost': { id: 'scare', label: 'Ghost scares', duration: 3000 },
  'slime+ghost': { id: 'scare', label: 'Ghost scares', duration: 3000 },
};

// Emote components
const EMOTES = {
  heart: '❤️',
  star: '⭐',
  music: '🎵',
  zzz: '💤',
  sweat: '💦',
  anger: '💢',
  sparkle: '✨',
};

function pickInteraction(primarySpecies, companionSpecies) {
  // 30% chance for species-specific interaction
  const speciesKey = `${primarySpecies}+${companionSpecies}`;
  const speciesInteraction = SPECIES_INTERACTIONS[speciesKey];

  if (speciesInteraction && Math.random() < 0.3) {
    return speciesInteraction;
  }

  // Weighted random from base interactions
  const totalWeight = INTERACTIONS.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const interaction of INTERACTIONS) {
    roll -= interaction.weight;
    if (roll <= 0) return interaction;
  }
  return INTERACTIONS[0];
}

// Get emotes for each interaction type
function getInteractionEmotes(interactionId) {
  switch (interactionId) {
    case 'play': return { primary: '❤️', companion: '❤️' };
    case 'chase': return { primary: '💨', companion: '😰' };
    case 'nap': return { primary: '💤', companion: '💤' };
    case 'dance': return { primary: '🎵', companion: '🎵' };
    case 'argue': return { primary: '💢', companion: '💦' };
    case 'gift': return { primary: '🎁', companion: '⭐' };
    case 'merge': return { primary: '✨', companion: '✨' };
    case 'groom': return { primary: '💕', companion: '💕' };
    case 'phase': return { primary: '👻', companion: '👻' };
    case 'bat': return { primary: '🐾', companion: '😵' };
    case 'scare': return { primary: '👻', companion: '😱' };
    default: return { primary: '✨', companion: '✨' };
  }
}

// Animation variants for different interactions
function getAnimationVariants(interactionId, role) {
  const isPrimary = role === 'primary';

  switch (interactionId) {
    case 'play':
      // Both bounce toward each other
      return {
        animate: {
          y: [0, -15, 0, -10, 0],
          x: isPrimary ? [0, 20, 15, 20, 0] : [0, -20, -15, -20, 0],
          transition: { duration: 2, repeat: 1, ease: 'easeInOut' },
        },
      };

    case 'chase':
      // One runs, other follows
      return {
        animate: {
          x: isPrimary ? [0, 60, 120, 60, 0] : [0, 50, 110, 50, 0],
          y: [0, -5, 0, -5, 0],
          transition: { duration: 2.5, repeat: 1, ease: 'linear' },
        },
      };

    case 'nap':
      // Both settle down side by side
      return {
        animate: {
          y: [0, 5, 5, 5, 0],
          scale: [1, 0.95, 0.95, 0.95, 1],
          transition: { duration: 2.5, repeat: 1, ease: 'easeInOut' },
        },
      };

    case 'dance':
      // Both bounce in sync
      return {
        animate: {
          y: [0, -12, 0, -12, 0],
          rotate: isPrimary ? [0, 5, -5, 5, 0] : [0, -5, 5, -5, 0],
          transition: { duration: 1, repeat: 3, ease: 'easeInOut' },
        },
      };

    case 'argue':
      // Face each other, shake
      return {
        animate: {
          x: isPrimary ? [0, 5, -5, 5, -5, 0] : [0, -5, 5, -5, 5, 0],
          rotate: isPrimary ? [0, 2, -2, 2, -2, 0] : [0, -2, 2, -2, 2, 0],
          transition: { duration: 0.8, repeat: 3, ease: 'easeInOut' },
        },
      };

    case 'gift':
      // Primary moves toward companion, sparkle
      return {
        animate: isPrimary
          ? { x: [0, 15, 15, 0], y: [0, -5, -5, 0], transition: { duration: 1.5, repeat: 1 } }
          : { scale: [1, 1, 1.1, 1.15, 1], y: [0, 0, -5, -8, 0], transition: { duration: 1.5, repeat: 1 } },
      };

    case 'merge':
      // Slimes overlap then split
      return {
        animate: {
          x: isPrimary ? [0, 30, 30, 0] : [0, -30, -30, 0],
          scale: [1, 1.2, 1.2, 1],
          opacity: [1, 0.7, 0.7, 1],
          transition: { duration: 2, repeat: 1, ease: 'easeInOut' },
        },
      };

    case 'groom':
      // Face each other, gentle bob
      return {
        animate: {
          x: isPrimary ? [0, 10, 10, 0] : [0, -10, -10, 0],
          y: [0, -3, 0, -3, 0],
          transition: { duration: 1, repeat: 3, ease: 'easeInOut' },
        },
      };

    case 'phase':
      // Ghosts pass through each other
      return {
        animate: {
          x: isPrimary ? [0, 50, 50, 0] : [0, -50, -50, 0],
          opacity: [1, 0.3, 0.3, 1],
          transition: { duration: 1.5, repeat: 1, ease: 'easeInOut' },
        },
      };

    case 'bat':
      // Cat bats, slime bounces
      return {
        animate: isPrimary
          ? { x: [0, 10, 0], rotate: [0, 10, 0], transition: { duration: 0.5, repeat: 4 } }
          : { x: [0, 15, 0, 15, 0], y: [0, -10, 0, -10, 0], transition: { duration: 0.6, repeat: 4 } },
      };

    case 'scare':
      // Ghost wobbles, other shakes
      return {
        animate: isPrimary
          ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1], transition: { duration: 0.6, repeat: 3 } }
          : { x: [0, -5, 5, -5, 5, 0], y: [0, -3, 0, -3, 0, 0], transition: { duration: 0.4, repeat: 4 } },
      };

    default:
      return { animate: {} };
  }
}

function PetInteraction({ interaction, primaryPosition, companionPosition, onComplete }) {
  const [emotes, setEmotes] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!interaction) return;

    const interactionEmotes = getInteractionEmotes(interaction.id);
    setEmotes(interactionEmotes);

    // Auto-complete after duration
    timerRef.current = setTimeout(() => {
      setEmotes(null);
      onComplete?.();
    }, interaction.duration || 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [interaction]);

  if (!interaction) return null;

  const primaryAnim = getAnimationVariants(interaction.id, 'primary');
  const companionAnim = getAnimationVariants(interaction.id, 'companion');

  return (
    <>
      {/* Primary pet emote */}
      <AnimatePresence>
        {emotes && (
          <motion.div
            className="fixed z-40 pointer-events-none text-lg"
            style={{
              left: (primaryPosition?.x || 200) + 40,
              top: (primaryPosition?.y || 400) - 30,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -15, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.5 }}
            transition={{ duration: 0.5, repeat: 2, repeatType: 'reverse' }}
          >
            {emotes.primary}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Companion pet emote */}
      <AnimatePresence>
        {emotes && (
          <motion.div
            className="fixed z-40 pointer-events-none text-lg"
            style={{
              left: (companionPosition?.x || 400) + 40,
              top: (companionPosition?.y || 400) - 30,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -15, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.5 }}
            transition={{ duration: 0.5, repeat: 2, repeatType: 'reverse' }}
          >
            {emotes.companion}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Export utilities for App.jsx to use
export { pickInteraction, getAnimationVariants, getInteractionEmotes };
export default PetInteraction;
