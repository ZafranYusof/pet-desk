import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import PetSprite from './PetSprite';
import Accessory from './Accessory';
import Emotes, { useEmotes } from './Emotes';
import sprites from '../data/sprites';
import evolvedSprites from '../data/evolvedSprites';
import { accessories } from '../data/accessories';
import { getPersonality } from '../services/personality';
import { getEvolutionStage } from '../services/evolutionService';

function getAnimationFrames(species = 'slime', level = 1) {
  const evo = getEvolutionStage(species, level);
  const p = evo.spritePrefix;
  return {
    idle: [`${p}_idle`, `${p}_idle2`],
    walking: [`${p}_walk1`, `${p}_walk2`],
    sleeping: [`${p}_sleep`],
    eating: [`${p}_eat`],
    happy: [`${p}_happy`],
    dancing: [`${p}_dance1`, `${p}_dance2`],
    sad: [`${p}_sad`],
  };
}

const FRAME_INTERVALS = {
  idle: 800,
  walking: 300,
  sleeping: 1000,
  eating: 500,
  happy: 600,
  dancing: 400,
  sad: 1000,
};

const PET_SIZE = 128;
const EDGE_PADDING = 50;
const WALK_SPEED = 2; // px per frame at 60fps
const GRAVITY_OFFSET = 150; // pet stays near bottom

// Species-specific accessory offsets (where accessories sit on each species)
const SPECIES_OFFSETS = {
  slime: { hat: { x: 0, y: -3 }, glasses: { x: 0, y: 0 }, other: { x: 0, y: 1 } },
  cat: { hat: { x: 0, y: -4 }, glasses: { x: 0, y: -1 }, other: { x: 0, y: 1 } },
  ghost: { hat: { x: 0, y: -3 }, glasses: { x: 0, y: 0 }, other: { x: 0, y: 2 } },
};

