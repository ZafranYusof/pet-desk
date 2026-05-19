/**
 * PetDesk - Dungeon Crawler Service
 * Procedural dungeon generation, combat, loot, and progression.
 */

const DUNGEON_STATE_KEY = 'petdesk_dungeon_state';
const DUNGEON_HIGHEST_KEY = 'petdesk_dungeon_highest';

const ROOM_TYPES = {
  empty: { symbol: '·', description: 'An empty room. Nothing here.' },
  enemy: { symbol: '👾', description: 'An enemy lurks!' },
  treasure: { symbol: '💰', description: 'A treasure chest!' },
  trap: { symbol: '⚠️', description: 'A trap! Take damage.' },
  boss: { symbol: '💀', description: 'The floor boss awaits!' },
  start: { symbol: '🚪', description: 'The entrance.' },
  shop: { symbol: '🏪', description: 'A wandering merchant.' },
};

const ENEMIES_BY_FLOOR = [
  // Floor 1-3
  [
    { name: 'Pixel Bug', hp: 20, maxHp: 20, atk: 5 },
    { name: 'Data Rat', hp: 25, maxHp: 25, atk: 7 },
  ],
  // Floor 4-6
  [
    { name: 'Virus', hp: 40, maxHp: 40, atk: 12 },
    { name: 'Corrupted File', hp: 35, maxHp: 35, atk: 15 },
  ],
  // Floor 7-9
  [
    { name: 'Malware', hp: 60, maxHp: 60, atk: 20 },
    { name: 'Trojan', hp: 55, maxHp: 55, atk: 25 },
  ],
];

const BOSSES = {
  3: { name: 'Dungeon Crown Guardian', hp: 80, maxHp: 80, atk: 18, drop: 'dungeon-crown' },
  6: { name: 'Shadow Blade Wraith', hp: 120, maxHp: 120, atk: 28, drop: 'shadow-blade' },
  10: { name: 'The Firewall', hp: 150, maxHp: 150, atk: 30, drop: 'firewall-shield' },
};

const LOOT_TABLE = {
  common: { weight: 60, items: [
    { type: 'coins', amount: [10, 30] },
    { type: 'material', id: 'wood', name: 'Wood', amount: [1, 3] },
    { type: 'material', id: 'fabric', name: 'Fabric', amount: [1, 2] },
  ]},
  uncommon: { weight: 25, items: [
    { type: 'coins', amount: [30, 60] },
    { type: 'material', id: 'crystal', name: 'Crystal', amount: [1, 2] },
    { type: 'material', id: 'gold-dust', name: 'Gold Dust', amount: [1, 1] },
  ]},
  rare: { weight: 12, items: [
    { type: 'coins', amount: [60, 100] },
    { type: 'material', id: 'star-fragment', name: 'Star Fragment', amount: [1, 1] },
    { type: 'material', id: 'shadow-essence', name: 'Shadow Essence', amount: [1, 1] },
  ]},
  legendary: { weight: 3, items: [
    { type: 'coins', amount: [100, 200] },
    { type: 'material', id: 'dragon-scale', name: 'Dragon Scale', amount: [1, 1] },
    { type: 'food', id: 'golden-apple', name: 'Golden Apple', amount: [1, 1] },
  ]},
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickWeighted(table) {
  const totalWeight = Object.values(table).reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const [rarity, data] of Object.entries(table)) {
    roll -= data.weight;
    if (roll <= 0) {
      const item = data.items[Math.floor(Math.random() * data.items.length)];
      return { ...item, rarity };
    }
  }
  return { ...table.common.items[0], rarity: 'common' };
}

/**
 * Generate a 7x7 floor map.
 */
