import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PetSprite from './PetSprite';
import BattleResult from './BattleResult';
import { startBattle, executePlayerTurn, executeAITurn, getBattleRewards, getBattleLossPenalty, getWinStreak } from '../services/battleService';
import { getEvolutionStage } from '../services/evolutionService';
import sprites from '../data/sprites';
import evolvedSprites from '../data/evolvedSprites';

// Sound effects via Web Audio API
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playHitSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function playSpecialSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function playDefendSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

function playVictorySound() {
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch {}
}

function playDefeatSound() {
  try {
    const ctx = getAudioCtx();
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  } catch {}
}

// Get sprite data for a species/level
function getSpriteData(species, level) {
  const evo = getEvolutionStage(species, level);
  const key = `${evo.spritePrefix}_idle`;
  return evolvedSprites[key] || sprites[key] || sprites[`${species}_idle`] || sprites.slime_idle;
}

// HP bar color
function getHpColor(percent) {
  if (percent > 0.5) return '#4ade80';
  if (percent > 0.25) return '#fbbf24';
  return '#ef4444';
}

function BattleArena({ petState, onClose, onBattleEnd }) {
  const [battleState, setBattleState] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showSpecialMenu, setShowSpecialMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerShake, setPlayerShake] = useState(false);
  const [opponentShake, setOpponentShake] = useState(false);
  const [playerGlow, setPlayerGlow] = useState(false);
  const [opponentGlow, setOpponentGlow] = useState(false);
  const [playerSlide, setPlayerSlide] = useState(false);
  const [opponentSlide, setOpponentSlide] = useState(false);
  const [shieldEffect, setShieldEffect] = useState(null); // 'player' | 'opponent'
  const logEndRef = useRef(null);

  // Initialize battle
  useEffect(() => {
    const state = startBattle(petState);
    state.log.push({ actor: 'system', text: `A wild ${state.opponent.name} appeared!` });
    setBattleState(state);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [battleState?.log?.length]);

  // Execute AI turn after player
  useEffect(() => {
    if (!battleState || battleState.phase !== 'opponent_turn' || battleState.result) return;

    const timer = setTimeout(() => {
      setIsAnimating(true);
      const prevPlayerHp = battleState.player.stats.hp;
      const newState = executeAITurn(battleState);

      // Determine what animation to play
      const lastLog = newState.log[newState.log.length - 1];
      if (lastLog && lastLog.actor === 'opponent') {
        if (lastLog.text.includes('defends')) {
          playDefendSound();
          setShieldEffect('opponent');
          setTimeout(() => setShieldEffect(null), 600);
        } else if (newState.player.stats.hp < prevPlayerHp) {
          // Player took damage
          const wasSpecial = lastLog.text.includes('Soul Drain') || lastLog.text.includes('Nightmare') || lastLog.text.includes('Acid') || lastLog.text.includes('Shadow') || lastLog.text.includes('Nine Lives');
          if (wasSpecial) {
            playSpecialSound();
            setOpponentGlow(true);
            setTimeout(() => setOpponentGlow(false), 400);
          } else {
            playHitSound();
            setOpponentSlide(true);
            setTimeout(() => setOpponentSlide(false), 300);
          }
          setTimeout(() => {
            setPlayerShake(true);
            setTimeout(() => setPlayerShake(false), 300);
          }, 200);
        }
      }

      setTimeout(() => {
        setBattleState(newState);
        setIsAnimating(false);

        if (newState.result) {
          setTimeout(() => {
            if (newState.result === 'win') playVictorySound();
            else if (newState.result === 'lose') playDefeatSound();
            setShowResult(true);
          }, 500);
        }
      }, 600);
    }, 1000);

    return () => clearTimeout(timer);
  }, [battleState?.phase]);

  const handlePlayerAction = useCallback((action, moveId = null) => {
    if (!battleState || isAnimating || battleState.phase !== 'player_turn') return;

    setIsAnimating(true);
    setShowSpecialMenu(false);

    const prevOpponentHp = battleState.opponent.stats.hp;
    const newState = executePlayerTurn(battleState, action, moveId);

    // Not enough MP - don't animate
    if (newState.phase === battleState.phase && newState.log.length === battleState.log.length + 1) {
      const lastLog = newState.log[newState.log.length - 1];
      if (lastLog && lastLog.text.includes('Not enough MP')) {
        setBattleState(newState);
        setIsAnimating(false);
        return;
      }
    }

    // Animations based on action
    if (action === 'defend') {
      playDefendSound();
      setShieldEffect('player');
      setTimeout(() => setShieldEffect(null), 600);
    } else if (action === 'flee') {
      // No special animation
    } else if (action === 'attack' || action === 'special') {
      if (newState.opponent.stats.hp < prevOpponentHp) {
        if (action === 'special') {
          playSpecialSound();
          setPlayerGlow(true);
          setTimeout(() => setPlayerGlow(false), 400);
        } else {
          playHitSound();
          setPlayerSlide(true);
          setTimeout(() => setPlayerSlide(false), 300);
        }
        setTimeout(() => {
          setOpponentShake(true);
          setTimeout(() => setOpponentShake(false), 300);
        }, 200);
      } else {
        // Missed or healed
        if (action === 'special') {
          playSpecialSound();
          setPlayerGlow(true);
          setTimeout(() => setPlayerGlow(false), 400);
        }
      }
    }

    setTimeout(() => {
      setBattleState(newState);
      setIsAnimating(false);

      if (newState.result) {
        setTimeout(() => {
          if (newState.result === 'win') playVictorySound();
          else if (newState.result === 'lose') playDefeatSound();
          setShowResult(true);
        }, 500);
      }
    }, 500);
  }, [battleState, isAnimating]);

  const onBattleEndRef = useRef(onBattleEnd);
  onBattleEndRef.current = onBattleEnd;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleBattleEnd = useCallback((action) => {
    if (!battleState) return;

    if (action === 'again') {
      setShowResult(false);
      const newState = startBattle(petState);
      newState.log.push({ actor: 'system', text: `A wild ${newState.opponent.name} appeared!` });
      setBattleState(newState);
    } else {
      onBattleEndRef.current(battleState.result, battleState.opponent?.level);
      onCloseRef.current();
    }
  }, [battleState, petState]);

  if (!battleState) return null;

  const { player, opponent } = battleState;
  const playerHpPercent = player.stats.hp / player.stats.maxHp;
  const opponentHpPercent = opponent.stats.hp / opponent.stats.maxHp;
  const playerMpPercent = player.stats.mp / player.stats.maxMp;
  const opponentMpPercent = opponent.stats.mp / opponent.stats.maxMp;

  const playerSprite = getSpriteData(player.species, player.level);
  const opponentSprite = getSpriteData(opponent.species, opponent.level);

  const specialMoves = player.moves.filter((m) => m.type === 'special');

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Battle container */}
      <motion.div
        className="relative w-[480px] h-[600px] bg-gray-900/95 rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Opponent section */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{opponent.name}</span>
              <span className="text-gray-400 text-xs">Lv.{opponent.level}</span>
              <span className="text-gray-500 text-xs capitalize">({opponent.species})</span>
            </div>
          </div>
          {/* HP bar */}
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-1">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getHpColor(opponentHpPercent) }}
              animate={{ width: `${opponentHpPercent * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>HP {opponent.stats.hp}/{opponent.stats.maxHp}</span>
          </div>
          {/* MP bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              animate={{ width: `${opponentMpPercent * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-[10px] text-gray-500">MP {opponent.stats.mp}/{opponent.stats.maxMp}</div>
        </div>

        {/* Battle field */}
        <div className="flex-1 relative flex flex-col items-center justify-center gap-6">
          {/* Turn indicator */}
          {battleState.phase === 'opponent_turn' && !battleState.result && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-yellow-400 animate-pulse">
              Enemy turn...
            </div>
          )}

          {/* Opponent sprite */}
          <motion.div
            className="relative"
            animate={{
              x: opponentSlide ? -20 : 0,
              filter: opponentGlow ? 'brightness(2) drop-shadow(0 0 10px #a78bfa)' : 'none',
            }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              animate={opponentShake ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
              style={{ transform: 'scaleX(-1)' }}
            >
              <PetSprite sprite={opponentSprite} scale={0.8} />
            </motion.div>
            {/* Shield effect */}
            <AnimatePresence>
              {shieldEffect === 'opponent' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <span className="text-3xl">🛡️</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Player sprite */}
          <motion.div
            className="relative"
            animate={{
              x: playerSlide ? 20 : 0,
              filter: playerGlow ? 'brightness(2) drop-shadow(0 0 10px #60a5fa)' : 'none',
            }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              animate={playerShake ? { x: [0, -5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              <PetSprite sprite={playerSprite} scale={0.8} />
            </motion.div>
            {/* Shield effect */}
            <AnimatePresence>
              {shieldEffect === 'player' && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <span className="text-3xl">🛡️</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Player stats */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{player.name}</span>
              <span className="text-gray-400 text-xs">Lv.{player.level}</span>
            </div>
          </div>
          {/* HP bar */}
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-1">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getHpColor(playerHpPercent) }}
              animate={{ width: `${playerHpPercent * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>HP {player.stats.hp}/{player.stats.maxHp}</span>
          </div>
          {/* MP bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-blue-500"
              animate={{ width: `${playerMpPercent * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div className="text-[10px] text-gray-500">MP {player.stats.mp}/{player.stats.maxMp}</div>
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-3">
          <AnimatePresence mode="wait">
            {showSpecialMenu ? (
              <motion.div
                key="special-menu"
                className="grid grid-cols-2 gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <button
                  className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  onClick={() => setShowSpecialMenu(false)}
                >
                  ← Back
                </button>
                {specialMoves.map((move) => (
                  <button
                    key={move.id}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      move.mpCost > player.stats.mp
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-purple-900/60 hover:bg-purple-800/80 text-purple-200'
                    }`}
                    disabled={move.mpCost > player.stats.mp || isAnimating || battleState.phase !== 'player_turn'}
                    onClick={() => handlePlayerAction('special', move.id)}
                    title={move.description}
                  >
                    <div className="font-medium">{move.name}</div>
                    <div className="text-[10px] opacity-70">{move.mpCost} MP</div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="main-menu"
                className="grid grid-cols-2 gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <button
                  className="px-4 py-3 bg-red-900/60 hover:bg-red-800/80 text-red-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isAnimating || battleState.phase !== 'player_turn'}
                  onClick={() => handlePlayerAction('attack', player.moves.find(m => m.type === 'basic')?.id)}
                >
                  ⚔️ Attack
                </button>
                <button
                  className="px-4 py-3 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isAnimating || battleState.phase !== 'player_turn'}
                  onClick={() => setShowSpecialMenu(true)}
                >
                  ✨ Special
                </button>
                <button
                  className="px-4 py-3 bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isAnimating || battleState.phase !== 'player_turn'}
                  onClick={() => handlePlayerAction('defend')}
                >
                  🛡️ Defend
                </button>
                <button
                  className="px-4 py-3 bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 rounded-lg font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={isAnimating || battleState.phase !== 'player_turn'}
                  onClick={() => handlePlayerAction('flee')}
                >
                  🏃 Flee
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Battle log */}
        <div className="px-4 pb-4">
          <div className="h-[60px] overflow-y-auto bg-gray-800/50 rounded-lg p-2 text-[11px] space-y-0.5 scrollbar-thin">
            {battleState.log.slice(-5).map((entry, i) => (
              <div
                key={i}
                className={`${
                  entry.actor === 'player' ? 'text-green-300' :
                  entry.actor === 'opponent' ? 'text-red-300' :
                  'text-gray-400'
                }`}
              >
                {entry.text}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </motion.div>

      {/* Battle Result overlay */}
      <AnimatePresence>
        {showResult && (
          <BattleResult
            result={battleState.result}
            opponent={battleState.opponent}
            playerLevel={player.level}
            onAction={handleBattleEnd}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BattleArena;
