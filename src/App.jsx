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
import { getTimeOfDay, shouldAutoSleep } from './services/timeService';
import { getWeather } from './services/weatherService';
import { getPersonality, applyPersonalityToTick, shouldIgnoreClick } from './services/personality';
import { generateEntry, saveDiaryEntry, hasEntryToday } from './services/diaryService';
import { checkAndNotify, notifyLevelUp, recordInteraction } from './services/notificationService';
import Particles from './components/Particles';
import WeatherOverlay from './components/WeatherOverlay';
import PetDiary from './components/PetDiary';
import Achievements from './components/Achievements';
import AchievementPopup from './components/AchievementPopup';
import DailyReward from './components/DailyReward';
import Scrapbook from './components/Scrapbook';
import { checkAchievements, getStats, incrementStat, recordGameWin } from './services/achievementService';
import { checkDailyReward } from './services/dailyRewards';
import { recordFirstFeed, recordFirstPlay, recordFirstPet, recordLevelUp, recordSpeciesUnlock, recordAccessoryEquip, recordAchievement, recordStreak, recordGameWin as recordGameWinScrapbook } from './services/scrapbookService';

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

// Daily stats storage key
const DAILY_STATS_KEY = 'petdesk_daily_stats';

function getDefaultDailyStats() {
  return {
    date: new Date().toISOString().split('T')[0],
    timesFed: 0,
    timesPlayed: 0,
    timesPetted: 0,
    gamesPlayed: 0,
    minutesAsleep: 0,
    previousLevel: null,
  };
}

function loadDailyStats() {
  try {
    const stored = localStorage.getItem(DAILY_STATS_KEY);
    if (stored) {
      const stats = JSON.parse(stored);
      const today = new Date().toISOString().split('T')[0];
      if (stats.date === today) return stats;
    }
  } catch (e) { /* ignore */ }
  return getDefaultDailyStats();
}

function saveDailyStats(stats) {
  try {
    localStorage.setItem(DAILY_STATS_KEY, JSON.stringify(stats));
  } catch (e) { /* ignore */ }
}

