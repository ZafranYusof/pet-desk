import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import InteractivePanel from './InteractivePanel';
import {
  getActiveWidgets, getWidgetTypes, getWidgetPosition, saveWidgetPosition,
  getWidgetSize, disableWidget, getWidgetTodos, addWidgetTodo,
  toggleWidgetTodo, deleteWidgetTodo, getWidgetNotes, saveWidgetNotes,
  getSystemStats, getBatteryInfo
} from '../services/widgetManagerService';

// --- Individual Widget Components ---

function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="flex flex-col items-center justify-center h-full p-2">
      <div className="text-white text-2xl font-mono font-bold tracking-wider">
        {hours}:{minutes}
      </div>
      <div className="text-gray-500 text-[10px] font-mono">{seconds}s</div>
      <div className="text-gray-400 text-[10px] mt-1">
        {days[time.getDay()]}, {months[time.getMonth()]} {time.getDate()}
      </div>
    </div>
  );
}

function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    // Try to get weather from existing weather service localStorage
    try {
      const stored = localStorage.getItem('petdesk_weather');
      if (stored) {
        const data = JSON.parse(stored);
        setWeather(data);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const getWeatherEmoji = (type) => {
    const map = { sunny: '☀️', cloudy: '☁️', rainy: '🌧️', stormy: '⛈️', snowy: '❄️' };
    return map[type] || '🌤️';
  };

  const hour = new Date().getHours();
  const timeOfDay = hour >= 6 && hour < 12 ? 'Morning' : hour >= 12 && hour < 17 ? 'Afternoon' : hour >= 17 && hour < 21 ? 'Evening' : 'Night';

  return (
    <div className="flex flex-col items-center justify-center h-full p-2">
      <div className="text-2xl">{weather ? getWeatherEmoji(weather.weather) : '🌤️'}</div>
      <div className="text-white text-xs font-medium mt-1">
        {weather?.weather ? weather.weather.charAt(0).toUpperCase() + weather.weather.slice(1) : timeOfDay}
      </div>
      {weather?.temperature && (
        <div className="text-gray-400 text-[10px]">{weather.temperature}°C</div>
      )}
    </div>
  );
}

function TodoWidget() {
  const [todos, setTodos] = useState(() => getWidgetTodos());
  const [input, setInput] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setTodos(addWidgetTodo(input.trim()));
    setInput('');
  };

  const handleToggle = (id) => {
    setTodos(toggleWidgetTodo(id));
  };

  const handleDelete = (id) => {
    setTodos(deleteWidgetTodo(id));
  };

  return (
    <div className="flex flex-col h-full p-2">
      <form onSubmit={handleAdd} className="flex gap-1 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add task..."
          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white text-[10px] placeholder-gray-600 outline-none focus:border-blue-500/50"
        />
        <button type="submit" className="text-blue-400 text-xs px-1 hover:text-blue-300">+</button>
      </form>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {todos.slice(0, 8).map((todo) => (
          <div key={todo.id} className="flex items-center gap-1 group">
            <button
              onClick={() => handleToggle(todo.id)}
              className={`w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center ${
                todo.done ? 'bg-green-500/30 border-green-500/50' : 'border-white/20'
              }`}
            >
              {todo.done && <span className="text-[7px] text-green-300">✓</span>}
            </button>
            <span className={`text-[10px] flex-1 truncate ${todo.done ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
              {todo.text}
            </span>
            <button
              onClick={() => handleDelete(todo.id)}
              className="text-red-400/0 group-hover:text-red-400/70 text-[8px] transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        {todos.length === 0 && (
          <p className="text-gray-600 text-[9px] text-center mt-4">No tasks yet</p>
        )}
      </div>
    </div>
  );
}

function NotesWidget() {
  const [text, setText] = useState(() => getWidgetNotes());
  const saveTimeout = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveWidgetNotes(e.target.value);
    }, 500);
  };

  return (
    <div className="flex flex-col h-full p-2">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Quick notes..."
        className="flex-1 bg-transparent border-none outline-none text-gray-300 text-[10px] resize-none placeholder-gray-600 leading-relaxed"
      />
      <div className="text-gray-600 text-[8px] text-right">{text.length} chars</div>
    </div>
  );
}

function SystemWidget() {
  const [stats, setStats] = useState(null);
  const [battery, setBattery] = useState(null);

  useEffect(() => {
    getSystemStats().then(setStats);
    getBatteryInfo().then(setBattery);

    const timer = setInterval(() => {
      getSystemStats().then(setStats);
      getBatteryInfo().then(setBattery);
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center h-full p-2 space-y-1">
      {stats && (
        <>
          <div className="flex justify-between">
            <span className="text-gray-500 text-[9px]">Platform</span>
            <span className="text-gray-300 text-[9px]">{stats.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-[9px]">Cores</span>
            <span className="text-gray-300 text-[9px]">{stats.cores}</span>
          </div>
          {stats.memory && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-[9px]">Memory</span>
              <span className="text-gray-300 text-[9px]">{stats.memory}</span>
            </div>
          )}
        </>
      )}
      {battery && (
        <div className="flex justify-between">
          <span className="text-gray-500 text-[9px]">Battery</span>
          <span className={`text-[9px] ${battery.level > 20 ? 'text-green-400' : 'text-red-400'}`}>
            {battery.level}% {battery.charging ? '⚡' : ''}
          </span>
        </div>
      )}
      {!stats && <p className="text-gray-600 text-[9px] text-center">Loading...</p>}
    </div>
  );
}

// --- Draggable Widget Wrapper ---

function DraggableWidget({ widgetId, children, onClose }) {
  const [position, setPosition] = useState(() => getWidgetPosition(widgetId));
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const size = getWidgetSize(widgetId);
  const widgetType = getWidgetTypes()[widgetId];

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.widget-content')) return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const newX = e.clientX - offsetRef.current.x;
      const newY = e.clientY - offsetRef.current.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      saveWidgetPosition(widgetId, position.x, position.y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, widgetId, position]);

  return (
    <motion.div
      ref={dragRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed z-[9990] rounded-xl border border-white/10 shadow-xl overflow-hidden cursor-move select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: 'rgba(15, 15, 25, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Widget header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-white/5">
        <span className="text-[9px] text-gray-500 flex items-center gap-1">
          <span>{widgetType?.icon}</span>
          {widgetType?.name}
        </span>
        <button
          onClick={() => onClose(widgetId)}
          className="text-gray-600 hover:text-gray-300 text-[10px] transition-colors"
        >
          ×
        </button>
      </div>
      {/* Widget content */}
      <div className="widget-content h-[calc(100%-24px)] cursor-default">
        {children}
      </div>
    </motion.div>
  );
}

// --- Main Desktop Widgets Container ---

function DesktopWidgets() {
  const [activeWidgets, setActiveWidgets] = useState(() => getActiveWidgets());

  // Listen for changes (from WidgetManager panel)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'petdesk_desktop_widgets') {
        setActiveWidgets(getActiveWidgets());
      }
    };
    window.addEventListener('storage', handleStorage);

    // Also poll periodically for same-window changes
    const poll = setInterval(() => {
      setActiveWidgets(getActiveWidgets());
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(poll);
    };
  }, []);

  const handleClose = useCallback((widgetId) => {
    disableWidget(widgetId);
    setActiveWidgets(getActiveWidgets());
  }, []);

  const widgetComponents = {
    clock: <ClockWidget />,
    weather: <WeatherWidget />,
    todo: <TodoWidget />,
    notes: <NotesWidget />,
    system: <SystemWidget />,
  };

  if (activeWidgets.length === 0) return null;

  return (
    <InteractivePanel style={{ pointerEvents: 'none', position: 'fixed', inset: 0, zIndex: 9990 }}>
      <div style={{ pointerEvents: 'auto' }}>
        {activeWidgets.map((widgetId) => (
          widgetComponents[widgetId] ? (
            <DraggableWidget key={widgetId} widgetId={widgetId} onClose={handleClose}>
              {widgetComponents[widgetId]}
            </DraggableWidget>
          ) : null
        ))}
      </div>
    </InteractivePanel>
  );
}

export default DesktopWidgets;
