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
import StoryMode from './components/StoryMode';
import DesktopReaction from './components/DesktopReaction';
import { getReaction } from './services/desktopBuddyService';
import StatsDashboard from './components/StatsDashboard';
import BattleArena from './components/BattleArena';
import { getActiveCustomSpriteData, getActiveCustomSprite } from './services/customSpriteService';
import { getBattleRewards, getBattleLossPenalty, getWinStreak } from './services/battleService';
import { checkAchievements, getStats, incrementStat, recordGameWin } from './services/achievementService';
import { getActiveHabitat, setActiveHabitat, getHabitatMoodBonus } from './services/habitatService';
import Habitat from './components/Habitat';
import HabitatSelector from './components/HabitatSelector';
import Garden from './components/Garden';
import PetRoom from './components/PetRoom';
import { getRoomBonus, addCoins, getCoins } from './services/housingService';
import CraftingTable from './components/CraftingTable';
import WeatherEvent from './components/WeatherEvent';
import { checkDailyReward } from './services/dailyRewards';
import JobBoard from './components/JobBoard';
import Arcade from './components/Arcade';
import FlappyPet from './games/FlappyPet';
import SnakeGame from './games/SnakeGame';
import BlockStack from './games/BlockStack';
import { checkJobComplete, collectJobReward, getJobProgress } from './services/jobService';
import { saveHighScore, recordGamePlayed } from './services/arcadeService';
import { addMaterial } from './services/craftingService';
import { checkForEvent, getActiveEvent, endEvent } from './services/weatherEventService';
import BreedingLab from './components/BreedingLab';
import DungeonCrawler from './components/DungeonCrawler';
import PhotoMode from './components/PhotoMode';
import { ChatBubble, ChatLog } from './components/PetChat';
import { generateMessage, getGreeting, getIdleChat, saveChatMessage } from './services/petChatService';
import { tickGarden, getGardenNotifications, getGarden } from './services/gardenService';
import { recordFirstFeed, recordFirstPlay, recordFirstPet, recordLevelUp, recordSpeciesUnlock, recordAccessoryEquip, recordAchievement, recordStreak, recordGameWin as recordGameWinScrapbook } from './services/scrapbookService';
import { recordInteraction as recordStatsInteraction, recordLevelUp as recordStatsLevelUp, recordEvolution as recordStatsEvolution, recordAchievementUnlock as recordStatsAchievement, recordGamePlayed as recordStatsGame, recordGameWin as recordStatsGameWin, startPlaytimeTracking, stopPlaytimeTracking } from './services/statsService';
import { updateFakePlayers, syncPlayerScores, submitScore } from './services/leaderboardService';
import Leaderboard from './components/Leaderboard';

// New imports for tasks 2-10
import { recordPersonalityInteraction, tickPersonalityEvolution, getPersonalityIgnoreChance, loadPersonalityEvolution } from './services/personalityEvolution';
import { logFed, logPlayed, logPetted, logLevelUp, logDanced, generateOfflineActivities } from './services/activityLogService';
import ActivityLog from './components/ActivityLog';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import { loadKeybinds } from './services/keybindService';
import KeybindSettings from './components/KeybindSettings';
import { detectEdge, getEdgeTransform } from './services/screenEdgeService';
import { loadPalette, getPaletteFilter } from './services/paletteService';
import ColorPalette from './components/ColorPalette';
import { PetProvider } from './context/PetContext';
import { getActiveSeasonalEvent, getSeasonalXpMultiplier } from './services/seasonalService';
import SeasonalEvent, { SeasonalBanner } from './components/SeasonalEvent';

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