function App() {
  const [petState, setPetState] = useState(() => loadPet());
  const [showStats, setShowStats] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [showAccessoryShop, setShowAccessoryShop] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showScrapbook, setShowScrapbook] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [currentSprite, setCurrentSprite] = useState('slime_idle');
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
  const [weather, setWeather] = useState(() => getWeather());
  const [justPetted, setJustPetted] = useState(false);
  const { emoteQueue, addEmote } = useEmotes();
  const idleSecondsRef = useRef(0);
  const actionTimeoutRef = useRef(null);
  const frameRef = useRef(0);
  const dailyStatsRef = useRef(loadDailyStats());
  const notificationIntervalRef = useRef(null);
  const diaryCheckRef = useRef(null);
  const achievementQueueRef = useRef([]);

  // Update time of day every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update weather every 60s (checks if 2h passed internally)
  useEffect(() => {
    const interval = setInterval(() => {
      setWeather(getWeather());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sleep at night
  useEffect(() => {
    if (shouldAutoSleep() && petState.state !== 'sleeping') {
      setPetState((prev) => {
        if (prev.state !== 'sleeping') {
          return { ...prev, state: 'sleeping' };
        }
        return prev;
      });
    }
  }, [timeOfDay]);

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

  // Check daily reward on mount
  useEffect(() => {
    const reward = checkDailyReward();
    if (reward) {
      const timer = setTimeout(() => setShowDailyReward(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Tick every 5 seconds (with personality modifiers)
  useEffect(() => {
    const interval = setInterval(() => {
      setPetState((prev) => {
        let updated = tick(prev, idleSecondsRef.current);
        const personality = getPersonality(prev.species || 'slime');
        updated = applyPersonalityToTick(updated, personality);

        // Track sleep minutes
        if (updated.state === 'sleeping') {
          dailyStatsRef.current.minutesAsleep = (dailyStatsRef.current.minutesAsleep || 0) + (5 / 60);
          saveDailyStats(dailyStatsRef.current);
        }

        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Notification check every 60 seconds
  useEffect(() => {
    notificationIntervalRef.current = setInterval(() => {
      checkAndNotify(petState);
    }, 60000);
    return () => {
      if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current);
    };
  }, [petState]);

  // Diary: generate entry at midnight and reset daily stats
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (dailyStatsRef.current.date !== today) {
        // Generate diary entry for the previous day
        if (!hasEntryToday()) {
          const entry = generateEntry(petState, dailyStatsRef.current);
          saveDiaryEntry(entry);
        }
        dailyStatsRef.current = getDefaultDailyStats();
        dailyStatsRef.current.previousLevel = petState.level;
        saveDailyStats(dailyStatsRef.current);
      }
    }, 60000);
    return () => clearInterval(checkMidnight);
  }, [petState]);

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
        recordInteraction();
        dailyStatsRef.current.timesFed = (dailyStatsRef.current.timesFed || 0) + 1;
        saveDailyStats(dailyStatsRef.current);
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setPetState((prev) => ({ ...prev, state: 'idle' }));
        }, 3000);
        { const s = incrementStat('timesFed'); runAchievementCheck(s); }
        recordFirstFeed();
        break;

      case 'play':
        setPetState((prev) => {
          const updated = play(prev);
          checkLevelUp(prev, updated);
          return updated;
        });
        addEmote('music');
        recordInteraction();
        dailyStatsRef.current.timesPlayed = (dailyStatsRef.current.timesPlayed || 0) + 1;
        saveDailyStats(dailyStatsRef.current);
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setPetState((prev) => ({ ...prev, state: 'idle' }));
        }, 3000);
        { const s = incrementStat('timesPlayed'); runAchievementCheck(s); }
        recordFirstPlay();
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

      case 'diary':
        setShowDiary((prev) => !prev);
        break;

      case 'achievements':
        setShowAchievements((prev) => !prev);
        break;

      case 'scrapbook':
        setShowScrapbook((prev) => !prev);
        break;

      default:
        // Handle game actions
        if (action && action.startsWith('game:')) {
          recordInteraction();
          dailyStatsRef.current.gamesPlayed = (dailyStatsRef.current.gamesPlayed || 0) + 1;
          saveDailyStats(dailyStatsRef.current);
        }
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
      notifyLevelUp(updated.level);
      // Check for new unlocks
      const { petState: withUnlocks, newUnlocks } = checkUnlocks(updated);
      setPetState(withUnlocks);
      // Scrapbook entries
      recordLevelUp(updated.level);
      if (newUnlocks) {
        newUnlocks.forEach((unlock) => {
          if (unlock.type === 'species') recordSpeciesUnlock(unlock.name);
        });
      }
      // Re-check achievements
      const stats = getStats();
      runAchievementCheck(stats);
    }
  }

  // Run achievement check and queue popups
  function runAchievementCheck(stats) {
    setPetState((current) => {
      const newlyUnlocked = checkAchievements(current, stats);
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((a) => {
          recordAchievement(a.name, a.icon);
          achievementQueueRef.current.push(a);
        });
        showNextAchievement();
      }
      return current;
    });
  }

  function showNextAchievement() {
    if (achievementPopup) return;
    const next = achievementQueueRef.current.shift();
    if (next) {
      setAchievementPopup(next);
    }
  }

  function handleAchievementDismiss() {
    setAchievementPopup(null);
    setTimeout(() => {
      const next = achievementQueueRef.current.shift();
      if (next) setAchievementPopup(next);
    }, 300);
  }

  // Pet interaction (click) with personality
  const handlePetClick = useCallback(() => {
    const personality = getPersonality(petState.species || 'slime');

    // Cat might ignore clicks
    if (shouldIgnoreClick(personality)) {
      addEmote('sweat'); // "hmph" reaction
      return;
    }

    setPetState((prev) => {
      const updated = pet(prev);
      checkLevelUp(prev, updated);
      return updated;
    });
    addEmote('star');
    recordInteraction();
    dailyStatsRef.current.timesPetted = (dailyStatsRef.current.timesPetted || 0) + 1;
    saveDailyStats(dailyStatsRef.current);
    setJustPetted(true);
    setTimeout(() => setJustPetted(false), 2000);
    recordFirstPet();
    { const s = getStats(); runAchievementCheck(s); }
  }, [addEmote, petState.species]);

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
    recordAccessoryEquip(accId);
    { const s = getStats(); runAchievementCheck(s); }
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
      {/* Weather overlay */}
      <WeatherOverlay weather={weather} />

      {/* Pet sprite area */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={handlePetClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Emotes floating above */}
        <Emotes emoteQueue={emoteQueue} />

        {/* Particle effects */}
        <Particles type="sparkles" active={petState.happiness > 80 && weather === 'sunny'} />
        <Particles type="hearts" active={justPetted} />
        <Particles type="raindrops" active={weather === 'rainy' || weather === 'stormy'} />
        <Particles type="snow" active={weather === 'snowy'} />
        <Particles type="fire" active={petState.hunger !== undefined && petState.hunger < 20} />
        <Particles type="zzz" active={petState.state === 'sleeping'} />
        <Particles type="music" active={petState.state === 'dancing'} />

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

      {/* Pet Diary */}
      <AnimatePresence>
        {showDiary && (
          <PetDiary onClose={() => setShowDiary(false)} />
        )}
      </AnimatePresence>

      {/* Achievements panel */}
      <AnimatePresence>
        {showAchievements && (
          <Achievements onClose={() => setShowAchievements(false)} />
        )}
      </AnimatePresence>

      {/* Scrapbook */}
      <AnimatePresence>
        {showScrapbook && (
          <Scrapbook onClose={() => setShowScrapbook(false)} />
        )}
      </AnimatePresence>

      {/* Daily Reward popup */}
      <AnimatePresence>
        {showDailyReward && (
          <DailyReward
            petState={petState}
            onClaim={(updated) => {
              setPetState(updated);
              const s = getStats();
              runAchievementCheck(s);
            }}
            onClose={() => setShowDailyReward(false)}
          />
        )}
      </AnimatePresence>

      {/* Achievement unlock popup */}
      <AnimatePresence>
        {achievementPopup && (
          <AchievementPopup
            achievement={achievementPopup}
            onDismiss={handleAchievementDismiss}
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
