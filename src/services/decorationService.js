/**
 * PetDesk - Decoration Service
 * Manages the pet's room decoration with drag-and-drop furniture on a 6x4 grid.
 */

const DECO_ROOM_KEY = 'petdesk_deco_room';
const DECO_OWNED_KEY = 'petdesk_deco_owned';

// 6x4 grid
export const GRID_COLS = 6;
export const GRID_ROWS = 4;

export const FURNITURE_CATALOG = [
  // Beds
  { id: 'cozy-bed', name: 'Cozy Bed', emoji: '🛏️', category: 'bed', cost: 50, size: { w: 2, h: 1 }, bonus: { type: 'energy', value: 0.3 }, description: 'Faster energy regen', pixels: '🛏️' },
  { id: 'luxury-bed', name: 'Luxury Bed', emoji: '🛌', category: 'bed', cost: 150, size: { w: 2, h: 1 }, bonus: { type: 'energy', value: 0.6 }, description: 'Premium rest', pixels: '🛌' },
  // Lamps
  { id: 'desk-lamp', name: 'Desk Lamp', emoji: '💡', category: 'lamp', cost: 30, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.1 }, description: 'Warm glow', pixels: '💡' },
  { id: 'lava-lamp', name: 'Lava Lamp', emoji: '🪔', category: 'lamp', cost: 80, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.3 }, description: 'Groovy vibes', pixels: '🪔' },
  // Plants
  { id: 'small-plant', name: 'Small Plant', emoji: '🌱', category: 'plant', cost: 25, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.2 }, description: 'Fresh air', pixels: '🌱' },
  { id: 'big-plant', name: 'Big Plant', emoji: '🌿', category: 'plant', cost: 60, size: { w: 1, h: 2 }, bonus: { type: 'happiness', value: 0.4 }, description: 'Jungle vibes', pixels: '🌿' },
  { id: 'cactus', name: 'Cactus', emoji: '🌵', category: 'plant', cost: 40, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.15 }, description: 'Low maintenance', pixels: '🌵' },
  { id: 'flower-pot', name: 'Flower Pot', emoji: '🌸', category: 'plant', cost: 45, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.25 }, description: 'Pretty blooms', pixels: '🌸' },
  // Bookshelves
  { id: 'bookshelf', name: 'Bookshelf', emoji: '📚', category: 'bookshelf', cost: 100, size: { w: 1, h: 2 }, bonus: { type: 'xp', value: 0.2 }, description: 'Knowledge boost', pixels: '📚' },
  { id: 'mini-library', name: 'Mini Library', emoji: '📖', category: 'bookshelf', cost: 200, size: { w: 2, h: 2 }, bonus: { type: 'xp', value: 0.5 }, description: 'Scholar\'s dream', pixels: '📖' },
  // Rugs
  { id: 'round-rug', name: 'Round Rug', emoji: '🟤', category: 'rug', cost: 35, size: { w: 2, h: 1 }, bonus: { type: 'happiness', value: 0.1 }, description: 'Soft underfoot', pixels: '🟤' },
  { id: 'fancy-rug', name: 'Fancy Rug', emoji: '🟣', category: 'rug', cost: 90, size: { w: 2, h: 2 }, bonus: { type: 'happiness', value: 0.3 }, description: 'Royal carpet', pixels: '🟣' },
  // Posters
  { id: 'star-poster', name: 'Star Poster', emoji: '⭐', category: 'poster', cost: 20, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.1 }, description: 'Reach for the stars', pixels: '⭐' },
  { id: 'cat-poster', name: 'Cat Poster', emoji: '🐱', category: 'poster', cost: 20, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.1 }, description: 'Meow', pixels: '🐱' },
  { id: 'game-poster', name: 'Game Poster', emoji: '🎮', category: 'poster', cost: 30, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.15 }, description: 'Player one', pixels: '🎮' },
  // Clock
  { id: 'wall-clock', name: 'Wall Clock', emoji: '🕐', category: 'clock', cost: 40, size: { w: 1, h: 1 }, bonus: { type: 'xp', value: 0.1 }, description: 'Time is XP', pixels: '🕐' },
  // TV
  { id: 'small-tv', name: 'Small TV', emoji: '📺', category: 'tv', cost: 120, size: { w: 2, h: 1 }, bonus: { type: 'happiness', value: 0.4 }, description: 'Entertainment', pixels: '📺' },
  // Table
  { id: 'coffee-table', name: 'Coffee Table', emoji: '☕', category: 'table', cost: 45, size: { w: 2, h: 1 }, bonus: { type: 'energy', value: 0.1 }, description: 'Coffee break', pixels: '☕' },
  // Fish tank
  { id: 'fish-tank', name: 'Fish Tank', emoji: '🐠', category: 'decor', cost: 130, size: { w: 2, h: 1 }, bonus: { type: 'happiness', value: 0.5 }, description: 'Calming fish', pixels: '🐠' },
  // Music
  { id: 'music-box', name: 'Music Box', emoji: '🎵', category: 'decor', cost: 70, size: { w: 1, h: 1 }, bonus: { type: 'happiness', value: 0.2 }, description: 'Sweet melodies', pixels: '🎵' },
  // Trophy
  { id: 'trophy-shelf', name: 'Trophy Shelf', emoji: '🏆', category: 'decor', cost: 110, size: { w: 1, h: 1 }, bonus: { type: 'xp', value: 0.3 }, description: 'Show off wins', pixels: '🏆' },
  // Candle
  { id: 'candle-set', name: 'Candle Set', emoji: '🕯️', category: 'decor', cost: 35, size: { w: 1, h: 1 }, bonus: { type: 'energy', value: 0.15 }, description: 'Relaxing glow', pixels: '🕯️' },
  // Globe
  { id: 'globe', name: 'Globe', emoji: '🌍', category: 'decor', cost: 55, size: { w: 1, h: 1 }, bonus: { type: 'xp', value: 0.15 }, description: 'World explorer', pixels: '🌍' },
  // Crystal
  { id: 'crystal-ball', name: 'Crystal Ball', emoji: '🔮', category: 'decor', cost: 160, size: { w: 1, h: 1 }, bonus: { type: 'xp', value: 0.4 }, description: 'Mystical energy', pixels: '🔮' },
];

