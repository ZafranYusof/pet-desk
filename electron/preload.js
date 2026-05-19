const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Pet state persistence
  getPetState: () => {
    const stored = localStorage.getItem('petState');
    return stored ? JSON.parse(stored) : null;
  },
  savePetState: (state) => {
    localStorage.setItem('petState', JSON.stringify(state));
  },

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
});
