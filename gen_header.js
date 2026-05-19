const fs = require('fs');
const path = require('path');

const content = // Pixel art sprite data for pets
// Each sprite is a 16x16 2D array of color strings (null = transparent)

// Slime colors
const G = '#4ade80'; // green body
const D = '#22c55e'; // darker green shading
const E = '#1e293b'; // eyes dark
const W = '#ffffff'; // eye highlight
const M = '#dc2626'; // mouth (red)
const B = '#fb923c'; // blush/cheeks

// Cat colors
const O = '#f97316'; // orange body
const K = '#ea580c'; // dark orange
const N = '#fbbf24'; // nose

// Ghost colors
const S = '#e2e8f0'; // white-ish body
const H = '#94a3b8'; // shadow
const P = '#7c3aed'; // purple glow

// Helper: null
const _ = null;

export const sprites = {
;

fs.writeFileSync(path.join(__dirname, 'src/data/sprites.js'), content);
console.log('header written');
