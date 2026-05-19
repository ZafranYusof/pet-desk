const { app, BrowserWindow, globalShortcut, powerMonitor, ipcMain, Tray } = require('electron');
const path = require('path');
const { createTray } = require('./tray');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;
let tray = null;
let idleCheckInterval = null;
let lastIdleState = 'active'; // 'active' or 'idle'

const isDev = !app.isPackaged;

function createWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Full screen click-through: ignore mouse events everywhere except pet sprite
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Load content
  if (isDev) {
    mainWindow.loadURL('http://localhost:5174');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Don't show in taskbar
  mainWindow.setSkipTaskbar(true);

  // Prevent window from being closed accidentally
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

function startIdleDetection() {
  idleCheckInterval = setInterval(() => {
    const idleSeconds = powerMonitor.getSystemIdleTime();
    const newState = idleSeconds > 300 ? 'idle' : 'active'; // 5 min = 300s

    if (newState !== lastIdleState) {
      lastIdleState = newState;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('idle-state-changed', { state: newState, idleSeconds });
      }
    }

    // Always send idle seconds for tick calculations
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('idle-tick', { idleSeconds });
    }
  }, 5000);
}

// ---------- Pet state store (simple JSON file) ----------
const Store = (() => {
  const fs = require('fs');
  const storePath = path.join(app.getPath('userData'), 'pet-state.json');
  return {
    get() {
      try {
        if (fs.existsSync(storePath)) {
          return JSON.parse(fs.readFileSync(storePath, 'utf8'));
        }
      } catch (e) { console.error('[store] read failed', e); }
      return null;
    },
    set(data) {
      try {
        fs.writeFileSync(storePath, JSON.stringify(data), 'utf8');
      } catch (e) { console.error('[store] write failed', e); }
    }
  };
})();

ipcMain.handle('pet:get-state', () => Store.get());
ipcMain.handle('pet:save-state', (_e, state) => { Store.set(state); return true; });

// IPC Handlers
ipcMain.handle('get-screen-size', () => {
  const { screen } = require('electron');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});

ipcMain.handle('get-system-idle', () => {
  return powerMonitor.getSystemIdleTime();
});

ipcMain.handle('show-window', () => {
  if (mainWindow) mainWindow.show();
});

ipcMain.handle('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

// Allow renderer to toggle mouse events (for interaction)
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

app.whenReady().then(() => {
  createWindow();

  // Create tray icon
  tray = createTray(mainWindow);

  // Global shortcut: F10 to toggle visibility
  globalShortcut.register('F10', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  // Start idle detection
  startIdleDetection();
});

// Second instance handling
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (idleCheckInterval) clearInterval(idleCheckInterval);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
