import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../services/soundService';

const COLS = 8;
const ROWS = 16;
const CELL_SIZE = 16;
const BOARD_WIDTH = COLS * CELL_SIZE;
const BOARD_HEIGHT = ROWS * CELL_SIZE;
const INITIAL_DROP_SPEED = 800;
const SPEED_DECREASE = 30;
const MIN_SPEED = 150;

// 4 simplified pieces: I, O, L, T
const PIECES = [
  { id: 'I', color: '#22d3ee', cells: [[0,0],[1,0],[2,0],[3,0]] },
  { id: 'O', color: '#facc15', cells: [[0,0],[1,0],[0,1],[1,1]] },
  { id: 'L', color: '#fb923c', cells: [[0,0],[0,1],[0,2],[1,2]] },
  { id: 'T', color: '#a855f7', cells: [[0,0],[1,0],[2,0],[1,1]] },
];

function rotateCells(cells) {
  // Rotate 90 degrees clockwise around center
  const maxX = Math.max(...cells.map(c => c[0]));
  const maxY = Math.max(...cells.map(c => c[1]));
  return cells.map(([x, y]) => [maxY - y, x]);
}

function getRandomPiece() {
  const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
  return {
    ...piece,
    cells: [...piece.cells],
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  };
}

function BlockStack({ onBack, onGameEnd }) {
  const [gameState, setGameState] = useState('ready'); // ready, playing, dead
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [renderTick, setRenderTick] = useState(0);

  const board = useRef(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const currentPiece = useRef(null);
  const nextPiece = useRef(null);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesClearedRef = useRef(0);
  const dropInterval = useRef(null);
  const speedRef = useRef(INITIAL_DROP_SPEED);

  function resetGame() {
    board.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    currentPiece.current = getRandomPiece();
    nextPiece.current = getRandomPiece();
    scoreRef.current = 0;
    levelRef.current = 1;
    linesClearedRef.current = 0;
    speedRef.current = INITIAL_DROP_SPEED;
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
  }

  function startGame() {
    resetGame();
    setGameState('playing');
  }

  function canPlace(cells, px, py) {
    for (const [cx, cy] of cells) {
      const nx = px + cx;
      const ny = py + cy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board.current[ny][nx] !== null) return false;
    }
    return true;
  }

  function lockPiece() {
    const piece = currentPiece.current;
    if (!piece) return;

    for (const [cx, cy] of piece.cells) {
      const nx = piece.x + cx;
      const ny = piece.y + cy;
      if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
        board.current[ny][nx] = piece.color;
      }
    }

    // Check for completed lines
    let cleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board.current[row].every((cell) => cell !== null)) {
        board.current.splice(row, 1);
        board.current.unshift(Array(COLS).fill(null));
        cleared++;
        row++; // Re-check this row
      }
    }

    if (cleared > 0) {
      const points = cleared === 4 ? 40 + 10 * cleared : 10 * cleared;
      scoreRef.current += points;
      linesClearedRef.current += cleared;
      setScore(scoreRef.current);
      setLinesCleared(linesClearedRef.current);
      playSound('pet');

      // Level up every 5 lines
      const newLevel = Math.floor(linesClearedRef.current / 5) + 1;
      if (newLevel > levelRef.current) {
        levelRef.current = newLevel;
        setLevel(newLevel);
        speedRef.current = Math.max(MIN_SPEED, INITIAL_DROP_SPEED - (newLevel - 1) * SPEED_DECREASE);
        restartDropInterval();
      }
    }

    // Next piece
    currentPiece.current = nextPiece.current;
    nextPiece.current = getRandomPiece();

    // Check game over
    if (!canPlace(currentPiece.current.cells, currentPiece.current.x, currentPiece.current.y)) {
      die();
    }
  }

  function die() {
    setGameState('dead');
    playSound('feed');
    if (dropInterval.current) clearInterval(dropInterval.current);
    const finalScore = scoreRef.current;
    setScore(finalScore);
    if (onGameEnd) onGameEnd(finalScore);
  }

  function moveDown() {
    const piece = currentPiece.current;
    if (!piece) return;

    if (canPlace(piece.cells, piece.x, piece.y + 1)) {
      piece.y += 1;
    } else {
      lockPiece();
    }
    setRenderTick((t) => t + 1);
  }

  function moveLeft() {
    const piece = currentPiece.current;
    if (!piece) return;
    if (canPlace(piece.cells, piece.x - 1, piece.y)) {
      piece.x -= 1;
      setRenderTick((t) => t + 1);
    }
  }

  function moveRight() {
    const piece = currentPiece.current;
    if (!piece) return;
    if (canPlace(piece.cells, piece.x + 1, piece.y)) {
      piece.x += 1;
      setRenderTick((t) => t + 1);
    }
  }

  function rotate() {
    const piece = currentPiece.current;
    if (!piece) return;
    const rotated = rotateCells(piece.cells);
    if (canPlace(rotated, piece.x, piece.y)) {
      piece.cells = rotated;
      setRenderTick((t) => t + 1);
    }
  }

  function hardDrop() {
    const piece = currentPiece.current;
    if (!piece) return;
    while (canPlace(piece.cells, piece.x, piece.y + 1)) {
      piece.y += 1;
    }
    lockPiece();
    setRenderTick((t) => t + 1);
  }

  function restartDropInterval() {
    if (dropInterval.current) clearInterval(dropInterval.current);
    dropInterval.current = setInterval(moveDown, speedRef.current);
  }

  // Game loop (drop interval)
  useEffect(() => {
    if (gameState !== 'playing') return;

    dropInterval.current = setInterval(moveDown, speedRef.current);
    return () => {
      if (dropInterval.current) clearInterval(dropInterval.current);
    };
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (gameState === 'ready' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        startGame();
        return;
      }
      if (gameState !== 'playing') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          rotate();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          moveDown();
          break;
        case 'Space':
          e.preventDefault();
          hardDrop();
          break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  // Render the board + current piece as a flat grid
  function getRenderBoard() {
    const display = board.current.map((row) => [...row]);
    const piece = currentPiece.current;
    if (piece && gameState === 'playing') {
      for (const [cx, cy] of piece.cells) {
        const nx = piece.x + cx;
        const ny = piece.y + cy;
        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
          display[ny][nx] = piece.color;
        }
      }
    }
    return display;
  }

  // Render next piece preview
  function renderNextPiece() {
    const piece = nextPiece.current;
    if (!piece) return null;
    const cells = piece.cells;
    const maxX = Math.max(...cells.map(c => c[0])) + 1;
    const maxY = Math.max(...cells.map(c => c[1])) + 1;

    return (
      <div className="relative" style={{ width: maxX * 10, height: maxY * 10 }}>
        {cells.map(([cx, cy], i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: cx * 10,
              top: cy * 10,
              width: 9,
              height: 9,
              background: piece.color,
            }}
          />
        ))}
      </div>
    );
  }

  const displayBoard = getRenderBoard();

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Header info */}
        <div className="flex items-center gap-4 text-white text-xs">
          <span>Score: {score}</span>
          <span>Level: {level}</span>
          <span>Lines: {linesCleared}</span>
        </div>

        <div className="flex gap-3">
          {/* Game board */}
          <div
            className="relative rounded-lg border border-gray-600/50 select-none"
            style={{
              width: BOARD_WIDTH,
              height: BOARD_HEIGHT,
              background: '#0a0a1a',
            }}
          >
            {/* Grid */}
            {displayBoard.map((row, ry) =>
              row.map((cell, cx) => (
                cell && (
                  <div
                    key={`${ry}-${cx}`}
                    className="absolute rounded-sm border border-white/10"
                    style={{
                      left: cx * CELL_SIZE,
                      top: ry * CELL_SIZE,
                      width: CELL_SIZE - 1,
                      height: CELL_SIZE - 1,
                      background: cell,
                    }}
                  />
                )
              ))
            )}

            {/* Grid lines (subtle) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5">
              {[...Array(COLS + 1)].map((_, i) => (
                <line key={`v${i}`} x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={BOARD_HEIGHT} stroke="#666" strokeWidth="0.5" />
              ))}
              {[...Array(ROWS + 1)].map((_, i) => (
                <line key={`h${i}`} x1={0} y1={i * CELL_SIZE} x2={BOARD_WIDTH} y2={i * CELL_SIZE} stroke="#666" strokeWidth="0.5" />
              ))}
            </svg>

            {/* Ready screen */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-lg">
                <div className="text-white text-lg font-bold mb-2">🧱 Block Stack</div>
                <div className="text-gray-300 text-xs mb-1">←→ Move • ↑ Rotate</div>
                <div className="text-gray-300 text-xs mb-1">↓ Soft drop • Space Hard drop</div>
                <div className="text-gray-400 text-xs">Press Space to start</div>
              </div>
            )}

            {/* Death screen */}
            {gameState === 'dead' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
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

          {/* Side panel - next piece */}
          <div className="flex flex-col gap-2">
            <div className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-1">Next</div>
              <div className="w-[44px] h-[44px] flex items-center justify-center">
                {renderNextPiece()}
              </div>
            </div>
          </div>
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

export default BlockStack;
