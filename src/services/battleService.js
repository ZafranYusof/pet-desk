/**
 * PetDesk - Battle Service
 * Turn-based RPG battle logic, AI behavior, damage calculations.
 */

import { getMovesForSpecies } from '../data/moves';
import { getEvolutionStage } from './evolutionService';

const OPPONENT_NAMES = ['Shadow', 'Blaze', 'Frost', 'Storm', 'Pixel', 'Byte', 'Glitch', 'Nova'];
const SPECIES_LIST = ['slime', 'cat', 'ghost'];

// Battle streak storage
const STREAK_KEY = 'petdesk_battle_streak';

function getStreak() {
  try {
    return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
  } catch { return 0; }
}

function setStreak(val) {
  localStorage.setItem(STREAK_KEY, String(val));
}

/**
 * Calculate battle stats from pet state.
 */
function calculateStats(level, evoStage) {
  const evoBonus = evoStage === 1 ? 3 : evoStage === 2 ? 6 : evoStage >= 3 ? 10 : 0;
  return {
    maxHp: 50 + (level * 5),
    hp: 50 + (level * 5),
    maxMp: 20 + (level * 2),
    mp: 20 + (level * 2),
    attack: 5 + (level * 2) + evoBonus,
    defense: 3 + level + evoBonus,
    speed: 5 + level,
  };
}

/**
 * Generate an AI opponent based on player level.
 */
export function generateOpponent(playerLevel) {
  const levelOffset = Math.floor(Math.random() * 5) - 2; // -2 to +2
  const level = Math.max(1, playerLevel + levelOffset);
  const species = SPECIES_LIST[Math.floor(Math.random() * SPECIES_LIST.length)];
  const name = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];

  const evo = getEvolutionStage(species, level);
  const stats = calculateStats(level, evo.stage);
  const moves = getMovesForSpecies(species, evo.stage);

  return {
    name,
    species,
    level,
    evoStage: evo.stage,
    stats,
    moves,
    buffs: [],
    debuffs: [],
    isDefending: false,
    isPhased: false,
    isFeared: false,
  };
}

/**
 * Start a new battle.
 */
export function startBattle(petState) {
  const species = petState.species || 'slime';
  const level = petState.level || 1;
  const evo = getEvolutionStage(species, level);
  const stats = calculateStats(level, evo.stage);
  const moves = getMovesForSpecies(species, evo.stage);

  const player = {
    name: petState.name || 'Pet',
    species,
    level,
    evoStage: evo.stage,
    stats,
    moves,
    buffs: [],
    debuffs: [],
    isDefending: false,
    isPhased: false,
    isFeared: false,
  };

  const opponent = generateOpponent(level);

  return {
    player,
    opponent,
    turn: 0,
    log: [],
    phase: 'player_turn', // player_turn, opponent_turn, battle_end
    result: null,
  };
}

/**
 * Calculate damage for an attack.
 */
function calculateDamage(attacker, move, target) {
  const attack = getEffectiveStat(attacker, 'attack');
  let defense = getEffectiveStat(target, 'defense');

  // Piercing effect ignores some defense
  if (move.effect && move.effect.type === 'piercing') {
    defense *= (1 - move.effect.defenseIgnore);
  }

  // Defending halves incoming damage
  const defendMod = target.isDefending ? 0.5 : 1.0;

  // Base damage
  let damage = (attack * move.multiplier * (0.8 + Math.random() * 0.4)) - (defense * 0.3);
  damage = Math.max(1, Math.floor(damage * defendMod));

  // Critical hit (10% chance, 1.5x)
  const isCrit = Math.random() < 0.1;
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }

  return { damage, isCrit };
}

/**
 * Get effective stat considering buffs/debuffs.
 */
function getEffectiveStat(fighter, stat) {
  let value = fighter.stats[stat];

  for (const buff of fighter.buffs) {
    if (buff.stat === stat) {
      value = Math.floor(value * buff.multiplier);
    }
  }

  for (const debuff of fighter.debuffs) {
    if (debuff.stat === stat) {
      value = Math.max(1, value - debuff.reduction);
    }
  }

  return value;
}

/**
 * Tick down buff/debuff durations.
 */
