import React, { useState, useEffect, useRef, useCallback } from 'react';

const FOODS = ['🍎', '🍕', '🍔', '🍩', '🍪'];
const PLAY_WIDTH = 180;
const PLAY_HEIGHT = 200;
const PET_SIZE = 32;
const FOOD_SIZE = 20;
const GAME_DURATION = 30000; // 30 seconds

function CatchFood({ onGameEnd }) {
  const [petX, setPetX] = useState(PLAY_WIDTH / 2 - PET_SIZE / 2);
  const [foods, setFoods] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(true);

  const gameRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());
  const spawnTimerRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const petXRef = useRef(PLAY_WIDTH / 2 - PET_SIZE / 2);
  const foodsRef = useRef([]);
  const foodIdRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { petXRef.current = petX; }, [petX]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (!gameActive) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setPetX((prev) => {
          const next = Math.max(0, prev - 15);
          petXRef.current = next;
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setPetX((prev) => {
          const next = Math.min(PLAY_WIDTH - PET_SIZE, prev + 15);
          petXRef.current = next;
          return next;
        });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameActive]);

  // Mouse control
  const handleMouseMove = useCallback((e) => {
    if (!gameActive || !gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - PET_SIZE / 2;
    const clamped = Math.max(0, Math.min(PLAY_WIDTH - PET_SIZE, x));
    setPetX(clamped);
    petXRef.current = clamped;
  }, [gameActive]);

  // Game timer
  useEffect(() => {
    if (!gameActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameActive]);

  // End game when lives or time run out
  useEffect(() => {
    if (!gameActive) {
      const xp = scoreRef.current * 2;
      onGameEnd(scoreRef.current, Math.max(0, xp));
    }
  }, [gameActive]);

  // Main game loop
  useEffect(() => {
    if (!gameActive) return;

    const baseSpeed = 80; // px per second
    const spawnInterval = 800; // ms between spawns

    function gameLoop() {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Spawn food
      spawnTimerRef.current += dt * 1000;
      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0;
        const newFood = {
          id: foodIdRef.current++,
          emoji: FOODS[Math.floor(Math.random() * FOODS.length)],
          x: Math.random() * (PLAY_WIDTH - FOOD_SIZE),
          y: -FOOD_SIZE,
        };
        foodsRef.current = [...foodsRef.current, newFood];
      }

      // Speed increases every 10 catches
      const speedMultiplier = 1 + Math.floor(scoreRef.current / 10) * 0.3;
      const speed = baseSpeed * speedMultiplier;

      // Move foods down
      let newFoods = [];
      let scoreGain = 0;
      let livesLost = 0;

      for (const food of foodsRef.current) {
        const newY = food.y + speed * dt;

        // Check catch
        if (
          newY + FOOD_SIZE >= PLAY_HEIGHT - PET_SIZE &&
          newY <= PLAY_HEIGHT &&
          food.x + FOOD_SIZE > petXRef.current &&
          food.x < petXRef.current + PET_SIZE
        ) {
          scoreGain++;
          continue; // caught, remove
        }

        // Check miss
        if (newY > PLAY_HEIGHT) {
          livesLost++;
          continue; // missed, remove
        }

        newFoods.push({ ...food, y: newY });
      }

      foodsRef.current = newFoods;

      if (scoreGain > 0) {
        setScore((prev) => prev + scoreGain);
      }
      if (livesLost > 0) {
        setLives((prev) => {
          const next = prev - livesLost;
          if (next <= 0) {
            setGameActive(false);
            return 0;
          }
          return next;
        });
      }

      setFoods([...foodsRef.current]);
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    lastTimeRef.current = Date.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameActive]);

  return (
    <div
      ref={gameRef}
      className="w-full h-full relative cursor-crosshair select-none"
      onMouseMove={handleMouseMove}
      style={{ width: PLAY_WIDTH, height: PLAY_HEIGHT, margin: '0 auto' }}
    >
      {/* HUD */}
      <div className="absolute top-1 left-2 right-2 flex justify-between text-[10px] text-gray-400 z-10">
        <span>❤️ {lives}</span>
        <span>{timeLeft}s</span>
      </div>

      {/* Falling foods */}
      {foods.map((food) => (
        <div
          key={food.id}
          className="absolute text-sm"
          style={{
            left: food.x,
            top: food.y,
            width: FOOD_SIZE,
            height: FOOD_SIZE,
            lineHeight: `${FOOD_SIZE}px`,
            textAlign: 'center',
          }}
        >
          {food.emoji}
        </div>
      ))}

      {/* Pet catcher */}
      <div
        className="absolute bottom-1 text-xl"
        style={{
          left: petX,
          width: PET_SIZE,
          height: PET_SIZE,
          lineHeight: `${PET_SIZE}px`,
          textAlign: 'center',
        }}
      >
        🐾
      </div>
    </div>
  );
}

export default CatchFood;
