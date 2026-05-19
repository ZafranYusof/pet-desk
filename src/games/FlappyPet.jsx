import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../services/soundService';

const GAME_WIDTH = 250;
const GAME_HEIGHT = 350;
const PET_SIZE = 24;
const PIPE_WIDTH = 32;
const GAP_SIZE = 80;
const GRAVITY = 0.4;
const FLAP_FORCE = -6.5;
const PIPE_SPEED_BASE = 2;
const PIPE_SPACING = 160;

function FlappyPet({ onBack, onGameEnd }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, dead
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const petY = useRef(GAME_HEIGHT / 2 - PET_SIZE / 2);
  const petVelocity = useRef(0);
  const pipes = useRef([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(null);
  const gameAreaRef = useRef(null);
  const lastPipeX = useRef(GAME_WIDTH + 50);

  // Render state (force re-render via counter)
  const [renderTick, setRenderTick] = useState(0);

  const pipeSpeed = useCallback(() => {
    return PIPE_SPEED_BASE + Math.floor(scoreRef.current / 5) * 0.3;
  }, []);

  function resetGame() {
    petY.current = GAME_HEIGHT / 2 - PET_SIZE / 2;
    petVelocity.current = 0;
    pipes.current = [];
    scoreRef.current = 0;
    lastPipeX.current = GAME_WIDTH + 50;
    setScore(0);
  }

  function startGame() {
    resetGame();
    setGameState('playing');
  }

  function flap() {
    if (gameState === 'ready') {
      startGame();
      petVelocity.current = FLAP_FORCE;
      return;
    }
    if (gameState === 'dead') return;
    petVelocity.current = FLAP_FORCE;
    playSound('bounce');
  }

  function die() {
    setGameState('dead');
    playSound('feed'); // buzz-like sound
    const finalScore = scoreRef.current;
    setScore(finalScore);
    if (onGameEnd) onGameEnd(finalScore);
  }

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    function gameLoop() {
      // Update pet
      petVelocity.current += GRAVITY;
      petY.current += petVelocity.current;

      // Ceiling/floor check
      if (petY.current < 0) {
        petY.current = 0;
        petVelocity.current = 0;
      }
      if (petY.current > GAME_HEIGHT - PET_SIZE) {
        die();
        return;
      }

      // Spawn pipes
      const speed = pipeSpeed();
      if (pipes.current.length === 0 || lastPipeX.current < GAME_WIDTH - PIPE_SPACING + 50) {
        // Need a new pipe
      }
      const rightmostPipe = pipes.current.length > 0
        ? Math.max(...pipes.current.map((p) => p.x))
        : -PIPE_SPACING;

      if (rightmostPipe < GAME_WIDTH - PIPE_SPACING + 50) {
        const gapTop = 40 + Math.random() * (GAME_HEIGHT - GAP_SIZE - 80);
        pipes.current.push({
          x: GAME_WIDTH,
          gapTop,
          scored: false,
        });
      }

      // Update pipes
      for (let i = pipes.current.length - 1; i >= 0; i--) {
        pipes.current[i].x -= speed;

        // Score check
        if (!pipes.current[i].scored && pipes.current[i].x + PIPE_WIDTH < 40) {
          pipes.current[i].scored = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          playSound('pet');
        }

        // Remove off-screen pipes
        if (pipes.current[i].x < -PIPE_WIDTH) {
          pipes.current.splice(i, 1);
        }
      }

      // Collision detection
      const petLeft = 40;
      const petRight = petLeft + PET_SIZE;
      const petTop = petY.current;
      const petBottom = petTop + PET_SIZE;

      for (const pipe of pipes.current) {
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + PIPE_WIDTH;

        if (petRight > pipeLeft && petLeft < pipeRight) {
          // Check if pet is in the gap
          if (petTop < pipe.gapTop || petBottom > pipe.gapTop + GAP_SIZE) {
            die();
            return;
          }
        }
      }

      setRenderTick((t) => t + 1);
      frameRef.current = requestAnimationFrame(gameLoop);
    }

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // Pet rotation based on velocity
  const rotation = gameState === 'playing'
    ? Math.max(-30, Math.min(60, petVelocity.current * 4))
    : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Score display */}
        <div className="text-white text-sm font-bold">Score: {score}</div>

        {/* Game area */}
        <div
          ref={gameAreaRef}
          className="relative overflow-hidden rounded-xl border border-gray-600/50 cursor-pointer select-none"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
          onClick={flap}
        >
          {/* Stars background */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${(i * 17 + 5) % 100}%`,
                top: `${(i * 23 + 10) % 80}%`,
              }}
            />
          ))}

          {/* Pipes */}
          {pipes.current.map((pipe, i) => (
            <React.Fragment key={i}>
              {/* Top pipe */}
              <div
                className="absolute bg-gradient-to-b from-green-700 to-green-500 border border-green-400/50 rounded-b-md"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: PIPE_WIDTH,
                  height: pipe.gapTop,
                }}
              />
              {/* Bottom pipe */}
              <div
                className="absolute bg-gradient-to-t from-green-700 to-green-500 border border-green-400/50 rounded-t-md"
                style={{
                  left: pipe.x,
                  top: pipe.gapTop + GAP_SIZE,
                  width: PIPE_WIDTH,
                  height: GAME_HEIGHT - pipe.gapTop - GAP_SIZE,
                }}
              />
            </React.Fragment>
          ))}

          {/* Pet */}
          <div
            className="absolute"
            style={{
              left: 40,
              top: petY.current,
              width: PET_SIZE,
              height: PET_SIZE,
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 0.1s',
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 border-2 border-yellow-200 shadow-lg flex items-center justify-center">
              <div className="text-[10px]">🐾</div>
            </div>
          </div>

          {/* Ready screen */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <div className="text-white text-lg font-bold mb-2">🐦 Flappy Pet</div>
              <div className="text-gray-300 text-xs">Click or Space to start</div>
            </div>
          )}

          {/* Death screen */}
          {gameState === 'dead' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <div className="text-white text-lg font-bold mb-1">Game Over</div>
              <div className="text-yellow-300 text-sm mb-1">Score: {score}</div>
              <div className="text-gray-400 text-xs mb-3">XP earned: +{Math.floor(score / 10)}</div>
              <button
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); startGame(); }}
              >
                Play Again
              </button>
            </div>
          )}

          {/* Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-800" />
        </div>

        {/* Back button */}
        <button
          className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer transition-colors"
          onClick={onBack}
        >
          ← Back to Arcade
        </button>
      </div>
    </motion.div>
  );
}

export default FlappyPet;
