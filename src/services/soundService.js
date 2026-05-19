// Sound service using Web Audio API - generates retro tones, no audio files needed

let audioCtx = null;
let masterVolume = parseFloat(localStorage.getItem('petdesk-volume') ?? '0.3');
let isMuted = localStorage.getItem('petdesk-muted') === 'true';

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getGain() {
  if (isMuted) return 0;
  return masterVolume;
}

function playTone(frequency, duration, type = 'square', opts = {}) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  if (opts.freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(opts.freqEnd, ctx.currentTime + duration);
  }

  if (opts.wobble) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(opts.wobble.rate || 20, ctx.currentTime);
    lfoGain.gain.setValueAtTime(opts.wobble.depth || 50, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(ctx.currentTime);
    lfo.stop(ctx.currentTime + duration);
  }

  const vol = getGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);

  if (opts.fadeOut) {
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  } else {
    gain.gain.setValueAtTime(vol, ctx.currentTime + duration - 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  }

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + (opts.delay || 0));
  osc.stop(ctx.currentTime + (opts.delay || 0) + duration);
}

const sounds = {
  // Short high beep - when petted
  chirp() {
    playTone(800, 0.1, 'square');
  },

  // Low crunch wobble - when fed
  munch() {
    playTone(200, 0.3, 'sawtooth', { wobble: { rate: 30, depth: 80 } });
  },

  // Ascending arpeggio C-E-G-C - level up
  levelUp() {
    playTone(523, 0.1, 'square', { delay: 0 });
    playTone(659, 0.1, 'square', { delay: 0.1 });
    playTone(784, 0.1, 'square', { delay: 0.2 });
    playTone(1047, 0.15, 'square', { delay: 0.3 });
  },

  // Low slow wave - sleeping
  snore() {
    playTone(100, 0.5, 'sine', { fadeOut: true });
  },

  // Quick pitch drop - jump/bounce
  bounce() {
    playTone(600, 0.15, 'square', { freqEnd: 200 });
  },

  // Two quick chirps - happy
  happy() {
    playTone(600, 0.08, 'square', { delay: 0 });
    playTone(800, 0.08, 'square', { delay: 0.1 });
  },
};

export function playSound(name) {
  if (isMuted) return;
  const fn = sounds[name];
  if (fn) {
    try {
      fn();
    } catch (e) {
      // Silently fail - audio not critical
    }
  }
}

export function setVolume(vol) {
  masterVolume = Math.max(0, Math.min(1, vol));
  localStorage.setItem('petdesk-volume', String(masterVolume));
}

export function getVolume() {
  return masterVolume;
}

export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('petdesk-muted', String(isMuted));
  return isMuted;
}

export function getMuted() {
  return isMuted;
}