const Pet = ({ petState = 'idle', species = 'slime', level = 1, equippedAccessories = [], onPet, onBounce, onContextMenu, screenWidth = 1920, screenHeight = 1080, timeOfDay = 'afternoon', weather = 'sunny', triggerEmote = null, isCompanion = false, companionName = '', onPositionChange = null }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [position, setPosition] = useState(() => ({
    x: isCompanion
      ? Math.floor((screenWidth - PET_SIZE) * 0.75)
      : Math.floor((screenWidth - PET_SIZE) / 2),
    y: screenHeight - GRAVITY_OFFSET,
  }));
  const [isWalking, setIsWalking] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [walkDirection, setWalkDirection] = useState(1); // 1 = right, -1 = left
  const [isHovered, setIsHovered] = useState(false);
  const [ghostOpacity, setGhostOpacity] = useState(1);

  const walkTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const targetRef = useRef(null);
  const idleTimerRef = useRef(null);
  const [isShaking, setIsShaking] = useState(false);
  const { emoteQueue, addEmote } = useEmotes();

  const personality = getPersonality(species);

  // Determine current state (walking overrides idle)
  const currentState = isWalking ? 'walking' : petState;
  const ANIMATION_FRAMES = getAnimationFrames(species, level);
  const frames = ANIMATION_FRAMES[currentState] || ANIMATION_FRAMES.idle;
  const interval = FRAME_INTERVALS[currentState] || 800;

  // Animation frame loop (sprite frames)
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, interval);
    return () => clearInterval(timer);
  }, [frames.length, interval]);

  // Pick a new random destination along the bottom edge
  const pickNewDestination = useCallback(() => {
    const minX = EDGE_PADDING;
    const maxX = screenWidth - PET_SIZE - EDGE_PADDING;
    const targetX = Math.floor(Math.random() * (maxX - minX)) + minX;
    return targetX;
  }, [screenWidth]);

  // Walk speed modifier based on time of day
  const walkSpeedModifier = timeOfDay === 'night' ? 0.5 : timeOfDay === 'evening' ? 0.8 : timeOfDay === 'morning' ? 1.3 : 1.0;
  const effectiveWalkSpeed = WALK_SPEED * walkSpeedModifier;
  const effectiveWalkSpeedRef = useRef(effectiveWalkSpeed);
  effectiveWalkSpeedRef.current = effectiveWalkSpeed;

  // Stormy weather shaking effect
  useEffect(() => {
    if (weather === 'stormy') {
      setIsShaking(true);
    } else {
      setIsShaking(false);
    }
  }, [weather]);

  // Weather-based emotes
  useEffect(() => {
    if (weather === 'rainy') {
      const timer = setInterval(() => addEmote('sweat'), 8000);
      return () => clearInterval(timer);
    }
    if (weather === 'stormy') {
      const timer = setInterval(() => addEmote('sweat'), 4000);
      return () => clearInterval(timer);
    }
  }, [weather, addEmote]);

  // Evening yawning
  useEffect(() => {
    if (timeOfDay === 'evening') {
      const timer = setInterval(() => addEmote('zzz'), 30000);
      return () => clearInterval(timer);
    }
  }, [timeOfDay, addEmote]);

  // Walking logic using requestAnimationFrame
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  useEffect(() => {
    if (!isWalking || targetRef.current === null) {
      // Double check - if isWalking but no target, reset
      if (isWalking && targetRef.current === null) {
        setIsWalking(false);
      }
      return;
    }

    let lastTime = performance.now();
    let running = true;

    const step = (now) => {
      if (!running) return;
      const delta = (now - lastTime) / (1000 / 60); // normalize to 60fps
      lastTime = now;

      setPosition((prev) => {
        const target = targetRef.current;
        if (target === null) return prev;

        const dx = target - prev.x;
        const dist = Math.abs(dx);
        const speed = effectiveWalkSpeedRef.current;

        if (dist < speed * 2) {
          // Arrived at destination
          targetRef.current = null;
          setIsWalking(false);
          running = false;
          const newPos = { ...prev, x: target };
          if (onPositionChangeRef.current) onPositionChangeRef.current(newPos);
          return newPos;
        }

        const dir = dx > 0 ? 1 : -1;
        setWalkDirection(dir);
        const newPos = { ...prev, x: prev.x + dir * speed * delta };
        if (onPositionChangeRef.current) onPositionChangeRef.current(newPos);
        return newPos;
      });

      if (running && targetRef.current !== null) {
        animFrameRef.current = requestAnimationFrame(step);
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isWalking]); // only restart when walking starts/stops

  // Schedule walking behavior: idle time modified by personality
  const petStateRef = useRef(petState);
  petStateRef.current = petState;
  const pickNewDestRef = useRef(pickNewDestination);
  pickNewDestRef.current = pickNewDestination;
  const walkFreqRef = useRef(personality.walkFrequencyMultiplier || 1);
  walkFreqRef.current = personality.walkFrequencyMultiplier || 1;

  useEffect(() => {
    const scheduleNextWalk = () => {
      const baseIdle = (Math.random() * 5 + 3) * 1000; // 3-8s (more frequent)
      const idleTime = baseIdle / walkFreqRef.current;
      idleTimerRef.current = setTimeout(() => {
        if (petStateRef.current === 'idle' || petStateRef.current === 'happy') {
          const dest = pickNewDestRef.current();
          targetRef.current = dest;
          setIsWalking(true);
        }
        scheduleNextWalk();
      }, idleTime);
    };

    // Start first walk quickly (1-2s after mount)
    const initialTimer = setTimeout(() => {
      if (petStateRef.current === 'idle' || petStateRef.current === 'happy') {
        const dest = pickNewDestRef.current();
        targetRef.current = dest;
        setIsWalking(true);
      }
      scheduleNextWalk();
    }, 1000 + Math.random() * 1000);

    return () => {
      clearTimeout(initialTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []); // stable - uses refs for latest values

  // Stop walking when state changes to sleeping/eating/dancing
  useEffect(() => {
    if (petState === 'sleeping' || petState === 'eating' || petState === 'dancing') {
      setIsWalking(false);
      targetRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [petState]);

  // Occasional jump (frequency modified by personality bounciness)
  const isWalkingRef = useRef(isWalking);
  isWalkingRef.current = isWalking;
  const onBounceRef = useRef(onBounce);
  onBounceRef.current = onBounce;
  const bounceFreqRef = useRef(personality.bounceFrequencyMultiplier || 1);
  bounceFreqRef.current = personality.bounceFrequencyMultiplier || 1;
  const bounceHeightRef = useRef(personality.bounceHeightMultiplier || 1);
  bounceHeightRef.current = personality.bounceHeightMultiplier || 1;

  useEffect(() => {
    const scheduleJump = () => {
      const baseDelay = (Math.random() * 20 + 20) * 1000;
      const delay = baseDelay / bounceFreqRef.current;
      const timer = setTimeout(() => {
        if ((petStateRef.current === 'idle' || petStateRef.current === 'happy') && !isWalkingRef.current) {
          setIsJumping(true);
          if (onBounceRef.current) onBounceRef.current();
          setTimeout(() => setIsJumping(false), 400);
        }
        scheduleJump();
      }, delay);
      return timer;
    };

    const timer = scheduleJump();
    return () => clearTimeout(timer);
  }, []); // stable - uses refs

  // Ghost special: flicker (opacity 0.3 for 1s)
  useEffect(() => {
    if (species !== 'ghost') return;
    const interval = setInterval(() => {
      if (Math.random() < (personality.flickerChance || 0)) {
        setGhostOpacity(0.3);
        setTimeout(() => setGhostOpacity(1), 1000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [species, personality.flickerChance]);

  // Ghost special: teleport to random position
  useEffect(() => {
    if (species !== 'ghost') return;
    const interval = setInterval(() => {
      if (Math.random() < (personality.teleportChance || 0)) {
        const minX = EDGE_PADDING;
        const maxX = screenWidth - PET_SIZE - EDGE_PADDING;
        const newX = Math.floor(Math.random() * (maxX - minX)) + minX;
        setGhostOpacity(0.1);
        setTimeout(() => {
          setPosition((prev) => ({ ...prev, x: newX }));
          setGhostOpacity(1);
        }, 300);
      }
    }, 60000); // Check once per minute
    return () => clearInterval(interval);
  }, [species, personality.teleportChance, screenWidth]);

  // Emotes based on state
  useEffect(() => {
    if (petState === 'sleeping') {
      const timer = setInterval(() => addEmote('zzz'), 3000);
      return () => clearInterval(timer);
    }
    if (petState === 'dancing') {
      const timer = setInterval(() => addEmote('music'), 2000);
      return () => clearInterval(timer);
    }
    if (petState === 'sad') {
      const timer = setInterval(() => addEmote('sweat'), 4000);
      return () => clearInterval(timer);
    }
  }, [petState, addEmote]);

  // External emote trigger from parent (feed/play/sleep actions)
  useEffect(() => {
    if (triggerEmote) {
      addEmote(triggerEmote.type);
    }
  }, [triggerEmote, addEmote]);

  // Right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) onContextMenu(e);
  }, [onContextMenu]);

  // Click to pet with ripple effect
  const [ripples, setRipples] = useState([]);
  const handleClick = useCallback((e) => {
    e.stopPropagation();
    // Create ripple at click point
    const rect = e.currentTarget.getBoundingClientRect();
    const rippleX = e.clientX - rect.left - 20;
    const rippleY = e.clientY - rect.top - 20;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: rippleX, y: rippleY }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    addEmote('heart');
    if (onPet) onPet();
  }, [addEmote, onPet]);

  // Mouse enter/leave for click-through toggle
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouse(false);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouse(true);
    }
  }, []);

  const spriteKey = frames[frameIndex % frames.length];
  const currentSprite = sprites[spriteKey] || evolvedSprites[spriteKey];

  // Jump animation (height modified by personality)
  const jumpY = isJumping ? -30 * (personality.bounceHeightMultiplier || 1) : 0;

  // Shaking animation for stormy weather
  const shakeStyle = isShaking ? {
    animation: 'shake 0.3s infinite',
  } : {};

  // Bounce animation variants
  const bounceVariants = {
    idle: {
      y: [0, -4, 0],
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
    },
    happy: {
      y: [0, -8, 0],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
    },
    sleeping: {
      y: [0, -2, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    walking: {
      rotate: [0, -3, 0, 3, 0],
      transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
    },
    dancing: {
      rotate: [0, -10, 0, 10, 0],
      transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' },
    },
    sad: {
      y: [0, -1, 0],
      transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
    },
    eating: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <motion.div
      className="pet-container"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y + jumpY,
        cursor: isHovered ? 'pointer' : 'default',
        width: PET_SIZE,
        height: PET_SIZE,
        transition: isJumping ? 'top 0.2s ease-out' : 'none',
        opacity: ghostOpacity,
        transform: isCompanion ? 'scale(0.8)' : undefined,
        transformOrigin: 'bottom center',
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Companion name tag */}
        {isCompanion && companionName && (
          <div
            style={{
              position: 'absolute',
              top: -20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)',
              color: '#93c5fd',
              fontSize: '9px',
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {companionName}
          </div>
        )}
        <Emotes emoteQueue={emoteQueue} />
        {/* Ripple effects */}
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="pet-ripple"
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
        <motion.div
          animate={currentState}
          variants={bounceVariants}
          style={{
            transform: walkDirection === -1 ? 'scaleX(-1)' : 'scaleX(1)',
            ...shakeStyle,
          }}
        >
          <PetSprite sprite={currentSprite} scale={1} />
          {/* Render equipped accessories */}
          {equippedAccessories.map((accId) => {
            const acc = accessories.find((a) => a.id === accId);
            if (!acc) return null;
            return (
              <Accessory
                key={accId}
                accessory={acc}
                speciesOffsets={SPECIES_OFFSETS[species] || SPECIES_OFFSETS.slime}
                cellSize={4}
              />
            );
          })}
        </motion.div>
        <div className="pet-shadow" />
      </div>
    </motion.div>
  );
};

export default Pet;
