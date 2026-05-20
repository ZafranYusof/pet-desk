import { useState } from 'react';

export function useArcade() {
  const [showArcade, setShowArcade] = useState(false);
  const [activeGame, setActiveGame] = useState(null);

  return {
    showArcade,
    setShowArcade,
    activeGame,
    setActiveGame,
  };
}
