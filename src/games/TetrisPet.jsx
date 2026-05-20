import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../services/soundService';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 14;
const TICK_BASE = 800;

const PIECES = [
  { shape: [[1,1,1,1]], color: '#00f0f0' },           // I
  { shape: [[1,1],[1,1]], color: '#f0f000' },          // O
  { shape: [[0,1,0],[1,1,1]], color: '#a000f0' },      // T
  { shape: [[1,0,0],[1,1,1]], color: '#0000f0' },      // J
  { shape: [[0,0,1],[1,1,1]], color: '#f0a000' },      // L
  { shape: [[0,1,1],[1,1,0]], color: '#00f000' },      // S
  { shape: [[1,1,0],[0,1,1]], color: '#f00000' },      // Z
];

function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

function randomPiece() {
  const idx = Math.floor(Math.random() * PIECES.length);
  return { ...PIECES[idx], x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
}

function rotatePiece(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = [];
  for (let c = 0; c < cols; c++) {
    const newRow = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(shape[r][c]);
    }
    rotated.push(newRow);
  }
  return rotated;
}

function collides(board, shape, px, py) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = px + c;
      const ny = py + r;
      if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function placePiece(board, piece) {
  const newBoard = board.map(row => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const ny = piece.y + r;
      const nx = piece.x + c;
      if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
        newBoard[ny][nx] = piece.color;
      }
    }
  }
  return newBoard;
}

function clearLines(board) {
  let cleared = 0;
  const newBoard = board.filter(row => {
    if (row.every(cell => cell !== null)) {
      cleared++;
      return false;
    }
    return true;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { board: newBoard, cleared };
}

function TetrisPet({ onBack, onGameEnd }) {
  const [board, setBoard] = useState(createBoard);
  const [piece, setPiece] = useState(randomPiece);
  const [nextPiece, setNextPiece] = useState(randomPiece);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameState, setGameState] = useState('playing');
  const tickRef = useRef(null);
  const scoreRef = useRef(0);

  const tickSpeed = Math.max(100, TICK_BASE - (level - 1) * 80);

  const dropPiece = useCallback(() => {
    if (gameState !== 'playing') return;

    setPiece(prev => {
      const newY = prev.y + 1;
      if (collides(board, prev.shape, prev.x, newY)) {
        // Place piece
        const newBoard = placePiece(board, prev);
        const { board: clearedBoard, cleared } = clearLines(newBoard);
        setBoard(clearedBoard);

        if (cleared > 0) {
          const points = [0, 100, 300, 500, 800][cleared] * level;
          setScore(s => { const ns = s + points; scoreRef.current = ns; return ns; });
          setLines(l => {
            const nl = l + cleared;
            setLevel(Math.floor(nl / 10) + 1);
            return nl;
          });
          playSound('bounce');
        }

        // Spawn next piece
        const next = nextPiece;
        if (collides(clearedBoard, next.shape, next.x, next.y)) {
          setGameState('over');
          setGameOver(true);
          if (onGameEnd) onGameEnd(scoreRef.current);
          return prev;
        }
        setNextPiece(randomPiece());
        return next;
      }
      return { ...prev, y: newY };
    });
  }, [board, gameState, level, nextPiece]);

  // Game tick
  useEffect(() => {
    if (gameState !== 'playing') return;
    tickRef.current = setInterval(dropPiece, tickSpeed);
    return () => clearInterval(tickRef.current);
  }, [dropPiece, tickSpeed, gameState]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (gameState !== 'playing') return;
      e.preventDefault();

      if (e.key === 'ArrowLeft') {
        setPiece(prev => {
          if (!collides(board, prev.shape, prev.x - 1, prev.y)) {
            return { ...prev, x: prev.x - 1 };
          }
          return prev;
        });
      } else if (e.key === 'ArrowRight') {
        setPiece(prev => {
          if (!collides(board, prev.shape, prev.x + 1, prev.y)) {
            return { ...prev, x: prev.x + 1 };
          }
          return prev;
        });
      } else if (e.key === 'ArrowDown') {
        dropPiece();
      } else if (e.key === 'ArrowUp' || e.key === 'z' || e.key === 'Z') {
        setPiece(prev => {
          const rotated = rotatePiece(prev.shape);
          if (!collides(board, rotated, prev.x, prev.y)) {
            return { ...prev, shape: rotated };
          }
          // Wall kick attempts
          if (!collides(board, rotated, prev.x - 1, prev.y)) {
            return { ...prev, shape: rotated, x: prev.x - 1 };
          }
          if (!collides(board, rotated, prev.x + 1, prev.y)) {
            return { ...prev, shape: rotated, x: prev.x + 1 };
          }
          return prev;
        });
      } else if (e.key === ' ') {
        // Hard drop
        setPiece(prev => {
          let ny = prev.y;
          while (!collides(board, prev.shape, prev.x, ny + 1)) {
            ny++;
          }
          return { ...prev, y: ny };
        });
        setTimeout(dropPiece, 50);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [board, gameState, dropPiece]);

  function restart() {
    setBoard(createBoard());
    setPiece(randomPiece());
    setNextPiece(randomPiece());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setGameState('playing');
    scoreRef.current = 0;
  }

  // Render board with current piece
  const displayBoard = placePiece(board, piece);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button className="text-gray-400 hover:text-white text-sm cursor-pointer" onClick={onBack}>← Back</button>
          <span className="text-white text-sm font-bold">🧱 Tetris Pet</span>
          <div className="text-xs text-gray-400">Lv{level}</div>
        </div>

        <div className="flex gap-3">
          {/* Board */}
          <div
            className="border border-gray-600/50 bg-gray-950/80"
            style={{ width: BOARD_WIDTH * CELL_SIZE, height: BOARD_HEIGHT * CELL_SIZE }}
          >
            {displayBoard.map((row, ry) => (
              <div key={ry} className="flex">
                {row.map((cell, cx) => (
                  <div
                    key={cx}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: cell || 'transparent',
                      border: cell ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.03)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Side panel */}
          <div className="w-16 space-y-3">
            <div>
              <div className="text-[10px] text-gray-500">Score</div>
              <div className="text-xs text-white font-bold">{score}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Lines</div>
              <div className="text-xs text-white font-bold">{lines}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Next</div>
              <div className="bg-gray-800/50 rounded p-1">
                {nextPiece.shape.map((row, ry) => (
                  <div key={ry} className="flex">
                    {row.map((cell, cx) => (
                      <div
                        key={cx}
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: cell ? nextPiece.color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls hint */}
        <div className="text-[10px] text-gray-600 text-center mt-2">
          ←→ Move • ↑ Rotate • ↓ Soft Drop • Space Hard Drop
        </div>

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <div className="text-white text-lg font-bold mb-1">Game Over!</div>
              <div className="text-gray-400 text-sm mb-3">Score: {score}</div>
              <div className="flex gap-2 justify-center">
                <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer" onClick={restart}>Retry</button>
                <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer" onClick={onBack}>Back</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default TetrisPet;
