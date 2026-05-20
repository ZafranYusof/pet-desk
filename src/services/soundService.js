// Sound service using Web Audio API - generates tones with sound pack support
// Enhanced with ambient background music per habitat and separate volume controls
import { getPackById } from './soundPacks';

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let masterVolume = parseInt(localStorage.getItem('petdesk-volume') ?? '70', 10);
let musicVolume = parseInt(localStorage.getItem('petdesk-music-volume') ?? '40', 10);
let sfxVolume = parseInt(localStorage.getItem('petdesk-sfx-volume') ?? '80', 10);
let isMutedState = localStorage.getItem('petdesk-muted') === 'true';
let activePackId = localStorage.getItem('petdesk-soundpack') || 'retro';

// Ambient music state
let currentAmbient = null;
let ambientNodes = [];
let ambientInterval = null;

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);

    musicGain = audioCtx.createGain();
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.connect(masterGain);

    updateAllGains();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMasterGain() {
  getContext();
  return sfxGain;
}

function getMusicGain() {
  getContext();
  return musicGain;
}

function updateAllGains() {
  const masterVol = isMutedState ? 0 : masterVolume / 100;
  if (masterGain) masterGain.gain.setValueAtTime(masterVol, audioCtx.currentTime);
  if (musicGain) musicGain.gain.setValueAtTime(musicVolume / 100, audioCtx.currentTime);
  if (sfxGain) sfxGain.gain.setValueAtTime(sfxVolume / 100, audioCtx.currentTime);
}

