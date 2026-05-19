import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import PetSprite from './components/PetSprite';
import StatusBars from './components/StatusBars';
import StatsPanel from './components/StatsPanel';
import ContextMenu from './components/ContextMenu';
import Emotes, { useEmotes } from './components/Emotes';
import LevelUp from './components/LevelUp';
import Accessory from './components/Accessory';
import PetSelector from './components/PetSelector';
import AccessoryShop from './components/AccessoryShop';
import { sprites, speciesConfig, speciesAccessoryOffsets } from './data/sprites';
import { accessories } from './data/accessories';
import { loadPet, loadPetAsync, savePet } from './services/petStorage';
import { tick, feed, play, pet, sleep, calculateLevel, checkUnlocks, switchSpecies, equipAccessory, unequipAccessory } from './services/petEngine';

// Map pet state to sprite key based on species
function getSpriteKey(petState, frameRef) {
  const frame = frameRef % 2;
  const prefix = petState.species || 'slime';
  switch (petState.state) {
    case 'sleeping':
      return `${prefix}_sleep`;
    case 'eating':
      return `${prefix}_eat`;
    case 'playing':
    case 'dancing':
      return frame === 0 ? `${prefix}_dance1` : `${prefix}_dance2`;
    case 'walking':
      return frame === 0 ? `${prefix}_walk1` : `${prefix}_walk2`;
    default:
      return frame === 0 ? `${prefix}_idle` : `${prefix}_idle2`;
  }
}

// Map mood to sprite for static display
function getMoodSprite(mood, species) {
  const prefix = species || 'slime';
  switch (mood) {
    case 'happy': return `${prefix}_happy`;
    case 'sad': return `${prefix}_sad`;
    case 'sleepy': return `${prefix}_sleep`;
    case 'hungry': return `${prefix}_sad`;
    default: return `${prefix}_idle`;
  }
}

function App() {
  const [petState, setPetState] = useState(() => loadPet());
  const [showStats, setShowStats] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [showAccessoryShop, setShowAccessoryShop] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSprite, setCurrentSprite] = useState('slime_idle');
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const { emoteQueue, addEmote } = useEmotes();
  const idleSecondsRef = useRef(0);
  const actionTimeoutRef = useRef(null);
  const frameRef = useRef(0);

  // Ensure pet state has new fields (migration for existing saves)
  useEffect(() => {
    setPetState((prev) => ({
      species: 'slime',
      accessories: [],
      unlockedSpecies: ['slime'],
      unlockedAccessories: ['party-hat'],
      ...prev,
    }));
  }, []);

  // Load pet from electron-store on mount
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

  // Update sprite based on state (deterministic frame counter)
  useEffect(() => {
    const interval = setInterval(() => {
      frameRef.current += 1;
      setCurrentSprite(getSpriteKey(petState, frameRef.current));
    }, 800);
    return () => clearInterval(interval);
  }, [petState.state, petState.mood, petState.species]);

  // Listen for electron IPC events
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onIdleChange?.((data) => {
      idleSecondsRef.current = data.idleSeconds;
    });

    window.electronAPI.onIdleTick?.((data) => {
      idleSecondsRef.current = data.idleSeconds;
    });

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
      // Check for new unlocks
      const { petState: withUnlocks } = checkUnlocks(updated);
      setPetState(withUnlocks);
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

  const handleSelectSpecies = useCallback((speciesId) => {
    setPetState((prev) => switchSpecies(prev, speciesId));
    setShowPetSelector(false);
  }, []);

  const handleEquipAccessory = useCallback((accId) => {
    setPetState((prev) => equipAccessory(prev, accId));
  }, []);

  const handleUnequipAccessory = useCallback((accId) => {
    setPetState((prev) => unequipAccessory(prev, accId));
  }, []);

  const spriteData = sprites[currentSprite] || sprites.slime_idle;
  const currentSpeciesOffsets = speciesAccessoryOffsets[petState.species || 'slime'] || speciesAccessoryOffsets.slime;

  // Get equipped accessory objects
  const equippedAccessoryObjects = (petState.accessories || [])
    .map((id) => accessories.find((a) => a.id === id))
    .filter(Boolean);

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

        {/* The pet with accessories */}
        <div className="relative">
          <PetSprite sprite={spriteData} scale={1.5} />
          {equippedAccessoryObjects.map((acc) => (
            <Accessory
              key={acc.id}
              accessory={acc}
              speciesOffsets={currentSpeciesOffsets}
              cellSize={4}
            />
          ))}
        </div>
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
                timesFed: Math.floor(petState.xp / 5),
              },
            }}
            onClose={() => setShowStats(false)}
            onRename={handleRename}
            onOpenPetSelector={() => { setShowPetSelector(true); setShowAccessoryShop(false); }}
            onOpenAccessoryShop={() => { setShowAccessoryShop(true); setShowPetSelector(false); }}
          />
        )}
      </AnimatePresence>

      {/* Pet Selector */}
      <AnimatePresence>
        {showPetSelector && (
          <PetSelector
            currentSpecies={petState.species || 'slime'}
            unlockedSpecies={petState.unlockedSpecies || ['slime']}
            currentLevel={petState.level || 1}
            onSelect={handleSelectSpecies}
            onClose={() => setShowPetSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Accessory Shop */}
      <AnimatePresence>
        {showAccessoryShop && (
          <AccessoryShop
            equippedAccessories={petState.accessories || []}
            unlockedAccessories={petState.unlockedAccessories || ['party-hat']}
            currentLevel={petState.level || 1}
            onEquip={handleEquipAccessory}
            onUnequip={handleUnequipAccessory}
            onClose={() => setShowAccessoryShop(false)}
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
