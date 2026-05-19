// Job Service - Pet Jobs/Career system with passive income
const JOB_STATE_KEY = 'petdesk_job_state';
const JOB_COOLDOWN_KEY = 'petdesk_job_cooldown';

const JOBS = [
  {
    id: 'pixel-artist',
    name: 'Pixel Artist',
    icon: '🎨',
    shiftHours: 1,
    rewards: { xp: 15, materialChance: 0.2, material: 'Fabric' },
    requirement: { level: 1 },
    flavor: 'Drawing tiny masterpieces, one pixel at a time',
  },
  {
    id: 'code-monkey',
    name: 'Code Monkey',
    icon: '💻',
    shiftHours: 2,
    rewards: { xp: 35, materialChance: 0.15, material: 'Crystal' },
    requirement: { level: 5 },
    flavor: "console.log('working hard or hardly working?')",
  },
  {
    id: 'garden-keeper',
    name: 'Garden Keeper',
    icon: '🌿',
    shiftHours: 1.5,
    rewards: { xp: 25, materialChance: 0.3, material: 'Wood', autoWater: true },
    requirement: { level: 8, gardenUnlocked: true },
    flavor: 'Tending to the digital garden with care',
  },
  {
    id: 'battle-trainer',
    name: 'Battle Trainer',
    icon: '⚔️',
    shiftHours: 3,
    rewards: { xp: 60, attackBonus: 2, materialChance: 0.1, material: 'Shadow Essence' },
    requirement: { level: 12, battlesWon: 5 },
    flavor: 'Training in the art of pixel combat',
  },
  {
    id: 'star-explorer',
    name: 'Star Explorer',
    icon: '🚀',
    shiftHours: 4,
    rewards: { xp: 100, materialChance: 0.25, material: 'Star Fragment', rareFoodChance: 0.1 },
    requirement: { level: 18 },
    flavor: 'Boldly going where no pet has gone before',
  },
  {
    id: 'royal-advisor',
    name: 'Royal Advisor',
    icon: '👑',
    shiftHours: 6,
    rewards: { xp: 200, goldDust: 2, materialChance: 0.15, material: 'Accessory' },
    requirement: { level: 25, storyChapter: 8 },
    flavor: 'Advising the king on matters of great importance',
  },
];

function loadJobState() {
  try {
    const stored = localStorage.getItem(JOB_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    currentJob: null,
    completedShifts: 0,
    totalXPEarned: 0,
    jobHistory: [],
  };
}

function saveJobState(state) {
  try {
    localStorage.setItem(JOB_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

function getCooldownEnd() {
  try {
    const stored = localStorage.getItem(JOB_COOLDOWN_KEY);
    if (stored) return parseInt(stored, 10);
  } catch (e) { /* ignore */ }
  return 0;
}

function setCooldown() {
  const cooldownEnd = Date.now() + 30 * 60 * 1000; // 30 minutes
  localStorage.setItem(JOB_COOLDOWN_KEY, String(cooldownEnd));
}

function clearCooldown() {
  localStorage.removeItem(JOB_COOLDOWN_KEY);
}

export function getJobs(level, stats = {}) {
  return JOBS.map((job) => {
    let unlocked = level >= job.requirement.level;
    let lockReason = null;

    if (!unlocked) {
      lockReason = `Level ${job.requirement.level} required`;
    } else if (job.requirement.gardenUnlocked && !stats.gardenUnlocked) {
      unlocked = false;
      lockReason = 'Garden must be unlocked';
    } else if (job.requirement.battlesWon && (stats.battlesWon || 0) < job.requirement.battlesWon) {
      unlocked = false;
      lockReason = `Win ${job.requirement.battlesWon} battles`;
    } else if (job.requirement.storyChapter && (stats.storyChapter || 0) < job.requirement.storyChapter) {
      unlocked = false;
      lockReason = `Complete story chapter ${job.requirement.storyChapter}`;
    }

    return { ...job, unlocked, lockReason };
  });
}

export function startJob(jobId) {
  const state = loadJobState();
  if (state.currentJob) return { success: false, reason: 'Already on a job' };

  const cooldownEnd = getCooldownEnd();
  if (Date.now() < cooldownEnd) {
    const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
    return { success: false, reason: `Cooldown: ${remaining} min remaining` };
  }

  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return { success: false, reason: 'Job not found' };

  state.currentJob = {
    jobId,
    startTime: Date.now(),
    shiftDuration: job.shiftHours * 60 * 60 * 1000,
  };
  saveJobState(state);
  clearCooldown();
  return { success: true };
}

export function checkJobComplete() {
  const state = loadJobState();
  if (!state.currentJob) return null;

  const { startTime, shiftDuration } = state.currentJob;
  const elapsed = Date.now() - startTime;

  if (elapsed >= shiftDuration) {
    return { complete: true, jobId: state.currentJob.jobId };
  }
  return { complete: false, jobId: state.currentJob.jobId };
}

export function collectJobReward() {
  const state = loadJobState();
  if (!state.currentJob) return null;

  const { startTime, shiftDuration, jobId } = state.currentJob;
  const elapsed = Date.now() - startTime;
  if (elapsed < shiftDuration) return null; // Not done yet

  const job = JOBS.find((j) => j.id === jobId);
  if (!job) return null;

  // Calculate rewards
  const rewards = { xp: job.rewards.xp };

  if (job.rewards.materialChance && Math.random() < job.rewards.materialChance) {
    rewards.material = job.rewards.material;
  }
  if (job.rewards.attackBonus) {
    rewards.attackBonus = job.rewards.attackBonus;
  }
  if (job.rewards.goldDust) {
    rewards.goldDust = job.rewards.goldDust;
  }
  if (job.rewards.rareFoodChance && Math.random() < job.rewards.rareFoodChance) {
    rewards.rareFood = true;
  }
  if (job.rewards.autoWater) {
    rewards.autoWater = true;
  }

  // Update state
  state.completedShifts += 1;
  state.totalXPEarned += rewards.xp;
  state.jobHistory.unshift({ jobId, completedAt: Date.now(), reward: rewards });
  if (state.jobHistory.length > 50) state.jobHistory = state.jobHistory.slice(0, 50);
  state.currentJob = null;
  saveJobState(state);

  return rewards;
}

export function cancelJob() {
  const state = loadJobState();
  if (!state.currentJob) return false;

  state.currentJob = null;
  saveJobState(state);
  setCooldown();
  return true;
}

export function getJobProgress() {
  const state = loadJobState();
  if (!state.currentJob) return null;

  const { startTime, shiftDuration, jobId } = state.currentJob;
  const elapsed = Date.now() - startTime;
  const percent = Math.min(100, Math.floor((elapsed / shiftDuration) * 100));
  const remaining = Math.max(0, shiftDuration - elapsed);

  const job = JOBS.find((j) => j.id === jobId);

  return {
    jobId,
    jobName: job?.name || jobId,
    jobIcon: job?.icon || '💼',
    elapsed,
    total: shiftDuration,
    percent,
    remainingMs: remaining,
    remainingMin: Math.ceil(remaining / 60000),
    complete: elapsed >= shiftDuration,
  };
}

export function isOnJob() {
  const state = loadJobState();
  return state.currentJob !== null;
}

export function getJobState() {
  return loadJobState();
}

export function getCooldownRemaining() {
  const cooldownEnd = getCooldownEnd();
  if (Date.now() >= cooldownEnd) return 0;
  return Math.ceil((cooldownEnd - Date.now()) / 60000);
}
