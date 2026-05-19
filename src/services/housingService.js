// Housing Service - manages pet room state, furniture placement, and coins

import { getFurnitureById, getAllFurniture } from '../data/furniture';

const ROOM_STATE_KEY = 'petdesk_room_state';
const OWNED_FURNITURE_KEY = 'petdesk_owned_furniture';
const COINS_KEY = 'petdesk_coins';

function getDefaultRoomState() {
  return {
    wallpaper: 'plain-wall',
    floor: 'wood-floor',
    furniture: [
      { id: 'basic-bed', position: { x: 1, y: 3 } },
      { id: 'potted-plant', position: { x: 6, y: 1 } },
    ],
  };
}

function getDefaultOwned() {
  // Free items are owned by default
  return ['basic-bed', 'wooden-table', 'potted-plant', 'wood-floor', 'plain-wall'];
}

// === Room State ===

export function getRoomState() {
  try {
    const stored = localStorage.getItem(ROOM_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  const defaultState = getDefaultRoomState();
  saveRoomState(defaultState);
  return defaultState;
}

export function saveRoomState(state) {
  try {
    localStorage.setItem(ROOM_STATE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }
}

// === Furniture Placement ===

export function placeFurniture(furnitureId, position) {
  const state = getRoomState();
  const def = getFurnitureById(furnitureId);
  if (!def) return false;

  // Check bounds (8x6 grid)
  if (position.x < 0 || position.y < 0) return false;
  if (def.size && (position.x + def.size.w > 8 || position.y + def.size.h > 6)) return false;

  // Check overlap with existing furniture
  if (def.size && hasOverlap(state.furniture, furnitureId, position, -1)) return false;

  state.furniture.push({ id: furnitureId, position });
  saveRoomState(state);
  return true;
}

export function removeFurniture(index) {
  const state = getRoomState();
  if (index < 0 || index >= state.furniture.length) return false;
  state.furniture.splice(index, 1);
  saveRoomState(state);
  return true;
}

export function moveFurniture(index, newPosition) {
  const state = getRoomState();
  if (index < 0 || index >= state.furniture.length) return false;

  const item = state.furniture[index];
  const def = getFurnitureById(item.id);
  if (!def || !def.size) return false;

  // Check bounds
  if (newPosition.x < 0 || newPosition.y < 0) return false;
  if (newPosition.x + def.size.w > 8 || newPosition.y + def.size.h > 6) return false;

  // Check overlap (exclude self)
  if (hasOverlap(state.furniture, item.id, newPosition, index)) return false;

  state.furniture[index].position = newPosition;
  saveRoomState(state);
  return true;
}

function hasOverlap(furnitureList, newId, newPos, excludeIndex) {
  const newDef = getFurnitureById(newId);
  if (!newDef || !newDef.size) return false;

  for (let i = 0; i < furnitureList.length; i++) {
    if (i === excludeIndex) continue;
    const existing = furnitureList[i];
    const existingDef = getFurnitureById(existing.id);
    if (!existingDef || !existingDef.size) continue;

    const ax1 = newPos.x, ay1 = newPos.y;
    const ax2 = newPos.x + newDef.size.w, ay2 = newPos.y + newDef.size.h;
    const bx1 = existing.position.x, by1 = existing.position.y;
    const bx2 = existing.position.x + existingDef.size.w, by2 = existing.position.y + existingDef.size.h;

    if (ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1) {
      return true;
    }
  }
  return false;
}

// === Wallpaper & Floor ===

export function setWallpaper(id) {
  const owned = getOwnedFurniture();
  if (!owned.includes(id)) return false;
  const state = getRoomState();
  state.wallpaper = id;
  saveRoomState(state);
  return true;
}

export function setFloor(id) {
  const owned = getOwnedFurniture();
  if (!owned.includes(id)) return false;
  const state = getRoomState();
  state.floor = id;
  saveRoomState(state);
  return true;
}

// === Owned Furniture ===

export function getOwnedFurniture() {
  try {
    const stored = localStorage.getItem(OWNED_FURNITURE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  const defaults = getDefaultOwned();
  saveOwnedFurniture(defaults);
  return defaults;
}

function saveOwnedFurniture(owned) {
  try {
    localStorage.setItem(OWNED_FURNITURE_KEY, JSON.stringify(owned));
  } catch (e) { /* ignore */ }
}

export function buyFurniture(id) {
  const def = getFurnitureById(id);
  if (!def) return false;

  const owned = getOwnedFurniture();
  if (owned.includes(id)) return false; // already owned

  if (!spendCoins(def.cost)) return false; // not enough coins

  owned.push(id);
  saveOwnedFurniture(owned);
  return true;
}

// === Coins ===

export function getCoins() {
  try {
    const stored = localStorage.getItem(COINS_KEY);
    if (stored !== null) return parseInt(stored, 10) || 0;
  } catch (e) { /* ignore */ }
  return 0;
}

export function addCoins(amount) {
  if (amount <= 0) return;
  const current = getCoins();
  try {
    localStorage.setItem(COINS_KEY, String(current + amount));
  } catch (e) { /* ignore */ }
}

export function spendCoins(amount) {
  if (amount <= 0) return true;
  const current = getCoins();
  if (current < amount) return false;
  try {
    localStorage.setItem(COINS_KEY, String(current - amount));
  } catch (e) { /* ignore */ }
  return true;
}

// === Room Bonuses ===

export function getRoomBonus() {
  const state = getRoomState();
  const bonuses = { energy: 0, xp: 0, happiness: 0 };

  for (const item of state.furniture) {
    const def = getFurnitureById(item.id);
    if (!def || !def.bonus) continue;

    switch (def.bonus.type) {
      case 'energy':
        bonuses.energy += def.bonus.value;
        break;
      case 'xp':
        bonuses.xp += def.bonus.value;
        break;
      case 'happiness':
        bonuses.happiness += def.bonus.value;
        break;
    }
  }

  return bonuses;
}

// === Grid Constants ===
export const ROOM_GRID_WIDTH = 8;
export const ROOM_GRID_HEIGHT = 6;
