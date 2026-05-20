import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getActiveWidget, cycleWidget, getTodos, saveTodos, getTimerState, saveTimerState } from '../services/widgetService';

// Clock Widget
function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${days[time.getDay()]}, ${months[time.getMonth()]} ${time.getDate()}`;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-white text-xl font-mono font-bold leading-tight">{hours}:{minutes}</div>
      <div className="text-gray-400 text-[10px] mt-0.5">{dateStr}</div>
    </div>
  );
}

// Weather Widget
function WeatherWidget() {
  const [hour] = useState(() => new Date().getHours());

  const getWeatherInfo = () => {
    if (hour >= 6 && hour < 12) return { emoji: '🌤️', name: 'Morning', feels: 'Cool' };
    if (hour >= 12 && hour < 17) return { emoji: '☀️', name: 'Afternoon', feels: 'Warm' };
    if (hour >= 17 && hour < 21) return { emoji: '🌅', name: 'Evening', feels: 'Cool' };
    return { emoji: '🌙', name: 'Night', feels: 'Cold' };
  };

  const getMoodFace = () => {
    if (hour >= 6 && hour < 21) return '😊';
    return '😐';
  };

  const info = getWeatherInfo();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-0.5">
      <div className="text-lg">{info.emoji}</div>
      <div className="text-white text-[10px] font-medium">{info.name}</div>
      <div className="text-gray-400 text-[9px]">Feels: {info.feels} {getMoodFace()}</div>
    </div>
  );
}

// Pet Stats Widget
function PetStatsWidget({ petState }) {
  const hunger = petState?.hunger ?? 50;
  const energy = petState?.energy ?? 50;
  const happiness = petState?.happiness ?? 50;

  function getBarColor(value) {
    if (value > 70) return '#4ade80';
    if (value > 40) return '#fbbf24';
    return '#f87171';
  }

  const Bar = ({ value, label, icon }) => (
    <div className="flex items-center gap-1.5 w-full">
      <span className="text-[9px]">{icon}</span>
      <div className="flex-1 h-1.5 bg-gray-700/60 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: getBarColor(value) }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col justify-center h-full gap-1.5 px-2">
      <Bar value={hunger} label="H" icon="🍖" />
      <Bar value={energy} label="E" icon="⚡" />
      <Bar value={happiness} label="♥" icon="💚" />
    </div>
  );
}

// Todo Widget
function TodoWidget() {
  const [todos, setTodos] = useState(() => getTodos());
  const [editingIdx, setEditingIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingIdx !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIdx]);

  const handleAdd = (idx) => {
    setEditingIdx(idx);
    setEditText('');
  };

  const handleSave = () => {
    if (editText.trim()) {
      const newTodos = [...todos];
      if (editingIdx >= todos.length) {
        newTodos.push({ text: editText.trim(), done: false });
      } else {
        newTodos[editingIdx] = { text: editText.trim(), done: false };
      }
      setTodos(newTodos);
      saveTodos(newTodos);
    }
    setEditingIdx(null);
  };

  const handleToggle = (idx) => {
    const newTodos = [...todos];
    newTodos[idx] = { ...newTodos[idx], done: !newTodos[idx].done };
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const handleDelete = (e, idx) => {
    e.preventDefault();
    const newTodos = todos.filter((_, i) => i !== idx);
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const slots = [0, 1, 2];

  return (
    <div className="flex flex-col justify-center h-full gap-0.5 px-1.5">
      {slots.map((idx) => {
        if (editingIdx === idx) {
          return (
            <div key={idx} className="flex items-center">
              <input
                ref={inputRef}
                className="w-full bg-gray-800 text-white text-[9px] px-1 py-0.5 rounded border border-gray-600 outline-none"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditingIdx(null); }}
                onBlur={handleSave}
                maxLength={20}
                placeholder="Type..."
              />
            </div>
          );
        }
        if (idx < todos.length) {
          return (
            <div
              key={idx}
              className="flex items-center gap-1 cursor-pointer group"
              onClick={() => handleToggle(idx)}
              onContextMenu={(e) => handleDelete(e, idx)}
            >
              <span className="text-[9px]">{todos[idx].done ? '✅' : '⬜'}</span>
              <span className={`text-[9px] truncate ${todos[idx].done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                {todos[idx].text}
              </span>
            </div>
          );
        }
        return (
          <div
            key={idx}
            className="flex items-center gap-1 cursor-pointer opacity-40 hover:opacity-70 transition-opacity"
            onClick={() => handleAdd(idx)}
          >
            <span className="text-[9px]">➕</span>
            <span className="text-[9px] text-gray-500">Add todo</span>
          </div>
        );
      })}
    </div>
  );
}