export function generateFloor(floorNumber) {
  const size = 7;
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ type: 'empty', visited: false, content: null }))
  );

  // Place start at random edge
  const edges = [];
  for (let i = 0; i < size; i++) {
    edges.push({ x: 0, y: i });
    edges.push({ x: size - 1, y: i });
    edges.push({ x: i, y: 0 });
    edges.push({ x: i, y: size - 1 });
  }
  const startPos = edges[Math.floor(Math.random() * edges.length)];
  grid[startPos.y][startPos.x] = { type: 'start', visited: true, content: null };

  // Place boss at opposite-ish position
  let bossPos = { x: size - 1 - startPos.x, y: size - 1 - startPos.y };
  // Clamp to grid
  bossPos.x = Math.max(0, Math.min(size - 1, bossPos.x));
  bossPos.y = Math.max(0, Math.min(size - 1, bossPos.y));
  if (bossPos.x === startPos.x && bossPos.y === startPos.y) {
    bossPos = { x: size - 1 - startPos.x, y: Math.floor(size / 2) };
  }
  grid[bossPos.y][bossPos.x] = { type: 'boss', visited: false, content: null };

  // Carve path from start to boss (random walk)
  const path = [];
  let cx = startPos.x, cy = startPos.y;
  const visited = new Set([`${cx},${cy}`]);
  while (cx !== bossPos.x || cy !== bossPos.y) {
    const dx = bossPos.x - cx;
    const dy = bossPos.y - cy;
    // Bias towards boss but add randomness
    let nx = cx, ny = cy;
    if (Math.random() < 0.6) {
      // Move towards boss
      if (Math.abs(dx) > Math.abs(dy)) {
        nx += dx > 0 ? 1 : -1;
      } else {
        ny += dy > 0 ? 1 : -1;
      }
    } else {
      // Random direction
      const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
      const [ddx, ddy] = dirs[Math.floor(Math.random() * dirs.length)];
      nx = cx + ddx;
      ny = cy + ddy;
    }
    // Clamp
    nx = Math.max(0, Math.min(size - 1, nx));
    ny = Math.max(0, Math.min(size - 1, ny));
    if (!visited.has(`${nx},${ny}`)) {
      path.push({ x: nx, y: ny });
      visited.add(`${nx},${ny}`);
    }
    cx = nx;
    cy = ny;
  }

  // Fill path rooms with random types
  for (const pos of path) {
    if (grid[pos.y][pos.x].type === 'start' || grid[pos.y][pos.x].type === 'boss') continue;
    const roll = Math.random() * 100;
    let type;
    if (roll < 40) type = 'empty';
    else if (roll < 70) type = 'enemy';
    else if (roll < 85) type = 'treasure';
    else if (roll < 95) type = 'trap';
    else type = 'shop';
    grid[pos.y][pos.x] = { type, visited: false, content: null };
  }

  // Fill remaining empty rooms with random types
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x].type === 'start' || grid[y][x].type === 'boss') continue;
      if (visited.has(`${x},${y}`)) continue;
      const roll = Math.random() * 100;
      let type;
      if (roll < 40) type = 'empty';
      else if (roll < 70) type = 'enemy';
      else if (roll < 85) type = 'treasure';
      else if (roll < 95) type = 'trap';
      else type = 'shop';
      grid[y][x] = { type, visited: false, content: null };
    }
  }

  return { grid, startPos, bossPos, size };
}

/**
 * Get enemy for current floor.
 */
export function getEnemyForFloor(floorNumber, isBoss = false) {
  if (isBoss) {
    // Check if this floor has a named boss
    if (BOSSES[floorNumber]) {
      return { ...BOSSES[floorNumber] };
    }
    // Generic boss for other floors
    const baseHp = 50 + floorNumber * 15;
    const baseAtk = 10 + floorNumber * 3;
    return { name: `Floor ${floorNumber} Guardian`, hp: baseHp, maxHp: baseHp, atk: baseAtk, drop: null };
  }

  const tier = floorNumber <= 3 ? 0 : floorNumber <= 6 ? 1 : 2;
  const enemies = ENEMIES_BY_FLOOR[tier];
  const template = enemies[Math.floor(Math.random() * enemies.length)];
  // Scale slightly with floor
  const scale = 1 + (floorNumber - 1) * 0.05;
  return {
    ...template,
    hp: Math.floor(template.hp * scale),
    maxHp: Math.floor(template.maxHp * scale),
    atk: Math.floor(template.atk * scale),
  };
}

