import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../services/soundService';

const LANE_COUNT = 4;
const NOTE_SPEED_BASE = 3;
const HIT_ZONE_Y = 280;
const HIT_TOLERANCE = 30;
const GAME_WIDTH = 200;
const GAME_HEIGHT = 320;

const KEYS = ['d', 'f', 'j', 'k'];
const ARROWS = ['←', '↓', '↑', '→'];
const LANE_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

// Simple songs defined as note patterns (lane, time in ms)
const SONGS = [
  {
    name: 'Pixel Beat',
    bpm: 120,
    notes: [
      { lane: 0, time: 500 }, { lane: 2, time: 1000 }, { lane: 1, time: 1500 }, { lane: 3, time: 2000 },
      { lane: 0, time: 2500 }, { lane: 1, time: 2750 }, { lane: 2, time: 3000 }, { lane: 3, time: 3250 },
      { lane: 0, time: 3750 }, { lane: 2, time: 4000 }, { lane: 1, time: 4500 }, { lane: 3, time: 5000 },
      { lane: 2, time: 5500 }, { lane: 0, time: 5750 }, { lane: 3, time: 6000 }, { lane: 1, time: 6250 },
      { lane: 0, time: 6750 }, { lane: 1, time: 7000 }, { lane: 2, time: 7250 }, { lane: 3, time: 7500 },
      { lane: 2, time: 8000 }, { lane: 0, time: 8500 }, { lane: 1, time: 9000 }, { lane: 3, time: 9500 },
      { lane: 0, time: 10000 }, { lane: 2, time: 10250 }, { lane: 1, time: 10500 }, { lane: 3, time: 10750 },
      { lane: 0, time: 11250 }, { lane: 1, time: 11750 }, { lane: 2, time: 12000 }, { lane: 3, time: 12500 },
    ],
  },
  {
    name: 'Chiptune Groove',
    bpm: 140,
    notes: [
      { lane: 1, time: 400 }, { lane: 2, time: 800 }, { lane: 0, time: 1200 }, { lane: 3, time: 1400 },
      { lane: 1, time: 1800 }, { lane: 0, time: 2000 }, { lane: 2, time: 2200 }, { lane: 3, time: 2600 },
      { lane: 0, time: 3000 }, { lane: 1, time: 3200 }, { lane: 2, time: 3400 }, { lane: 3, time: 3600 },
      { lane: 0, time: 4000 }, { lane: 2, time: 4200 }, { lane: 1, time: 4600 }, { lane: 3, time: 4800 },
      { lane: 0, time: 5200 }, { lane: 1, time: 5400 }, { lane: 3, time: 5600 }, { lane: 2, time: 5800 },
      { lane: 1, time: 6200 }, { lane: 0, time: 6600 }, { lane: 3, time: 7000 }, { lane: 2, time: 7200 },
      { lane: 0, time: 7600 }, { lane: 1, time: 7800 }, { lane: 2, time: 8000 }, { lane: 3, time: 8200 },
      { lane: 0, time: 8600 }, { lane: 2, time: 9000 }, { lane: 1, time: 9400 }, { lane: 3, time: 9800 },
      { lane: 0, time: 10200 }, { lane: 1, time: 10400 }, { lane: 2, time: 10600 }, { lane: 3, time: 10800 },
    ],
  },
  {
    name: 'Retro Rush',
    bpm: 160,
    notes: [
      { lane: 0, time: 300 }, { lane: 1, time: 600 }, { lane: 2, time: 900 }, { lane: 3, time: 1200 },
      { lane: 3, time: 1500 }, { lane: 2, time: 1800 }, { lane: 1, time: 2100 }, { lane: 0, time: 2400 },
      { lane: 0, time: 2600 }, { lane: 2, time: 2800 }, { lane: 1, time: 3000 }, { lane: 3, time: 3200 },
      { lane: 1, time: 3500 }, { lane: 0, time: 3700 }, { lane: 3, time: 3900 }, { lane: 2, time: 4100 },
      { lane: 0, time: 4400 }, { lane: 1, time: 4550 }, { lane: 2, time: 4700 }, { lane: 3, time: 4850 },
      { lane: 3, time: 5100 }, { lane: 2, time: 5250 }, { lane: 1, time: 5400 }, { lane: 0, time: 5550 },
      { lane: 0, time: 5800 }, { lane: 3, time: 6000 }, { lane: 1, time: 6200 }, { lane: 2, time: 6400 },
      { lane: 2, time: 6700 }, { lane: 0, time: 6900 }, { lane: 3, time: 7100 }, { lane: 1, time: 7300 },
      { lane: 0, time: 7600 }, { lane: 1, time: 7750 }, { lane: 2, time: 7900 }, { lane: 3, time: 8050 },
      { lane: 0, time: 8300 }, { lane: 2, time: 8500 }, { lane: 1, time: 8700 }, { lane: 3, time: 8900 },
    ],
  },
];

