/**
 * Widget Manager Service
 * Manages floating mini-panels/widgets on the desktop.
 * Note: Named differently from widgetService.js which handles the pet's built-in widget mode.
 */

const WIDGETS_STATE_KEY = 'petdesk_desktop_widgets';
const WIDGET_POSITIONS_KEY = 'petdesk_widget_positions';
const WIDGET_TODOS_KEY = 'petdesk_widget_todos_v2';
const WIDGET_NOTES_KEY = 'petdesk_widget_notes';

// Available widget types
const WIDGET_TYPES = {
  clock: {
    id: 'clock',
    name: 'Clock',
    icon: '🕐',
    description: 'Digital clock with date',
    defaultSize: 'small',
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    icon: '🌤️',
    description: 'Current weather info',
    defaultSize: 'small',
  },
  todo: {
    id: 'todo',
    name: 'Todo List',
    icon: '✅',
    description: 'Simple task list',
    defaultSize: 'medium',
  },
  notes: {
    id: 'notes',
    name: 'Quick Notes',
    icon: '📝',
    description: 'Sticky note pad',
    defaultSize: 'medium',
  },
  system: {
    id: 'system',
    name: 'System Stats',
    icon: '📊',
    description: 'System information',
    defaultSize: 'small',
  },
};

const WIDGET_SIZES = {
  small: { width: 160, height: 120 },
  medium: { width: 200, height: 180 },
};

// --- State Management ---

function getWidgetsState() {
  try {
    const stored = localStorage.getItem(WIDGETS_STATE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    // Which widgets are active (visible)
    active: [],
  };
}

function saveWidgetsState(state) {
  localStorage.setItem(WIDGETS_STATE_KEY, JSON.stringify(state));
}

function getPositions() {
  try {
    const stored = localStorage.getItem(WIDGET_POSITIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {};
}

function savePositions(positions) {
  localStorage.setItem(WIDGET_POSITIONS_KEY, JSON.stringify(positions));
}

// --- Public API ---

/**
 * Get all available widget type definitions
 */
export function getWidgetTypes() {
  return WIDGET_TYPES;
}

/**
 * Get widget size presets
 */
export function getWidgetSizes() {
  return WIDGET_SIZES;
}

/**
 * Get list of currently active (visible) widget IDs
 */
export function getActiveWidgets() {
  const state = getWidgetsState();
  return state.active || [];
}

/**
 * Check if a specific widget is active
 */
export function isWidgetActive(widgetId) {
  const active = getActiveWidgets();
  return active.includes(widgetId);
}

/**
 * Toggle a widget on/off
 */
export function toggleWidget(widgetId) {
  if (!WIDGET_TYPES[widgetId]) return false;

  const state = getWidgetsState();
  const idx = state.active.indexOf(widgetId);

  if (idx >= 0) {
    state.active.splice(idx, 1);
  } else {
    state.active.push(widgetId);
  }

  saveWidgetsState(state);
  return state.active.includes(widgetId);
}

/**
 * Enable a widget
 */
export function enableWidget(widgetId) {
  if (!WIDGET_TYPES[widgetId]) return;
  const state = getWidgetsState();
  if (!state.active.includes(widgetId)) {
    state.active.push(widgetId);
    saveWidgetsState(state);
  }
}

/**
 * Disable a widget
 */
export function disableWidget(widgetId) {
  const state = getWidgetsState();
  state.active = state.active.filter(id => id !== widgetId);
  saveWidgetsState(state);
}

/**
 * Get position for a widget
 */
export function getWidgetPosition(widgetId) {
  const positions = getPositions();
  if (positions[widgetId]) return positions[widgetId];

  // Default positions (staggered)
  const typeKeys = Object.keys(WIDGET_TYPES);
  const idx = typeKeys.indexOf(widgetId);
  return {
    x: 50 + (idx * 30),
    y: 50 + (idx * 30),
  };
}

/**
 * Save position for a widget
 */
export function saveWidgetPosition(widgetId, x, y) {
  const positions = getPositions();
  positions[widgetId] = { x, y };
  savePositions(positions);
}

/**
 * Get widget size (small or medium)
 */
export function getWidgetSize(widgetId) {
  const type = WIDGET_TYPES[widgetId];
  if (!type) return WIDGET_SIZES.small;
  return WIDGET_SIZES[type.defaultSize] || WIDGET_SIZES.small;
}

// --- Todo Widget Data ---

export function getWidgetTodos() {
  try {
    const stored = localStorage.getItem(WIDGET_TODOS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

export function saveWidgetTodos(todos) {
  localStorage.setItem(WIDGET_TODOS_KEY, JSON.stringify(todos.slice(0, 20)));
}

export function addWidgetTodo(text) {
  const todos = getWidgetTodos();
  todos.unshift({ id: Date.now(), text, done: false, createdAt: Date.now() });
  saveWidgetTodos(todos);
  return todos;
}

export function toggleWidgetTodo(id) {
  const todos = getWidgetTodos();
  const todo = todos.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
  saveWidgetTodos(todos);
  return todos;
}

export function deleteWidgetTodo(id) {
  const todos = getWidgetTodos().filter(t => t.id !== id);
  saveWidgetTodos(todos);
  return todos;
}

// --- Notes Widget Data ---

export function getWidgetNotes() {
  try {
    const stored = localStorage.getItem(WIDGET_NOTES_KEY);
    if (stored) return stored;
  } catch (e) { /* ignore */ }
  return '';
}

export function saveWidgetNotes(text) {
  localStorage.setItem(WIDGET_NOTES_KEY, text);
}

// --- System Stats (via Electron if available) ---

export async function getSystemStats() {
  try {
    if (window.electronAPI?.getSystemStats) {
      return await window.electronAPI.getSystemStats();
    }
  } catch (e) { /* ignore */ }

  // Fallback: basic info from navigator
  return {
    platform: navigator.platform || 'Unknown',
    cores: navigator.hardwareConcurrency || '?',
    memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : '?',
    uptime: null,
    battery: null,
  };
}

export async function getBatteryInfo() {
  try {
    if (navigator.getBattery) {
      const battery = await navigator.getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging,
      };
    }
  } catch (e) { /* ignore */ }
  return null;
}