/**
 * Calculate pet combat stats from pet state.
 */
export function getPetCombatStats(petState) {
  const level = petState.level || 1;
  const baseHp = 80 + level * 10;
  const baseAtk = 10 + level * 3;
  const baseDef = 3 + level;
  return { maxHp: baseHp, atk: baseAtk, def: baseDef };
}

/**
 * Simulate one round of combat.
 * Returns { playerHp, enemyHp, log, playerDmg, enemyDmg }
 */
export function combatRound(playerHp, playerStats, enemy, action) {
  const log = [];
  let newPlayerHp = playerHp;
  let newEnemyHp = enemy.hp;
  let playerDmg = 0;
  let enemyDmg = 0;

  if (action === 'attack') {
    // Player attacks
    const variance = 0.8 + Math.random() * 0.4; // 0.8-1.2x
    playerDmg = Math.max(1, Math.floor(playerStats.atk * variance));
    newEnemyHp = Math.max(0, newEnemyHp - playerDmg);
    log.push(`You deal ${playerDmg} damage!`);

    // Enemy attacks back (if alive)
    if (newEnemyHp > 0) {
      const eVariance = 0.7 + Math.random() * 0.6;
      enemyDmg = Math.max(1, Math.floor(enemy.atk * eVariance) - playerStats.def);
      newPlayerHp = Math.max(0, newPlayerHp - enemyDmg);
      log.push(`${enemy.name} deals ${enemyDmg} damage!`);
    }
  } else if (action === 'heal') {
    // Heal 30% of max HP
    const healAmount = Math.floor(playerStats.maxHp * 0.3);
    newPlayerHp = Math.min(playerStats.maxHp, newPlayerHp + healAmount);
    log.push(`You heal ${healAmount} HP!`);

    // Enemy still attacks
    const eVariance = 0.7 + Math.random() * 0.6;
    enemyDmg = Math.max(1, Math.floor(enemy.atk * eVariance) - playerStats.def);
    newPlayerHp = Math.max(0, newPlayerHp - enemyDmg);
    log.push(`${enemy.name} deals ${enemyDmg} damage!`);
  } else if (action === 'flee') {
    // 50% chance to flee
    if (Math.random() < 0.5) {
      log.push('You escaped successfully!');
      return { playerHp: newPlayerHp, enemyHp: newEnemyHp, log, fled: true, playerDmg: 0, enemyDmg: 0 };
    } else {
      log.push('Failed to escape!');
      // Enemy gets free hit
      const eVariance = 0.7 + Math.random() * 0.6;
      enemyDmg = Math.max(1, Math.floor(enemy.atk * eVariance) - playerStats.def);
      newPlayerHp = Math.max(0, newPlayerHp - enemyDmg);
      log.push(`${enemy.name} deals ${enemyDmg} damage!`);
    }
  }

  return { playerHp: newPlayerHp, enemyHp: newEnemyHp, log, fled: false, playerDmg, enemyDmg };
}

/**
 * Generate loot from treasure room.
 */
export function openTreasure() {
  const loot = pickWeighted(LOOT_TABLE);
  if (loot.amount) {
    loot.quantity = rand(loot.amount[0], loot.amount[1]);
  }
  return loot;
}

/**
 * Calculate trap damage (10-20% of max HP).
 */
export function triggerTrap(maxHp) {
  const pct = 0.1 + Math.random() * 0.1;
  return Math.floor(maxHp * pct);
}

/**
 * Start a new dungeon run.
 */