function AppContent() {
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
  const [showBattle, setShowBattle] = useState(false);
  const [showDungeon, setShowDungeon] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showHabitatSelector, setShowHabitatSelector] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [desktopReaction, setDesktopReaction] = useState(null);
  const [showGarden, setShowGarden] = useState(false);
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [showArcade, setShowArcade] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [showPetRoom, setShowPetRoom] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showBreedingLab, setShowBreedingLab] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);
  const [chatBubble, setChatBubble] = useState(null);
  const chatTimerRef = useRef(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeWeatherEvent, setActiveWeatherEvent] = useState(() => getActiveEvent());
  const [activeHabitat, setActiveHabitatState] = useState(() => getActiveHabitat());
  const [activeCustomSpriteName, setActiveCustomSpriteName] = useState(() => getActiveCustomSprite());
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [evolutionAnimation, setEvolutionAnimation] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
  const [weather, setWeather] = useState(() => getWeather());
  const [screenSize, setScreenSize] = useState({ width: 1920, height: 1080 });

  // New state for tasks 2-10
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showKeybindSettings, setShowKeybindSettings] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showSeasonalEvent, setShowSeasonalEvent] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [edgeReaction, setEdgeReaction] = useState(null);
  const [colorPalette, setColorPalette] = useState(() => loadPalette());
  const [petSpriteClass, setPetSpriteClass] = useState('');

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

  // Companion tick
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

  // Pet-to-pet interaction timer
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
        const interaction = pickInteraction(petState.species || 'slime', companionState?.species || 'slime');
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
            if (companionSlot !== null) saveSlotState(companionSlot, updated);
            return updated;
          });
        }, (interaction.duration || 4000) + 500);
        scheduleInteraction();
      }, delay);
    }
    scheduleInteraction();
    return () => { if (interactionTimerRef.current) clearTimeout(interactionTimerRef.current); };
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
    const interval = setInterval(() => { setTimeOfDay(getTimeOfDay()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Tick garden every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      tickGarden();
      const plots = getGarden();
      const notifications = getGardenNotifications(plots);
      notifications.forEach((n) => {
        if (n.type === 'harvest' && window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(`${n.plantEmoji} ${n.plantName} is ready to harvest!`);
        } else if (n.type === 'water' && window.electronAPI?.showNotification) {
          window.electronAPI.showNotification(`${n.plantEmoji} ${n.plantName} needs water!`);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check job completion every 60 seconds
  useEffect(() => {
    const jobStatus = checkJobComplete();
    if (jobStatus && jobStatus.complete && window.electronAPI?.showNotification) {
      window.electronAPI.showNotification('Job shift complete! Collect your reward.');
    }
    const interval = setInterval(() => {
      const status = checkJobComplete();
      if (status && status.complete && window.electronAPI?.showNotification) {
        window.electronAPI.showNotification('Job shift complete! Collect your reward.');
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update weather every 60s
  useEffect(() => {
    const interval = setInterval(() => { setWeather(getWeather()); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check for weather events every 30 minutes
  useEffect(() => {
    const event = checkForEvent(timeOfDay, weather);
    if (event) setActiveWeatherEvent(event);
    const interval = setInterval(() => {
      const evt = checkForEvent(timeOfDay, weather);
      if (evt) setActiveWeatherEvent(evt);
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeOfDay, weather]);

  // Auto-sleep at night
  useEffect(() => {
    if (shouldAutoSleep() && petState.state !== 'sleeping') {
      setPetState((prev) => prev.state !== 'sleeping' ? { ...prev, state: 'sleeping' } : prev);
    }
  }, [timeOfDay]);

  // Pet chat: random message every 2-5 minutes
  useEffect(() => {
    function scheduleChatMessage() {
      const delay = 120000 + Math.random() * 180000;
      chatTimerRef.current = setTimeout(() => {
        const msg = getIdleChat(petState);
        if (msg) { setChatBubble(msg); saveChatMessage(msg); }
        scheduleChatMessage();
      }, delay);
    }
    scheduleChatMessage();
    return () => { if (chatTimerRef.current) clearTimeout(chatTimerRef.current); };
  }, [petState.species, petState.happiness]);

  // Chat greeting on mount
  useEffect(() => {
    const hour = new Date().getHours();
    let timeOfDayStr = 'morning';
    if (hour >= 12 && hour < 18) timeOfDayStr = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDayStr = 'evening';
    else if (hour >= 22 || hour < 6) timeOfDayStr = 'night';
    const greeting = getGreeting(petState, timeOfDayStr);
    if (greeting) { setTimeout(() => { setChatBubble(greeting); saveChatMessage(greeting); }, 2000); }
  }, []);

  // Ensure pet state has new fields (migration)
  useEffect(() => {
    setPetState((prev) => ({ species: 'slime', accessories: [], unlockedSpecies: ['slime'], unlockedAccessories: ['party-hat'], ...prev }));
  }, []);

  // Load pet from electron-store on mount
  useEffect(() => {
    loadPetAsync().then((state) => {
      if (state) {
        setPetState((prev) => ({ species: 'slime', accessories: [], unlockedSpecies: ['slime'], unlockedAccessories: ['party-hat'], ...state }));
      }
    });
  }, []);

  // Save pet state whenever it changes + auto-save indicator
  useEffect(() => {
    savePet(petState);
    setSaveIndicator(true);
    const timer = setTimeout(() => setSaveIndicator(false), 500);
    return () => clearTimeout(timer);
  }, [petState]);

  // Check daily reward on mount
  useEffect(() => {
    const reward = checkDailyReward();
    if (reward) { const timer = setTimeout(() => setShowDailyReward(true), 800); return () => clearTimeout(timer); }
  }, []);

  // Initialize aging data on mount
  useEffect(() => {
    let agingData = getAgingData();
    if (!agingData) agingData = initAgingData(petState.createdAt);
  }, []);

  // Update leaderboard fake players on mount
  useEffect(() => { updateFakePlayers(); syncPlayerScores(petState, getStats()); }, []);

  // Check birthday on mount
  useEffect(() => {
    const timer = setTimeout(() => { if (shouldCelebrateBirthday()) setShowBirthday(true); }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Tick active food effects every second
  useEffect(() => {
    const interval = setInterval(() => { setActiveEffects(tickEffects()); }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Start playtime tracking
  useEffect(() => { startPlaytimeTracking(); return () => stopPlaytimeTracking(); }, []);

  // Generate offline activities on mount
  useEffect(() => {
    const lastSave = petState.lastSaved || petState.lastFed;
    if (lastSave) generateOfflineActivities(petState, lastSave);
  }, []);

  // Update pet sprite class based on state (Task 9)
  useEffect(() => {
    const state = petState.state || 'idle';
    const mood = petState.mood || 'neutral';
    if (state === 'eating') setPetSpriteClass('pet-state-eating');
    else if (state === 'sleeping') setPetSpriteClass('pet-state-sleeping');
    else if (state === 'dancing') setPetSpriteClass('pet-state-dancing');
    else if (state === 'playing') setPetSpriteClass('pet-state-playing');
    else if (mood === 'happy') setPetSpriteClass('pet-state-happy');
    else if (mood === 'hungry' || mood === 'sad') setPetSpriteClass('pet-state-angry');
    else setPetSpriteClass('');
  }, [petState.state, petState.mood]);

  // Screen edge awareness (Task 6)
  useEffect(() => {
    const edge = detectEdge(primaryPosition, screenSize);
    setEdgeReaction(edge);
  }, [primaryPosition, screenSize]);

  // Tick every 5 seconds (with personality modifiers + personality evolution)
  useEffect(() => {
    const interval = setInterval(() => {
      setPetState((prev) => {
        let updated = tick(prev, idleSecondsRef.current);
        const personality = getPersonality(prev.species || 'slime');
        updated = applyPersonalityToTick(updated, personality);
        const habitatBonus = getHabitatMoodBonus(activeHabitat);
        if (habitatBonus.happiness) updated.happiness = Math.min(100, updated.happiness + habitatBonus.happiness);
        if (habitatBonus.energy) updated.energy = Math.min(100, updated.energy + habitatBonus.energy);
        const roomBonus = getRoomBonus();
        if (roomBonus.happiness) updated.happiness = Math.min(100, updated.happiness + roomBonus.happiness);
        if (roomBonus.energy) updated.energy = Math.min(100, updated.energy + roomBonus.energy);
        if (updated.state === 'sleeping') {
          dailyStatsRef.current.minutesAsleep = (dailyStatsRef.current.minutesAsleep || 0) + (5 / 60);
          saveDailyStats(dailyStatsRef.current);
        }
        // Personality evolution tick
        tickPersonalityEvolution();
        return updated;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Notification check every 60 seconds
  useEffect(() => {
    notificationIntervalRef.current = setInterval(() => { checkAndNotify(petState); }, 60000);
    return () => { if (notificationIntervalRef.current) clearInterval(notificationIntervalRef.current); };
  }, [petState]);

  // Diary: generate entry at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      if (dailyStatsRef.current.date !== today) {
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
    window.electronAPI.onIdleChange?.((data) => { idleSecondsRef.current = data.idleSeconds; });
    window.electronAPI.onIdleTick?.((data) => { idleSecondsRef.current = data.idleSeconds; });
    window.electronAPI.onPetAction?.((action) => { handleAction(action); });
    window.electronAPI.onActivityEvent?.((data) => {
      const reaction = getReaction(data.type, data);
      if (reaction) setDesktopReaction(reaction);
    });
  }, []);

  // Keybind handler (Task 5)
  useEffect(() => {
    const keybinds = loadKeybinds();
    function handleKeyDown(e) {
      const key = e.key;
      if (key === keybinds.toggleStats || (key === 'F9' && keybinds.toggleStats === 'F9')) {
        e.preventDefault();
        setShowStats((prev) => !prev);
      }
      if (key === keybinds.quickFeed || (key === 'F8' && keybinds.quickFeed === 'F8')) {
        e.preventDefault();
        handleAction('feed');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function clearActionTimeout() {
    if (actionTimeoutRef.current) { clearTimeout(actionTimeoutRef.current); actionTimeoutRef.current = null; }
  }

  function checkLevelUp(prev, updated) {
    if (updated.level > prev.level) {
      setLevelUpLevel(updated.level);
      notifyLevelUp(updated.level);
      submitScore('level', updated.level);
      submitScore('totalXp', updated.xp || 0);
      const evoData = checkEvolutionOnLevelUp(updated, prev.level, updated.level);
      if (evoData) {
        setEvolutionAnimation({ oldSpriteKey: `${evoData.oldPrefix}_idle`, newSpriteKey: `${evoData.newPrefix}_idle`, name: evoData.name });
      }
      const { petState: withUnlocks, newUnlocks } = checkUnlocks(updated);
      setPetState(withUnlocks);
      recordLevelUp(updated.level);
      logLevelUp(updated.level);
      if (newUnlocks) { newUnlocks.forEach((unlock) => { if (unlock.type === 'species') recordSpeciesUnlock(unlock.name); }); }
      const stats = getStats();
      runAchievementCheck(stats);
    }
  }

  function runAchievementCheck(stats) {
    setPetState((current) => {
      const newlyUnlocked = checkAchievements(current, stats);
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((a) => { recordAchievement(a.name, a.icon); achievementQueueRef.current.push(a); });
        showNextAchievement();
      }
      return current;
    });
  }

  function showNextAchievement() {
    if (achievementPopup) return;
    const next = achievementQueueRef.current.shift();
    if (next) setAchievementPopup(next);
  }

  function handleAchievementDismiss() {
    setAchievementPopup(null);
    setTimeout(() => { const next = achievementQueueRef.current.shift(); if (next) setAchievementPopup(next); }, 300);
  }

  // Pet interaction (click) with personality + personality evolution
  const handlePetClick = useCallback(() => {
    const personality = getPersonality(petState.species || 'slime');
    const evoState = loadPersonalityEvolution();
    const evoIgnoreChance = getPersonalityIgnoreChance(evoState.dominantPersonality);
    if (shouldIgnoreClick(personality) || Math.random() < evoIgnoreChance) {
      setTriggerEmote({ type: 'sweat', t: Date.now() });
      return;
    }
    setPetState((prev) => { const updated = pet(prev); checkLevelUp(prev, updated); return updated; });
    setTriggerEmote({ type: 'star', t: Date.now() });
    recordInteraction();
    recordStatsInteraction('pet');
    recordPersonalityInteraction('pet');
    logPetted();
    dailyStatsRef.current.timesPetted = (dailyStatsRef.current.timesPetted || 0) + 1;
    saveDailyStats(dailyStatsRef.current);
    setJustPetted(true);
    setTimeout(() => setJustPetted(false), 2000);
    recordFirstPet();
    { const s = getStats(); runAchievementCheck(s); }
  }, [petState.species]);

  const handleFoodSelect = useCallback((foodId) => {
    setShowFoodMenu(false);
    setPetState((prev) => {
      const updated = feed(prev, foodId);
      checkLevelUp(prev, updated);
      if (updated._feedMessage) { setFeedMessage(updated._feedMessage); setTimeout(() => setFeedMessage(null), 3000); }
      const { _feedEffect, _feedMessage, ...cleanState } = updated;
      return cleanState;
    });
    setTriggerEmote({ type: 'heart', t: Date.now() });
    recordInteraction();
    recordStatsInteraction('feed');
    recordPersonalityInteraction('feed');
    logFed();
    dailyStatsRef.current.timesFed = (dailyStatsRef.current.timesFed || 0) + 1;
    saveDailyStats(dailyStatsRef.current);
    clearActionTimeout();
    actionTimeoutRef.current = setTimeout(() => { setPetState((prev) => ({ ...prev, state: 'idle' })); }, 3000);
    { const s = incrementStat('timesFed'); runAchievementCheck(s); }
    recordFirstFeed();
    setActiveEffects(getActiveEffects());
  }, []);

  const handleBirthdayCelebrate = useCallback(() => {
    const rewards = getBirthdayRewards();
    markBirthdayCelebrated();
    setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + rewards.xp; updated.level = calculateLevel(updated.xp); return updated; });
    addToInventory(rewards.food, rewards.foodCount);
  }, []);

  const handleContextMenu = useCallback((e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }, []);

  const handleSummonCompanion = useCallback((slotIndex) => {
    const slots = getPetSlots();
    if (!slots[slotIndex]) return;
    summonCompanion(slotIndex);
    setCompanionSlot(slotIndex);
    setCompanionState(slots[slotIndex]);
  }, []);

  const handleDismissCompanion = useCallback(() => { dismissCompanion(); setCompanionSlot(null); setCompanionState(null); setCurrentInteraction(null); }, []);

  const handleCreatePet = useCallback((species, name) => {
    const updatedSlots = createNewPet(species, name, petState.level || 1);
    if (updatedSlots) setPetSlots(updatedSlots);
  }, [petState.level]);

  const handleDeletePet = useCallback((slotIndex) => {
    const updatedSlots = deletePet(slotIndex);
    if (updatedSlots) { setPetSlots(updatedSlots); if (companionSlot === slotIndex) handleDismissCompanion(); }
  }, [companionSlot]);

  const handleRename = useCallback((newName) => { setPetState((prev) => ({ ...prev, name: newName })); }, []);
  const handleSelectSpecies = useCallback((speciesId) => { setPetState((prev) => switchSpecies(prev, speciesId)); setShowPetSelector(false); }, []);
  const handleEquipAccessory = useCallback((accId) => { setPetState((prev) => equipAccessory(prev, accId)); recordAccessoryEquip(accId); { const s = getStats(); runAchievementCheck(s); } }, []);
  const handleUnequipAccessory = useCallback((accId) => { setPetState((prev) => unequipAccessory(prev, accId)); }, []);

  // Handle actions (from context menu or tray)
  const handleAction = useCallback((action) => {
    setContextMenu(null);
    switch (action) {
      case 'feed':
        setPetState((prev) => { const updated = feed(prev); checkLevelUp(prev, updated); return updated; });
        setTriggerEmote({ type: 'heart', t: Date.now() });
        recordInteraction(); recordStatsInteraction('feed'); recordPersonalityInteraction('feed'); logFed();
        dailyStatsRef.current.timesFed = (dailyStatsRef.current.timesFed || 0) + 1;
        saveDailyStats(dailyStatsRef.current);
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => { setPetState((prev) => ({ ...prev, state: 'idle' })); }, 3000);
        { const s = incrementStat('timesFed'); runAchievementCheck(s); }
        recordFirstFeed();
        break;
      case 'food': setShowFoodMenu(true); break;
      case 'play':
        setPetState((prev) => { const updated = play(prev); checkLevelUp(prev, updated); return updated; });
        setTriggerEmote({ type: 'music', t: Date.now() });
        recordInteraction(); recordStatsInteraction('play'); recordPersonalityInteraction('play'); logPlayed();
        dailyStatsRef.current.timesPlayed = (dailyStatsRef.current.timesPlayed || 0) + 1;
        saveDailyStats(dailyStatsRef.current);
        clearActionTimeout();
        actionTimeoutRef.current = setTimeout(() => { setPetState((prev) => ({ ...prev, state: 'idle' })); }, 3000);
        { const s = incrementStat('timesPlayed'); runAchievementCheck(s); }
        recordFirstPlay();
        break;
      case 'sleep':
        setPetState((prev) => sleep(prev));
        setTriggerEmote({ type: 'zzz', t: Date.now() });
        recordStatsInteraction('sleep');
        break;
      case 'stats': setShowStats((prev) => !prev); break;
      case 'sound': setShowSoundSettings((prev) => !prev); break;
      case 'lifetimeStats': setShowStatsDashboard((prev) => !prev); break;
      case 'widget': setShowWidget((prev) => !prev); break;
      case 'spriteEditor': setShowSpriteEditor((prev) => !prev); break;
      case 'rename': setShowStats(true); break;
      case 'story': setShowStory((prev) => !prev); break;
      case 'diary': setShowDiary((prev) => !prev); break;
      case 'achievements': setShowAchievements((prev) => !prev); break;
      case 'scrapbook': setShowScrapbook((prev) => !prev); break;
      case 'garden': setShowGarden((prev) => !prev); break;
      case 'jobs': setShowJobBoard((prev) => !prev); break;
      case 'arcade': setShowArcade((prev) => !prev); break;
      case 'room': setShowPetRoom((prev) => !prev); break;
      case 'craft': setShowCrafting((prev) => !prev); break;
      case 'leaderboard': setShowLeaderboard((prev) => !prev); break;
      case 'battle': setShowBattle(true); break;
      case 'dungeon': setShowDungeon(true); break;
      case 'photo': setShowPhotoMode(true); break;
      case 'habitat': setShowHabitatSelector((prev) => !prev); break;
      case 'breed': setShowBreedingLab((prev) => !prev); break;
      case 'chat': setShowChatLog((prev) => !prev); break;
      case 'pets': setShowPetSlots((prev) => !prev); break;
      case 'activityLog': setShowActivityLog((prev) => !prev); break;
      case 'keybinds': setShowKeybindSettings((prev) => !prev); break;
      case 'palette': setShowColorPalette((prev) => !prev); break;
      case 'seasonal': setShowSeasonalEvent((prev) => !prev); break;
      case 'summonCompanion': {
        const slots = getPetSlots();
        for (let i = 1; i < slots.length; i++) { if (slots[i]) { handleSummonCompanion(i); break; } }
        break;
      }
      case 'dismissCompanion': handleDismissCompanion(); break;
      default:
        if (action && action.startsWith('game:')) {
          recordInteraction(); recordStatsInteraction('game');
          const gameId = action.split(':')[1];
          if (gameId) recordStatsGame(gameId);
          dailyStatsRef.current.gamesPlayed = (dailyStatsRef.current.gamesPlayed || 0) + 1;
          saveDailyStats(dailyStatsRef.current);
        }
        break;
    }
  }, []);

  // Get palette filter for pet sprite
  const paletteFilter = getPaletteFilter(colorPalette.id, colorPalette.customHue);

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

      {/* Seasonal event banner (Task 10) */}
      <SeasonalBanner onOpen={() => setShowSeasonalEvent(true)} />

      {/* Pet with full desktop roaming */}
      <div className={`pet-sprite-animated ${petSpriteClass} ${edgeReaction ? `pet-edge-${edgeReaction.reaction === 'sit' ? 'sit' : edgeReaction.reaction === 'lean' ? (edgeReaction.edge === 'left' ? 'lean-left' : 'lean-right') : 'look-up'}` : ''}`} style={{ filter: paletteFilter !== 'none' ? paletteFilter : undefined }}>
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
      </div>

      {/* Pet Chat Bubble */}
      <AnimatePresence>
        {chatBubble && (
          <ChatBubble message={chatBubble} species={petState.species || 'slime'} onDismiss={() => setChatBubble(null)} />
        )}
      </AnimatePresence>

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
      <PetInteraction interaction={currentInteraction} primaryPosition={primaryPosition} companionPosition={companionPosition} onComplete={() => setCurrentInteraction(null)} />

      {/* Particle effects */}
      <Particles type="sparkles" active={petState.happiness > 80 && weather === 'sunny'} />
      <Particles type="hearts" active={justPetted} />
      <Particles type="raindrops" active={weather === 'rainy' || weather === 'stormy'} />
      <Particles type="snow" active={weather === 'snowy'} />
      <Particles type="fire" active={petState.hunger !== undefined && petState.hunger < 20} />
      <Particles type="zzz" active={petState.state === 'sleeping'} />
      <Particles type="music" active={petState.state === 'dancing'} />

      {/* Auto-save indicator (Task 4) */}
      <AutoSaveIndicator visible={saveIndicator} />

      {/* Desktop Widget */}
      <DesktopWidget petPosition={{ x: 200, y: 200 }} petState={petState} visible={showWidget} onTimerEnd={() => { setPetState((prev) => ({ ...prev, state: 'dancing' })); logDanced(); setTimeout(() => setPetState((prev) => ({ ...prev, state: 'idle' })), 3000); }} />

      {/* Sprite Editor */}
      <AnimatePresence>
        {showSpriteEditor && (<SpriteEditor onClose={() => setShowSpriteEditor(false)} onApplyCustomSprite={(name) => setActiveCustomSpriteName(name)} />)}
      </AnimatePresence>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (<ContextMenu x={contextMenu.x} y={contextMenu.y} petState={petState} onAction={handleAction} onClose={() => setContextMenu(null)} />)}
      </AnimatePresence>

      {/* Food Menu */}
      <AnimatePresence>
        {showFoodMenu && (<FoodMenu petState={petState} onSelectFood={handleFoodSelect} onClose={() => setShowFoodMenu(false)} />)}
      </AnimatePresence>

      {/* Feed message toast */}
      <AnimatePresence>
        {feedMessage && (
          <motion.div className="fixed top-8 left-1/2 -translate-x-1/2 z-[90] bg-gray-900/95 backdrop-blur-md text-white text-sm px-4 py-2 rounded-xl border border-gray-700/50 shadow-xl" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
            {feedMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Birthday Event */}
      <AnimatePresence>
        {showBirthday && (<BirthdayEvent petName={petState.name} petAge={(() => { const d = getAgingData(); return d ? getPetAge(d.birthDate) : { days: 0 }; })()} rewards={getBirthdayRewards()} onCelebrate={handleBirthdayCelebrate} onDismiss={() => setShowBirthday(false)} />)}
      </AnimatePresence>

      {/* Stats panel */}
      <AnimatePresence>
        {showStats && (
          <StatsPanel petState={{ ...petState, xpToNext: (petState.level) * 100, stats: { totalPets: petState.totalPets, daysAlive: Math.floor((Date.now() - petState.createdAt) / 86400000), timesFed: Math.floor(petState.xp / 5) } }} onClose={() => setShowStats(false)} onRename={handleRename} onOpenPetSelector={() => { setShowPetSelector(true); setShowAccessoryShop(false); }} onOpenAccessoryShop={() => { setShowAccessoryShop(true); setShowPetSelector(false); }} />
        )}
      </AnimatePresence>

      {/* Pet Selector */}
      <AnimatePresence>
        {showPetSelector && (<PetSelector currentSpecies={petState.species || 'slime'} unlockedSpecies={petState.unlockedSpecies || ['slime']} currentLevel={petState.level || 1} onSelect={handleSelectSpecies} onClose={() => setShowPetSelector(false)} />)}
      </AnimatePresence>

      {/* Accessory Shop */}
      <AnimatePresence>
        {showAccessoryShop && (<AccessoryShop equippedAccessories={petState.accessories || []} unlockedAccessories={petState.unlockedAccessories || ['party-hat']} currentLevel={petState.level || 1} onEquip={handleEquipAccessory} onUnequip={handleUnequipAccessory} onClose={() => setShowAccessoryShop(false)} />)}
      </AnimatePresence>

      {/* Pet Diary */}
      <AnimatePresence>
        {showDiary && (<PetDiary onClose={() => setShowDiary(false)} />)}
      </AnimatePresence>

      {/* Achievements panel */}
      <AnimatePresence>
        {showAchievements && (<Achievements onClose={() => setShowAchievements(false)} />)}
      </AnimatePresence>

      {/* Scrapbook */}
      <AnimatePresence>
        {showScrapbook && (<Scrapbook onClose={() => setShowScrapbook(false)} />)}
      </AnimatePresence>

      {/* Story Mode */}
      <AnimatePresence>
        {showStory && (
          <StoryMode petLevel={petState.level || 1} onClose={() => setShowStory(false)} onEffect={(effects) => {
            setPetState((prev) => {
              const updated = { ...prev };
              if (effects.happiness) updated.happiness = Math.min(100, (updated.happiness || 0) + effects.happiness);
              if (effects.energy) updated.energy = Math.min(100, (updated.energy || 0) + effects.energy);
              if (effects.xp) { updated.xp = (updated.xp || 0) + effects.xp; updated.level = calculateLevel(updated.xp); }
              return updated;
            });
          }} />
        )}
      </AnimatePresence>

      {/* Desktop Buddy Reaction */}
      <DesktopReaction reaction={desktopReaction} onDismiss={() => setDesktopReaction(null)} />

      {/* Sound Settings */}
      <AnimatePresence>
        {showSoundSettings && (<SoundSettings onClose={() => setShowSoundSettings(false)} />)}
      </AnimatePresence>

      {/* Leaderboard */}
      <AnimatePresence>
        {showLeaderboard && (<Leaderboard petName={petState.name || 'You'} onClose={() => setShowLeaderboard(false)} />)}
      </AnimatePresence>

      {/* Stats Dashboard */}
      <AnimatePresence>
        {showStatsDashboard && (<StatsDashboard onClose={() => setShowStatsDashboard(false)} />)}
      </AnimatePresence>

      {/* Battle Arena */}
      <AnimatePresence>
        {showBattle && (
          <BattleArena petState={petState} onClose={() => setShowBattle(false)} onBattleEnd={(result, opponentLevel) => {
            setShowBattle(false);
            if (result === 'win') {
              const rewards = getBattleRewards(opponentLevel);
              setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + rewards.xp; updated.level = calculateLevel(updated.xp); return updated; });
              addCoins(10);
              const stats = getStats();
              submitScore('battleWins', stats.battlesWon || 0);
              syncPlayerScores(petState, stats);
            } else if (result === 'lose') {
              const penalty = getBattleLossPenalty();
              setPetState((prev) => ({ ...prev, happiness: Math.max(0, (prev.happiness || 100) - penalty.happinessLoss) }));
            }
          }} />
        )}
      </AnimatePresence>

      {/* Pet Slots panel */}
      <AnimatePresence>
        {showPetSlots && (<PetSlots slots={petSlots} primaryLevel={petState.level || 1} companionSlot={companionSlot} onSummon={handleSummonCompanion} onDismiss={handleDismissCompanion} onCreate={handleCreatePet} onDelete={handleDeletePet} onClose={() => setShowPetSlots(false)} />)}
      </AnimatePresence>

      {/* Crafting Table */}
      <AnimatePresence>
        {showCrafting && (
          <CraftingTable petLevel={petState.level || 1} onCraftResult={(result, recipe) => {
            if (result.type === 'accessory') {
              setPetState((prev) => { const updated = { ...prev }; if (!updated.unlockedAccessories?.includes(result.id)) { updated.unlockedAccessories = [...(updated.unlockedAccessories || []), result.id]; } return updated; });
            } else if (result.type === 'food') {
              setPetState((prev) => { const updated = { ...prev }; if (result.effect.hunger) updated.hunger = Math.min(100, (updated.hunger || 0) + result.effect.hunger); if (result.effect.energy) updated.energy = Math.min(100, (updated.energy || 0) + result.effect.energy); if (result.effect.happiness) updated.happiness = Math.min(100, (updated.happiness || 0) + result.effect.happiness); if (result.effect.xp) { updated.xp = (updated.xp || 0) + result.effect.xp; updated.level = calculateLevel(updated.xp); } return updated; });
            } else if (result.type === 'boost' || result.type === 'special') {
              setPetState((prev) => { const updated = { ...prev }; if (result.effect.allStats) { updated.hunger = Math.min(100, (updated.hunger || 0) + result.effect.allStats); updated.energy = Math.min(100, (updated.energy || 0) + result.effect.allStats); updated.happiness = Math.min(100, (updated.happiness || 0) + result.effect.allStats); } if (result.effect.xpMultiplier) { updated.xp = (updated.xp || 0) + 25; updated.level = calculateLevel(updated.xp); } return updated; });
            }
          }} onClose={() => setShowCrafting(false)} />
        )}
      </AnimatePresence>

      {/* Weather Event */}
      <WeatherEvent activeEvent={activeWeatherEvent} onCollectReward={(rewards) => {
        setPetState((prev) => { const updated = { ...prev }; if (rewards.xp) { updated.xp = (updated.xp || 0) + rewards.xp; updated.level = calculateLevel(updated.xp); } if (rewards.happiness) updated.happiness = Math.min(100, (updated.happiness || 0) + rewards.happiness); if (rewards.energy) updated.energy = Math.min(100, (updated.energy || 0) + rewards.energy); return updated; });
      }} onEventEnd={() => setActiveWeatherEvent(null)} />

      {/* Pet Room */}
      <AnimatePresence>
        {showPetRoom && (<PetRoom petLevel={petState.level || 1} onClose={() => setShowPetRoom(false)} />)}
      </AnimatePresence>

      {/* Garden */}
      <AnimatePresence>
        {showGarden && (
          <Garden level={petState.level || 1} onClose={() => setShowGarden(false)} onReward={(reward) => {
            setPetState((prev) => {
              const updated = { ...prev };
              if (reward.happiness) updated.happiness = Math.min(100, (updated.happiness || 0) + reward.happiness);
              if (reward.hunger) updated.hunger = Math.min(100, (updated.hunger || 0) + reward.hunger);
              if (reward.energy) updated.energy = Math.min(100, (updated.energy || 0) + reward.energy);
              if (reward.xp) { updated.xp = (updated.xp || 0) + reward.xp; updated.level = calculateLevel(updated.xp); }
              if (reward.type === 'accessory' || reward.type === 'accessory_special') { const accId = reward.accessoryId || 'crystal-pendant'; if (!updated.unlockedAccessories?.includes(accId)) { updated.unlockedAccessories = [...(updated.unlockedAccessories || []), accId]; } }
              return updated;
            });
          }} />
        )}
      </AnimatePresence>

      {/* Habitat Selector */}
      <AnimatePresence>
        {showHabitatSelector && (<HabitatSelector currentLevel={petState.level || 1} activeHabitat={activeHabitat} onSelect={(id) => { setActiveHabitat(id); setActiveHabitatState(id); setShowHabitatSelector(false); }} onClose={() => setShowHabitatSelector(false)} />)}
      </AnimatePresence>

      {/* Job Board */}
      <AnimatePresence>
        {showJobBoard && (<JobBoard petState={petState} onClose={() => setShowJobBoard(false)} onReward={(rewards) => { setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + (rewards.xp || 0); updated.level = calculateLevel(updated.xp); return updated; }); }} />)}
      </AnimatePresence>

      {/* Arcade */}
      <AnimatePresence>
        {showArcade && !activeGame && (<Arcade petState={petState} onClose={() => setShowArcade(false)} onPlayGame={(gameId) => { setShowArcade(false); setActiveGame(gameId); }} />)}
      </AnimatePresence>

      {/* Arcade Games */}
      <AnimatePresence>
        {activeGame === 'flappyPet' && (
          <FlappyPet onBack={() => { setActiveGame(null); setShowArcade(true); }} onGameEnd={(score) => { saveHighScore('flappyPet', score); submitScore('arcadeHighScore', score); recordGamePlayed(score); const xpGain = Math.floor(score / 10); if (xpGain > 0) { setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + xpGain; updated.level = calculateLevel(updated.xp); return updated; }); } }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeGame === 'snake' && (
          <SnakeGame onBack={() => { setActiveGame(null); setShowArcade(true); }} onGameEnd={(score) => { saveHighScore('snake', score); submitScore('arcadeHighScore', score); recordGamePlayed(score); const xpGain = Math.floor(score / 10); if (xpGain > 0) { setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + xpGain; updated.level = calculateLevel(updated.xp); return updated; }); } }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeGame === 'blockStack' && (
          <BlockStack onBack={() => { setActiveGame(null); setShowArcade(true); }} onGameEnd={(score) => { saveHighScore('blockStack', score); submitScore('arcadeHighScore', score); recordGamePlayed(score); const xpGain = Math.floor(score / 10); if (xpGain > 0) { setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + xpGain; updated.level = calculateLevel(updated.xp); return updated; }); } }} />
        )}
      </AnimatePresence>

      {/* Dungeon Crawler */}
      <AnimatePresence>
        {showDungeon && (
          <DungeonCrawler petState={petState} onClose={() => setShowDungeon(false)} onReward={(rewards) => {
            setShowDungeon(false);
            setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + (rewards.xp || 0); updated.level = calculateLevel(updated.xp); return updated; });
            if (rewards.coins) addCoins(rewards.coins);
            if (rewards.inventory) { rewards.inventory.forEach((item) => { if (item.type === 'accessory') { setPetState((prev) => { const updated = { ...prev }; if (!updated.unlockedAccessories?.includes(item.id)) { updated.unlockedAccessories = [...(updated.unlockedAccessories || []), item.id]; } return updated; }); } }); }
          }} />
        )}
      </AnimatePresence>

      {/* Photo Mode */}
      <AnimatePresence>
        {showPhotoMode && (<PhotoMode petState={petState} onClose={() => setShowPhotoMode(false)} />)}
      </AnimatePresence>

      {/* Breeding Lab */}
      <AnimatePresence>
        {showBreedingLab && (
          <BreedingLab petState={petState} onBreedComplete={(hybrid) => {
            const slots = getPetSlots();
            for (let i = 0; i < slots.length; i++) { if (slots[i] === null) { slots[i] = hybrid; savePetSlots(slots); setPetSlots(slots); break; } }
            setShowBreedingLab(false);
            const chatMsg = generateMessage(petState, 'levelup');
            if (chatMsg) { setChatBubble(chatMsg); saveChatMessage(chatMsg); }
          }} onClose={() => setShowBreedingLab(false)} />
        )}
      </AnimatePresence>

      {/* Chat Log */}
      <AnimatePresence>
        {showChatLog && (<ChatLog species={petState.species || 'slime'} petName={petState.name} onClose={() => setShowChatLog(false)} />)}
      </AnimatePresence>

      {/* Activity Log (Task 3) */}
      <AnimatePresence>
        {showActivityLog && (<ActivityLog onClose={() => setShowActivityLog(false)} />)}
      </AnimatePresence>

      {/* Keybind Settings (Task 5) */}
      <AnimatePresence>
        {showKeybindSettings && (<KeybindSettings onClose={() => setShowKeybindSettings(false)} />)}
      </AnimatePresence>

      {/* Color Palette (Task 7) */}
      <AnimatePresence>
        {showColorPalette && (<ColorPalette onClose={() => setShowColorPalette(false)} onApply={(palette) => setColorPalette(palette)} />)}
      </AnimatePresence>

      {/* Seasonal Event (Task 10) */}
      <AnimatePresence>
        {showSeasonalEvent && (
          <SeasonalEvent petState={petState} onClaimReward={(reward) => {
            setPetState((prev) => { const updated = { ...prev }; updated.xp = (updated.xp || 0) + (reward.xpBonus || 0); updated.level = calculateLevel(updated.xp); if (reward.accessories) { reward.accessories.forEach((accId) => { if (!updated.unlockedAccessories?.includes(accId)) { updated.unlockedAccessories = [...(updated.unlockedAccessories || []), accId]; } }); } return updated; });
          }} onClose={() => setShowSeasonalEvent(false)} />
        )}
      </AnimatePresence>

      {/* Daily Reward popup */}
      <AnimatePresence>
        {showDailyReward && (<DailyReward petState={petState} onClaim={(updated) => { setPetState(updated); const s = getStats(); runAchievementCheck(s); }} onClose={() => setShowDailyReward(false)} />)}
      </AnimatePresence>

      {/* Achievement unlock popup */}
      <AnimatePresence>
        {achievementPopup && (<AchievementPopup achievement={achievementPopup} onDismiss={handleAchievementDismiss} />)}
      </AnimatePresence>

      {/* Level up celebration */}
      <AnimatePresence>
        {levelUpLevel && (<LevelUp level={levelUpLevel} onComplete={() => setLevelUpLevel(null)} />)}
      </AnimatePresence>

      {/* Evolution animation */}
      <AnimatePresence>
        {evolutionAnimation && (<EvolutionAnimation oldSpriteKey={evolutionAnimation.oldSpriteKey} newSpriteKey={evolutionAnimation.newSpriteKey} evolutionName={evolutionAnimation.name} onComplete={() => setEvolutionAnimation(null)} />)}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <PetProvider>
      <AppContent />
    </PetProvider>
  );
}

export default App;
