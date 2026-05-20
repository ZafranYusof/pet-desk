import React, { useState, useEffect, useRef, useCallback } from 'react';

const TOTAL_TARGETS = 20;
const PLAY_WIDTH = 170;
const PLAY_HEIGHT = 180;
const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899'];

function QuickTap({ onGameEnd }) {
  const [target, setTarget] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targetsShown, setTargetsShown] = useState(0);
  const [gameActive, setGameActive] = useState(true);

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const targetsShownRef = useRef(0);
  const timeoutRef = useRef(null);
  const gameActiveRef = useRef(true);
  const onGameEndRef = useRef(onGameEnd);
  onGameEndRef.current = onGameEnd;

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { targetsShownRef.current = targetsShown; }, [targetsShown]);
  useEffect(() => { gameActiveRef.current = gameActive; }, [gameActive]);

  const endGame = useCallback(() => {
    setGameActive(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const xp = scoreRef.current * 3;
    onGameEndRef.current(scoreRef.current, Math.max(0, xp));
  }, []);

  const getTimeout = useCallback(() => {
    // Starts at 1500ms, decreases by 50ms per hit, min 600ms
    return Math.max(600, 1500 - scoreRef.current * 50);
  }, []);

  const getSize = useCallback(() => {
    // Starts at 30px, decreases by 1px per hit, min 18px
    return Math.max(18, 30 - scoreRef.current);
  }, []);

  const spawnTarget = useCallback(() => {
    if (!gameActiveRef.current) return;

    if (targetsShownRef.current >= TOTAL_TARGETS) {
      endGame();
      return;
    }

    const size = getSize();
    const x = Math.random() * (PLAY_WIDTH - size);
    const y = Math.random() * (PLAY_HEIGHT - size - 20) + 10; // padding from edges
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    setTarget({ x, y, size, color, id: Date.now() });
    setTargetsShown((prev) => prev + 1);

    // Set timeout for miss
    const timeout = getTimeout();
    timeoutRef.current = setTimeout(() => {
      if (!gameActiveRef.current) return;
      // Missed
      setTarget(null);
      setLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          endGame();
          return 0;
        }
        return next;
      });
      // Spawn next after short delay
      setTimeout(() => spawnTarget(), 300);
    }, timeout);
  }, [endGame, getTimeout, getSize]);

  // Start game
  useEffect(() => {
    const startDelay = setTimeout(() => spawnTarget(), 500);
    return () => {
      clearTimeout(startDelay);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleTargetClick = useCallback(() => {
    if (!gameActive || !target) return;

    // Clear miss timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setScore((prev) => prev + 1);
    setTarget(null);

    // Spawn next after short delay
    setTimeout(() => spawnTarget(), 200);
  }, [gameActive, target, spawnTarget]);

  return (
    <div
      className="w-full h-full relative select-none"
      style={{ width: PLAY_WIDTH, height: PLAY_HEIGHT, margin: '0 auto' }}
    >
      {/* HUD */}
      <div className="absolute top-1 left-2 right-2 flex justify-between text-[10px] text-gray-400 z-10">
        <span>❤️ {lives}</span>
        <span>🎯 {score}/{TOTAL_TARGETS}</span>
      </div>

      {/* Target */}
      {target && (
        <button
          key={target.id}
          onClick={handleTargetClick}
          className="absolute rounded-full cursor-pointer transition-transform active:scale-75"
          style={{
            left: target.x,
            top: target.y,
            width: target.size,
            height: target.size,
            backgroundColor: target.color,
            boxShadow: `0 0 8px ${target.color}60`,
          }}
        />
      )}

      {/* Waiting state */}
      {!target && gameActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-gray-500">...</span>
        </div>
      )}
    </div>
  );
}

export default QuickTap;
