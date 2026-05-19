import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import PetSprite from './PetSprite';
import Emotes, { useEmotes } from './Emotes';
import sprites from '../data/sprites';

const ANIMATION_FRAMES = {
  idle: ['slime_idle', 'slime_idle2'],
  walking: ['slime_walk1', 'slime_walk2'],
  sleeping: ['slime_sleep'],
  eating: ['slime_eat'],
  happy: ['slime_happy'],
  dancing: ['slime_dance1', 'slime_dance2'],
  sad: ['slime_sad'],
};

const FRAME_INTERVALS = {
  idle: 800,
  walking: 300,
  sleeping: 1000,
  eating: 500,
  happy: 600,
  dancing: 400,
  sad: 1000,
};

const Pet = ({ petState = 'idle', onPet }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isWalking, setIsWalking] = useState(false);
  const [walkDirection, setWalkDirection] = useState(1);
  const walkTimerRef = useRef(null);
  const walkIntervalRef = useRef(null);
  const { emoteQueue, addEmote } = useEmotes();

  // Determine current state (walking overrides idle)
  const currentState = isWalking ? 'walking' : petState;
  const frames = ANIMATION_FRAMES[currentState] || ANIMATION_FRAMES.idle;
  const interval = FRAME_INTERVALS[currentState] || 800;

  // Animation frame loop
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, interval);
    return () => clearInterval(timer);
  }, [frames.length, interval]);

  // Walking behavior: every 10-20s, walk for 2-4s
  useEffect(() => {
    const scheduleWalk = () => {
      const delay = (Math.random() * 10 + 10) * 1000; // 10-20s
      walkTimerRef.current = setTimeout(() => {
        if (petState === 'idle') {
          const direction = Math.random() > 0.5 ? 1 : -1;
          setWalkDirection(direction);
          setIsWalking(true);

          // Move position during walk
          const walkSpeed = 2;
          walkIntervalRef.current = setInterval(() => {
            setPosition((prev) => ({
              ...prev,
              x: Math.max(-200, Math.min(200, prev.x + direction * walkSpeed)),
            }));
          }, 50);

          // Stop walking after 2-4s
          const walkDuration = (Math.random() * 2 + 2) * 1000;
          setTimeout(() => {
            setIsWalking(false);
            if (walkIntervalRef.current) {
              clearInterval(walkIntervalRef.current);
            }
            scheduleWalk();
          }, walkDuration);
        } else {
          scheduleWalk();
        }
      }, delay);
    };

    scheduleWalk();
    return () => {
      if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    };
  }, [petState]);

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

  // Click to pet
  const handleClick = useCallback(() => {
    addEmote('heart');
    if (onPet) onPet();
  }, [addEmote, onPet]);

  const currentSprite = sprites[frames[frameIndex % frames.length]];

  // Bounce animation for idle/happy
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
      drag
      dragMomentum={false}
      style={{
        position: 'absolute',
        cursor: 'grab',
        x: position.x,
        y: position.y,
      }}
      whileDrag={{ cursor: 'grabbing' }}
      onClick={handleClick}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Emotes emoteQueue={emoteQueue} />
        <motion.div
          animate={currentState}
          variants={bounceVariants}
          style={{
            transform: walkDirection === -1 ? 'scaleX(-1)' : 'scaleX(1)',
          }}
        >
          <PetSprite sprite={currentSprite} scale={1} />
        </motion.div>
        <div className="pet-shadow" />
      </div>
    </motion.div>
  );
};

export default Pet;