function tickBuffs(fighter) {
  fighter.buffs = fighter.buffs
    .map((b) => ({ ...b, duration: b.duration - 1 }))
    .filter((b) => b.duration > 0);

  fighter.debuffs = fighter.debuffs
    .map((d) => ({ ...d, duration: d.duration - 1 }))
    .filter((d) => d.duration > 0);

  fighter.isDefending = false;
}

/**
 * Execute the player's turn.
 * @param {object} battleState - current battle state
 * @param {string} action - 'attack', 'special', 'defend', 'flee'
 * @param {string|null} moveId - specific move ID for attack/special
 * @returns {object} updated battle state
 */
export function executePlayerTurn(battleState, action, moveId = null) {
  const state = JSON.parse(JSON.stringify(battleState));
  const { player, opponent } = state;

  // Check if player is feared (skip turn)
  if (player.isFeared) {
    state.log.push({ actor: 'player', text: `${player.name} is frozen with fear!` });
    player.isFeared = false;
    state.phase = 'opponent_turn';
    return state;
  }

  if (action === 'flee') {
    const success = Math.random() < 0.7;
    if (success) {
      state.log.push({ actor: 'system', text: 'Got away safely!' });
      state.phase = 'battle_end';
      state.result = 'flee';
      return state;
    } else {
      state.log.push({ actor: 'player', text: `${player.name} tried to flee but failed!` });
      state.phase = 'opponent_turn';
      return state;
    }
  }

  if (action === 'defend') {
    player.isDefending = true;
    player.stats.mp = Math.min(player.stats.maxMp, player.stats.mp + 5);
    state.log.push({ actor: 'player', text: `${player.name} defends! (+5 MP)` });
    state.phase = 'opponent_turn';
    return state;
  }

  // Attack or Special
  const move = player.moves.find((m) => m.id === moveId) || player.moves[0];

  // Check MP
  if (move.mpCost > player.stats.mp) {
    state.log.push({ actor: 'system', text: 'Not enough MP!' });
    return state; // Don't consume turn
  }

  // Spend MP
  player.stats.mp -= move.mpCost;

  // Miss chance (Shadow Strike)
  if (move.effect && move.effect.type === 'missChance') {
    if (Math.random() < move.effect.chance) {
      state.log.push({ actor: 'player', text: `${player.name} used ${move.name}... but missed!` });
      state.phase = 'opponent_turn';
      return state;
    }
  }

  // Phased opponent can't be hit
  if (opponent.isPhased) {
    state.log.push({ actor: 'player', text: `${player.name} used ${move.name}... but ${opponent.name} is phased!` });
    opponent.isPhased = false;
    state.phase = 'opponent_turn';
    return state;
  }

  // Handle heal moves
  if (move.effect && move.effect.type === 'heal') {
    const healAmount = Math.floor(player.stats.maxHp * move.effect.percent);
    player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + healAmount);
    state.log.push({ actor: 'player', text: `${player.name} used ${move.name}! Healed ${healAmount} HP!` });
    state.phase = 'opponent_turn';
    return state;
  }

  // Handle buff moves
  if (move.effect && move.effect.type === 'buff') {
    player.buffs.push({
      stat: move.effect.stat,
      multiplier: move.effect.multiplier,
      duration: move.effect.duration,
    });
    state.log.push({ actor: 'player', text: `${player.name} used ${move.name}! ${move.effect.stat} boosted!` });
    state.phase = 'opponent_turn';
    return state;
  }

  // Calculate and apply damage
  const { damage, isCrit } = calculateDamage(player, move, opponent);
  opponent.stats.hp = Math.max(0, opponent.stats.hp - damage);

  let logText = `${player.name} used ${move.name}! ${damage} damage!`;
  if (isCrit) logText += ' CRITICAL!';
  state.log.push({ actor: 'player', text: logText });

  // Apply move effects
  if (move.effect) {
    applyMoveEffect(move.effect, player, opponent, state, damage);
  }

  // Self damage (Nightmare)
  if (move.effect && move.effect.type === 'selfDamage') {
    const selfDmg = Math.floor(player.stats.maxHp * move.effect.percent);
    player.stats.hp = Math.max(1, player.stats.hp - selfDmg);
    state.log.push({ actor: 'system', text: `Recoil! ${player.name} took ${selfDmg} damage!` });
  }

  // Self debuff (Pounce)
  if (move.effect && move.effect.type === 'selfDebuff') {
    player.debuffs.push({
      stat: move.effect.stat,
      reduction: move.effect.reduction,
      duration: move.effect.duration,
    });
  }

  // Check if opponent fainted
  if (opponent.stats.hp <= 0) {
    state.phase = 'battle_end';
    state.result = 'win';
    return state;
  }

  state.phase = 'opponent_turn';
  return state;
}

