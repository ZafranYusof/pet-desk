// Plant definitions for the Garden system
const plants = [
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    unlockLevel: 1,
    growthTime: 7200, // 2 hours in seconds
    waterInterval: 3600, // needs water every 1 hour
    stages: 4,
    witheredTime: 7200, // dies if not watered for 2 hours after needing water
    reward: { type: 'stats', happiness: 20, xp: 10 },
    description: 'A cheerful flower that boosts happiness',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    emoji: '🥕',
    unlockLevel: 1,
    growthTime: 3600, // 1 hour
    waterInterval: 1800, // 30 min
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'food', foodId: 'carrot', foodName: 'Carrot', hunger: 25, xp: 5 },
    description: 'A crunchy snack for your pet',
  },
  {
    id: 'berry_bush',
    name: 'Berry Bush',
    emoji: '🫐',
    unlockLevel: 5,
    growthTime: 10800, // 3 hours
    waterInterval: 3600,
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'food', foodId: 'berries', foodName: 'Berries', hunger: 15, happiness: 10, xp: 8 },
    description: 'Sweet berries that make your pet happy',
  },
  {
    id: 'golden_wheat',
    name: 'Golden Wheat',
    emoji: '🌾',
    unlockLevel: 8,
    growthTime: 14400, // 4 hours
    waterInterval: 5400, // 1.5 hours
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'stats', xp: 30, energy: 5 },
    description: 'Nutritious wheat that gives energy',
  },
  {
    id: 'crystal_flower',
    name: 'Crystal Flower',
    emoji: '💎',
    unlockLevel: 12,
    growthTime: 21600, // 6 hours
    waterInterval: 7200, // 2 hours
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'accessory', xp: 15 },
    description: 'A rare flower that unlocks accessories',
  },
  {
    id: 'moon_fruit',
    name: 'Moon Fruit',
    emoji: '🌙',
    unlockLevel: 16,
    growthTime: 28800, // 8 hours
    waterInterval: 10800, // 3 hours
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'food', foodId: 'moon_fruit', foodName: 'Moon Fruit', hunger: 40, happiness: 20, xp: 20 },
    description: 'Mystical fruit with a night XP boost',
  },
  {
    id: 'star_seed',
    name: 'Star Seed',
    emoji: '⭐',
    unlockLevel: 20,
    growthTime: 43200, // 12 hours
    waterInterval: 14400, // 4 hours
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'stats', xp: 100 },
    description: 'A legendary seed that grants massive XP',
  },
  {
    id: 'rainbow_rose',
    name: 'Rainbow Rose',
    emoji: '🌈',
    unlockLevel: 30,
    growthTime: 86400, // 24 hours
    waterInterval: 21600, // 6 hours
    stages: 4,
    witheredTime: 7200,
    reward: { type: 'accessory_special', accessoryId: 'rainbow-crown', accessoryName: 'Rainbow Crown', xp: 200 },
    description: 'The rarest rose — unlocks the Rainbow Crown',
  },
];

export default plants;

export function getPlantById(id) {
  return plants.find((p) => p.id === id) || null;
}
