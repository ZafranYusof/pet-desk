import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../services/soundService';

const GRID_SIZE = 15;
const CELL_SIZE = 16;
const BOARD_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 200;
const MIN_SPEED = 80;
const SPEED_DECREASE = 5;
const FOOD_EMOJIS = ['🍎', '🍕', '🍣', '⭐'];

function getRandomPos(snake) {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function SnakeGame({ onBack, onGameEnd }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, dead
  const [score, setScore] = useState(0);
  const [renderTick, setRenderTick] = useState(0);

  const snake = useRef([{ x: 7, y: 7 }]);
  const direction = useRef({ x: 1, y: 0 });
  const nextDirection = useRef({ x: 1, y: 0 });
  const food = useRef({ x: 12, y: 7, emoji: '🍎' });
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const foodEaten = useRef(0);
  const intervalRef = useRef(null);

  function resetGame() {
    snake.current = [{ x: 7, y: 7 }];
    direction.current = { x: 1, y: 0 };
    nextDirection.current = { x: 1, y: 0 };
    food.current = { x: 12, y: 7, emoji: FOOD_EMOJIS[0] };
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    foodEaten.current = 0;
    setScore(0);
  }

  function startGame() {
    resetGame();
    setGameState('playing');
  }

  function die() {
    setGameState('dead');
    playSound('feed');
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finalScore = scoreRef.current;
    setScore(finalScore);
    if (onGameEnd) onGameEnd(finalScore);
  }

  // Game tick
  const gameTick = useCallback(() => {
    direction.current = { ...nextDirection.current };
    const head = snake.current[0];
    const newHead = {
      x: head.x + direction.current.x,
      y: head.y + direction.current.y,
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      die();
      return;
    }

    // Self collision
    if (snake.current.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      die();
      return;
    }

    snake.current = [newHead, ...snake.current];

    // Food check
    if (newHead.x === food.current.x && newHead.y === food.current.y) {
      foodEaten.current += 1;
      scoreRef.current += 10;
      setScore(scoreRef.current);
      playSound('pet');

      // New food
      food.current = {
        ...getRandomPos(snake.current),
        emoji: FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)],
      };

      // Speed up every 3 food
      if (foodEaten.current % 3 === 0) {
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_DECREASE);
        // Restart interval with new speed
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(gameTick, speedRef.current);
      }
    } else {
      // Remove tail
      snake.current.pop();
    }

    setRenderTick((t) => t + 1);
  }, []);

  // Start/stop game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    intervalRef.current = setInterval(gameTick, speedRef.current);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, gameTick]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (gameState === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (gameState !== 'playing') return;

      const dir = direction.current;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          if (dir.y !== 1) nextDirection.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          if (dir.y !== -1) nextDirection.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          if (dir.x !== 1) nextDirection.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          if (dir.x !== -1) nextDirection.current = { x: 1, y: 0 };
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Score */}
        <div className="text-white text-sm font-bold">Score: {score}</div>

        {/* Game board */}
        <div
          className="relative rounded-xl border border-gray-600/50 select-none"
          style={{
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            background: '#0a0a1a',
          }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
            {[...Array(GRID_SIZE + 1)].map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={BOARD_SIZE} stroke="#444" strokeWidth="0.5" />
                <line x1={0} y1={i * CELL_SIZE} x2={BOARD_SIZE} y2={i * CELL_SIZE} stroke="#444" strokeWidth="0.5" />
              </React.Fragment>
            ))}
          </svg>

          {/* Snake */}
          {snake.current.map((seg, i) => (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                left: seg.x * CELL_SIZE,
                top: seg.y * CELL_SIZE,
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
                background: i === 0
                  ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                  : `rgba(74, 222, 128, ${1 - i * 0.03})`,
                border: i === 0 ? '1px solid #86efac' : 'none',
              }}
            />
          ))}

          {/* Food */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: food.current.x * CELL_SIZE,
              top: food.current.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              fontSize: '12px',
            }}
          >
            {food.current.emoji}
          </div>

          {/* Ready screen */}
          {gameState === 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-xl">
              <div className="text-white text-lg font-bold mb-2">🐍 Snake</div>
              <div className="text-gray-300 text-xs mb-1">Arrow keys or WASD</div>
              <div className="text-gray-400 text-xs">Press Space to start</div>
            </div>
          )}

          {/* Death screen */}
          {gameState === 'dead' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
              <div className="text-white text-lg font-bold mb-1">Game Over</div>
              <div className="text-yellow-300 text-sm mb-1">Score: {score}</div>
              <div className="text-gray-400 text-xs mb-3">XP earned: +{Math.floor(score / 10)}</div>
              <button
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
                onClick={startGame}
              >
                Play Again
              </button>
            </div>
          )}
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

export default SnakeGame;
