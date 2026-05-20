const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Pet state persistence (via IPC to main process store)
  getPetState: () => ipcRenderer.invoke('pet:get-state'),
  savePetState: (state) => ipcRenderer.invoke('pet:save-state', state),

  // Screen size
  getScreenSize: () => ipcRenderer.invoke('get-screen-size'),

  // System idle
  getSystemIdle: () => ipcRenderer.invoke('get-system-idle'),
  onIdleChange: (callback) => {
    ipcRenderer.on('idle-state-changed', (event, data) => callback(data));
  },
  onIdleTick: (callback) => {
    ipcRenderer.on('idle-tick', (event, data) => callback(data));
  },

  // Pet actions (from tray)
  onPetAction: (callback) => {
    ipcRenderer.on('pet-action', (event, action) => callback(action));
  },

  // Window control
  showWindow: () => ipcRenderer.invoke('show-window'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  quitApp: () => ipcRenderer.invoke('quit-app'),

  // Mouse events toggle (for interaction areas)
  setIgnoreMouse: (ignore) => ipcRenderer.send('set-ignore-mouse', ignore),


  // Activity events (desktop buddy)
  onActivityEvent: (callback) => {
    ipcRenderer.on('activity-event', (event, data) => callback(data));
  },

  // Desktop notifications
  showNotification: (message) => ipcRenderer.invoke('show-notification', message),

  // Clipboard monitoring
  onClipboardChange: (callback) => {
    ipcRenderer.on('clipboard-change', (event, text) => callback(text));
  },

  // Active window detection (PowerShell-based, real foreground window)
  onActiveWindow: (callback) => {
    ipcRenderer.on('active-window', (event, data) => callback(data));
  },

  // Active window detection (legacy/backward compat)
  onActiveWindowChange: (callback) => {
    ipcRenderer.on('active-window-change', (event, data) => callback(data));
  },
});

