// Widget service - manages widget state, todos, and timer

const WIDGET_KEY = 'petdesk_widget_mode';
const TODOS_KEY = 'petdesk_widget_todos';
const TIMER_KEY = 'petdesk_widget_timer';

const WIDGET_MODES = ['clock', 'weather', 'petStats', 'todo', 'timer'];

export function getActiveWidget() {
  try {
    const mode = localStorage.getItem(WIDGET_KEY);
    if (mode && WIDGET_MODES.includes(mode)) return mode;
  } catch (e) { /* ignore */ }
  return 'clock';
}

export function setActiveWidget(mode) {
  if (WIDGET_MODES.includes(mode)) {
    localStorage.setItem(WIDGET_KEY, mode);
  }
}

export function cycleWidget() {
  const current = getActiveWidget();
  const idx = WIDGET_MODES.indexOf(current);
  const next = WIDGET_MODES[(idx + 1) % WIDGET_MODES.length];
  setActiveWidget(next);
  return next;
}

// Todos (max 3)
export function getTodos() {
  try {
    const stored = localStorage.getItem(TODOS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

export function saveTodos(todos) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos.slice(0, 3)));
}

// Timer (pomodoro)
export function getTimerState() {
  try {
    const stored = localStorage.getItem(TIMER_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return {
    mode: 'work', // 'work' | 'break'
    duration: 25 * 60, // seconds
    remaining: 25 * 60,
    isRunning: false,
    startedAt: null,
  };
}

export function saveTimerState(state) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(state));
}

export function getWidgetModes() {
  return WIDGET_MODES;
}
