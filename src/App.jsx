import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import PetSprite from './components/PetSprite';
import StatusBars from './components/StatusBars';
import StatsPanel from './components/StatsPanel';
import ContextMenu from './components/ContextMenu';
import Emotes, { useEmotes } from './components/Emotes';
import LevelUp from './components/LevelUp';
import { sprites } from './data/sprites';
import { loadPet, savePet } from './services/petStorage';
import { tick, feed, play, pet, sleep, calculateLevel } from './services/petEngine';

// Map pet state to sprite key
function getSpriteKey(petState) {
  switch (petState.state) {
    case 'sleeping':
      return 'slime_sleep';
    case 'eating':
      return 'slime_eat';
    case 'playing':
    case 'dancing':
      return Math.random() > 0.5 ? 'slime_dance1' : 'slime_dance2';
    case 'walking':
      return Math.random() > 0.5 ? 'slime_walk1' : 'slime_walk2';
    default:
      // idle - alternate between idle frames
      return Math.random() > 0.5 ? 'slime_idle' : 'slime_idle2';
  }
}

// Map mood to sprite for static display
function getMoodSprite(mood) {
  switch (mood) {
    case 'happy': return 'slime_happy';
    case 'sad': return 'slime_sad';
    case 'sleepy': return 'slime_sleep';
    case 'hungry': return 'slime_sad';
    default: return 'slime_idle';
  }
}

function App() {
  const [petState, setPetState] = useState(() => loadPet());
  const [showStats, setShowStats] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSprite, setCurrentSprite] = useState('slime_idle');
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const { emoteQueue, addEmote } = useEmotes();
  const idleSecondsRef = useRef(0);
  const actionTimeoutRef = useRef(null);

  // Save pet state whenever it changes
  useEffect(() => {
    savePet(petState);
  }, [petState]);

  // Tick every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPetState((prev) => {
        const updated = tick(prev, idleSecondsRef.current);
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update sprite based on state
  useEffect(() => {
    const interval = setInterval(() => {
      if (petState.state === 'eating' || petState.state === 'playing') {
        // Keep action sprite during action
        setCurrentSprite(getSpriteKey(petState));
      } else {
        setCurrentSprite(getMoodSprite(petState.mood));
      }
    }, 800); // Animate every 800ms
    return () => clearInterval(interval);
  }, [petState.state, petState.mood]);

  // Listen for electron IPC events
  useEffect(() => {
    if (!window.electronAPI) return;

    // Idle state changes
    window.electronAPI.onIdleChange?.((data) => {
      idleSecondsRef.current = data.idleSeconds;
    });

    window.electronAPI.onIdleTick?.((data) => {
      idleSecondsRef.current = data.idleSeconds;
    });

    // Tray actions
    window.electronAPI.onPetAction?.((action) => {
      handleAction(action);
    });
  }, []);

  // Handle actions (from context menu or tray)
  const handleAction = useCallback((action) => {
    setContextMenu(null);

    switch (action) {
      case 'feed':
        setPetState((prev) => {
          const updated = feed(prev);
          checkLevelUp(prev, updated);
          return updated;
        });
        addEmote('heart');
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setPetState((prev) => ({ ...prev, state: 'idle' }));
        }, 3000);
        break;

      case 'play':
        setPetState((prev) => {
          const updated = play(prev);
          checkLevelUp(prev, updated);
          return updated;
        });
        addEmote('music');
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setPetState((prev) => ({ ...prev, state: 'idle' }));
        }, 3000);
        break;

      case 'sleep':
        setPetState((prev) => sleep(prev));
        addEmote('zzz');
        break;

      case 'stats':
        setShowStats((prev) => !prev);
        break;

      case 'rename':
        // Handled by StatsPanel
        setShowStats(true);
        break;

      default:
        break;
    }
  }, [addEmote]);

  function clearActionTimeout() {
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
      actionTimeoutRef.current = null;
    }
  }

  function checkLevelUp(prev, updated) {
    if (updated.level > prev.level) {
      setLevelUpLevel(updated.level);
    }
  }

  // Pet interaction (click)
  const handlePetClick = useCallback(() => {
    setPetState((prev) => {
      const updated = pet(prev);
      checkLevelUp(prev, updated);
      return updated;
    });
    addEmote('star');
  }, [addEmote]);

  // Right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Mouse enter/leave for click-through toggle
  const handleMouseEnter = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouse(false);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.setIgnoreMouse(true);
    }
  }, []);

  const handleRename = useCallback((newName) => {
    setPetState((prev) => ({ ...prev, name: newName }));
  }, []);

  const spriteData = sprites[currentSprite] || sprites.slime_idle;

  return (
    <div
      className="w-[200px] h-[200px] relative select-none overflow-hidden"
      style={{ background: 'transparent' }}
      onContextMenu={handleContextMenu}
    >
      {/* Pet sprite area */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handlePetClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Emotes floating above */}
        <Emotes emoteQueue={emoteQueue} />

        {/* The pet */}
        <PetSprite sprite={spriteData} scale={1.5} />
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            petState={petState}
            onAction={handleAction}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Stats panel */}
      <AnimatePresence>
        {showStats && (
          <StatsPanel
            petState={{
              ...petState,
              xpToNext: (petState.level) * 100,
              stats: {
                totalPets: petState.totalPets,
                daysAlive: Math.floor((Date.now() - petState.createdAt) / 86400000),
                timesFed: Math.floor(petState.xp / 5), // approximate
              },
            }}
            onClose={() => setShowStats(false)}
            onRename={handleRename}
          />
        )}
      </AnimatePresence>

      {/* Level up celebration */}
      <AnimatePresence>
        {levelUpLevel && (
          <LevelUp
            level={levelUpLevel}
            onComplete={() => setLevelUpLevel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
