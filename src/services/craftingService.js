// Crafting Service - Materials inventory, recipes, and crafting logic

const MATERIALS_KEY = 'petdesk_crafting_materials';
const DISCOVERED_KEY = 'petdesk_crafting_discovered';

const RECIPES = [
  // Accessories
  { id: 'wooden-crown', name: 'Wooden Crown', icon: '👑', materials: { wood: 3, goldDust: 1 }, result: { type: 'accessory', id: 'wooden-crown' }, unlockLevel: 3 },
  { id: 'crystal-necklace', name: 'Crystal Necklace', icon: '💎', materials: { crystal: 2, goldDust: 1 }, result: { type: 'accessory', id: 'crystal-necklace' }, unlockLevel: 5 },
  { id: 'shadow-cloak', name: 'Shadow Cloak', icon: '🌑', materials: { shadowEssence: 3, fabric: 2 }, result: { type: 'accessory', id: 'shadow-cloak' }, unlockLevel: 8 },
  { id: 'feather-wings', name: 'Feather Wings', icon: '🪶', materials: { feather: 4, fabric: 1 }, result: { type: 'accessory', id: 'feather-wings' }, unlockLevel: 10 },
  { id: 'star-tiara', name: 'Star Tiara', icon: '👸', materials: { starFragment: 2, crystal: 2, goldDust: 2 }, result: { type: 'accessory', id: 'star-tiara' }, unlockLevel: 15 },

  // Food items
  { id: 'energy-potion', name: 'Energy Potion', icon: '⚡', materials: { crystal: 1, slimeGel: 2 }, result: { type: 'food', id: 'energy-potion', effect: { energy: 50 } }, unlockLevel: 4 },
  { id: 'happiness-cake', name: 'Happiness Cake', icon: '🎂', materials: { wood: 1, goldDust: 1 }, result: { type: 'food', id: 'happiness-cake', effect: { happiness: 40 } }, unlockLevel: 6 },
  { id: 'xp-elixir', name: 'XP Elixir', icon: '🧪', materials: { starFragment: 1, crystal: 1 }, result: { type: 'food', id: 'xp-elixir', effect: { xp: 50 } }, unlockLevel: 9 },
  { id: 'mega-feast', name: 'Mega Feast', icon: '🍖', materials: { wood: 2, feather: 1, slimeGel: 1 }, result: { type: 'food', id: 'mega-feast', effect: { hunger: 80, happiness: 20 } }, unlockLevel: 12 },
  { id: 'revival-tonic', name: 'Revival Tonic', icon: '💖', materials: { crystal: 3, shadowEssence: 2, starFragment: 1 }, result: { type: 'food', id: 'revival-tonic', effect: { hunger: 100, energy: 100, happiness: 50 } }, unlockLevel: 20 },

  // Boosts
  { id: 'xp-charm', name: 'XP Charm', icon: '🔮', materials: { goldDust: 3, starFragment: 1 }, result: { type: 'boost', id: 'xp-charm', effect: { xpMultiplier: 2, duration: 600 } }, unlockLevel: 7 },
  { id: 'luck-amulet', name: 'Luck Amulet', icon: '🍀', materials: { crystal: 2, feather: 2 }, result: { type: 'boost', id: 'luck-amulet', effect: { dropRateBonus: 0.5, duration: 1800 } }, unlockLevel: 11 },
  { id: 'speed-boots', name: 'Speed Boots', icon: '👟', materials: { fabric: 3, slimeGel: 1 }, result: { type: 'boost', id: 'speed-boots', effect: { speedBoost: 2, duration: 900 } }, unlockLevel: 13 },
  { id: 'shield-orb', name: 'Shield Orb', icon: '🛡️', materials: { crystal: 3, shadowEssence: 1 }, result: { type: 'boost', id: 'shield-orb', effect: { defenseBoost: 5, duration: 1200 } }, unlockLevel: 16 },
  { id: 'rainbow-gem', name: 'Rainbow Gem', icon: '🌈', materials: { crystal: 2, goldDust: 2, starFragment: 2, slimeGel: 1, feather: 1, shadowEssence: 1 }, result: { type: 'special', id: 'rainbow-gem', effect: { allStats: 30 } }, unlockLevel: 25 },
];

const MATERIAL_INFO = {
  wood: { emoji: '🪵', name: 'Wood' },
  crystal: { emoji: '💎', name: 'Crystal' },
  fabric: { emoji: '🧵', name: 'Fabric' },
  goldDust: { emoji: '✨', name: 'Gold Dust' },
  slimeGel: { emoji: '🫧', name: 'Slime Gel' },
  shadowEssence: { emoji: '🌑', name: 'Shadow Essence' },
  feather: { emoji: '🪶', name: 'Feather' },
  starFragment: { emoji: '⭐', name: 'Star Fragment' },
};

function getDefaultMaterials() {
  return {
    wood: 0, crystal: 0, fabric: 0, goldDust: 0,
    slimeGel: 0, shadowEssence: 0, feather: 0, starFragment: 0,
  };
}

export function getMaterials() {
  try {
    const stored = localStorage.getItem(MATERIALS_KEY);
    if (stored) return { ...getDefaultMaterials(), ...JSON.parse(stored) };
  } catch (e) { /* ignore */ }
  return getDefaultMaterials();
}

function saveMaterials(materials) {
  try {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
  } catch (e) { /* ignore */ }
}

export function addMaterial(type, count = 1) {
  const materials = getMaterials();
  if (materials[type] !== undefined) {
    materials[type] += count;
    saveMaterials(materials);
  }
  return materials;
}

export function getRecipes(level = 1) {
  return RECIPES.filter((r) => r.unlockLevel <= level);
}

export function getAllRecipes() {
  return RECIPES;
}

export function canCraft(recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return false;
  const materials = getMaterials();
  return Object.entries(recipe.materials).every(
    ([mat, needed]) => (materials[mat] || 0) >= needed
  );
}

export function craft(recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return null;
  if (!canCraft(recipeId)) return null;

  const materials = getMaterials();
  Object.entries(recipe.materials).forEach(([mat, needed]) => {
    materials[mat] -= needed;
  });
  saveMaterials(materials);

  // Mark as discovered
  markDiscovered(recipeId);

  return recipe.result;
}

export function getDiscoveredRecipes() {
  try {
    const stored = localStorage.getItem(DISCOVERED_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore */ }
  return [];
}

export function isRecipeDiscovered(recipeId) {
  return getDiscoveredRecipes().includes(recipeId);
}

function markDiscovered(recipeId) {
  const discovered = getDiscoveredRecipes();
  if (!discovered.includes(recipeId)) {
    discovered.push(recipeId);
    try {
      localStorage.setItem(DISCOVERED_KEY, JSON.stringify(discovered));
    } catch (e) { /* ignore */ }
  }
}

// Check if player can "see" a recipe (has at least one required material)
export function canSeeRecipe(recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return false;
  if (isRecipeDiscovered(recipeId)) return true;
  const materials = getMaterials();
  return Object.keys(recipe.materials).some((mat) => (materials[mat] || 0) > 0);
}

export function getMaterialInfo() {
  return MATERIAL_INFO;
}

export function getRecipeById(recipeId) {
  return RECIPES.find((r) => r.id === recipeId) || null;
}