/**
 * Apply special move effects.
 */
function applyMoveEffect(effect, attacker, target, state, damage) {
  switch (effect.type) {
    case 'slow':
      if (Math.random() < effect.chance) {
        target.debuffs.push({ stat: 'speed', reduction: effect.speedReduction, duration: effect.duration });
        state.log.push({ actor: 'system', text: `${target.name} was slowed!` });
      }
      break;
    case 'fear':
      if (Math.random() < effect.chance) {
        target.isFeared = true;
        state.log.push({ actor: 'system', text: `${target.name} is terrified!` });
      }
      break;
    case 'phase':
      attacker.isPhased = true;
      state.log.push({ actor: 'system', text: `${attacker.name} phased out!` });
      break;
    case 'lifesteal':
      const heal = Math.floor(damage * effect.percent);
      attacker.stats.hp = Math.min(attacker.stats.maxHp, attacker.stats.hp + heal);
      state.log.push({ actor: 'system', text: `${attacker.name} drained ${heal} HP!` });
      break;
  }
}

/**
 * Execute the AI's turn.
 */
export function executeAITurn(battleState) {
  const state = JSON.parse(JSON.stringify(battleState));
  const { player, opponent } = state;

  // Tick opponent buffs at start of their turn
  tickBuffs(opponent);

  // Check if AI is feared
  if (opponent.isFeared) {
    state.log.push({ actor: 'opponent', text: `${opponent.name} is frozen with fear!` });
    opponent.isFeared = false;
    state.phase = 'player_turn';
    state.turn++;
    tickBuffs(player);
    return state;
  }

  // AI decision based on HP%
  const hpPercent = opponent.stats.hp / opponent.stats.maxHp;
  const action = chooseAIAction(hpPercent, opponent);

  if (action === 'defend') {
    opponent.isDefending = true;
    opponent.stats.mp = Math.min(opponent.stats.maxMp, opponent.stats.mp + 5);
    state.log.push({ actor: 'opponent', text: `${opponent.name} defends! (+5 MP)` });
    state.phase = 'player_turn';
    state.turn++;
    tickBuffs(player);
    return state;
  }

  // Pick a move
  const move = chooseAIMove(action, opponent);

  // Check MP - fallback to basic attack
  if (move.mpCost > opponent.stats.mp) {
    const basicMove = opponent.moves.find((m) => m.mpCost === 0) || opponent.moves[0];
    return executeAIAttack(state, basicMove);
  }

  // Spend MP
  opponent.stats.mp -= move.mpCost;

  // Miss chance
  if (move.effect && move.effect.type === 'missChance') {
    if (Math.random() < move.effect.chance) {
      state.log.push({ actor: 'opponent', text: `${opponent.name} used ${move.name}... but missed!` });
      state.phase = 'player_turn';
      state.turn++;
      tickBuffs(player);
      return state;
    }
  }

  // Phased player
  if (player.isPhased) {
    state.log.push({ actor: 'opponent', text: `${opponent.name} used ${move.name}... but ${player.name} is phased!` });
    player.isPhased = false;
    state.phase = 'player_turn';
    state.turn++;
    tickBuffs(player);
    return state;
  }

  // Heal
  if (move.effect && move.effect.type === 'heal') {
    const healAmount = Math.floor(opponent.stats.maxHp * move.effect.percent);
    opponent.stats.hp = Math.min(opponent.stats.maxHp, opponent.stats.hp + healAmount);
    state.log.push({ actor: 'opponent', text: `${opponent.name} used ${move.name}! Healed ${healAmount} HP!` });
    state.phase = 'player_turn';
    state.turn++;
    tickBuffs(player);
    return state;
  }

  // Buff
  if (move.effect && move.effect.type === 'buff') {
    opponent.buffs.push({
      stat: move.effect.stat,
      multiplier: move.effect.multiplier,
      duration: move.effect.duration,
    });
    state.log.push({ actor: 'opponent', text: `${opponent.name} used ${move.name}! ${move.effect.stat} boosted!` });
    state.phase = 'player_turn';
    state.turn++;
    tickBuffs(player);
    return state;
  }

  return executeAIAttack(state, move);
}