export function startDungeon(petState) {
  const stats = getPetCombatStats(petState);
  const floor = generateFloor(1);
  const state = {
    currentFloor: 1,
    currentRoom: { ...floor.startPos },
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    potions: 3,
    inventory: [],
    coins: 0,
    explored: [`${floor.startPos.x},${floor.startPos.y}`],
    map: floor,
    petStats: stats,
    inCombat: false,
    currentEnemy: null,
    combatLog: [],
    roomMessage: ROOM_TYPES.start.description,
    gameOver: false,
    victory: false,
  };
  saveDungeonState(state);
  return state;
}

/**
 * Move to an adjacent room.
 */
export function moveToRoom(state, x, y) {
  const { map } = state;
  // Check adjacency
  const dx = Math.abs(x - state.currentRoom.x);
  const dy = Math.abs(y - state.currentRoom.y);
  if (dx + dy !== 1) return state; // Must be adjacent (no diagonal)
  if (x < 0 || x >= map.size || y < 0 || y >= map.size) return state;
  if (state.inCombat || state.gameOver) return state;

  const newState = { ...state };
  newState.currentRoom = { x, y };
  newState.explored = [...state.explored, `${x},${y}`];
  
  const room = map.grid[y][x];
  room.visited = true;
  newState.roomMessage = ROOM_TYPES[room.type]?.description || '';

  switch (room.type) {
    case 'enemy': {
      const enemy = getEnemyForFloor(state.currentFloor, false);
      newState.inCombat = true;
      newState.currentEnemy = enemy;
      newState.combatLog = [`${enemy.name} appears! (HP: ${enemy.hp})`];
      break;
    }
    case 'boss': {
      const boss = getEnemyForFloor(state.currentFloor, true);
      newState.inCombat = true;
      newState.currentEnemy = boss;
      newState.combatLog = [`⚠️ BOSS: ${boss.name}! (HP: ${boss.hp})`];
      break;
    }
    case 'treasure': {
      const loot = openTreasure();
      newState.inventory = [...state.inventory, loot];
      if (loot.type === 'coins') {
        newState.coins = (state.coins || 0) + loot.quantity;
        newState.roomMessage = `Found ${loot.quantity} coins!`;
      } else {
        newState.roomMessage = `Found ${loot.name} x${loot.quantity}! (${loot.rarity})`;
      }
      // Mark room as cleared
      room.type = 'empty';
      break;
    }
    case 'trap': {
      const dmg = triggerTrap(state.maxHp);
      newState.hp = Math.max(0, state.hp - dmg);
      newState.roomMessage = `Trap! You take ${dmg} damage!`;
      room.type = 'empty';
      if (newState.hp <= 0) {
        newState.gameOver = true;
        newState.roomMessage = 'You collapsed from the trap...';
      }
      break;
    }
    case 'shop': {
      // Simple shop: buy potion for 20 coins
      newState.roomMessage = 'A merchant offers potions (20 coins each). Click Heal to buy.';
      break;
    }
    default:
      break;
  }

  saveDungeonState(newState);
  return newState;
}

/**
 * Perform combat action.
 */