// Timer Widget
function TimerWidget({ onTimerEnd }) {
  const [timer, setTimer] = useState(() => getTimerState());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev.remaining <= 1) {
            const nextMode = prev.mode === 'work' ? 'break' : 'work';
            const nextDuration = nextMode === 'work' ? 25 * 60 : 5 * 60;
            const newState = { mode: nextMode, duration: nextDuration, remaining: nextDuration, isRunning: false, startedAt: null };
            saveTimerState(newState);
            if (onTimerEnd) onTimerEnd();
            return newState;
          }
          const newState = { ...prev, remaining: prev.remaining - 1 };
          saveTimerState(newState);
          return newState;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.isRunning, onTimerEnd]);

  const toggleTimer = (e) => {
    e.stopPropagation();
    setTimer((prev) => {
      const newState = { ...prev, isRunning: !prev.isRunning, startedAt: !prev.isRunning ? Date.now() : null };
      saveTimerState(newState);
      return newState;
    });
  };

  const mins = Math.floor(timer.remaining / 60).toString().padStart(2, '0');
  const secs = (timer.remaining % 60).toString().padStart(2, '0');
  const progress = 1 - (timer.remaining / timer.duration);
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-0.5">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="#374151" strokeWidth="3" />
          <circle
            cx="22" cy="22" r={radius} fill="none"
            stroke={timer.mode === 'work' ? '#f472b6' : '#4ade80'}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="text-white text-[9px] font-mono z-10">{mins}:{secs}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="text-[8px] px-1.5 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          onClick={toggleTimer}
        >
          {timer.isRunning ? '⏸' : '▶'}
        </button>
        <span className="text-[8px] text-gray-400">{timer.mode === 'work' ? 'Work' : 'Break'}</span>
      </div>
    </div>
  );
}

// Mood Widget
function MoodWidget({ petState }) {
  const mood = petState?.mood || 'content';
  const level = petState?.level || 1;
  const moodEmojis = {
    happy: '😊', content: '🙂', hungry: '😫',
    tired: '😴', sad: '😢', excited: '🤩',
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-0.5">
      <motion.div
        className="text-2xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {moodEmojis[mood] || '🙂'}
      </motion.div>
      <div className="text-[9px] text-gray-300 capitalize">{mood}</div>
      <div className="text-[8px] text-purple-400 font-medium">Lv.{level}</div>
    </div>
  );
}

// Main Desktop Widget
function DesktopWidget({ petPosition, petState, visible, onTimerEnd }) {
  const [mode, setMode] = useState(() => getActiveWidget());
  const [expanded, setExpanded] = useState(false);

  const handleCycleMode = (e) => {
    e.stopPropagation();
    const next = cycleWidget();
    setMode(next);
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  if (!visible) return null;

  // Position widget above pet
  const widgetX = (petPosition?.x ?? 200) - 10;
  const widgetY = (petPosition?.y ?? 200) - (expanded ? 130 : 90);

  const modeIcons = {
    clock: '🕐',
    weather: '🌤️',
    petStats: '📊',
    todo: '📝',
    timer: '⏱️',
    mood: '😊',
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-40 select-none"
        style={{ left: widgetX, top: widgetY }}
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        drag
        dragMomentum={false}
      >
        <motion.div
          className="bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-600/30 shadow-2xl shadow-black/40 overflow-hidden flex flex-col"
          animate={{ width: expanded ? 160 : 120, height: expanded ? 120 : 80 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header - click to cycle */}
          <div
            className="flex items-center justify-between px-2 py-0.5 border-b border-gray-700/30 cursor-pointer hover:bg-gray-800/50 transition-colors"
            onClick={handleCycleMode}
          >
            <span className="text-[8px] text-gray-400">{modeIcons[mode]} {mode}</span>
            <div className="flex items-center gap-1">
              <button
                className="text-[8px] text-gray-600 hover:text-gray-300 transition-colors"
                onClick={(e) => { e.stopPropagation(); handleExpand(); }}
              >
                {expanded ? '▼' : '▲'}
              </button>
              <span className="text-[8px] text-gray-600">▶</span>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 min-h-0">
            {mode === 'clock' && <ClockWidget />}
            {mode === 'weather' && <WeatherWidget />}
            {mode === 'petStats' && <PetStatsWidget petState={petState} />}
            {mode === 'todo' && <TodoWidget />}
            {mode === 'timer' && <TimerWidget onTimerEnd={onTimerEnd} />}
            {mode === 'mood' && <MoodWidget petState={petState} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DesktopWidget;
