// Accessory definitions for PetDesk
// Each accessory is a small pixel grid (8x8 or 8x6) with position offsets

const _ = null;
const BK = '#1e293b'; // black
const GD = '#fbbf24'; // gold
const SV = '#94a3b8'; // silver
const RD = '#dc2626'; // red
const BL = '#3b82f6'; // blue
const PR = '#7c3aed'; // purple
const WH = '#ffffff'; // white
const PK = '#f472b6'; // pink
const GN = '#22c55e'; // green
const YL = '#facc15'; // yellow

export const accessories = [
  {
    id: 'party-hat',
    name: 'Party Hat',
    category: 'hat',
    unlockLevel: 1,
    offset: { x: 4, y: -4 },
    pixels: [
      [_,_,_,_,RD,_,_,_],
      [_,_,_,RD,RD,_,_,_],
      [_,_,_,RD,BL,RD,_,_],
      [_,_,RD,BL,RD,BL,_,_],
      [_,_,RD,RD,BL,RD,_,_],
      [_,RD,BL,RD,RD,BL,RD,_],
      [GD,GD,GD,GD,GD,GD,GD,GD],
    ],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    category: 'hat',
    unlockLevel: 2,
    offset: { x: 4, y: -5 },
    pixels: [
      [_,_,BK,BK,BK,BK,_,_],
      [_,_,BK,BK,BK,BK,_,_],
      [_,_,BK,BK,BK,BK,_,_],
      [_,_,BK,BK,BK,BK,_,_],
      [_,_,BK,RD,RD,BK,_,_],
      [BK,BK,BK,BK,BK,BK,BK,BK],
      [BK,BK,BK,BK,BK,BK,BK,BK],
    ],
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    category: 'glasses',
    unlockLevel: 3,
    offset: { x: 3, y: 0 },
    pixels: [
      [_,_,_,_,_,_,_,_],
      [BK,BK,BK,BK,BK,BK,BK,BK],
      [BK,BK,BK,BK,BK,BK,BK,BK],
      [BK,BK,BK,_,_,BK,BK,BK],
    ],
  },
  {
    id: 'flower',
    name: 'Flower',
    category: 'other',
    unlockLevel: 3,
    offset: { x: -2, y: -1 },
    pixels: [
      [_,_,PK,_,_,_,_,_],
      [_,PK,YL,PK,_,_,_,_],
      [_,_,PK,_,_,_,_,_],
      [_,_,GN,_,_,_,_,_],
      [_,_,GN,_,_,_,_,_],
    ],
  },
  {
    id: 'nerd-glasses',
    name: 'Nerd Glasses',
    category: 'glasses',
    unlockLevel: 4,
    offset: { x: 3, y: 0 },
    pixels: [
      [BK,BK,BK,_,_,BK,BK,BK],
      [BK,WH,BK,BK,BK,WH,BK,_],
      [BK,BK,BK,_,_,BK,BK,_],
    ],
  },
  {
    id: 'bow-tie',
    name: 'Bow Tie',
    category: 'other',
    unlockLevel: 5,
    offset: { x: 4, y: 5 },
    pixels: [
      [_,RD,_,_,_,RD,_,_],
      [RD,RD,RD,GD,RD,RD,RD,_],
      [_,RD,_,_,_,RD,_,_],
    ],
  },
  {
    id: 'scarf',
    name: 'Scarf',
    category: 'other',
    unlockLevel: 6,
    offset: { x: 2, y: 5 },
    pixels: [
      [_,RD,RD,RD,RD,RD,RD,_],
      [RD,RD,WH,RD,WH,RD,RD,RD],
      [_,_,_,_,_,_,RD,RD],
      [_,_,_,_,_,_,RD,RD],
    ],
  },
  {
    id: 'crown',
    name: 'Crown',
    category: 'hat',
    unlockLevel: 7,
    offset: { x: 3, y: -4 },
    pixels: [
      [_,GD,_,GD,_,GD,_,_],
      [_,GD,GD,GD,GD,GD,_,_],
      [_,GD,RD,GD,RD,GD,_,_],
      [_,GD,GD,GD,GD,GD,_,_],
    ],
  },
  {
    id: 'monocle',
    name: 'Monocle',
    category: 'glasses',
    unlockLevel: 8,
    offset: { x: 5, y: 0 },
    pixels: [
      [_,GD,GD,GD,_,_,_,_],
      [GD,WH,WH,GD,_,_,_,_],
      [_,GD,GD,GD,_,_,_,_],
      [_,_,GD,_,_,_,_,_],
      [_,_,_,GD,_,_,_,_],
    ],
  },
  {
    id: 'halo',
    name: 'Halo',
    category: 'other',
    unlockLevel: 9,
    offset: { x: 3, y: -5 },
    pixels: [
      [_,_,YL,YL,YL,YL,_,_],
      [_,YL,_,_,_,_,YL,_],
      [_,_,YL,YL,YL,YL,_,_],
    ],
  },
  {
    id: 'devil-horns',
    name: 'Devil Horns',
    category: 'hat',
    unlockLevel: 11,
    offset: { x: 3, y: -4 },
    pixels: [
      [RD,_,_,_,_,_,RD,_],
      [RD,RD,_,_,_,RD,RD,_],
      [_,RD,_,_,_,RD,_,_],
    ],
  },
  {
    id: 'wizard-hat',
    name: 'Wizard Hat',
    category: 'hat',
    unlockLevel: 12,
    offset: { x: 3, y: -6 },
    pixels: [
      [_,_,_,PR,_,_,_,_],
      [_,_,PR,PR,_,_,_,_],
      [_,_,PR,PR,PR,_,_,_],
      [_,PR,PR,GD,PR,PR,_,_],
      [_,PR,PR,PR,PR,PR,_,_],
      [PR,PR,GD,PR,GD,PR,PR,_],
      [PR,PR,PR,PR,PR,PR,PR,PR],
    ],
  },
];

export default accessories;
