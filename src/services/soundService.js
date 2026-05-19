// Sound service using Web Audio API - generates tones with sound pack support
import { getPackById } from './soundPacks';

let audioCtx = null;
let masterGain = null;
let masterVolume = parseInt(localStorage.getItem('petdesk-volume') ?? '70', 10);
let isMutedState = localStorage.getItem('petdesk-muted') === 'true';
let activePackId = localStorage.getItem('petdesk-soundpack') || 'retro';

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    updateMasterGain();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMasterGain() {
  getContext();
  return masterGain;
}

function updateMasterGain() {
  if (masterGain) {
    const vol = isMutedState ? 0 : masterVolume / 100;
    masterGain.gain.setValueAtTime(vol, audioCtx.currentTime);
  }
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

  osc.connect(gain);
  gain.connect(getMasterGain());

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

export function playSound(name) {
  if (isMutedState) return;
  const eventName = legacySoundMap[name] || name;
  playPackSound(eventName);
}

// Preview all sounds in a pack quickly
export function previewPack(packId) {
  const pack = getPackById(packId);
  const events = Object.keys(pack.sounds);
  let delay = 0;
  const ctx = getContext();

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

    // Calculate max duration of this event's tones
    const maxDur = Math.max(...tones.map((t) => (t.delay || 0) + t.duration));
    delay += maxDur + 0.15; // gap between sounds
  });
}

// Volume control (0-100)
export function setVolume(vol) {
  masterVolume = Math.max(0, Math.min(100, Math.round(vol)));
  localStorage.setItem('petdesk-volume', String(masterVolume));
  updateMasterGain();
}

export function getVolume() {
  return masterVolume;
}

// Mute control
export function setMute(muted) {
  isMutedState = !!muted;
  localStorage.setItem('petdesk-muted', String(isMutedState));
  updateMasterGain();
}

export function toggleMute() {
  setMute(!isMutedState);
  return isMutedState;
}

export function getMuted() {
  return isMutedState;
}

// Sound pack control
export function setSoundPack(packId) {
  activePackId = packId;
  localStorage.setItem('petdesk-soundpack', packId);
}

export function getActivePack() {
  return activePackId;
}
