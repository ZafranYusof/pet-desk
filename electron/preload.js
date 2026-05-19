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
});
