import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Pet from './components/Pet';
import StatsPanel from './components/StatsPanel';
import ContextMenu from './components/ContextMenu';
import LevelUp from './components/LevelUp';
import PetSelector from './components/PetSelector';
import AccessoryShop from './components/AccessoryShop';
import PetSlots from './components/PetSlots';
import PetInteraction, { pickInteraction } from './components/PetInteraction';
import { loadPet, loadPetAsync, savePet, loadAllPets, saveAllPets } from './services/petStorage';
import { getPetSlots, savePetSlots, createNewPet, deletePet, summonCompanion, dismissCompanion, getCompanion, saveSlotState } from './services/multiPetService';
import { tick, feed, play, pet, sleep, calculateLevel, checkUnlocks, checkEvolutionOnLevelUp, switchSpecies, equipAccessory, unequipAccessory } from './services/petEngine';
import { tickEffects, getActiveEffects, hasActiveEffect, addToInventory } from './services/foodService';
import { getAgingData, initAgingData, getPetAge, getAgeStage, getAgeStageInfo, getAgeMoodModifier, shouldCelebrateBirthday, markBirthdayCelebrated, getBirthdayRewards } from './services/agingService';
import { getTimeOfDay, shouldAutoSleep } from './services/timeService';
import { getWeather } from './services/weatherService';
import { getPersonality, applyPersonalityToTick, shouldIgnoreClick } from './services/personality';
import { generateEntry, saveDiaryEntry, hasEntryToday } from './services/diaryService';
import { checkAndNotify, notifyLevelUp, recordInteraction } from './services/notificationService';
import Particles from './components/Particles';
import WeatherOverlay from './components/WeatherOverlay';
import EvolutionAnimation from './components/EvolutionAnimation';
import PetDiary from './components/PetDiary';
import Achievements from './components/Achievements';
import AchievementPopup from './components/AchievementPopup';
import DailyReward from './components/DailyReward';
import Scrapbook from './components/Scrapbook';
import DesktopWidget from './components/DesktopWidget';
import SpriteEditor from './components/SpriteEditor';
import FoodMenu from './components/FoodMenu';
import BirthdayEvent from './components/BirthdayEvent';
import SoundSettings from './components/SoundSettings';
import StatsDashboard from './components/StatsDashboard';
import { getActiveCustomSpriteData, getActiveCustomSprite } from './services/customSpriteService';
import { checkAchievements, getStats, incrementStat, recordGameWin } from './services/achievementService';
import { getActiveHabitat, setActiveHabitat, getHabitatMoodBonus } from './services/habitatService';
import Habitat from './components/Habitat';
import HabitatSelector from './components/HabitatSelector';
import { checkDailyReward } from './services/dailyRewards';
import { recordFirstFeed, recordFirstPlay, recordFirstPet, recordLevelUp, recordSpeciesUnlock, recordAccessoryEquip, recordAchievement, recordStreak, recordGameWin as recordGameWinScrapbook } from './services/scrapbookService';
import { recordInteraction as recordStatsInteraction, recordLevelUp as recordStatsLevelUp, recordEvolution as recordStatsEvolution, recordAchievementUnlock as recordStatsAchievement, recordGamePlayed as recordStatsGame, recordGameWin as recordStatsGameWin, startPlaytimeTracking, stopPlaytimeTracking } from './services/statsService';


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
  const [showWidget, setShowWidget] = useState(false);
  const [showSpriteEditor, setShowSpriteEditor] = useState(false);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showBirthday, setShowBirthday] = useState(false);
  const [activeEffects, setActiveEffects] = useState(() => getActiveEffects());
  const [feedMessage, setFeedMessage] = useState(null);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [showHabitatSelector, setShowHabitatSelector] = useState(false);
  const [activeHabitat, setActiveHabitatState] = useState(() => getActiveHabitat());
  const [activeCustomSpriteName, setActiveCustomSpriteName] = useState(() => getActiveCustomSprite());
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [evolutionAnimation, setEvolutionAnimation] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
  const [weather, setWeather] = useState(() => getWeather());
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });

  // Multi-pet state
  const [petSlots, setPetSlots] = useState(() => getPetSlots());
  const [companionSlot, setCompanionSlot] = useState(() => getCompanion());
  const [companionState, setCompanionState] = useState(null);
  const [showPetSlots, setShowPetSlots] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState(null);
  const [primaryPosition, setPrimaryPosition] = useState({ x: 200, y: 400 });
  const [companionPosition, setCompanionPosition] = useState({ x: 600, y: 400 });
  const interactionTimerRef = useRef(null);

  // Get screen size on mount
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getScreenSize) {
      window.electronAPI.getScreenSize().then((size) => {
        if (size) setScreenSize(size);
      });
    } else {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

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
      const delay = 30000 + Math.random() * 30000; // 30-60 seconds
      interactionTimerRef.current = setTimeout(() => {
        const interaction = pickInteraction(
          petState.species || 'slime',
          companionState?.species || 'slime'
        );
        setCurrentInteraction(interaction);

        // Apply bonuses after interaction completes
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
  const [justPetted, setJustPetted] = useState(false);
  const [triggerEmote, setTriggerEmote] = useState(null);
  const idleSecondsRef = useRef(0);
  const actionTimeoutRef = useRef(null);
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

  // Initialize aging data on mount
  useEffect(() => {
    let agingData = getAgingData();
    if (!agingData) {
      agingData = initAgingData(petState.createdAt);
    }
  }, []);

  // Check birthday on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldCelebrateBirthday()) {
        setShowBirthday(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Tick active food effects every second
  useEffect(() => {
    const interval = setInterval(() => {
      const effects = tickEffects();
      setActiveEffects(effects);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start playtime tracking
  useEffect(() => {
    startPlaytimeTracking();
    return () => stopPlaytimeTracking();
  }, []);

  // Tick every 5 seconds (with personality modifiers)
  useEffect(() => {
    const interval = setInterval(() => {
      setPetState((prev) => {
        let updated = tick(prev, idleSecondsRef.current);
        const personality = getPersonality(prev.species || 'slime');
        updated = applyPersonalityToTick(updated, personality);

        // Apply habitat mood bonus
        const habitatBonus = getHabitatMoodBonus(activeHabitat);
        if (habitatBonus.happiness) {
          updated.happiness = Math.min(100, updated.happiness + habitatBonus.happiness);
        }
        if (habitatBonus.energy) {
          updated.energy = Math.min(100, updated.energy + habitatBonus.energy);
        }

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
        setTriggerEmote({ type: 'heart', t: Date.now() });
        recordInteraction();
        recordStatsInteraction('feed');
        dailyStatsRef.current.timesFed = (dailyStatsRef.current.timesFed || 0) + 1;
        saveDailyStats(dailyStatsRef.current);
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => {
          setPetState((prev) => ({ ...prev, state: 'idle' }));
        }, 3000);
        { const s = incrementStat('timesFed'); runAchievementCheck(s); }
        recordFirstFeed();
        break;

      case 'food':
        setShowFoodMenu(true);
        break;

      case 'play':
        setPetState((prev) => {
          const updated = play(prev);
          checkLevelUp(prev, updated);
          return updated;
        });
        setTriggerEmote({ type: 'music', t: Date.now() });
        recordInteraction();
        recordStatsInteraction('play');
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
        setTriggerEmote({ type: 'zzz', t: Date.now() });
        recordStatsInteraction('sleep');
        break;

      case 'stats':
        setShowStats((prev) => !prev);
        break;

      case 'sound':
        setShowSoundSettings((prev) => !prev);
        break;

      case 'lifetimeStats':
        setShowStatsDashboard((prev) => !prev);
        break;

      case 'widget':
        setShowWidget((prev) => !prev);
        break;

      case 'spriteEditor':
        setShowSpriteEditor((prev) => !prev);
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

      case 'habitat':
        setShowHabitatSelector((prev) => !prev);
        break;

      case 'pets':
        setShowPetSlots((prev) => !prev);
        break;

      case 'summonCompanion': {
        const slots = getPetSlots();
        for (let i = 1; i < slots.length; i++) {
          if (slots[i]) {
            handleSummonCompanion(i);
            break;
          }
        }
        break;
      }

      case 'dismissCompanion':
        handleDismissCompanion();
        break;

      default:
        // Handle game actions
        if (action && action.startsWith('game:')) {
          recordInteraction();
          recordStatsInteraction('game');
          const gameId = action.split(':')[1];
          if (gameId) recordStatsGame(gameId);
          dailyStatsRef.current.gamesPlayed = (dailyStatsRef.current.gamesPlayed || 0) + 1;
          saveDailyStats(dailyStatsRef.current);
        }
        break;
    }
  }, []);

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
      // Check for evolution
      const evoData = checkEvolutionOnLevelUp(updated, prev.level, updated.level);
      if (evoData) {
        setEvolutionAnimation({
          oldSpriteKey: `${evoData.oldPrefix}_idle`,
          newSpriteKey: `${evoData.newPrefix}_idle`,
          name: evoData.name,
        });
      }
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
      setTriggerEmote({ type: 'sweat', t: Date.now() }); // "hmph" reaction
      return;
    }

    setPetState((prev) => {
      const updated = pet(prev);
      checkLevelUp(prev, updated);
      return updated;
    });
    setTriggerEmote({ type: 'star', t: Date.now() });
    recordInteraction();
    recordStatsInteraction('pet');
    dailyStatsRef.current.timesPetted = (dailyStatsRef.current.timesPetted || 0) + 1;
    saveDailyStats(dailyStatsRef.current);
    setJustPetted(true);
    setTimeout(() => setJustPetted(false), 2000);
    recordFirstPet();
    { const s = getStats(); runAchievementCheck(s); }
  }, [petState.species]);

  // Handle food selection from FoodMenu
  const handleFoodSelect = useCallback((foodId) => {
    setShowFoodMenu(false);
    setPetState((prev) => {
      const updated = feed(prev, foodId);
      checkLevelUp(prev, updated);
      // Show feed message
      if (updated._feedMessage) {
        setFeedMessage(updated._feedMessage);
        setTimeout(() => setFeedMessage(null), 3000);
      }
      // Clean up internal props
      const { _feedEffect, _feedMessage, ...cleanState } = updated;
      return cleanState;
    });
    setTriggerEmote({ type: 'heart', t: Date.now() });
    recordInteraction();
    recordStatsInteraction('feed');
    dailyStatsRef.current.timesFed = (dailyStatsRef.current.timesFed || 0) + 1;
    saveDailyStats(dailyStatsRef.current);
    clearActionTimeout();
    actionTimeoutRef.current = setTimeout(() => {
      setPetState((prev) => ({ ...prev, state: 'idle' }));
    }, 3000);
    { const s = incrementStat('timesFed'); runAchievementCheck(s); }
    recordFirstFeed();
    // Update active effects display
    setActiveEffects(getActiveEffects());
  }, []);

  // Handle birthday celebration
  const handleBirthdayCelebrate = useCallback(() => {
    const rewards = getBirthdayRewards();
    markBirthdayCelebrated();
    // Apply rewards
    setPetState((prev) => {
      const updated = { ...prev };
      updated.xp = (updated.xp || 0) + rewards.xp;
      updated.level = calculateLevel(updated.xp);
      return updated;
    });
    // Add food reward to inventory
    addToInventory(rewards.food, rewards.foodCount);
  }, []);

  // Right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Multi-pet handlers
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


  return (
    <div
      className="w-full h-full relative select-none overflow-hidden"
      style={{ background: 'transparent', width: '100vw', height: '100vh' }}
      onContextMenu={handleContextMenu}
    >
      {/* Habitat background */}
      <AnimatePresence mode="wait">
        <Habitat key={activeHabitat} habitatId={activeHabitat} />
      </AnimatePresence>

      {/* Weather overlay */}
      <WeatherOverlay weather={weather} />

      {/* Pet with full desktop roaming */}
      <Pet
        petState={petState.state || 'idle'}
        species={petState.species || 'slime'}
        level={petState.level || 1}
        onPet={handlePetClick}
        onBounce={() => {}}
        screenWidth={screenSize.width}
        screenHeight={screenSize.height}
        timeOfDay={timeOfDay}
        weather={weather}
        triggerEmote={triggerEmote}
        onPositionChange={setPrimaryPosition}
      />

      {/* Companion pet */}
      {companionState && (
        <Pet
          petState={companionState.state || 'idle'}
          species={companionState.species || 'slime'}
          level={companionState.level || 1}
          onPet={() => {}}
          onBounce={() => {}}
          screenWidth={screenSize.width}
          screenHeight={screenSize.height}
          timeOfDay={timeOfDay}
          weather={weather}
          triggerEmote={null}
          isCompanion={true}
          companionName={companionState.name}
          onPositionChange={setCompanionPosition}
        />
      )}

      {/* Pet-to-pet interaction effects */}
      <PetInteraction
        interaction={currentInteraction}
        primaryPosition={primaryPosition}
        companionPosition={companionPosition}
        onComplete={() => setCurrentInteraction(null)}
      />

      {/* Particle effects */}
      <Particles type="sparkles" active={petState.happiness > 80 && weather === 'sunny'} />
      <Particles type="hearts" active={justPetted} />
      <Particles type="raindrops" active={weather === 'rainy' || weather === 'stormy'} />
      <Particles type="snow" active={weather === 'snowy'} />
      <Particles type="fire" active={petState.hunger !== undefined && petState.hunger < 20} />
      <Particles type="zzz" active={petState.state === 'sleeping'} />
      <Particles type="music" active={petState.state === 'dancing'} />

      {/* Desktop Widget */}
      <DesktopWidget
        petPosition={{ x: 200, y: 200 }}
        petState={petState}
        visible={showWidget}
        onTimerEnd={() => {
          setPetState((prev) => ({ ...prev, state: 'dancing' }));
          setTimeout(() => setPetState((prev) => ({ ...prev, state: 'idle' })), 3000);
        }}
      />

      {/* Sprite Editor */}
      <AnimatePresence>
        {showSpriteEditor && (
          <SpriteEditor
            onClose={() => setShowSpriteEditor(false)}
            onApplyCustomSprite={(name) => setActiveCustomSpriteName(name)}
          />
        )}
      </AnimatePresence>

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

      {/* Food Menu */}
      <AnimatePresence>
        {showFoodMenu && (
          <FoodMenu
            petState={petState}
            onSelectFood={handleFoodSelect}
            onClose={() => setShowFoodMenu(false)}
          />
        )}
      </AnimatePresence>

      {/* Feed message toast */}
      <AnimatePresence>
        {feedMessage && (
          <motion.div
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[90] bg-gray-900/95 backdrop-blur-md text-white text-sm px-4 py-2 rounded-xl border border-gray-700/50 shadow-xl"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {feedMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Birthday Event */}
      <AnimatePresence>
        {showBirthday && (
          <BirthdayEvent
            petName={petState.name}
            petAge={(() => { const d = getAgingData(); return d ? getPetAge(d.birthDate) : { days: 0 }; })()}
            rewards={getBirthdayRewards()}
            onCelebrate={handleBirthdayCelebrate}
            onDismiss={() => setShowBirthday(false)}
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

      {/* Sound Settings */}
      <AnimatePresence>
        {showSoundSettings && (
          <SoundSettings onClose={() => setShowSoundSettings(false)} />
        )}
      </AnimatePresence>

      {/* Stats Dashboard */}
      <AnimatePresence>
        {showStatsDashboard && (
          <StatsDashboard onClose={() => setShowStatsDashboard(false)} />
        )}
      </AnimatePresence>

      {/* Pet Slots panel */}
      <AnimatePresence>
        {showPetSlots && (
          <PetSlots
            slots={petSlots}
            primaryLevel={petState.level || 1}
            companionSlot={companionSlot}
            onSummon={handleSummonCompanion}
            onDismiss={handleDismissCompanion}
            onCreate={handleCreatePet}
            onDelete={handleDeletePet}
            onClose={() => setShowPetSlots(false)}
          />
        )}
      </AnimatePresence>

      {/* Habitat Selector */}
      <AnimatePresence>
        {showHabitatSelector && (
          <HabitatSelector
            currentLevel={petState.level || 1}
            activeHabitat={activeHabitat}
            onSelect={(id) => {
              setActiveHabitat(id);
              setActiveHabitatState(id);
              setShowHabitatSelector(false);
            }}
            onClose={() => setShowHabitatSelector(false)}
          />
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

      {/* Evolution animation */}
      <AnimatePresence>
        {evolutionAnimation && (
          <EvolutionAnimation
            oldSpriteKey={evolutionAnimation.oldSpriteKey}
            newSpriteKey={evolutionAnimation.newSpriteKey}
            evolutionName={evolutionAnimation.name}
            onComplete={() => setEvolutionAnimation(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
