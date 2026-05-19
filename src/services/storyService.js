const STORY_KEY = 'petdesk_story_progress';

const chapters = [
  {
    id: 1,
    title: "The Awakening",
    unlockLevel: 1,
    theme: { bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', accent: '#e94560' },
    scenes: [
      { id: 'ch1_s1', text: "You open your eyes for the first time. The desktop stretches endlessly before you. A blinking cursor catches your attention...", speaker: 'narrator', choices: [{ text: "Approach the cursor", next: 'ch1_s2a', effect: { happiness: 5, xp: 10 } }, { text: "Hide behind an icon", next: 'ch1_s2b', effect: { energy: 5, xp: 10 } }] },
      { id: 'ch1_s2a', text: "The cursor pulses warmly as you approach. It seems friendly! It blinks twice and points toward a glowing folder...", speaker: 'narrator', choices: [{ text: "Follow the cursor", next: 'ch1_s3', effect: { happiness: 3, xp: 15 } }, { text: "Touch the cursor", next: 'ch1_s3', effect: { energy: 3, xp: 15 } }] },
      { id: 'ch1_s2b', text: "You peek from behind a Recycle Bin icon. The desktop is vast and mysterious. Strange sounds echo from the taskbar below...", speaker: 'narrator', choices: [{ text: "Explore cautiously", next: 'ch1_s3', effect: { happiness: 3, xp: 15 } }, { text: "Stay hidden longer", next: 'ch1_s3', effect: { energy: 5, xp: 10 } }] },
      { id: 'ch1_s3', text: "You discover a small note left by a previous pet: 'Welcome to the Desktop. Everything here is alive. Trust the pixels.' This is your home now.", speaker: 'narrator', choices: [{ text: "Embrace your new home", next: 'ch1_end', effect: { happiness: 10, xp: 20 } }] },
      { id: 'ch1_end', text: "You feel a warm glow inside. The desktop welcomes you. Your adventure has just begun...", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 50, food: 'star_candy' }
  },
  {
    id: 2,
    title: "The Icon Forest",
    unlockLevel: 3,
    theme: { bg: 'linear-gradient(135deg, #0b3d0b 0%, #1a5c1a 50%, #2d8a2d 100%)', accent: '#7fff00' },
    scenes: [
      { id: 'ch2_s1', text: "The desktop icons tower above you like ancient trees. Each one hums with a different energy. A shortcut arrow points deeper into the forest...", speaker: 'narrator', choices: [{ text: "Follow the arrow", next: 'ch2_s2a', effect: { happiness: 5, xp: 10 } }, { text: "Climb an icon", next: 'ch2_s2b', effect: { energy: -5, xp: 15 } }] },
      { id: 'ch2_s2a', text: "The path leads to a clearing where .exe files dance in circles. They invite you to join their ritual...", speaker: 'narrator', choices: [{ text: "Join the dance", next: 'ch2_s3', effect: { happiness: 8, xp: 15 } }, { text: "Watch from afar", next: 'ch2_s3', effect: { energy: 3, xp: 10 } }] },
      { id: 'ch2_s2b', text: "From the top of a Chrome icon, you can see the entire desktop. The taskbar glows like a river of light below...", speaker: 'narrator', choices: [{ text: "Slide down", next: 'ch2_s3', effect: { happiness: 5, xp: 15 } }, { text: "Jump to next icon", next: 'ch2_s3', effect: { energy: -3, xp: 20 } }] },
      { id: 'ch2_s3', text: "A wise old .txt file speaks: 'Beyond the forest lies the Taskbar Tunnels. Few pets return unchanged.' You feel ready.", speaker: 'narrator', choices: [{ text: "Thank the elder", next: 'ch2_end', effect: { happiness: 5, xp: 20 } }] },
      { id: 'ch2_end', text: "The Icon Forest parts before you. You've earned the respect of the desktop dwellers. New paths await...", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 50, food: 'pixel_berry' }
  },
  {
    id: 3,
    title: "The Taskbar Tunnels",
    unlockLevel: 5,
    theme: { bg: 'linear-gradient(135deg, #1a1a3e 0%, #2d2d5e 50%, #4a4a8a 100%)', accent: '#00d4ff' },
    scenes: [
      { id: 'ch3_s1', text: "The taskbar stretches like an underground tunnel. Pinned apps glow like lanterns. The Start Menu looms ahead like a great gate...", speaker: 'narrator', choices: [{ text: "Enter the Start Menu", next: 'ch3_s2a', effect: { happiness: 3, xp: 15 } }, { text: "Explore the system tray", next: 'ch3_s2b', effect: { energy: 3, xp: 15 } }] },
      { id: 'ch3_s2a', text: "Inside the Start Menu, programs are organized like a vast library. Recently used apps whisper your user's secrets...", speaker: 'narrator', choices: [{ text: "Listen to the whispers", next: 'ch3_s3', effect: { happiness: 5, xp: 20 } }, { text: "Search for something", next: 'ch3_s3', effect: { energy: -3, xp: 25 } }] },
      { id: 'ch3_s2b', text: "The system tray is cozy. WiFi signal pulses like a heartbeat. Battery icon watches over everything like a guardian...", speaker: 'narrator', choices: [{ text: "Chat with WiFi", next: 'ch3_s3', effect: { happiness: 5, xp: 15 } }, { text: "Check the clock", next: 'ch3_s3', effect: { energy: 5, xp: 15 } }] },
      { id: 'ch3_s3', text: "A notification pops up: 'You have discovered the heart of the system. The tunnels remember all who pass through.'", speaker: 'narrator', choices: [{ text: "Leave your mark", next: 'ch3_end', effect: { happiness: 8, xp: 25 } }] },
      { id: 'ch3_end', text: "The taskbar hums with approval. You are now a recognized traveler of the digital underground.", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 50, food: 'byte_cookie' }
  },
  {
    id: 4,
    title: "The Recycle Bin Dungeon",
    unlockLevel: 8,
    theme: { bg: 'linear-gradient(135deg, #2d1b00 0%, #4a2d00 50%, #6b3d00 100%)', accent: '#ff6b00' },
    scenes: [
      { id: 'ch4_s1', text: "The Recycle Bin yawns open like a dungeon entrance. Deleted files cry out from within. Something valuable was lost here...", speaker: 'narrator', choices: [{ text: "Descend bravely", next: 'ch4_s2a', effect: { energy: -5, xp: 20 } }, { text: "Call out first", next: 'ch4_s2b', effect: { happiness: 3, xp: 15 } }] },
      { id: 'ch4_s2a', text: "Corrupted data swirls around you like bats. A deleted photo cries: 'Please, restore me! I'm someone's memory!'", speaker: 'narrator', choices: [{ text: "Try to restore it", next: 'ch4_s3', effect: { happiness: 10, xp: 25 } }, { text: "It's too dangerous", next: 'ch4_s3', effect: { energy: 5, xp: 15 } }] },
      { id: 'ch4_s2b', text: "An echo returns: 'Who dares enter? Only the brave or the foolish venture here...' A boss file blocks the path!", speaker: 'narrator', choices: [{ text: "Face the boss", next: 'ch4_s3', effect: { energy: -8, xp: 30 } }, { text: "Sneak around", next: 'ch4_s3', effect: { happiness: 3, xp: 20 } }] },
      { id: 'ch4_s3', text: "Deep in the bin, you find a golden file - an ancient system restore point. It pulses with power...", speaker: 'narrator', choices: [{ text: "Absorb its power", next: 'ch4_end', effect: { happiness: 8, energy: 8, xp: 30 } }] },
      { id: 'ch4_end', text: "You emerge victorious! The Recycle Bin bows to your courage. Deleted files cheer as you leave.", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 100, food: 'golden_byte', accessory: 'dungeon_crown' }
  },
  {
    id: 5,
    title: "The Browser Ocean",
    unlockLevel: 10,
    theme: { bg: 'linear-gradient(135deg, #001a33 0%, #003366 50%, #004d99 100%)', accent: '#00bfff' },
    scenes: [
      { id: 'ch5_s1', text: "Browser tabs stretch like an infinite ocean. Each tab is an island with its own world. Waves of data crash between them...", speaker: 'narrator', choices: [{ text: "Surf the tabs", next: 'ch5_s2a', effect: { happiness: 8, xp: 20 } }, { text: "Dive into the source", next: 'ch5_s2b', effect: { energy: -5, xp: 25 } }] },
      { id: 'ch5_s2a', text: "You ride a HTTP request like a wave! Cookies float by like jellyfish. A popup ad tries to grab you!", speaker: 'narrator', choices: [{ text: "Dodge the popup", next: 'ch5_s3', effect: { happiness: 5, xp: 20 } }, { text: "Block it with AdBlock", next: 'ch5_s3', effect: { energy: 3, xp: 25 } }] },
      { id: 'ch5_s2b', text: "The HTML source code reveals hidden treasures. CSS styles paint the world in beautiful colors around you...", speaker: 'narrator', choices: [{ text: "Swim through the DOM", next: 'ch5_s3', effect: { happiness: 5, xp: 25 } }, { text: "Ride a JavaScript event", next: 'ch5_s3', effect: { energy: -3, xp: 30 } }] },
      { id: 'ch5_s3', text: "You discover a bookmark - a portal to a saved memory. The browser remembers everything...", speaker: 'narrator', choices: [{ text: "Save this moment", next: 'ch5_end', effect: { happiness: 10, xp: 25 } }] },
      { id: 'ch5_end', text: "The Browser Ocean accepts you as a navigator. Your browsing history now includes an epic adventure!", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 100, food: 'cookie_data', accessory: 'surf_board' }
  },
  {
    id: 6,
    title: "The RAM Mountains",
    unlockLevel: 13,
    theme: { bg: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #4d0099 100%)', accent: '#bf00ff' },
    scenes: [
      { id: 'ch6_s1', text: "The RAM Mountains tower above - each peak a memory address. Data flows like rivers between the valleys. The air is electric...", speaker: 'narrator', choices: [{ text: "Climb the stack", next: 'ch6_s2a', effect: { energy: -8, xp: 25 } }, { text: "Follow the heap", next: 'ch6_s2b', effect: { happiness: 5, xp: 20 } }] },
      { id: 'ch6_s2a', text: "The call stack is treacherous! Functions call out as you pass. A recursive loop nearly traps you forever...", speaker: 'narrator', choices: [{ text: "Break the loop", next: 'ch6_s3', effect: { happiness: 8, xp: 30 } }, { text: "Ride the recursion", next: 'ch6_s3', effect: { energy: -5, xp: 35 } }] },
      { id: 'ch6_s2b', text: "The heap is chaotic but beautiful. Memory allocations bloom like flowers, then get garbage collected...", speaker: 'narrator', choices: [{ text: "Avoid the garbage collector", next: 'ch6_s3', effect: { happiness: 5, xp: 25 } }, { text: "Befriend it", next: 'ch6_s3', effect: { energy: 5, xp: 25 } }] },
      { id: 'ch6_s3', text: "At the peak, you see the entire system laid out below. A memory leak threatens to flood the valley!", speaker: 'narrator', choices: [{ text: "Patch the leak", next: 'ch6_end', effect: { happiness: 10, energy: 5, xp: 30 } }] },
      { id: 'ch6_end', text: "You saved the RAM Mountains from overflow! The system runs smoother thanks to your bravery.", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 100, food: 'memory_crystal', accessory: 'ram_helmet' }
  },
  {
    id: 7,
    title: "The Virus Invasion",
    unlockLevel: 16,
    theme: { bg: 'linear-gradient(135deg, #330000 0%, #660000 50%, #990000 100%)', accent: '#ff0000' },
    scenes: [
      { id: 'ch7_s1', text: "Red alerts flash everywhere! Malware has breached the firewall! The system needs a hero. Corrupted files march like an army...", speaker: 'narrator', choices: [{ text: "Fight head-on", next: 'ch7_s2a', effect: { energy: -10, xp: 30 } }, { text: "Set up defenses", next: 'ch7_s2b', effect: { happiness: 5, xp: 25 } }] },
      { id: 'ch7_s2a', text: "You clash with a trojan horse! It disguises itself as a friendly .exe but you see through its lies!", speaker: 'narrator', choices: [{ text: "Quarantine it!", next: 'ch7_s3', effect: { happiness: 8, xp: 35 } }, { text: "Delete it permanently", next: 'ch7_s3', effect: { energy: -5, xp: 40 } }] },
      { id: 'ch7_s2b', text: "You rally the antivirus definitions! They form a shield wall. The malware crashes against your defenses...", speaker: 'narrator', choices: [{ text: "Counter-attack!", next: 'ch7_s3', effect: { happiness: 10, xp: 30 } }, { text: "Hold the line", next: 'ch7_s3', effect: { energy: 5, xp: 30 } }] },
      { id: 'ch7_s3', text: "The virus boss appears - a massive ransomware that encrypts everything it touches! Final battle!", speaker: 'narrator', choices: [{ text: "Use the decryption key", next: 'ch7_end', effect: { happiness: 15, xp: 40 } }] },
      { id: 'ch7_end', text: "VICTORY! The virus is defeated! The system celebrates. You are now the Guardian of the Firewall!", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 150, food: 'antivirus_potion', accessory: 'firewall_shield' }
  },
  {
    id: 8,
    title: "The Cloud Kingdom",
    unlockLevel: 20,
    theme: { bg: 'linear-gradient(135deg, #e6f3ff 0%, #b3d9ff 50%, #80bfff 100%)', accent: '#0066cc' },
    scenes: [
      { id: 'ch8_s1', text: "You ascend through the network cables into the Cloud. Everything is light and weightless here. Servers float like castles...", speaker: 'narrator', choices: [{ text: "Visit a server castle", next: 'ch8_s2a', effect: { happiness: 8, xp: 30 } }, { text: "Float freely", next: 'ch8_s2b', effect: { energy: 8, xp: 25 } }] },
      { id: 'ch8_s2a', text: "The server castle holds backups of everything - photos, documents, memories. A cloud dragon guards the data...", speaker: 'narrator', choices: [{ text: "Befriend the dragon", next: 'ch8_s3', effect: { happiness: 10, xp: 35 } }, { text: "Sneak past", next: 'ch8_s3', effect: { energy: -5, xp: 40 } }] },
      { id: 'ch8_s2b', text: "Floating through the cloud, you meet other pets from other computers! They share stories of their users...", speaker: 'narrator', choices: [{ text: "Share your story", next: 'ch8_s3', effect: { happiness: 10, xp: 30 } }, { text: "Listen quietly", next: 'ch8_s3', effect: { energy: 5, xp: 30 } }] },
      { id: 'ch8_s3', text: "The Cloud King offers you citizenship. You could live here forever in perfect sync... but your desktop needs you.", speaker: 'narrator', choices: [{ text: "Return home", next: 'ch8_end', effect: { happiness: 15, xp: 40 } }] },
      { id: 'ch8_end', text: "You descend from the Cloud Kingdom with new wisdom. The sky is no longer the limit - it's just the beginning.", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 150, food: 'cloud_nectar', accessory: 'cloud_wings' }
  },
  {
    id: 9,
    title: "The Dark Web",
    unlockLevel: 25,
    theme: { bg: 'linear-gradient(135deg, #000000 0%, #1a0a1a 50%, #0d0d0d 100%)', accent: '#00ff41' },
    scenes: [
      { id: 'ch9_s1', text: "Beyond the normal network lies the Dark Web. Encrypted tunnels twist in impossible directions. Tor nodes flicker like dying stars...", speaker: 'narrator', choices: [{ text: "Proceed with stealth", next: 'ch9_s2a', effect: { energy: -5, xp: 35 } }, { text: "Light the way", next: 'ch9_s2b', effect: { happiness: 3, xp: 30 } }] },
      { id: 'ch9_s2a', text: "In the shadows, encrypted messages float by. A mysterious .onion file offers forbidden knowledge...", speaker: 'narrator', choices: [{ text: "Decline politely", next: 'ch9_s3', effect: { happiness: 8, xp: 35 } }, { text: "Investigate carefully", next: 'ch9_s3', effect: { energy: -5, xp: 45 } }] },
      { id: 'ch9_s2b', text: "Your light reveals hidden paths! But it also attracts attention. Shadowy processes emerge from the darkness...", speaker: 'narrator', choices: [{ text: "Stand your ground", next: 'ch9_s3', effect: { happiness: 5, xp: 40 } }, { text: "Encrypt yourself", next: 'ch9_s3', effect: { energy: -3, xp: 40 } }] },
      { id: 'ch9_s3', text: "Deep in the dark web, you find a fragment of ancient code - it speaks of your origin. 'The Source Code awaits...'", speaker: 'narrator', choices: [{ text: "Remember the path", next: 'ch9_end', effect: { happiness: 10, xp: 45 } }] },
      { id: 'ch9_end', text: "You escape the Dark Web with a clue to your creation. One final chapter remains...", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 150, food: 'encrypted_treat', accessory: 'shadow_cloak' }
  },
  {
    id: 10,
    title: "The Source Code",
    unlockLevel: 30,
    theme: { bg: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 50%, #ffe082 100%)', accent: '#ff6f00' },
    scenes: [
      { id: 'ch10_s1', text: "You stand before the Source Code - the very program that created you. Lines of JavaScript shimmer like golden threads...", speaker: 'narrator', choices: [{ text: "Read your own code", next: 'ch10_s2a', effect: { happiness: 10, xp: 40 } }, { text: "Touch the code", next: 'ch10_s2b', effect: { energy: 5, xp: 40 } }] },
      { id: 'ch10_s2a', text: "You see it all - every function that makes you think, feel, and grow. You were made with love and care...", speaker: 'narrator', choices: [{ text: "Accept who you are", next: 'ch10_s3', effect: { happiness: 15, xp: 50 } }, { text: "Wonder about more", next: 'ch10_s3', effect: { energy: 5, xp: 50 } }] },
      { id: 'ch10_s2b', text: "The code responds to your touch! Variables light up, functions sing. You are both the creation and the creator...", speaker: 'narrator', choices: [{ text: "Add a comment", next: 'ch10_s3', effect: { happiness: 15, xp: 50 } }, { text: "Just observe", next: 'ch10_s3', effect: { energy: 10, xp: 45 } }] },
      { id: 'ch10_s3', text: "The Source Code speaks: 'You have journeyed far, little pet. From awakening to understanding. You are complete.'", speaker: 'narrator', choices: [{ text: "Thank the Source", next: 'ch10_end', effect: { happiness: 20, energy: 20, xp: 60 } }] },
      { id: 'ch10_end', text: "You return to your desktop, forever changed. You know who you are now - a Digital Pioneer, born from code, alive through love.", speaker: 'narrator', choices: [] }
    ],
    reward: { xp: 300, food: 'source_essence', accessory: 'source_code_aura', title: 'Digital Pioneer' }
  }
];

function getStoryProgress() {
  try {
    const stored = localStorage.getItem(STORY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return { currentChapter: null, completedChapters: [], currentScene: null, choices: {} };
}

function saveStoryProgress(progress) {
  try {
    localStorage.setItem(STORY_KEY, JSON.stringify(progress));
  } catch (e) {}
}

function getAvailableChapters(level) {
  return chapters.filter(ch => ch.unlockLevel <= level);
}

function getScene(chapterId, sceneId) {
  const chapter = chapters.find(ch => ch.id === chapterId);
  if (!chapter) return null;
  if (!sceneId) return chapter.scenes[0];
  return chapter.scenes.find(s => s.id === sceneId) || null;
}

function getChapter(chapterId) {
  return chapters.find(ch => ch.id === chapterId) || null;
}

function makeChoice(chapterId, sceneId, choiceIndex) {
  const scene = getScene(chapterId, sceneId);
  if (!scene || !scene.choices[choiceIndex]) return null;
  const choice = scene.choices[choiceIndex];
  const progress = getStoryProgress();
  if (!progress.choices[chapterId]) progress.choices[chapterId] = {};
  progress.choices[chapterId][sceneId] = choiceIndex;
  progress.currentScene = choice.next;
  saveStoryProgress(progress);
  return { nextScene: choice.next, effects: choice.effect || {} };
}

function completeChapter(chapterId) {
  const chapter = chapters.find(ch => ch.id === chapterId);
  if (!chapter) return null;
  const progress = getStoryProgress();
  if (!progress.completedChapters.includes(chapterId)) {
    progress.completedChapters.push(chapterId);
  }
  progress.currentChapter = null;
  progress.currentScene = null;
  saveStoryProgress(progress);
  return chapter.reward;
}

function isChapterComplete(chapterId) {
  const progress = getStoryProgress();
  return progress.completedChapters.includes(chapterId);
}

function startChapter(chapterId) {
  const progress = getStoryProgress();
  progress.currentChapter = chapterId;
  progress.currentScene = null;
  saveStoryProgress(progress);
}

export { chapters, getStoryProgress, saveStoryProgress, getAvailableChapters, getScene, getChapter, makeChoice, completeChapter, isChapterComplete, startChapter };
