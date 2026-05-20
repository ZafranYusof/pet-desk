import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../services/soundService';

const GAME_WIDTH = 250;
const GAME_HEIGHT = 350;
const GROUND_Y = 300;
const PET_SIZE = 24;
const PET_X = 50;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_GAP = 180;
const SPEED_BASE = 4;
const SPEED_INCREMENT = 0.002;

function PetRacing({ onBack, onGameEnd }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, dead
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const petY = useRef(GROUND_Y - PET_SIZE);
  const petVelocity = useRef(0);
  const isJumping = useRef(false);
  const obstacles = useRef([]);
  const distance = useRef(0);
  const frameRef = useRef(null);
  const scoreRef = useRef(0);
  const speedRef = useRef(SPEED_BASE);
  const [renderTick, setRenderTick] = useState(0);

  function resetGame() {
    petY.current = GROUND_Y - PET_SIZE;
    petVelocity.current = 0;
    isJumping.current = false;
    obstacles.current = [];
    distance.current = 0;
    scoreRef.current = 0;
    speedRef.current = SPEED_BASE;
    setScore(0);
  }

  function startGame() {
    resetGame();
    setGameState('playing');
  }

  const jump = useCallback(() => {
    if (gameState === 'ready') {
      startGame();
      return;
    }
    if (gameState !== 'playing') return;

    // Allow jump only when on ground
    if (petY.current >= GROUND_Y - PET_SIZE - 2) {
      petVelocity.current = JUMP_FORCE;
      isJumping.current = true;
      playSound('bounce');
    }
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    function gameLoop() {
      // Update pet physics
      petVelocity.current += GRAVITY;
      petY.current += petVelocity.current;

      // Ground collision
      if (petY.current >= GROUND_Y - PET_SIZE) {
        petY.current = GROUND_Y - PET_SIZE;
        petVelocity.current = 0;
        isJumping.current = false;
      }

      // Update speed
      speedRef.current = SPEED_BASE + distance.current * SPEED_INCREMENT;

      // Update distance/score
      distance.current += speedRef.current;
      const newScore = Math.floor(distance.current / 10);
      if (newScore !== scoreRef.current) {
        scoreRef.current = newScore;
        setScore(newScore);
      }

      // Spawn obstacles
      const lastObs = obstacles.current[obstacles.current.length - 1];
      const spawnX = lastObs ? lastObs.x : GAME_WIDTH;
      if (!lastObs || spawnX < GAME_WIDTH - OBSTACLE_GAP) {
        const height = 20 + Math.random() * 40;
        const type = Math.random() > 0.3 ? 'ground' : 'air';
        obstacles.current.push({
          x: GAME_WIDTH + 20,
          height,
          type,
          y: type === 'ground' ? GROUND_Y - height : GROUND_Y - PET_SIZE - 20 - Math.random() * 30,
          passed: false,
        });
      }

      // Update obstacles
      obstacles.current = obstacles.current
        .map(obs => ({ ...obs, x: obs.x - speedRef.current }))
        .filter(obs => obs.x > -OBSTACLE_WIDTH - 10);

      // Collision detection
      for (const obs of obstacles.current) {
        const petLeft = PET_X;
        const petRight = PET_X + PET_SIZE;
        const petTop = petY.current;
        const petBottom = petY.current + PET_SIZE;

        const obsLeft = obs.x;
        const obsRight = obs.x + OBSTACLE_WIDTH;
        const obsTop = obs.type === 'ground' ? obs.y : obs.y;
        const obsBottom = obs.type === 'ground' ? GROUND_Y : obs.y + 16;

        if (petRight > obsLeft + 4 && petLeft < obsRight - 4 &&
            petBottom > obsTop + 4 && petTop < obsBottom - 4) {
          // Hit!
          setGameState('dead');
          if (scoreRef.current > highScore) setHighScore(scoreRef.current);
          if (onGameEnd) onGameEnd(scoreRef.current);
          return;
        }
      }

      setRenderTick(t => t + 1);
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gameState, highScore]);

  // Input handlers
  useEffect(() => {
    function handleKey(e) {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jump]);

  function restart() {
    resetGame();
    setGameState('playing');
  }

  // Render ground decorations
  const groundOffset = -(distance.current % 40);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={jump}
    >
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button className="text-gray-400 hover:text-white text-sm cursor-pointer" onClick={onBack}>← Back</button>
          <span className="text-white text-sm font-bold">🏃 Pet Racing</span>
          <span className="text-xs text-gray-400">HI: {highScore}</span>
        </div>

        {/* Game area */}
        <div
          className="relative overflow-hidden border border-gray-600/30 rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 cursor-pointer"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onClick={jump}
        >
          {/* Score */}
          <div className="absolute top-2 right-3 text-white text-sm font-bold font-mono z-10">
            {score}
          </div>

          {/* Speed indicator */}
          <div className="absolute top-2 left-3 text-xs text-gray-500 z-10">
            {speedRef.current.toFixed(1)}x
          </div>

          {/* Ground */}
          <div className="absolute left-0 right-0 bg-gray-600/50" style={{ top: GROUND_Y, height: 2 }} />

          {/* Ground texture */}
          <div className="absolute left-0 right-0 flex" style={{ top: GROUND_Y + 4 }}>
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="text-[8px] text-gray-600"
                style={{ position: 'absolute', left: groundOffset + i * 40 }}
              >
                ···
              </div>
            ))}
          </div>

          {/* Pet */}
          <div
            className="absolute transition-none"
            style={{
              left: PET_X,
              top: petY.current,
              width: PET_SIZE,
              height: PET_SIZE,
            }}
          >
            <div className="w-full h-full bg-green-400 rounded-md border-2 border-green-300 flex items-center justify-center text-[10px]">
              {isJumping.current ? '🦘' : '🏃'}
            </div>
          </div>

          {/* Obstacles */}
          {obstacles.current.map((obs, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: obs.x,
                top: obs.type === 'ground' ? obs.y : obs.y,
                width: OBSTACLE_WIDTH,
                height: obs.type === 'ground' ? obs.height : 16,
              }}
            >
              <div className={`w-full h-full rounded-sm ${obs.type === 'ground' ? 'bg-red-500/80 border border-red-400/50' : 'bg-yellow-500/80 border border-yellow-400/50'}`} />
            </div>
          ))}

          {/* Ready screen */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-lg font-bold mb-2">🏃 Pet Racing</div>
                <div className="text-gray-400 text-xs mb-3">Tap or press Space to jump!</div>
                <div className="text-gray-500 text-xs animate-pulse">Click to start</div>
              </div>
            </div>
          )}

          {/* Game over */}
          {gameState === 'dead' && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white text-lg font-bold mb-1">Game Over!</div>
                <div className="text-gray-400 text-sm mb-3">Distance: {score}m</div>
                <div className="flex gap-2 justify-center">
                  <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer" onClick={restart}>Retry</button>
                  <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer" onClick={onBack}>Back</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="text-[10px] text-gray-600 text-center mt-2">
          Space / Click to jump • Avoid obstacles!
        </div>
      </div>
    </motion.div>
  );
}

export default PetRacing;