/**
 * Get default room layout
 */
function getDefaultRoom() {
  return {
    grid: Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null)),
    placed: [], // { id, x, y }
  };
}

/**
 * Load room state
 */
export function getDecoRoom() {
  try {
    const stored = localStorage.getItem(DECO_ROOM_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return getDefaultRoom();
}

/**
 * Save room state
 */
export function saveDecoRoom(room) {
  try {
    localStorage.setItem(DECO_ROOM_KEY, JSON.stringify(room));
  } catch (e) { /* ignore */ }
}

/**
 * Get owned decoration items
 */
export function getOwnedDecorations() {
  try {
    const stored = localStorage.getItem(DECO_OWNED_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  // Default owned items
  return ['small-plant', 'desk-lamp', 'star-poster'];
}

/**
 * Save owned decorations
 */
export function saveOwnedDecorations(owned) {
  try {
    localStorage.setItem(DECO_OWNED_KEY, JSON.stringify(owned));
  } catch (e) { /* ignore */ }
}

/**
 * Buy a decoration item
 */
export function buyDecoration(itemId, coins) {
  const item = FURNITURE_CATALOG.find(f => f.id === itemId);
  if (!item) return { success: false, reason: 'Item not found' };
  if (coins < item.cost) return { success: false, reason: 'Not enough coins' };

  const owned = getOwnedDecorations();
  if (owned.includes(itemId)) return { success: false, reason: 'Already owned' };

  owned.push(itemId);
  saveOwnedDecorations(owned);
  return { success: true, cost: item.cost };
}

/**
 * Check if furniture fits at position
 */
export function canPlace(room, itemId, x, y, excludeIndex = -1) {
  const item = FURNITURE_CATALOG.find(f => f.id === itemId);
  if (!item) return false;

  const { w, h } = item.size;
  if (x < 0 || y < 0 || x + w > GRID_COLS || y + h > GRID_ROWS) return false;

  // Check overlap with existing placed items
  for (let i = 0; i < room.placed.length; i++) {
    if (i === excludeIndex) continue;
    const placed = room.placed[i];
    const placedItem = FURNITURE_CATALOG.find(f => f.id === placed.id);
    if (!placedItem) continue;

    const pw = placedItem.size.w, ph = placedItem.size.h;
    // AABB overlap check
    if (x < placed.x + pw && x + w > placed.x && y < placed.y + ph && y + h > placed.y) {
      return false;
    }
  }

  return true;
}

/**
 * Place furniture in room
 */
export function placeDecoration(itemId, x, y) {
  const room = getDecoRoom();
  if (!canPlace(room, itemId, x, y)) return false;

  room.placed.push({ id: itemId, x, y });
  saveDecoRoom(room);
  return true;
}

/**
 * Remove furniture from room
 */
export function removeDecoration(index) {
  const room = getDecoRoom();
  if (index < 0 || index >= room.placed.length) return false;
  room.placed.splice(index, 1);
  saveDecoRoom(room);
  return true;
}

/**
 * Move furniture to new position
 */
export function moveDecoration(index, newX, newY) {
  const room = getDecoRoom();
  if (index < 0 || index >= room.placed.length) return false;

  const item = room.placed[index];
  if (!canPlace(room, item.id, newX, newY, index)) return false;

  room.placed[index].x = newX;
  room.placed[index].y = newY;
  saveDecoRoom(room);
  return true;
}

/**
 * Get passive bonuses from all placed decorations
 */
export function getDecorationBonuses() {
  const room = getDecoRoom();
  const bonuses = { energy: 0, happiness: 0, xp: 0 };

  for (const placed of room.placed) {
    const item = FURNITURE_CATALOG.find(f => f.id === placed.id);
    if (!item || !item.bonus) continue;
    if (bonuses[item.bonus.type] !== undefined) {
      bonuses[item.bonus.type] += item.bonus.value;
    }
  }

  return bonuses;
}

/**
 * Get furniture item by ID
 */
export function getDecoFurnitureById(id) {
  return FURNITURE_CATALOG.find(f => f.id === id) || null;
}
