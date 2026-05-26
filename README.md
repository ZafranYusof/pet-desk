# PetDesk

[![Version](https://img.shields.io/badge/version-0.11.5-4ade80?style=flat-square)](https://github.com/ZafranYusof/pet-desk/releases)
[![License](https://img.shields.io/badge/license-MIT-10b981?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-2b2e3a?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)

A virtual desktop pet that lives on your screen. Feed it, play with it, watch it evolve. 86 components, 87 services, 9 mini games — a full pet simulation on your desktop.

## Features

### Evolution & Progression
- **9 Evolution Forms** — branching evolution tree with unique sprites per path
- **55 Achievements** — rarity tiers (common, rare, epic, legendary)
- **12 Skills** — 3 categories with skill tree progression
- **XP & Levels** — every interaction earns XP, unlock new content as you level
- **Daily Challenges** — rotating objectives with bonus rewards
- **Daily Login Rewards** — 7-day streak cycle
- **Quest Board** — multi-step quests with story progression

### Pet Life
- **Complex Mood System** — 8 moods influenced by interactions, weather, time of day
- **Personality Evolution** — pet develops traits based on how you interact
- **Visual Aging** — pet appearance changes over time
- **Dream Sequences** — animated dreams while pet sleeps
- **Pet Diary & Journal** — auto-generated entries from your pet's perspective
- **Story Mode** — narrative chapters that unlock as you progress
- **Birthday Events** — special celebrations

### Home & Decoration
- **Home Decorator** — 24 furniture items on a 6x4 grid
- **Seasonal Decorations** — holiday-themed items that rotate
- **Habitat System** — multiple environments to place your pet
- **Garden** — grow plants, harvest resources
- **Pet Room** — customizable living space

### Social & Multiplayer
- **Battle Arena** — turn-based battles with moves and abilities
- **Breeding Lab** — combine pets to create hybrids
- **Pet Visitors** — other pets visit your desktop
- **Leaderboard** — compare stats globally
- **Multi-Pet Slots** — own and switch between multiple pets

### Mini Games (9)
- Catch Food, Memory Match, Quick Tap, Snake, Tetris, Flappy Pet, Block Stack, Pet Racing, Rhythm Pet
- Arcade mode with high scores and XP rewards

### Desktop Integration
- **Real Weather** — fetches live weather (wttr.in), affects pet mood and particles
- **System Health Monitor** — CPU/RAM display widget
- **Pomodoro Timer** — focus mode with pet encouragement
- **Quick Launch** — app launcher from pet menu
- **Clipboard History** — clipboard intelligence and history
- **Desktop Organizer** — file organization helper
- **Screen Doodle** — draw on your screen
- **Screen Time Report** — usage tracking
- **Desktop Widgets** — clock, notes, system stats
- **Reminder Panel** — set reminders via pet

### AI & Chat
- **AI Chat** — talk to your pet (Ollama/local LLM integration)
- **Code Companion** — coding assistance from your pet
- **Pet Knowledge** — pet learns from conversations
- **Activity Learning** — adapts behavior based on your patterns

### Customization
- **Accessory Shop** — hats, glasses, bow-ties, and more
- **Skin Selector** — alternate color palettes
- **Sprite Editor** — create custom pet sprites
- **Color Palette** — customize pet colors
- **Sound Settings** — retro tones via Web Audio API, sound packs
- **Voice Settings** — pet voice customization
- **Keybind Settings** — custom keyboard shortcuts

### Visual & Effects
- **12 Particle Types** — sparkles, rain, hearts, fire, snow, zzz, music notes, and more
- **Ambient Backgrounds** — dynamic backgrounds based on time/weather
- **Weather Overlay** — visual weather effects on screen
- **Photo Mode** — screenshot your pet with filters
- **Prank Overlay** — fun screen pranks
- **Desktop Reactions** — pet reacts to desktop events
- **Music Detection** — pet dances when music plays

### Utility
- **Import/Export** — save/load pet data as `.petdesk` files
- **Mini Pet Widget** — compact always-visible pet widget
- **Notification Center** — centralized notifications
- **Activity Log** — track all pet interactions
- **Stats Dashboard** — detailed pet statistics
- **Auto-Save** — never lose progress
- **Crafting Table** — combine items to create new ones
- **Job Board** — send pet on jobs for rewards

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop | Electron 33 (transparent, frameless, always-on-top) |
| Frontend | React 18, Vite 6, Tailwind CSS 3 |
| Animation | Framer Motion, requestAnimationFrame |
| Sound | Web Audio API (OscillatorNode, no audio files) |
| AI | Ollama integration (local LLM) |
| Weather | wttr.in API (real-time) |
| Storage | JSON file (electron userData) + localStorage fallback |
| Sprites | Pure CSS grid (div-per-pixel rendering) |
| Installer | electron-builder, NSIS |

## Quick Start

```bash
git clone https://github.com/ZafranYusof/pet-desk.git
cd pet-desk
npm install
npm run dev
```

Pet appears on your screen. Right-click for the full menu.

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
├─ electron/           # Main process, preload, tray, click-through
├─ src/
│  ├─ components/      # 86 UI components
│  ├─ services/        # 87 service modules
│  ├─ games/           # 9 mini games
│  ├─ data/            # Sprites, accessories, furniture, moves, plants
│  ├─ hooks/           # Custom React hooks
│  ├─ context/         # Pet context provider
│  └─ styles/          # Tailwind + animations
└─ build/              # App icons
```

## Stats

- **86** components
- **87** services
- **9** mini games
- **55** achievements
- **24** furniture items
- **12** particle types
- **12** skills
- **9** evolution forms
- **8** mood states

## License

MIT
