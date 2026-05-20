import { useState, useEffect, useCallback, useRef } from 'react';
import { loadPet, loadPetAsync, savePet } from '../services/petStorage';
import { tick, feed, play, pet, sleep, calculateLevel, checkUnlocks, checkEvolutionOnLevelUp, switchSpecies, equipAccessory, unequipAccessory } from '../services/petEngine';
import { tickEffects, getActiveEffects, hasActiveEffect, addToInventory } from '../services/foodService';
import { getPersonality, applyPersonalityToTick, shouldIgnoreClick } from '../services/personality';
import { getActiveHabitat, getHabitatMoodBonus } from '../services/habitatService';
import { getRoomBonus } from '../services/housingService';
import { checkAndNotify, notifyLevelUp, recordInteraction } from '../services/notificationService';
import { checkAchievements, getStats, incrementStat } from '../services/achievementService';
import { recordInteraction as recordStatsInteraction, recordLevelUp as recordStatsLevelUp, recordEvolution as recordStatsEvolution, recordAchievementUnlock as recordStatsAchievement, recordGamePlayed as recordStatsGame, recordGameWin as recordStatsGameWin, startPlaytimeTracking, stopPlaytimeTracking } from '../services/statsService';
import { recordFirstFeed, recordFirstPlay, recordFirstPet, recordLevelUp, recordSpeciesUnlock, recordAccessoryEquip, recordAchievement } from '../services/scrapbookService';
import { submitScore, syncPlayerScores, updateFakePlayers } from '../services/leaderboardService';
import { checkDailyReward } from '../services/dailyRewards';
import { getAgingData, initAgingData, shouldCelebrateBirthday, markBirthdayCelebrated, getBirthdayRewards } from '../services/agingService';
import { generateEntry, saveDiaryEntry, hasEntryToday } from '../services/diaryService';

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