function playTone(frequency, duration, type = 'square', opts = {}) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + (opts.delay || 0));

  if (opts.freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(opts.freqEnd, ctx.currentTime + (opts.delay || 0) + duration);
  }

  if (opts.wobble) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(opts.wobble.rate || 20, ctx.currentTime);
    lfoGain.gain.setValueAtTime(opts.wobble.depth || 50, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(ctx.currentTime + (opts.delay || 0));
    lfo.stop(ctx.currentTime + (opts.delay || 0) + duration);
  }

  const volScale = opts.volumeScale !== undefined ? opts.volumeScale : 1;
  const startTime = ctx.currentTime + (opts.delay || 0);

  gain.gain.setValueAtTime(0.3 * volScale, startTime);

  if (opts.fadeOut) {
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
  } else {
    gain.gain.setValueAtTime(0.3 * volScale, startTime + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
  }

  const targetGain = opts.isMusic ? getMusicGain() : getMasterGain();
  osc.connect(gain);
  gain.connect(targetGain);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playPackSound(eventName) {
  if (isMutedState) return;
  const pack = getPackById(activePackId);
  const tones = pack.sounds[eventName];
  if (!tones) return;

  try {
    tones.forEach((tone) => {
      playTone(tone.freq, tone.duration, tone.type, {
        delay: tone.delay || 0,
        freqEnd: tone.freqEnd,
        wobble: tone.wobble,
        fadeOut: tone.fadeOut,
        volumeScale: tone.volumeScale,
      });
    });
  } catch (e) {
    // Silently fail - audio not critical
  }
}

// Legacy sound name mapping to pack events
const legacySoundMap = {
  chirp: 'pet',
  munch: 'feed',
  levelUp: 'levelUp',
  snore: 'sleep',
  bounce: 'bounce',
  happy: 'play',
};

// Additional SFX definitions
const extraSfx = {
  questComplete: [
    { freq: 523, duration: 0.1, type: 'square' },
    { freq: 659, duration: 0.1, type: 'square', delay: 0.1 },
    { freq: 784, duration: 0.15, type: 'square', delay: 0.2 },
    { freq: 1047, duration: 0.3, type: 'square', delay: 0.35 },
  ],
  dreamStart: [
    { freq: 440, duration: 0.4, type: 'sine', fadeOut: true },
    { freq: 554, duration: 0.4, type: 'sine', delay: 0.2, fadeOut: true },
    { freq: 659, duration: 0.6, type: 'sine', delay: 0.4, fadeOut: true },
  ],
  pomodoroBell: [
    { freq: 800, duration: 0.15, type: 'sine' },
    { freq: 1000, duration: 0.15, type: 'sine', delay: 0.2 },
    { freq: 800, duration: 0.15, type: 'sine', delay: 0.4 },
  ],
  levelUpFanfare: [
    { freq: 262, duration: 0.1, type: 'square' },
    { freq: 330, duration: 0.1, type: 'square', delay: 0.1 },
    { freq: 392, duration: 0.1, type: 'square', delay: 0.2 },
    { freq: 523, duration: 0.15, type: 'square', delay: 0.3 },
    { freq: 659, duration: 0.15, type: 'square', delay: 0.45 },
    { freq: 784, duration: 0.3, type: 'square', delay: 0.6 },
  ],
  seasonalJingle: [
    { freq: 523, duration: 0.15, type: 'triangle' },
    { freq: 587, duration: 0.15, type: 'triangle', delay: 0.15 },
    { freq: 659, duration: 0.15, type: 'triangle', delay: 0.3 },
    { freq: 523, duration: 0.15, type: 'triangle', delay: 0.45 },
    { freq: 659, duration: 0.15, type: 'triangle', delay: 0.6 },
    { freq: 784, duration: 0.4, type: 'triangle', delay: 0.75 },
  ],
  notification: [
    { freq: 880, duration: 0.08, type: 'sine' },
    { freq: 1100, duration: 0.12, type: 'sine', delay: 0.1 },
  ],
  error: [
    { freq: 200, duration: 0.15, type: 'sawtooth' },
    { freq: 150, duration: 0.2, type: 'sawtooth', delay: 0.15 },
  ],
};

export function playSound(name) {
  if (isMutedState) return;

  // Check extra SFX first
  if (extraSfx[name]) {
    try {
      extraSfx[name].forEach((tone) => {
        playTone(tone.freq, tone.duration, tone.type, {
          delay: tone.delay || 0,
          freqEnd: tone.freqEnd,
          fadeOut: tone.fadeOut,
          volumeScale: tone.volumeScale,
        });
      });
    } catch (e) { /* ignore */ }
    return;
  }

  const eventName = legacySoundMap[name] || name;
  playPackSound(eventName);
}

// === Ambient Music System ===

const AMBIENT_PATTERNS = {
  default: {
    name: 'Desktop',
    notes: [262, 294, 330, 349, 392, 440, 494, 523],
    tempo: 2000,
    type: 'square',
    pattern: [0, 2, 4, 5, 4, 2, 0, 2],
    volume: 0.08,
  },
  forest: {
    name: 'Forest',
    notes: [392, 440, 494, 523, 587, 659],
    tempo: 3000,
    type: 'sine',
    pattern: [0, 2, 4, 3, 1, 5, 3, 2],
    volume: 0.06,
    // Bird-like chirps
    extras: [
      { freq: 1200, duration: 0.05, type: 'sine', interval: 4000 },
      { freq: 1400, duration: 0.04, type: 'sine', interval: 6000 },
    ],
  },
  ocean: {
    name: 'Ocean',
    notes: [196, 220, 247, 262, 294],
    tempo: 4000,
    type: 'sine',
    pattern: [0, 1, 2, 3, 4, 3, 2, 1],
    volume: 0.07,
    // Wave-like oscillation
    wobble: { rate: 0.5, depth: 20 },
  },
  space: {
    name: 'Space',
    notes: [130, 165, 196, 220, 262, 330],
    tempo: 5000,
    type: 'sine',
    pattern: [0, 3, 5, 2, 4, 1, 3, 5],
    volume: 0.05,
    // Ethereal pads
    padDuration: 3,
  },
  cave: {
    name: 'Cave',
    notes: [110, 131, 147, 165, 196],
    tempo: 3500,
    type: 'triangle',
    pattern: [0, 2, 1, 3, 4, 2, 0, 1],
    volume: 0.06,
    // Echo drips
    extras: [
      { freq: 800, duration: 0.02, type: 'sine', interval: 5000, volumeScale: 0.3 },
      { freq: 600, duration: 0.03, type: 'sine', interval: 7000, volumeScale: 0.2 },
    ],
  },
};

/**
 * Start ambient music for a habitat.
 */
export function startAmbientMusic(habitatId = 'default') {
  stopAmbientMusic();

  if (isMutedState) return;

  const pattern = AMBIENT_PATTERNS[habitatId] || AMBIENT_PATTERNS.default;
  currentAmbient = habitatId;

  let noteIndex = 0;

  ambientInterval = setInterval(() => {
    if (isMutedState) return;

    const ctx = getContext();
    const noteIdx = pattern.pattern[noteIndex % pattern.pattern.length];
    const freq = pattern.notes[noteIdx];
    const duration = pattern.padDuration || 1.5;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = pattern.type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    if (pattern.wobble) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(pattern.wobble.rate, ctx.currentTime);
      lfoGain.gain.setValueAtTime(pattern.wobble.depth, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(ctx.currentTime);
      lfo.stop(ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(pattern.volume, ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(getMusicGain());

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);

    ambientNodes.push(osc);
    noteIndex++;
  }, pattern.tempo);

  // Start extras (bird chirps, drips, etc.)
  if (pattern.extras) {
    pattern.extras.forEach(extra => {
      const extraInterval = setInterval(() => {
        if (isMutedState) return;
        playTone(extra.freq, extra.duration, extra.type, {
          volumeScale: extra.volumeScale || 0.3,
          fadeOut: true,
          isMusic: true,
        });
      }, extra.interval + Math.random() * 2000);
      ambientNodes.push({ stop: () => clearInterval(extraInterval) });
    });
  }
}

/**
 * Stop ambient music.
 */
export function stopAmbientMusic() {
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
  ambientNodes.forEach(node => {
    try { if (node.stop) node.stop(); } catch (e) { /* ignore */ }
  });
  ambientNodes = [];
  currentAmbient = null;
}

/**
 * Get current ambient music habitat.
 */
export function getCurrentAmbient() {
  return currentAmbient;
}

/**
 * Get available ambient patterns.
 */
export function getAmbientPatterns() {
  return Object.entries(AMBIENT_PATTERNS).map(([id, p]) => ({ id, name: p.name }));
}

// Preview all sounds in a pack quickly
export function previewPack(packId) {
  const pack = getPackById(packId);
  const events = Object.keys(pack.sounds);
  let delay = 0;

  events.forEach((eventName) => {
    const tones = pack.sounds[eventName];
    if (!tones) return;

    tones.forEach((tone) => {
      const totalDelay = delay + (tone.delay || 0);
      playTone(tone.freq, tone.duration, tone.type, {
        delay: totalDelay,
        freqEnd: tone.freqEnd,
        wobble: tone.wobble,
        fadeOut: tone.fadeOut,
        volumeScale: tone.volumeScale,
      });
    });

    const maxDur = Math.max(...tones.map((t) => (t.delay || 0) + t.duration));
    delay += maxDur + 0.15;
  });
}

// Volume controls
export function setVolume(vol) {
  masterVolume = Math.max(0, Math.min(100, Math.round(vol)));
  localStorage.setItem('petdesk-volume', String(masterVolume));
  updateAllGains();
}

export function getVolume() {
  return masterVolume;
}

export function setMusicVolume(vol) {
  musicVolume = Math.max(0, Math.min(100, Math.round(vol)));
  localStorage.setItem('petdesk-music-volume', String(musicVolume));
  updateAllGains();
}

export function getMusicVolume() {
  return musicVolume;
}

export function setSfxVolume(vol) {
  sfxVolume = Math.max(0, Math.min(100, Math.round(vol)));
  localStorage.setItem('petdesk-sfx-volume', String(sfxVolume));
  updateAllGains();
}

export function getSfxVolume() {
  return sfxVolume;
}

export function setMute(muted) {
  isMutedState = !!muted;
  localStorage.setItem('petdesk-muted', String(isMutedState));
  updateAllGains();
  if (isMutedState) {
    stopAmbientMusic();
  }
}

export function toggleMute() {
  setMute(!isMutedState);
  return isMutedState;
}

export function getMuted() {
  return isMutedState;
}

export function setSoundPack(packId) {
  activePackId = packId;
  localStorage.setItem('petdesk-soundpack', packId);
}

export function getActivePack() {
  return activePackId;
}
