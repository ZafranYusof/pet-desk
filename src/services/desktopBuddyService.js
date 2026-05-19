const REACTION_COOLDOWN = 300000; // 5 minutes in ms
let lastReactionTime = 0;

function getReaction(event, data) {
  const now = Date.now();
  if (now - lastReactionTime < REACTION_COOLDOWN) return null;

  let reaction = null;

  switch (event) {
    case 'idle':
      reaction = { type: 'sleep', message: "Zzz... wake me when you're back", emote: 'zzz' };
      break;
    case 'active':
      reaction = { type: 'excited', message: "You're back! I missed you!", emote: 'heart' };
      break;
    case 'app-change':
      reaction = interpretApp(data?.title || '');
      break;
    case 'long-session':
      reaction = { type: 'concern', message: "Hey, take a break! 2hrs straight!", emote: 'sweat' };
      break;
    default:
      return null;
  }

  if (reaction) {
    lastReactionTime = now;
  }
  return reaction;
}

function interpretApp(title) {
  if (!title) return null;
  const t = title.toLowerCase();

  if (/youtube|netflix|spotify|music|video/i.test(t))
    return { type: 'dance', message: "Ooh, entertainment time!", emote: 'music' };
  if (/code|visual studio|terminal|cmd|powershell|vim|neovim/i.test(t))
    return { type: 'focus', message: "Coding mode! I'll be quiet...", emote: 'star' };
  if (/game|steam|epic|roblox|minecraft|valorant/i.test(t))
    return { type: 'excited', message: "Gaming! Can I watch?", emote: 'heart' };
  if (/word|docs|excel|sheets|powerpoint|notion/i.test(t))
    return { type: 'study', message: "Working hard! You got this!", emote: 'star' };
  if (/discord|whatsapp|telegram|messenger/i.test(t))
    return { type: 'curious', message: "Chatting with friends?", emote: 'heart' };
  if (/chrome|firefox|edge|brave|browser/i.test(t))
    return { type: 'curious', message: "Browsing... find anything cool?", emote: 'heart' };

  return null; // no reaction for unknown apps
}

function resetCooldown() {
  lastReactionTime = 0;
}

export { getReaction, interpretApp, resetCooldown };
