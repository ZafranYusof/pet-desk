/**
 * PetDesk - Import/Export Service
 * Export pet as encoded JSON, import from file, generate shareable pet card.
 */

const EXPORT_VERSION = 1;
const EXPORT_MAGIC = 'PETDESK';

/**
 * Encode pet data to base64 string
 */
export function exportPet(petState) {
  try {
    const exportData = {
      magic: EXPORT_MAGIC,
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      pet: {
        name: petState.name || 'Pet',
        species: petState.species || 'slime',
        level: petState.level || 1,
        xp: petState.xp || 0,
        happiness: petState.happiness ?? 50,
        hunger: petState.hunger ?? 50,
        energy: petState.energy ?? 50,
        accessories: petState.accessories || [],
        unlockedSpecies: petState.unlockedSpecies || ['slime'],
        unlockedAccessories: petState.unlockedAccessories || [],
        createdAt: petState.createdAt || Date.now(),
        totalPets: petState.totalPets || 0,
        personality: petState.personality || null,
      },
    };

    const jsonStr = JSON.stringify(exportData);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    return encoded;
  } catch (e) {
    console.error('Export failed:', e);
    return null;
  }
}

/**
 * Decode and validate imported pet data
 */
export function importPet(encodedString) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(encodedString.trim())));
    const data = JSON.parse(jsonStr);

    // Validate structure
    if (data.magic !== EXPORT_MAGIC) {
      return { success: false, reason: 'Invalid file format' };
    }
    if (!data.pet || !data.pet.species) {
      return { success: false, reason: 'Missing pet data' };
    }

    // Validate species
    const validSpecies = ['slime', 'cat', 'ghost'];
    if (!validSpecies.includes(data.pet.species)) {
      return { success: false, reason: 'Invalid species' };
    }

    // Validate numeric ranges
    if (typeof data.pet.level !== 'number' || data.pet.level < 1 || data.pet.level > 100) {
      return { success: false, reason: 'Invalid level' };
    }

    // Sanitize values
    const pet = {
      name: String(data.pet.name || 'Pet').slice(0, 20),
      species: data.pet.species,
      level: Math.max(1, Math.min(100, data.pet.level)),
      xp: Math.max(0, data.pet.xp || 0),
      happiness: Math.max(0, Math.min(100, data.pet.happiness ?? 50)),
      hunger: Math.max(0, Math.min(100, data.pet.hunger ?? 50)),
      energy: Math.max(0, Math.min(100, data.pet.energy ?? 50)),
      accessories: Array.isArray(data.pet.accessories) ? data.pet.accessories : [],
      unlockedSpecies: Array.isArray(data.pet.unlockedSpecies) ? data.pet.unlockedSpecies : ['slime'],
      unlockedAccessories: Array.isArray(data.pet.unlockedAccessories) ? data.pet.unlockedAccessories : [],
      createdAt: data.pet.createdAt || Date.now(),
      totalPets: data.pet.totalPets || 0,
      state: 'idle',
    };

    return { success: true, pet, exportedAt: data.exportedAt };
  } catch (e) {
    return { success: false, reason: 'Failed to decode: ' + e.message };
  }
}

/**
 * Generate pet card data for display
 */
export function generatePetCard(petState) {
  const stats = {
    name: petState.name || 'Pet',
    species: petState.species || 'slime',
    level: petState.level || 1,
    happiness: petState.happiness ?? 50,
    energy: petState.energy ?? 50,
    hunger: petState.hunger ?? 50,
    accessories: (petState.accessories || []).length,
    daysAlive: Math.floor((Date.now() - (petState.createdAt || Date.now())) / 86400000),
    totalPets: petState.totalPets || 0,
  };

  return stats;
}

/**
 * Download export as file
 */
export function downloadExport(petState) {
  const encoded = exportPet(petState);
  if (!encoded) return false;

  const blob = new Blob([encoded], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `petdesk_${(petState.name || 'pet').toLowerCase().replace(/\s+/g, '_')}_lv${petState.level || 1}.petdesk`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Read file and return encoded string
 */
export function readImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
