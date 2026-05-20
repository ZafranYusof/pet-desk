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

// File awareness IPC handlers
ipcMain.handle('scan-desktop', async () => {
  const fs = require('fs');
  const os = require('os');
  const desktopPath = path.join(os.homedir(), 'Desktop');
  // Also check OneDrive desktop
  const oneDriveDesktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
  const results = [];

  async function scanFolder(folderPath) {
    try {
      if (!fs.existsSync(folderPath)) return;
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        try {
          const fullPath = path.join(folderPath, entry.name);
          const stats = fs.statSync(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: stats.size,
            modified: stats.mtimeMs,
          });
        } catch (e) { /* skip inaccessible files */ }
      }
    } catch (e) { /* ignore */ }
  }

  await scanFolder(desktopPath);
  await scanFolder(oneDriveDesktop);
  return results;
});

ipcMain.handle('scan-projects', async () => {
  const fs = require('fs');
  const os = require('os');
  const results = [];

  // Common project locations
  const searchPaths = [
    os.homedir(),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'Projects'),
    path.join(os.homedir(), 'repos'),
    path.join(os.homedir(), 'dev'),
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'OneDrive', 'Desktop'),
  ];

  const projectIndicators = ['package.json', '.git', 'pubspec.yaml', 'Cargo.toml', 'go.mod', 'pom.xml', 'requirements.txt', 'composer.json'];

  function detectTechStack(dirPath) {
    const stack = [];
    try {
      const files = fs.readdirSync(dirPath).map(f => f.toLowerCase());
      if (files.includes('package.json')) stack.push('Node.js');
      if (files.includes('tsconfig.json')) stack.push('TypeScript');
      if (files.includes('vite.config.js') || files.includes('vite.config.ts')) stack.push('Vite');
      if (files.includes('next.config.js') || files.includes('next.config.mjs')) stack.push('Next.js');
      if (files.includes('pubspec.yaml')) stack.push('Flutter');
      if (files.includes('cargo.toml')) stack.push('Rust');
      if (files.includes('go.mod')) stack.push('Go');
      if (files.includes('requirements.txt') || files.includes('setup.py')) stack.push('Python');
      if (files.includes('tailwind.config.js')) stack.push('Tailwind');
    } catch (e) { /* ignore */ }
    return stack;
  }

  for (const searchPath of searchPaths) {
    try {
      if (!fs.existsSync(searchPath)) continue;
      const entries = fs.readdirSync(searchPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const dirPath = path.join(searchPath, entry.name);
        try {
          const dirFiles = fs.readdirSync(dirPath);
          const isProject = projectIndicators.some(indicator => dirFiles.includes(indicator));
          if (isProject) {
            const stats = fs.statSync(dirPath);
            results.push({
              name: entry.name,
              path: dirPath,
              lastModified: stats.mtimeMs,
              techStack: detectTechStack(dirPath),
            });
          }
        } catch (e) { /* skip inaccessible dirs */ }
      }
    } catch (e) { /* ignore */ }
  }

  // Deduplicate by path
  const seen = new Set();
  return results.filter(p => {
    if (seen.has(p.path)) return false;
    seen.add(p.path);
    return true;
  }).slice(0, 30);
});

ipcMain.handle('get-recent-files', async () => {
  const fs = require('fs');
  const os = require('os');
  const results = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const foldersToCheck = [
    path.join(os.homedir(), 'Desktop'),
    path.join(os.homedir(), 'Downloads'),
    path.join(os.homedir(), 'Documents'),
    path.join(os.homedir(), 'OneDrive', 'Desktop'),
  ];

  for (const folder of foldersToCheck) {
    try {
      if (!fs.existsSync(folder)) continue;
      const entries = fs.readdirSync(folder, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.isDirectory()) continue;
        try {
          const fullPath = path.join(folder, entry.name);
          const stats = fs.statSync(fullPath);
          if (stats.mtimeMs > oneDayAgo) {
            results.push({
              name: entry.name,
              path: fullPath,
              modified: stats.mtimeMs,
              size: stats.size,
            });
          }
        } catch (e) { /* skip */ }
      }
    } catch (e) { /* ignore */ }
  }

  // Sort by most recent
  results.sort((a, b) => b.modified - a.modified);
  return results.slice(0, 20);
});

ipcMain.handle('read-clipboard', async () => {
  return clipboard.readText();
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

  // Screenshot detection: PrintScreen key
  globalShortcut.register('PrintScreen', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('screenshot-taken', { method: 'printscreen', time: Date.now() });
    }
  });

  // Screenshot detection: Win+Shift+S (Snipping Tool)
  globalShortcut.register('Super+Shift+S', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('screenshot-taken', { method: 'snipping', time: Date.now() });
    }
  });
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

