import { useState } from 'react';

export function useUI() {
  const [showStats, setShowStats] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [showAccessoryShop, setShowAccessoryShop] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showScrapbook, setShowScrapbook] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [showSpriteEditor, setShowSpriteEditor] = useState(false);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [showStatsDashboard, setShowStatsDashboard] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [showDungeon, setShowDungeon] = useState(false);
  const [showPhotoMode, setShowPhotoMode] = useState(false);
  const [showHabitatSelector, setShowHabitatSelector] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showGarden, setShowGarden] = useState(false);
  const [showJobBoard, setShowJobBoard] = useState(false);
  const [showPetRoom, setShowPetRoom] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showBreedingLab, setShowBreedingLab] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPetSlots, setShowPetSlots] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [desktopReaction, setDesktopReaction] = useState(null);

  return {
    showStats, setShowStats,
    showPetSelector, setShowPetSelector,
    showAccessoryShop, setShowAccessoryShop,
    showDiary, setShowDiary,
    showAchievements, setShowAchievements,
    showScrapbook, setShowScrapbook,
    showWidget, setShowWidget,
    showSpriteEditor, setShowSpriteEditor,
    showFoodMenu, setShowFoodMenu,
    showSoundSettings, setShowSoundSettings,
    showStatsDashboard, setShowStatsDashboard,
    showBattle, setShowBattle,
    showDungeon, setShowDungeon,
    showPhotoMode, setShowPhotoMode,
    showHabitatSelector, setShowHabitatSelector,
    showStory, setShowStory,
    showGarden, setShowGarden,
    showJobBoard, setShowJobBoard,
    showPetRoom, setShowPetRoom,
    showCrafting, setShowCrafting,
    showBreedingLab, setShowBreedingLab,
    showLeaderboard, setShowLeaderboard,
    showPetSlots, setShowPetSlots,
    contextMenu, setContextMenu,
    desktopReaction, setDesktopReaction,
  };
}