export function doCombatAction(state, action) {
  if (!state.inCombat || !state.currentEnemy) return state;

  const newState = { ...state };

  if (action === 'heal' && state.potions <= 0) {
    newState.combatLog = [...state.combatLog, 'No potions left!'];
    return newState;
  }

  if (action === 'heal') {
    newState.potions = state.potions - 1;
  }

  const result = combatRound(state.hp, state.petStats, state.currentEnemy, action);
  newState.hp = result.playerHp;
  newState.combatLog = [...state.combatLog, ...result.log];

  if (result.fled) {
    newState.inCombat = false;
    newState.currentEnemy = null;
    newState.roomMessage = 'You fled the battle!';
  } else if (result.enemyHp <= 0) {
    // Enemy defeated
    const xpGain = 10 + state.currentFloor * 5;
    const coinGain = rand(5, 15) * state.currentFloor;
    newState.inCombat = false;
    newState.coins = (state.coins || 0) + coinGain;
    newState.combatLog = [...newState.combatLog, `Victory! +${coinGain} coins, +${xpGain} XP`];
    newState.currentEnemy = null;
    newState.roomMessage = `Enemy defeated! +${coinGain} coins`;

    // Check if boss was defeated
    const room = state.map.grid[state.currentRoom.y][state.currentRoom.x];
    if (room.type === 'boss') {
      // Check for boss drop
      const boss = BOSSES[state.currentFloor];
      if (boss && boss.drop) {
        newState.inventory = [...(newState.inventory || []), { type: 'accessory', id: boss.drop, name: boss.drop.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), rarity: 'legendary' }];
        newState.combatLog = [...newState.combatLog, `🎉 Boss drop: ${boss.drop.replace(/-/g, ' ')}!`];
      }

      // Floor cleared
      if (state.currentFloor >= 10) {
        newState.victory = true;
        newState.gameOver = true;
        newState.roomMessage = '🎉 You conquered the dungeon!';
      } else {
        // Advance to next floor
        const nextFloor = state.currentFloor + 1;
        const newFloorMap = generateFloor(nextFloor);
        newState.currentFloor = nextFloor;
        newState.map = newFloorMap;
        newState.currentRoom = { ...newFloorMap.startPos };
        newState.explored = [`${newFloorMap.startPos.x},${newFloorMap.startPos.y}`];
        newState.roomMessage = `Floor ${nextFloor}! The dungeon grows darker...`;
        newState.combatLog = [];
      }
    }
    // Mark room as cleared
    if (state.map.grid[state.currentRoom.y]?.[state.currentRoom.x]) {
      state.map.grid[state.currentRoom.y][state.currentRoom.x].type = 'empty';
    }
  } else {
    // Update enemy HP
    newState.currentEnemy = { ...state.currentEnemy, hp: result.enemyHp };
  }

  // Check player death
  if (newState.hp <= 0) {
    newState.gameOver = true;
    newState.inCombat = false;
    newState.roomMessage = 'You were defeated...';
  }

  saveDungeonState(newState);
  return newState;
}

/**
 * Buy potion from shop (20 coins).
 */
export function buyPotion(state) {
  if ((state.coins || 0) < 20) return { ...state, roomMessage: 'Not enough coins! (Need 20)' };
  const newState = { ...state };
  newState.coins = state.coins - 20;
  newState.potions = state.potions + 1;
  newState.roomMessage = `Bought a potion! (${newState.potions} potions, ${newState.coins} coins left)`;
  saveDungeonState(newState);
  return newState;
}

/**
 * End dungeon run and calculate rewards.
 */
export function endDungeon(state) {
  const rewards = {
    coins: state.coins || 0,
    xp: state.currentFloor * 20 + (state.victory ? 100 : 0),
    inventory: state.inventory || [],
    highestFloor: state.currentFloor,
    victory: state.victory || false,
  };

  // Update highest floor
  const prev = getHighestFloor();
  if (state.currentFloor > prev) {
    saveHighestFloor(state.currentFloor);
  }

  // Clear dungeon state
  localStorage.removeItem(DUNGEON_STATE_KEY);
  return rewards;
}

/**
 * Get highest floor reached.
 */
export function getHighestFloor() {
  try {
    return parseInt(localStorage.getItem(DUNGEON_HIGHEST_KEY) || '0', 10);
  } catch { return 0; }
}

function saveHighestFloor(floor) {
  localStorage.setItem(DUNGEON_HIGHEST_KEY, String(floor));
}

function saveDungeonState(state) {
  try {
    localStorage.setItem(DUNGEON_STATE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function loadDungeonState() {
  try {
    const stored = localStorage.getItem(DUNGEON_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

export function getRoomInfo(type) {
  return ROOM_TYPES[type] || ROOM_TYPES.empty;
}
