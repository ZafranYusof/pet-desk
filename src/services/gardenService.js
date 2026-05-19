import plants, { getPlantById } from '../data/plants';

const GARDEN_KEY = 'petdesk_garden';
const MAX_PLOTS = 6;

// Plot unlock levels
const PLOT_UNLOCKS = [
  { index: 0, level: 1 },
  { index: 1, level: 1 },
  { index: 2, level: 5 },
  { index: 3, level: 5 },
  { index: 4, level: 15 },
  { index: 5, level: 15 },
];

function createEmptyPlot() {
  return {
    plantId: null,
    plantedAt: null,
    lastWatered: null,
    stage: 0,
    isWithered: false,
  };
}

export function getGarden() {
  try {
    const stored = localStorage.getItem(GARDEN_KEY);
    if (stored) {
      const plots = JSON.parse(stored);
      if (Array.isArray(plots) && plots.length === MAX_PLOTS) {
        return plots;
      }
    }
  } catch (e) { /* ignore */ }
  const plots = Array.from({ length: MAX_PLOTS }, () => createEmptyPlot());
  saveGarden(plots);
  return plots;
}

export function saveGarden(plots) {
  try {
    localStorage.setItem(GARDEN_KEY, JSON.stringify(plots));
  } catch (e) { /* ignore */ }
}

export function isPlotUnlocked(plotIndex, level) {
  const unlock = PLOT_UNLOCKS[plotIndex];
  if (!unlock) return false;
  return level >= unlock.level;
}

export function getPlotUnlockLevel(plotIndex) {
  const unlock = PLOT_UNLOCKS[plotIndex];
  return unlock ? unlock.level : 99;
}

export function getAvailablePlants(level) {
  return plants.filter((p) => level >= p.unlockLevel);
}

export function plantSeed(plotIndex, plantId) {
  const plots = getGarden();
  if (plotIndex < 0 || plotIndex >= MAX_PLOTS) return plots;
  if (plots[plotIndex].plantId !== null) return plots;

  const plant = getPlantById(plantId);
  if (!plant) return plots;

  plots[plotIndex] = {
    plantId,
    plantedAt: Date.now(),
    lastWatered: Date.now(),
    stage: 0,
    isWithered: false,
  };
  saveGarden(plots);
  return plots;
}

export function waterPlant(plotIndex) {
  const plots = getGarden();
  if (plotIndex < 0 || plotIndex >= MAX_PLOTS) return plots;
  const plot = plots[plotIndex];
  if (!plot.plantId || plot.isWithered) return plots;

  plot.lastWatered = Date.now();
  saveGarden(plots);
  return plots;
}

export function harvestPlant(plotIndex) {
  const plots = getGarden();
  if (plotIndex < 0 || plotIndex >= MAX_PLOTS) return { plots, reward: null };
  const plot = plots[plotIndex];
  if (!plot.plantId || plot.isWithered) return { plots, reward: null };

  const plant = getPlantById(plot.plantId);
  if (!plant) return { plots, reward: null };

  // Check if ready to harvest (stage 3)
  const stage = getPlantStage(plot);
  if (stage < 3) return { plots, reward: null };

  const reward = { ...plant.reward, plantName: plant.name, plantEmoji: plant.emoji };

  // Clear the plot
  plots[plotIndex] = createEmptyPlot();
  saveGarden(plots);
  return { plots, reward };
}

export function removeWithered(plotIndex) {
  const plots = getGarden();
  if (plotIndex < 0 || plotIndex >= MAX_PLOTS) return plots;
  if (!plots[plotIndex].isWithered) return plots;

  plots[plotIndex] = createEmptyPlot();
  saveGarden(plots);
  return plots;
}

export function getPlantStage(plot) {
  if (!plot.plantId || plot.isWithered) return -1;

  const plant = getPlantById(plot.plantId);
  if (!plant) return -1;

  const elapsed = (Date.now() - plot.plantedAt) / 1000; // seconds
  const progress = Math.min(elapsed / plant.growthTime, 1);

  if (progress >= 0.75) return 3; // Ready
  if (progress >= 0.5) return 2; // Growing
  if (progress >= 0.25) return 1; // Sprout
  return 0; // Seed
}

export function getGrowthProgress(plot) {
  if (!plot.plantId || plot.isWithered) return 0;

  const plant = getPlantById(plot.plantId);
  if (!plant) return 0;

  const elapsed = (Date.now() - plot.plantedAt) / 1000;
  return Math.min(elapsed / plant.growthTime, 1);
}

export function needsWater(plot) {
  if (!plot.plantId || plot.isWithered) return false;

  const plant = getPlantById(plot.plantId);
  if (!plant) return false;

  const timeSinceWater = (Date.now() - plot.lastWatered) / 1000;
  return timeSinceWater >= plant.waterInterval;
}

export function isWithered(plot) {
  if (!plot.plantId) return false;
  if (plot.isWithered) return true;

  const plant = getPlantById(plot.plantId);
  if (!plant) return false;

  const timeSinceWater = (Date.now() - plot.lastWatered) / 1000;
  // Withers if not watered for waterInterval + witheredTime
  return timeSinceWater >= (plant.waterInterval + plant.witheredTime);
}

export function tickGarden() {
  const plots = getGarden();
  let changed = false;

  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    if (!plot.plantId || plot.isWithered) continue;

    // Check if withered
    if (isWithered(plot)) {
      plots[i].isWithered = true;
      changed = true;
      continue;
    }

    // Update stage
    const newStage = getPlantStage(plot);
    if (newStage !== plot.stage) {
      plots[i].stage = newStage;
      changed = true;
    }
  }

  if (changed) {
    saveGarden(plots);
  }
  return plots;
}

export function getGardenNotifications(plots) {
  const notifications = [];
  for (let i = 0; i < plots.length; i++) {
    const plot = plots[i];
    if (!plot.plantId || plot.isWithered) continue;

    const plant = getPlantById(plot.plantId);
    if (!plant) continue;

    if (needsWater(plot)) {
      notifications.push({ type: 'water', plotIndex: i, plantName: plant.name, plantEmoji: plant.emoji });
    }
    if (getPlantStage(plot) === 3) {
      notifications.push({ type: 'harvest', plotIndex: i, plantName: plant.name, plantEmoji: plant.emoji });
    }
  }
  return notifications;
}

export function getTimeRemaining(plot) {
  if (!plot.plantId || plot.isWithered) return null;

  const plant = getPlantById(plot.plantId);
  if (!plant) return null;

  const elapsed = (Date.now() - plot.plantedAt) / 1000;
  const remaining = Math.max(0, plant.growthTime - elapsed);
  return remaining;
}

export function formatTime(seconds) {
  if (seconds <= 0) return 'Ready!';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
