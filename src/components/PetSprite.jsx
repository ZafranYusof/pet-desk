import React, { memo } from 'react';

const PetSprite = memo(({ sprite, scale = 1 }) => {
  if (!sprite || sprite.length === 0) return null;

  const cellSize = 8 * scale;
  const cols = sprite[0].length;
  const rows = sprite.length;

  return (
    <div
      className="pixel-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        width: `${cols * cellSize}px`,
        height: `${rows * cellSize}px`,
        imageRendering: 'pixelated',
      }}
    >
      {sprite.flat().map((color, i) => (
        <div
          key={i}
          className="pixel-cell"
          style={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            backgroundColor: color || 'transparent',
          }}
        />
      ))}
    </div>
  );
});

PetSprite.displayName = 'PetSprite';

export default PetSprite;
