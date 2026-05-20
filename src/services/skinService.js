/**
 * Skin Service
 * Manages custom pet skins - built-in presets and user uploads.
 */

const SKIN_KEY = 'petdesk_current_skin';
const CUSTOM_SKINS_KEY = 'petdesk_custom_skins';
const MAX_CUSTOM_SIZE = 500 * 1024; // 500KB base64 limit

// Built-in skin presets
const BUILT_IN_SKINS = [
  {
    id: 'default',
    name: 'Default Slime',
    type: 'emoji',
    data: null, // uses existing pet emoji system
    preview: '🟢',
    description: 'The classic PetDesk slime',
  },
  {
    id: 'cat',
    name: 'Cat',
    type: 'emoji',
    data: '🐱',
    preview: '🐱',
    description: 'A cute kitty companion',
  },
  {
    id: 'dog',
    name: 'Dog',
    type: 'emoji',
    data: '🐕',
    preview: '🐕',
    description: 'A loyal doggo friend',
  },
  {
    id: 'robot',
    name: 'Robot',
    type: 'emoji',
    data: '🤖',
    preview: '🤖',
    description: 'Beep boop, robot pet',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    type: 'emoji',
    data: '👻',
    preview: '👻',
    description: 'A spooky spectral pet',
  },
  {
    id: 'pixel-slime',
    name: 'Pixel Slime',
    type: 'css-pixel',
    data: 'pixel-slime',
    preview: '🟩',
    description: 'Retro pixel art slime',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    type: 'emoji',
    data: '🐉',
    preview: '🐉',
    description: 'A mighty dragon companion',
  },
  {
    id: 'bunny',
    name: 'Bunny',
    type: 'emoji',
    data: '🐰',
    preview: '🐰',
    description: 'A fluffy bunny friend',
  },
];

// --- Storage ---

function getCustomSkins() {
  try {
    const stored = localStorage.getItem(CUSTOM_SKINS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

function saveCustomSkins(skins) {
  localStorage.setItem(CUSTOM_SKINS_KEY, JSON.stringify(skins));
}

// --- Public API ---

/**
 * Get the currently active skin
 */
export function getCurrentSkin() {
  try {
    const skinId = localStorage.getItem(SKIN_KEY);
    if (skinId) {
      // Check built-in
      const builtIn = BUILT_IN_SKINS.find(s => s.id === skinId);
      if (builtIn) return builtIn;

      // Check custom
      const customs = getCustomSkins();
      const custom = customs.find(s => s.id === skinId);
      if (custom) return custom;
    }
  } catch (e) { /* ignore */ }
  return BUILT_IN_SKINS[0]; // default
}

/**
 * Set the active skin by ID
 */
export function setSkin(skinId) {
  const all = getAvailableSkins();
  const skin = all.find(s => s.id === skinId);
  if (skin) {
    localStorage.setItem(SKIN_KEY, skinId);
    return skin;
  }
  return null;
}

/**
 * Get all available skins (built-in + custom)
 */
export function getAvailableSkins() {
  return [...BUILT_IN_SKINS, ...getCustomSkins()];
}

/**
 * Get only built-in skins
 */
export function getBuiltInSkins() {
  return BUILT_IN_SKINS;
}

/**
 * Upload a custom skin from a File object.
 * Resizes to 128x128 and stores as base64.
 * Returns a promise that resolves with the new skin object.
 */
export function uploadCustomSkin(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('File too large (max 5MB)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 128x128
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Draw centered/cropped
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 128, 128);

        const base64 = canvas.toDataURL('image/png');

        // Check size
        if (base64.length > MAX_CUSTOM_SIZE) {
          // Try JPEG with lower quality
          const jpegBase64 = canvas.toDataURL('image/jpeg', 0.7);
          if (jpegBase64.length > MAX_CUSTOM_SIZE) {
            reject(new Error('Image too large after compression. Try a simpler image.'));
            return;
          }
          saveSkinData(file.name, jpegBase64, resolve);
        } else {
          saveSkinData(file.name, base64, resolve);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function saveSkinData(fileName, base64, resolve) {
  const skinId = `custom-${Date.now()}`;
  const name = fileName.replace(/\.[^.]+$/, '').slice(0, 20) || 'Custom';

  const newSkin = {
    id: skinId,
    name,
    type: 'custom-image',
    data: base64,
    preview: base64,
    description: 'Custom uploaded skin',
    createdAt: Date.now(),
  };

  const customs = getCustomSkins();
  customs.push(newSkin);
  saveCustomSkins(customs);

  resolve(newSkin);
}

/**
 * Delete a custom skin by ID
 */
export function deleteCustomSkin(skinId) {
  const customs = getCustomSkins();
  const filtered = customs.filter(s => s.id !== skinId);
  saveCustomSkins(filtered);

  // If deleted skin was active, reset to default
  const currentId = localStorage.getItem(SKIN_KEY);
  if (currentId === skinId) {
    localStorage.setItem(SKIN_KEY, 'default');
  }

  return filtered;
}

/**
 * Check if a skin is custom (deletable)
 */
export function isCustomSkin(skinId) {
  return skinId.startsWith('custom-');
}

/**
 * Get pixel art CSS for the pixel-slime skin
 */
export function getPixelSlimeCSS() {
  return {
    width: '128px',
    height: '128px',
    imageRendering: 'pixelated',
    background: `
      linear-gradient(to bottom, transparent 25%, #4ade80 25%, #4ade80 75%, transparent 75%),
      linear-gradient(to right, transparent 25%, #4ade80 25%, #4ade80 75%, transparent 75%)
    `,
    borderRadius: '30% 30% 40% 40%',
    boxShadow: 'inset 0 -8px 16px rgba(0,0,0,0.2), inset 0 8px 16px rgba(255,255,255,0.1)',
    position: 'relative',
  };
}
