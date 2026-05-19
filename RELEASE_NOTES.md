## PetDesk v0.6.0 - Leaderboard, Breeding, Dungeons & More

### New Features

**Online Leaderboard (Simulated)**
- 50 procedurally generated players with realistic gamertags
- 5 categories: Level, Battle Wins, Arcade Score, Total XP, Collection
- Daily score updates (fake players "play" too)
- Motivational messages and rank tracking
- Gold/silver/bronze medals for top 3

**Pet Breeding**
- Combine 2 pets to create hybrid species
- 6 hybrids: Slimecat, Ectoplasm, Phantom Cat, Mega Slime, Twin Tail, Poltergeist
- 60 unique hybrid sprites with distinct visual identities
- Requirements: both pets level 10+, 100 coins, 24h cooldown
- Hybrids inherit averaged traits from both parents

**Pet AI Chat**
- Pet talks to you with species-specific personality
- Slime: cheerful and bouncy, Cat: sassy and aloof, Ghost: mysterious and eerie
- Typewriter speech bubbles every 2-5 minutes
- Reactions to events (feed, play, pet, level up, time of day)
- Chat log with last 20 messages
- Hybrids mix both parent response pools

**Procedural Dungeon Crawler**
- 10-floor roguelike with 7x7 procedurally generated maps
- Fog of war (only visited + adjacent rooms visible)
- Tiered enemies: Pixel Bug → Data Rat → Virus → Malware → The Firewall
- Turn-based combat: Attack, Heal, Flee
- Loot table: common to legendary drops
- Exclusive boss accessories: Dungeon Crown, Shadow Blade, Firewall Shield
- Shop rooms to buy potions mid-run

**Pet Photography**
- Screenshot mode with live preview
- 8 filters: Normal, Vintage, Neon, Noir, Dreamy, Pixel, Sunset, Ice
- 6 frames: None, Polaroid, Gold, Pixel, Hearts, Space
- 10 draggable stickers (resize, reposition)
- Gallery saves up to 20 photos
- Capture with flash effect animation

### Install
```bash
git clone https://github.com/ZafranYusof/pet-desk.git
cd pet-desk
npm install
npm run dev
```
