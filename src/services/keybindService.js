/**
 * PetDesk - Keybind Service
 * Manages customizable keyboard shortcuts.
 * Saves to localStorage, registers via Electron globalShortcut.
 */

const KEYBIND_KEY = 'petdesk_keybinds';

const DEFAULT_KEYBINDS = {
  toggleVisibility: 'F10',
  toggleStats: 'F9',
  quickFeed: 'F8',
};

/**
 * Load keybinds from storage
 */
export function loadKeybinds() {
  try {
    const stored = localStorage.getItem(KEYBIND_KEY);
    if (stored) {
      return { ...DEFAULT_KEYBINDS, ...JSON.parse(stored) };
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_KEYBINDS };
}

/**
 * Save keybinds to storage
 */
export function saveKeybinds(keybinds) {
  try {
    localStorage.setItem(KEYBIND_KEY, JSON.stringify(keybinds));
  } catch (e) { /* ignore */ }
}

/**
 * Get default keybinds
 */
export function getDefaultKeybinds() {
  return { ...DEFAULT_KEYBINDS };
}

/**
 * Update a single keybind
 */
export function updateKeybind(action, key) {
  const keybinds = loadKeybinds();
  keybinds[action] = key;
  saveKeybinds(keybinds);
  return keybinds;
}

/**
 * Reset all keybinds to defaults
 */
export function resetKeybinds() {
  saveKeybinds(DEFAULT_KEYBINDS);
  return { ...DEFAULT_KEYBINDS };
}

/**
 * Register keybinds with Electron (call from renderer)
 */
export function registerKeybinds(keybinds, handlers) {
  if (!window.electronAPI?.registerShortcut) return;

  // Unregister all first
  if (window.electronAPI.unregisterAllShortcuts) {
    window.electronAPI.unregisterAllShortcuts();
  }

  Object.entries(keybinds).forEach(([action, key]) => {
    if (key && handlers[action]) {
      window.electronAPI.registerShortcut(key, action);
    }
  });
}

/**
 * Get human-readable label for keybind action
 */
export function getKeybindLabel(action) {
  const labels = {
    toggleVisibility: 'Toggle Visibility',
    toggleStats: 'Toggle Stats',
    quickFeed: 'Quick Feed',
  };
  return labels[action] || action;
}

/**
 * Validate a key string
 */
export function isValidKey(key) {
  const validKeys = [
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'Ctrl+Shift+1', 'Ctrl+Shift+2', 'Ctrl+Shift+3', 'Ctrl+Shift+4', 'Ctrl+Shift+5',
    'Ctrl+Alt+P', 'Ctrl+Alt+S', 'Ctrl+Alt+F',
    'Alt+F1', 'Alt+F2', 'Alt+F3', 'Alt+F4', 'Alt+F5',
  ];
  return validKeys.includes(key) || /^(Ctrl\+)?(Alt\+)?(Shift\+)?[A-Z0-9]$/.test(key) || /^F\d{1,2}$/.test(key);
}
