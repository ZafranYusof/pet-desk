# PetDesk

[![Version](https://img.shields.io/badge/version-0.3.0-4ade80?style=flat-square)](https://github.com/ZafranYusof/pet-desk/releases)
[![License](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-2b2e3a?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)

A virtual desktop pet that lives on your screen. Feed it, play with it, watch it grow. Pure pixel art, no image files.

## Features

### Your Pet
- **3 Species** — Slime (default), Cat (unlock lvl 5), Ghost (unlock lvl 10)
- **Unique Personalities** — Slime is bouncy, Cat ignores you sometimes, Ghost teleports and flickers
- **12 Accessories** — Hats, glasses, bow-ties. Unlock as you level up
- **Full Desktop Roaming** — Pet walks along the bottom of your screen, jumps, changes direction
- **Day/Night Cycle** — Pet gets sleepy at night, energetic in the morning
- **Weather System** — Simulated weather affects mood (rain = sad, sunny = happy)

### Interaction
- **Click to pet** — Hearts float up, happiness increases
- **Right-click menu** — Feed, Play, Sleep, Diary, Achievements, Scrapbook
- **Mini Games** — Catch Food, Memory Match, Quick Tap (earn XP)
- **Desktop Notifications** — Pet reminds you when hungry or bored

### Progression
- **XP & Levels** — Every interaction earns XP. Level up to unlock pets and accessories
- **20 Achievements** — "First Meal", "Game Master", "Night Owl", and more
- **Daily Login Rewards** — 7-day streak cycle with XP bonuses and accessory unlocks
- **Pet Diary** — Auto-generated entries from your pet's perspective
- **Scrapbook** — Timeline of milestones (level ups, firsts, achievements)

### Visual
- **Pixel Art** — All sprites rendered via CSS grid (no image files, 16x16 grids)
- **7 Particle Effects** — Sparkles, rain, hearts, fire, snow, zzz, music notes
- **Sound Effects** — Retro tones via Web Audio API (chirp, munch, bounce, snore)
- **Transparent Overlay** — Click-through everywhere except the pet itself

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop | Electron 33 (transparent, frameless, always-on-top) |
| Frontend | React 18, Vite 6, Tailwind CSS 3 |
| Animation | Framer Motion, requestAnimationFrame |
| Sound | Web Audio API (OscillatorNode, no audio files) |
| Storage | JSON file (electron userData) + localStorage fallback |
| Sprites | Pure CSS grid (div-per-pixel, 8px cells) |

## Quick Start

```bash
git clone https://github.com/ZafranYusof/pet-desk.git
cd pet-desk
npm install
npm run dev
```

Pet appears at the bottom-right of your screen. Press **F10** to toggle visibility.

## Controls

| Action | How |
|--------|-----|
| Pet | Left-click the pet |
| Menu | Right-click the pet |
| Toggle visibility | F10 |
| Tray | Click tray icon for quick actions |

## Build Installer

```bash
npm run build:exe
```

Windows NSIS installer outputs to `release/`.

## Project Structure

```
pet-desk/
├── electron/           # Main process, preload, tray
├── src/
│   ├── components/     # Pet, Emotes, Particles, UI panels
│   ├── data/           # Sprite grids, accessories
│   ├── games/          # Mini games (CatchFood, MemoryMatch, QuickTap)
│   ├── services/       # Pet engine, storage, sound, weather, diary, achievements
│   └── styles/         # Tailwind + sprite CSS
└── build/              # Tray icon
```

## Unlock Progression

| Level | Unlock |
|-------|--------|
| 1 | Slime + Party Hat |
| 2 | Top Hat |
| 3 | Sunglasses, Flower |
| 4 | Nerd Glasses |
| 5 | **Cat** + Bow Tie |
| 6 | Scarf |
| 7 | Crown |
| 8 | Monocle |
| 9 | Halo |
| 10 | **Ghost** |
| 11 | Devil Horns |
| 12 | Wizard Hat |

## License

MIT
