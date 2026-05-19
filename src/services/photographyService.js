/**
 * PetDesk - Photography Service
 * Photo mode logic: filters, frames, stickers, gallery management.
 */

const PHOTO_GALLERY_KEY = 'petdesk_photo_gallery';
const MAX_PHOTOS = 20;

export const FILTERS = [
  { id: 'normal', name: 'Normal', css: 'none' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.6) contrast(1.1)' },
  { id: 'neon', name: 'Neon', css: 'saturate(2) brightness(1.2)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(1) contrast(1.3)' },
  { id: 'dreamy', name: 'Dreamy', css: 'blur(1px) brightness(1.1) saturate(1.3)' },
  { id: 'pixel', name: 'Pixel', css: 'contrast(1.2)' }, // pixelated via image-rendering
  { id: 'sunset', name: 'Sunset', css: 'sepia(0.3) hue-rotate(-10deg) saturate(1.4)' },
  { id: 'ice', name: 'Ice', css: 'hue-rotate(180deg) saturate(0.8) brightness(1.1)' },
];

export const FRAMES = [
  { id: 'none', name: 'None', style: {} },
  { id: 'polaroid', name: 'Polaroid', style: { border: '8px solid white', borderBottom: '24px solid white', borderRadius: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' } },
  { id: 'gold', name: 'Gold', style: { border: '4px solid #ffd700', borderRadius: '4px', boxShadow: '0 0 8px rgba(255,215,0,0.4), inset 0 0 4px rgba(255,215,0,0.2)' } },
  { id: 'pixel-frame', name: 'Pixel', style: { border: '6px dashed #8b5cf6', borderRadius: '0px', imageRendering: 'pixelated' } },
  { id: 'hearts', name: 'Hearts', style: { border: '4px solid #f472b6', borderRadius: '12px', boxShadow: '0 0 6px rgba(244,114,182,0.4)' } },
  { id: 'space', name: 'Space', style: { border: '5px solid #1e1b4b', borderRadius: '4px', boxShadow: '0 0 12px rgba(99,102,241,0.3), inset 0 0 8px rgba(99,102,241,0.1)' } },
];

export const STICKERS = [
  { id: 'star', emoji: '⭐' },
  { id: 'heart', emoji: '❤️' },
  { id: 'party', emoji: '🎉' },
  { id: 'crown', emoji: '👑' },
  { id: 'rainbow', emoji: '🌈' },
  { id: 'fire', emoji: '🔥' },
  { id: 'ice', emoji: '❄️' },
  { id: 'flower', emoji: '🌸' },
  { id: 'gem', emoji: '💎' },
  { id: 'music', emoji: '🎵' },
];

const STICKER_SIZES = {
  small: 20,
  medium: 32,
  large: 48,
};

/**
 * Capture a photo (save state snapshot).
 */
export function capturePhoto(petState, habitat, filter, frame, stickers) {
  const photo = {
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    filter: filter || 'normal',
    frame: frame || 'none',
    stickers: stickers || [],
    petSpecies: petState.species || 'slime',
    petLevel: petState.level || 1,
    petName: petState.name || 'Pet',
    petState: petState.state || 'idle',
    petAccessories: petState.accessories || [],
    habitat: habitat || 'meadow',
  };
  return photo;
}

/**
 * Save photo to gallery.
 */
export function savePhoto(photo) {
  const gallery = getGallery();
  gallery.unshift(photo);
  // Limit to MAX_PHOTOS
  while (gallery.length > MAX_PHOTOS) {
    gallery.pop();
  }
  try {
    localStorage.setItem(PHOTO_GALLERY_KEY, JSON.stringify(gallery));
  } catch { /* ignore */ }
  return gallery;
}

/**
 * Delete a photo from gallery.
 */
export function deletePhoto(id) {
  const gallery = getGallery().filter((p) => p.id !== id);
  try {
    localStorage.setItem(PHOTO_GALLERY_KEY, JSON.stringify(gallery));
  } catch { /* ignore */ }
  return gallery;
}

/**
 * Get all saved photos.
 */
export function getGallery() {
  try {
    const stored = localStorage.getItem(PHOTO_GALLERY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

/**
 * Get filter CSS by id.
 */
export function getFilterCSS(filterId) {
  const filter = FILTERS.find((f) => f.id === filterId);
  return filter ? filter.css : 'none';
}

/**
 * Get frame style by id.
 */
export function getFrameStyle(frameId) {
  const frame = FRAMES.find((f) => f.id === frameId);
  return frame ? frame.style : {};
}

/**
 * Get sticker size in pixels.
 */
export function getStickerSize(size) {
  return STICKER_SIZES[size] || STICKER_SIZES.medium;
}

/**
 * Format timestamp for display.
 */
export function formatPhotoDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
