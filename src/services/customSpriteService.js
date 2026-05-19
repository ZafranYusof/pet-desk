// Custom sprite service - save/load/manage custom pixel art sprites

const CUSTOM_SPRITES_KEY = 'petdesk_custom_sprites';
const ACTIVE_CUSTOM_KEY = 'petdesk_active_custom_sprite';
const MAX_CUSTOM_SPRITES = 5;

// Create empty 16x16 grid
export function createEmptyGrid() {
  return Array.from({ length: 16 }, () => Array(16).fill(null));
}

// Create a full empty sprite set (all 10 states)
export function createEmptySpriteSet(name = 'My Pet') {
  const empty = createEmptyGrid();
  return {
    name,
    sprites: {
      custom_idle: empty.map(row => [...row]),
      custom_idle2: empty.map(row => [...row]),
      custom_walk1: empty.map(row => [...row]),
      custom_walk2: empty.map(row => [...row]),
      custom_happy: empty.map(row => [...row]),
      custom_sad: empty.map(row => [...row]),
      custom_sleep: empty.map(row => [...row]),
      custom_eat: empty.map(row => [...row]),
      custom_dance1: empty.map(row => [...row]),
      custom_dance2: empty.map(row => [...row]),
    },
  };
}

// Save a custom sprite set
export function saveCustomSprite(name, spriteSet) {
  const all = loadCustomSprites();
  const existing = all.findIndex(s => s.name === name);
  if (existing >= 0) {
    all[existing] = { name, sprites: spriteSet.sprites };
  } else {
    if (all.length >= MAX_CUSTOM_SPRITES) {
      // Remove oldest
      all.shift();
    }
    all.push({ name, sprites: spriteSet.sprites });
  }
  localStorage.setItem(CUSTOM_SPRITES_KEY, JSON.stringify(all));
}

// Load all custom sprite sets
export function loadCustomSprites() {
  try {
    const stored = localStorage.getItem(CUSTOM_SPRITES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

// Delete a custom sprite by name
export function deleteCustomSprite(name) {
  const all = loadCustomSprites();
  const filtered = all.filter(s => s.name !== name);
  localStorage.setItem(CUSTOM_SPRITES_KEY, JSON.stringify(filtered));
  // If active was deleted, clear it
  if (getActiveCustomSprite() === name) {
    clearActiveCustomSprite();
  }
}

// Get currently equipped custom sprite name (or null)
export function getActiveCustomSprite() {
  try {
    return localStorage.getItem(ACTIVE_CUSTOM_KEY) || null;
  } catch (e) { return null; }
}

// Set active custom sprite by name
export function setActiveCustomSprite(name) {
  localStorage.setItem(ACTIVE_CUSTOM_KEY, name);
}

// Clear active custom sprite (revert to species default)
export function clearActiveCustomSprite() {
  localStorage.removeItem(ACTIVE_CUSTOM_KEY);
}

// Get the sprite data for the active custom sprite
export function getActiveCustomSpriteData() {
  const name = getActiveCustomSprite();
  if (!name) return null;
  const all = loadCustomSprites();
  return all.find(s => s.name === name) || null;
}

// Sprite state names for the editor
export function getSpriteStates() {
  return [
    { key: 'custom_idle', label: 'Idle 1' },
    { key: 'custom_idle2', label: 'Idle 2' },
    { key: 'custom_walk1', label: 'Walk 1' },
    { key: 'custom_walk2', label: 'Walk 2' },
    { key: 'custom_happy', label: 'Happy' },
    { key: 'custom_sad', label: 'Sad' },
    { key: 'custom_sleep', label: 'Sleep' },
    { key: 'custom_eat', label: 'Eat' },
    { key: 'custom_dance1', label: 'Dance 1' },
    { key: 'custom_dance2', label: 'Dance 2' },
  ];
}