export function usePetEngine(activeHabitat) {
  const [petState, setPetState] = useState(() => loadPet());
  const [activeEffects, setActiveEffects] = useState(() => getActiveEffects());
  const [feedMessage, setFeedMessage] = useState(null);
  const [levelUpLevel, setLevelUpLevel] = useState(null);
  const [evolutionAnimation, setEvolutionAnimation] = useState(null);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showBirthday, setShowBirthday] = useState(false);
  const [justPetted, setJustPetted] = useState(false);
  const [triggerEmote, setTriggerEmote] = useState(null);

  const idleSecondsRef = useRef(0);
  const actionTimeoutRef = useRef(null);
  const dailyStatsRef = useRef(loadDailyStats());
  const notificationIntervalRef = useRef(null);
  const achievementQueueRef = useRef([]);

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

  // Update leaderboard fake players on mount (daily)
  useEffect(() => {
    updateFakePlayers();
    syncPlayerScores(petState, getStats());
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

        // Apply room bonuses
        const roomBonus = getRoomBonus();
        if (roomBonus.happiness) {
          updated.happiness = Math.min(100, updated.happiness + roomBonus.happiness);
        }
        if (roomBonus.energy) {
          updated.energy = Math.min(100, updated.energy + roomBonus.energy);
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
  }, [activeHabitat]);

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
      submitScore('level', updated.level);
      submitScore('totalXp', updated.xp || 0);
      const evoData = checkEvolutionOnLevelUp(updated, prev.level, updated.level);
      if (evoData) {
        setEvolutionAnimation({
          oldSpriteKey: `${evoData.oldPrefix}_idle`,
          newSpriteKey: `${evoData.newPrefix}_idle`,
          name: evoData.name,
        });
      }
      const { petState: withUnlocks, newUnlocks } = checkUnlocks(updated);
      setPetState(withUnlocks);
      recordLevelUp(updated.level);
      if (newUnlocks) {
        newUnlocks.forEach((unlock) => {
          if (unlock.type === 'species') recordSpeciesUnlock(unlock.name);
        });
      }
      const stats = getStats();
      runAchievementCheck(stats);
    }
  }

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

  const handleAchievementDismiss = useCallback(() => {
    setAchievementPopup(null);
    setTimeout(() => {
      const next = achievementQueueRef.current.shift();
      if (next) setAchievementPopup(next);
    }, 300);
  }, []);

  const handlePetClick = useCallback(() => {
    const personality = getPersonality(petState.species || 'slime');
    if (shouldIgnoreClick(personality)) {
      setTriggerEmote({ type: 'sweat', t: Date.now() });
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

  const handleFeed = useCallback((foodId) => {
    if (foodId) {
      setPetState((prev) => {
        const updated = feed(prev, foodId);
        checkLevelUp(prev, updated);
        if (updated._feedMessage) {
          setFeedMessage(updated._feedMessage);
          setTimeout(() => setFeedMessage(null), 3000);
        }
        const { _feedEffect, _feedMessage, ...cleanState } = updated;
        return cleanState;
      });
    } else {
      setPetState((prev) => {
        const updated = feed(prev);
        checkLevelUp(prev, updated);
        return updated;
      });
    }
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
    setActiveEffects(getActiveEffects());
  }, []);

  const handlePlay = useCallback(() => {
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
  }, []);

  const handleSleep = useCallback(() => {
    setPetState((prev) => sleep(prev));
    setTriggerEmote({ type: 'zzz', t: Date.now() });
    recordStatsInteraction('sleep');
  }, []);

  const handleRename = useCallback((newName) => {
    setPetState((prev) => ({ ...prev, name: newName }));
  }, []);

  const handleSelectSpecies = useCallback((speciesId) => {
    setPetState((prev) => switchSpecies(prev, speciesId));
  }, []);

  const handleEquipAccessory = useCallback((accId) => {
    setPetState((prev) => equipAccessory(prev, accId));
    recordAccessoryEquip(accId);
    { const s = getStats(); runAchievementCheck(s); }
  }, []);

  const handleUnequipAccessory = useCallback((accId) => {
    setPetState((prev) => unequipAccessory(prev, accId));
  }, []);

  const handleBirthdayCelebrate = useCallback(() => {
    const rewards = getBirthdayRewards();
    markBirthdayCelebrated();
    setPetState((prev) => {
      const updated = { ...prev };
      updated.xp = (updated.xp || 0) + rewards.xp;
      updated.level = calculateLevel(updated.xp);
      return updated;
    });
    addToInventory(rewards.food, rewards.foodCount);
  }, []);

  const handleDailyRewardClaim = useCallback((updated) => {
    setPetState(updated);
    const s = getStats();
    runAchievementCheck(s);
  }, []);

  const applyXpReward = useCallback((xp) => {
    setPetState((prev) => {
      const updated = { ...prev };
      updated.xp = (updated.xp || 0) + xp;
      updated.level = calculateLevel(updated.xp);
      return updated;
    });
  }, []);

  const applyStatReward = useCallback((rewards) => {
    setPetState((prev) => {
      const updated = { ...prev };
      if (rewards.happiness) updated.happiness = Math.min(100, (updated.happiness || 0) + rewards.happiness);
      if (rewards.energy) updated.energy = Math.min(100, (updated.energy || 0) + rewards.energy);
      if (rewards.hunger) updated.hunger = Math.min(100, (updated.hunger || 0) + rewards.hunger);
      if (rewards.xp) {
        updated.xp = (updated.xp || 0) + rewards.xp;
        updated.level = calculateLevel(updated.xp);
      }
      return updated;
    });
  }, []);

  return {
    petState,
    setPetState,
    activeEffects,
    feedMessage,
    levelUpLevel,
    setLevelUpLevel,
    evolutionAnimation,
    setEvolutionAnimation,
    achievementPopup,
    showDailyReward,
    setShowDailyReward,
    showBirthday,
    setShowBirthday,
    justPetted,
    triggerEmote,
    setTriggerEmote,
    idleSecondsRef,
    dailyStatsRef,
    handlePetClick,
    handleFeed,
    handlePlay,
    handleSleep,
    handleRename,
    handleSelectSpecies,
    handleEquipAccessory,
    handleUnequipAccessory,
    handleBirthdayCelebrate,
    handleDailyRewardClaim,
    handleAchievementDismiss,
    applyXpReward,
    applyStatReward,
    checkLevelUp,
    runAchievementCheck,
    saveDailyStats: () => saveDailyStats(dailyStatsRef.current),
  };
}
