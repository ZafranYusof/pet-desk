// Sound pack definitions for PetDesk
// Each pack defines tones for all sound events using Web Audio API parameters

export const soundPacks = {
  retro: {
    id: 'retro',
    name: 'Retro',
    description: 'Classic 8-bit bleeps and bloops',
    sounds: {
      feed: [
        { freq: 523, freqEnd: 659, duration: 0.1, type: 'square', delay: 0 },
      ],
      pet: [
        { freq: 392, duration: 0.08, type: 'square', delay: 0 },
        { freq: 784, duration: 0.08, type: 'square', delay: 0.1 },
      ],
      play: [
        { freq: 262, duration: 0.06, type: 'square', delay: 0 },
        { freq: 330, duration: 0.06, type: 'square', delay: 0.06 },
        { freq: 392, duration: 0.06, type: 'square', delay: 0.12 },
        { freq: 523, duration: 0.06, type: 'square', delay: 0.18 },
      ],
      sleep: [
        { freq: 330, freqEnd: 262, duration: 0.2, type: 'sine', delay: 0, fadeOut: true },
      ],
      levelUp: [
        { freq: 262, duration: 0.1, type: 'square', delay: 0 },
        { freq: 330, duration: 0.1, type: 'square', delay: 0.1 },
        { freq: 392, duration: 0.1, type: 'square', delay: 0.2 },
        { freq: 523, duration: 0.3, type: 'square', delay: 0.3 },
      ],
      achievement: [
        { freq: 1319, freqEnd: 988, duration: 0.05, type: 'square', delay: 0 },
        { freq: 1319, duration: 0.08, type: 'square', delay: 0.06 },
      ],
      evolve: [
        { freq: 131, freqEnd: 1047, duration: 0.5, type: 'sawtooth', delay: 0, fadeOut: true },
      ],
      bounce: [
        { freq: 784, freqEnd: 300, duration: 0.15, type: 'square', delay: 0 },
      ],
    },
  },

  cute: {
    id: 'cute',
    name: 'Cute',
    description: 'Soft, bubbly, and adorable',
    sounds: {
      feed: [
        { freq: 880, freqEnd: 1047, duration: 0.06, type: 'sine', delay: 0 },
        { freq: 1047, freqEnd: 1175, duration: 0.06, type: 'sine', delay: 0.07 },
      ],
      pet: [
        { freq: 120, duration: 0.2, type: 'sine', delay: 0, wobble: { rate: 8, depth: 30 } },
      ],
      play: [
        { freq: 698, duration: 0.08, type: 'sine', delay: 0 },
        { freq: 880, duration: 0.08, type: 'sine', delay: 0.09 },
        { freq: 1047, duration: 0.08, type: 'sine', delay: 0.18 },
      ],
      sleep: [
        { freq: 262, duration: 0.3, type: 'sine', delay: 0, fadeOut: true, volumeScale: 0.4 },
      ],
      levelUp: [
        { freq: 523, duration: 0.1, type: 'sine', delay: 0 },
        { freq: 659, duration: 0.1, type: 'sine', delay: 0.1 },
        { freq: 784, duration: 0.1, type: 'sine', delay: 0.2 },
        { freq: 1047, duration: 0.1, type: 'sine', delay: 0.3 },
        { freq: 1319, duration: 0.15, type: 'sine', delay: 0.4 },
      ],
      achievement: [
        { freq: 1319, duration: 0.04, type: 'triangle', delay: 0 },
        { freq: 1568, duration: 0.04, type: 'triangle', delay: 0.05 },
        { freq: 1319, duration: 0.04, type: 'triangle', delay: 0.1 },
      ],
      evolve: [
        { freq: 262, freqEnd: 1047, duration: 0.8, type: 'sine', delay: 0, fadeOut: true },
      ],
      bounce: [
        { freq: 523, duration: 0.1, type: 'sine', delay: 0, wobble: { rate: 30, depth: 80 } },
      ],
    },
  },

  scifi: {
    id: 'scifi',
    name: 'Sci-Fi',
    description: 'Electronic and futuristic',
    sounds: {
      feed: [
        { freq: 2000, freqEnd: 4000, duration: 0.05, type: 'sawtooth', delay: 0, noise: true },
        { freq: 1200, duration: 0.06, type: 'square', delay: 0.06 },
      ],
      pet: [
        { freq: 200, freqEnd: 2000, duration: 0.15, type: 'sawtooth', delay: 0 },
      ],
      play: [
        { freq: 1000, freqEnd: 100, duration: 0.1, type: 'sawtooth', delay: 0 },
      ],
      sleep: [
        { freq: 131, duration: 0.4, type: 'sine', delay: 0, fadeOut: true, volumeScale: 0.3 },
        { freq: 165, duration: 0.4, type: 'sine', delay: 0, fadeOut: true, volumeScale: 0.3 },
      ],
      levelUp: [
        { freq: 100, freqEnd: 3000, duration: 0.4, type: 'sawtooth', delay: 0, fadeOut: true },
      ],
      achievement: [
        { freq: 880, duration: 0.03, type: 'square', delay: 0 },
        { freq: 800, duration: 0.03, type: 'square', delay: 0.04 },
      ],
      evolve: [
        { freq: 80, freqEnd: 2000, duration: 0.3, type: 'sawtooth', delay: 0 },
        { freq: 200, freqEnd: 800, duration: 0.3, type: 'square', delay: 0.3 },
        { freq: 131, duration: 0.3, type: 'sine', delay: 0.3 },
      ],
      bounce: [
        { freq: 800, duration: 0.1, type: 'sine', delay: 0, wobble: { rate: 40, depth: 200 } },
      ],
    },
  },

  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Organic and earthy tones',
    sounds: {
      feed: [
        { freq: 600, freqEnd: 200, duration: 0.08, type: 'sawtooth', delay: 0, volumeScale: 0.5 },
      ],
      pet: [
        { freq: 1319, freqEnd: 1568, duration: 0.04, type: 'sine', delay: 0 },
        { freq: 1568, freqEnd: 1319, duration: 0.04, type: 'sine', delay: 0.05 },
        { freq: 1319, freqEnd: 1568, duration: 0.04, type: 'sine', delay: 0.1 },
      ],
      play: [
        { freq: 1800, duration: 0.05, type: 'sine', delay: 0 },
        { freq: 2200, duration: 0.05, type: 'sine', delay: 0.1 },
        { freq: 1600, duration: 0.05, type: 'sine', delay: 0.2 },
        { freq: 2400, duration: 0.05, type: 'sine', delay: 0.28 },
      ],
      sleep: [
        { freq: 4000, duration: 0.02, type: 'sine', delay: 0, volumeScale: 0.2 },
        { freq: 4000, duration: 0.02, type: 'sine', delay: 0.08, volumeScale: 0.2 },
        { freq: 4000, duration: 0.02, type: 'sine', delay: 0.16, volumeScale: 0.2 },
      ],
      levelUp: [
        { freq: 880, duration: 0.08, type: 'sine', delay: 0 },
        { freq: 1047, duration: 0.08, type: 'sine', delay: 0.1 },
        { freq: 1175, duration: 0.08, type: 'sine', delay: 0.2 },
        { freq: 1319, duration: 0.08, type: 'sine', delay: 0.3 },
        { freq: 1568, duration: 0.12, type: 'sine', delay: 0.4 },
      ],
      achievement: [
        { freq: 2000, freqEnd: 1200, duration: 0.06, type: 'sine', delay: 0 },
      ],
      evolve: [
        { freq: 80, freqEnd: 40, duration: 0.7, type: 'sawtooth', delay: 0, fadeOut: true, volumeScale: 0.6 },
      ],
      bounce: [
        { freq: 1000, freqEnd: 600, duration: 0.05, type: 'sine', delay: 0, volumeScale: 0.3 },
      ],
    },
  },
};

export const packList = Object.values(soundPacks);

export function getPackById(id) {
  return soundPacks[id] || soundPacks.retro;
}