function RhythmPet({ onBack, onGameEnd }) {
  const [gameState, setGameState] = useState('select'); // select, playing, results
  const [selectedSong, setSelectedSong] = useState(0);
  const [notes, setNotes] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hits, setHits] = useState({ perfect: 0, good: 0, miss: 0 });
  const [feedback, setFeedback] = useState(null);
  const [laneFlash, setLaneFlash] = useState([false, false, false, false]);
  const startTimeRef = useRef(0);
  const frameRef = useRef(null);
  const notesRef = useRef([]);
  const scoreRef = useRef(0);

  function startSong(songIdx) {
    const song = SONGS[songIdx];
    const gameNotes = song.notes.map((n, i) => ({
      id: i,
      lane: n.lane,
      time: n.time,
      y: -20,
      hit: false,
      missed: false,
    }));
    notesRef.current = gameNotes;
    setNotes(gameNotes);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHits({ perfect: 0, good: 0, miss: 0 });
    scoreRef.current = 0;
    startTimeRef.current = Date.now();
    // Cancel any existing animation frame before starting new loop
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    setGameState('playing');
    gameLoop();
  }

  function gameLoop() {
    const elapsed = Date.now() - startTimeRef.current;
    let allDone = true;

    notesRef.current = notesRef.current.map(note => {
      if (note.hit || note.missed) return note;
      allDone = false;

      // Calculate Y position based on time
      const noteY = ((elapsed - note.time + 2000) / 2000) * HIT_ZONE_Y;

      // Check if missed (past hit zone)
      if (noteY > HIT_ZONE_Y + HIT_TOLERANCE && !note.hit) {
        return { ...note, y: noteY, missed: true };
      }

      return { ...note, y: noteY };
    });

    // Check for misses and update combo (only count each miss once)
    const newMisses = notesRef.current.filter(n => n.missed && !n.missHandled);
    if (newMisses.length > 0) {
      newMisses.forEach(n => { n.missHandled = true; });
      setCombo(0);
      setHits(prev => ({ ...prev, miss: prev.miss + newMisses.length }));
      setFeedback({ text: 'Miss!', color: 'text-red-400' });
      setTimeout(() => setFeedback(null), 500);
    }

    setNotes([...notesRef.current]);

    // Check if song is over
    const allProcessed = notesRef.current.every(n => n.hit || n.missed);
    if (allProcessed && elapsed > notesRef.current[notesRef.current.length - 1].time + 2500) {
      setGameState('results');
      if (onGameEnd) onGameEnd(scoreRef.current);
      return;
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Key handler
  useEffect(() => {
    if (gameState !== 'playing') return;

    function handleKey(e) {
      const laneIdx = KEYS.indexOf(e.key.toLowerCase());
      if (laneIdx === -1) return;
      e.preventDefault();

      // Flash lane
      setLaneFlash(prev => {
        const next = [...prev];
        next[laneIdx] = true;
        return next;
      });
      setTimeout(() => {
        setLaneFlash(prev => {
          const next = [...prev];
          next[laneIdx] = false;
          return next;
        });
      }, 100);

      // Find closest unhit note in this lane near hit zone
      let closest = null;
      let closestDist = Infinity;

      for (const note of notesRef.current) {
        if (note.lane !== laneIdx || note.hit || note.missed) continue;
        const dist = Math.abs(note.y - HIT_ZONE_Y);
        if (dist < closestDist && dist < HIT_TOLERANCE * 2) {
          closest = note;
          closestDist = dist;
        }
      }

      if (closest) {
        closest.hit = true;
        let points = 0;
        let feedbackText = '';

        if (closestDist < HIT_TOLERANCE * 0.4) {
          points = 100;
          feedbackText = 'Perfect!';
          setHits(prev => ({ ...prev, perfect: prev.perfect + 1 }));
          setFeedback({ text: feedbackText, color: 'text-yellow-300' });
        } else if (closestDist < HIT_TOLERANCE) {
          points = 50;
          feedbackText = 'Good!';
          setHits(prev => ({ ...prev, good: prev.good + 1 }));
          setFeedback({ text: feedbackText, color: 'text-green-300' });
        } else {
          points = 25;
          feedbackText = 'OK';
          setHits(prev => ({ ...prev, good: prev.good + 1 }));
          setFeedback({ text: feedbackText, color: 'text-gray-300' });
        }

        setCombo(prev => {
          const newCombo = prev + 1;
          setMaxCombo(mc => Math.max(mc, newCombo));
          return newCombo;
        });

        const comboBonus = Math.floor(combo / 5) * 10;
        const totalPoints = points + comboBonus;
        setScore(s => { const ns = s + totalPoints; scoreRef.current = ns; return ns; });
        playSound('bounce');
        setTimeout(() => setFeedback(null), 400);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, combo]);

  // Song select screen
  if (gameState === 'select') {
    return (
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4 w-[240px]">
          <div className="flex items-center justify-between mb-4">
            <button className="text-gray-400 hover:text-white text-sm cursor-pointer" onClick={onBack}>← Back</button>
            <span className="text-white text-sm font-bold">🎵 Rhythm Pet</span>
          </div>

          <div className="space-y-2">
            {SONGS.map((song, i) => (
              <button
                key={i}
                className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-700/60 border border-gray-600/30 rounded-lg text-left cursor-pointer transition-colors"
                onClick={() => { setSelectedSong(i); startSong(i); }}
              >
                <div className="text-sm text-white">{song.name}</div>
                <div className="text-xs text-gray-400">{song.bpm} BPM • {song.notes.length} notes</div>
              </button>
            ))}
          </div>

          <div className="text-[10px] text-gray-600 text-center mt-3">
            Keys: D F J K
          </div>
        </div>
      </motion.div>
    );
  }

  // Results screen
  if (gameState === 'results') {
    const totalNotes = SONGS[selectedSong].notes.length;
    const accuracy = totalNotes > 0 ? Math.round(((hits.perfect + hits.good) / totalNotes) * 100) : 0;
    const grade = accuracy >= 95 ? 'S' : accuracy >= 85 ? 'A' : accuracy >= 70 ? 'B' : accuracy >= 50 ? 'C' : 'D';

    return (
      <motion.div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-4 w-[220px] text-center">
          <div className="text-2xl font-bold text-white mb-1">🎵 Results</div>
          <div className="text-4xl font-bold text-yellow-300 mb-2">{grade}</div>
          <div className="text-sm text-white mb-3">Score: {score}</div>
          <div className="space-y-1 text-xs text-gray-400 mb-4">
            <div>Perfect: {hits.perfect} • Good: {hits.good} • Miss: {hits.miss}</div>
            <div>Max Combo: {maxCombo} • Accuracy: {accuracy}%</div>
          </div>
          <div className="flex gap-2 justify-center">
            <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer" onClick={() => startSong(selectedSong)}>Retry</button>
            <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer" onClick={onBack}>Back</button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Playing screen
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl p-3">
        {/* Score bar */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs text-gray-400">Score: {score}</span>
          <span className="text-xs text-yellow-300">{combo > 0 ? `${combo}x Combo` : ''}</span>
        </div>

        {/* Game area */}
        <div
          className="relative overflow-hidden border border-gray-600/30 rounded-lg bg-gray-950/80"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Lane dividers */}
          {Array.from({ length: LANE_COUNT }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-r border-gray-700/20"
              style={{ left: (i + 1) * (GAME_WIDTH / LANE_COUNT) }}
            />
          ))}

          {/* Lane flash */}
          {laneFlash.map((flash, i) => flash && (
            <div
              key={`flash-${i}`}
              className="absolute top-0 bottom-0 opacity-20"
              style={{
                left: i * (GAME_WIDTH / LANE_COUNT),
                width: GAME_WIDTH / LANE_COUNT,
                backgroundColor: LANE_COLORS[i],
              }}
            />
          ))}

          {/* Hit zone */}
          <div
            className="absolute left-0 right-0 h-1 bg-white/30"
            style={{ top: HIT_ZONE_Y }}
          />

          {/* Lane labels at hit zone */}
          {ARROWS.map((arrow, i) => (
            <div
              key={`label-${i}`}
              className="absolute text-xs text-gray-500 text-center"
              style={{
                left: i * (GAME_WIDTH / LANE_COUNT),
                width: GAME_WIDTH / LANE_COUNT,
                top: HIT_ZONE_Y + 5,
              }}
            >
              {arrow}
            </div>
          ))}

          {/* Notes */}
          {notes.filter(n => !n.hit && !n.missed && n.y > -20 && n.y < GAME_HEIGHT).map(note => (
            <div
              key={note.id}
              className="absolute rounded-sm"
              style={{
                left: note.lane * (GAME_WIDTH / LANE_COUNT) + 8,
                top: note.y,
                width: (GAME_WIDTH / LANE_COUNT) - 16,
                height: 12,
                backgroundColor: LANE_COLORS[note.lane],
                boxShadow: `0 0 6px ${LANE_COLORS[note.lane]}40`,
              }}
            />
          ))}

          {/* Feedback */}
          {feedback && (
            <div className={`absolute left-1/2 -translate-x-1/2 text-sm font-bold ${feedback.color}`} style={{ top: HIT_ZONE_Y - 30 }}>
              {feedback.text}
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="text-[10px] text-gray-600 text-center mt-2">
          D F J K — Hit notes as they reach the line
        </div>
      </div>
    </motion.div>
  );
}

export default RhythmPet;
