const { app, BrowserWindow, globalShortcut, powerMonitor, ipcMain, Tray, Notification, clipboard } = require('electron');
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
let lastActiveWindow = '';
let sessionStartTime = Date.now();
let activityCheckInterval = null;
let clipboardCheckInterval = null;
let lastClipboardText = '';
let activeWindowInterval = null;
let lastActiveWindowTitle = '';
let lastActiveWindowProcess = '';

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

  // Full screen click-through: ignore mouse events everywhere except interactive elements
  // Renderer toggles this off when mouse enters pet/panels
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
        // Send activity events for desktop buddy
        if (newState === 'idle') {
          mainWindow.webContents.send('activity-event', { type: 'idle', idleSeconds });
        } else {
          mainWindow.webContents.send('activity-event', { type: 'active', idleSeconds });
          sessionStartTime = Date.now();
        }
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
    if (ignore) {
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      mainWindow.setIgnoreMouseEvents(false);
    }
  }
});

// Desktop notifications
ipcMain.handle('show-notification', (_e, message) => {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: 'PetDesk',
      body: message,
      silent: false,
    });
    notification.show();
  }
  return true;
});


function startActivityDetection() {
  activityCheckInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    // Check for long session (2 hours)
    const sessionDuration = Date.now() - sessionStartTime;
    if (sessionDuration > 7200000) { // 2 hours
      mainWindow.webContents.send('activity-event', { type: 'long-session', duration: sessionDuration });
      sessionStartTime = Date.now(); // Reset so it doesn't spam
    }
  }, 30000); // Check every 30 seconds
}

// Active window detection using PowerShell (real foreground window)
function startActiveWindowDetection() {
  const { execSync } = require('child_process');

  activeWindowInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    try {
      const psScript = `
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class ForegroundWindow {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
  }
"@
$hwnd = [ForegroundWindow]::GetForegroundWindow()
$pid = 0
[ForegroundWindow]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
$sb = New-Object System.Text.StringBuilder 256
[ForegroundWindow]::GetWindowText($hwnd, $sb, 256) | Out-Null
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
@{ processName = $proc.ProcessName; windowTitle = $sb.ToString() } | ConvertTo-Json -Compress
`;
      const result = execSync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\"').replace(/\n/g, ' ')}"`, {
        encoding: 'utf8',
        timeout: 5000,
        windowsHide: true,
      }).trim();

      if (result) {
        const parsed = JSON.parse(result);
        const processName = parsed.processName || '';
        const windowTitle = parsed.windowTitle || '';

        // Only send when window actually changes
        if (processName !== lastActiveWindowProcess || windowTitle !== lastActiveWindowTitle) {
          lastActiveWindowProcess = processName;
          lastActiveWindowTitle = windowTitle;
          mainWindow.webContents.send('active-window', { processName, windowTitle });
          // Also send to existing active-window-change for backward compat
          mainWindow.webContents.send('active-window-change', { title: windowTitle, name: processName });
        }
      }
    } catch (e) {
      // Silently ignore errors (timeout, parse failures, etc.)
    }
  }, 10000); // Every 10 seconds
}

function startClipboardMonitoring() {
  lastClipboardText = clipboard.readText();
  clipboardCheckInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const currentText = clipboard.readText();
      if (currentText && currentText !== lastClipboardText) {
        lastClipboardText = currentText;
        mainWindow.webContents.send('clipboard-change', currentText);
      }
    } catch (e) {}
  }, 2000); // Check every 2 seconds
}

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

  // Start activity detection
  startActivityDetection();

  // Start active window detection (PowerShell-based)
  startActiveWindowDetection();

  // Start clipboard monitoring
  startClipboardMonitoring();
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
  if (activityCheckInterval) clearInterval(activityCheckInterval);
  if (activeWindowInterval) clearInterval(activeWindowInterval);
  if (clipboardCheckInterval) clearInterval(clipboardCheckInterval);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

