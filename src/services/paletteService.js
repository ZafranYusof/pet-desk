/**
 * PetDesk - Color Palette Service
 * Manages custom color palettes for pet sprites.
 */

const PALETTE_KEY = 'petdesk_color_palette';

export const PALETTES = [
  { id: 'original', name: 'Original', hueRotate: 0, saturate: 1, brightness: 1, description: 'Default colors' },
  { id: 'fire', name: 'Fire', hueRotate: -30, saturate: 1.3, brightness: 1.1, description: 'Warm fiery tones' },
  { id: 'ice', name: 'Ice', hueRotate: 180, saturate: 0.8, brightness: 1.15, description: 'Cool icy blues' },
  { id: 'forest', name: 'Forest', hueRotate: 90, saturate: 1.1, brightness: 0.95, description: 'Deep forest greens' },
  { id: 'royal', name: 'Royal', hueRotate: 270, saturate: 1.2, brightness: 1.0, description: 'Regal purples' },
  { id: 'sunset', name: 'Sunset', hueRotate: -15, saturate: 1.4, brightness: 1.1, description: 'Golden sunset hues' },
  { id: 'neon', name: 'Neon', hueRotate: 120, saturate: 2.0, brightness: 1.3, description: 'Vibrant neon glow' },
  { id: 'monochrome', name: 'Monochrome', hueRotate: 0, saturate: 0, brightness: 1.1, description: 'Classic black & white' },
];

/**
 * Load saved palette preference
 */
export function loadPalette() {
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return { id: 'original', customHue: 0 };
}

/**
 * Save palette preference
 */
export function savePalette(palette) {
  try {
    localStorage.setItem(PALETTE_KEY, JSON.stringify(palette));
  } catch (e) { /* ignore */ }
}

/**
 * Get CSS filter string for a palette
 */
export function getPaletteFilter(paletteId, customHue) {
  if (paletteId === 'custom' && customHue !== undefined) {
    return `hue-rotate(${customHue}deg)`;
  }

  const palette = PALETTES.find((p) => p.id === paletteId);
  if (!palette || palette.id === 'original') return 'none';

  const filters = [];
  if (palette.hueRotate !== 0) filters.push(`hue-rotate(${palette.hueRotate}deg)`);
  if (palette.saturate !== 1) filters.push(`saturate(${palette.saturate})`);
  if (palette.brightness !== 1) filters.push(`brightness(${palette.brightness})`);

  return filters.length > 0 ? filters.join(' ') : 'none';
}

/**
 * Get palette by ID
 */
export function getPaletteById(id) {
  return PALETTES.find((p) => p.id === id) || PALETTES[0];
}
