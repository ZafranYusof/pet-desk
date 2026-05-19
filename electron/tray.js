const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

function createTray(mainWindow) {
  const iconPath = path.join(__dirname, '..', 'build', 'tray-icon.png');

  // Create a simple 16x16 icon programmatically as fallback
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = createDefaultIcon();
    }
  } catch (e) {
    trayIcon = createDefaultIcon();
  }

  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  const tray = new Tray(trayIcon);
  tray.setToolTip('PetDesk - Your Desktop Pet');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🍖 Feed Pet',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet-action', 'feed');
        }
      },
    },
    {
      label: '🎮 Play',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet-action', 'play');
        }
      },
    },
    {
      label: '😴 Put to Sleep',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet-action', 'sleep');
        }
      },
    },
    {
      label: '📊 Stats',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pet-action', 'stats');
        }
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quit',
      click: () => {
        const { app } = require('electron');
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // Show window on tray click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });

  return tray;
}

function createDefaultIcon() {
  // Create a simple 16x16 green circle icon
  const { nativeImage } = require('electron');
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const cx = size / 2;
      const cy = size / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist < size / 2 - 1) {
        // Green fill
        buffer[idx] = 76;     // R
        buffer[idx + 1] = 175; // G
        buffer[idx + 2] = 80;  // B
        buffer[idx + 3] = 255; // A
      } else {
        // Transparent
        buffer[idx] = 0;
        buffer[idx + 1] = 0;
        buffer[idx + 2] = 0;
        buffer[idx + 3] = 0;
      }
    }
  }

  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

module.exports = { createTray };