function executeAIAttack(state, move) {
  const { player, opponent } = state;

  const { damage, isCrit } = calculateDamage(opponent, move, player);
  player.stats.hp = Math.max(0, player.stats.hp - damage);

  let logText = `${opponent.name} used ${move.name}! ${damage} damage!`;
  if (isCrit) logText += ' CRITICAL!';
  state.log.push({ actor: 'opponent', text: logText });

  // Apply effects
  if (move.effect) {
    applyMoveEffect(move.effect, opponent, player, state, damage);
  }

  // Self damage
  if (move.effect && move.effect.type === 'selfDamage') {
    const selfDmg = Math.floor(opponent.stats.maxHp * move.effect.percent);
    opponent.stats.hp = Math.max(1, opponent.stats.hp - selfDmg);
  }

  // Self debuff
  if (move.effect && move.effect.type === 'selfDebuff') {
    opponent.debuffs.push({
      stat: move.effect.stat,
      reduction: move.effect.reduction,
      duration: move.effect.duration,
    });
  }

  // Check if player fainted
  if (player.stats.hp <= 0) {
    state.phase = 'battle_end';
    state.result = 'lose';
    return state;
  }

  state.phase = 'player_turn';
  state.turn++;
  tickBuffs(player);
  return state;
}

/**
 * AI action selection based on HP%.
 */
function chooseAIAction(hpPercent, opponent) {
  const roll = Math.random();

  if (hpPercent > 0.7) {
    // Aggressive
    if (roll < 0.6) return 'attack';
    if (roll < 0.9) return 'special';
    return 'defend';
  } else if (hpPercent > 0.3) {
    // Balanced
    if (roll < 0.4) return 'attack';
    if (roll < 0.7) return 'special';
    return 'defend';
  } else {
    // Desperate
    if (roll < 0.2) return 'attack';
    if (roll < 0.7) return 'special';
    return 'defend';
  }
}

/**
 * Pick a move based on action type.
 */
function chooseAIMove(action, fighter) {
  if (action === 'attack') {
    const basics = fighter.moves.filter((m) => m.type === 'basic');
    return basics[Math.floor(Math.random() * basics.length)] || fighter.moves[0];
  }
  // Special
  const specials = fighter.moves.filter((m) => m.type === 'special' && m.mpCost <= fighter.stats.mp);
  if (specials.length > 0) {
    return specials[Math.floor(Math.random() * specials.length)];
  }
  // Fallback to basic
  const basics = fighter.moves.filter((m) => m.type === 'basic');
  return basics[Math.floor(Math.random() * basics.length)] || fighter.moves[0];
}

/**
 * Check if battle has ended.
 */
export function checkBattleEnd(playerHP, opponentHP) {
  if (opponentHP <= 0) return 'win';
  if (playerHP <= 0) return 'lose';
  return null;
}

/**
 * Get rewards for winning a battle.
 */
export function getBattleRewards(opponentLevel) {
  const xp = opponentLevel * 10;
  const streak = getStreak() + 1;
  setStreak(streak);

  const rewards = { xp, streak, food: null, accessory: null };

  // 20% chance special food
  const foodRoll = Math.random();
  if (foodRoll < 0.2) {
    rewards.food = 'golden_apple';
  } else if (foodRoll < 0.6) {
    rewards.food = 'cookie';
  }

  // Streak bonuses
  if (streak === 3) {
    rewards.accessory = 'battle_crown';
  } else if (streak === 5) {
    rewards.food = 'golden_apple';
  }

  return rewards;
}

/**
 * Apply loss penalty.
 */
export function getBattleLossPenalty() {
  setStreak(0);
  return { happinessLoss: 10 };
}

/**
 * Get current win streak.
 */
export function getWinStreak() {
  return getStreak();
}
