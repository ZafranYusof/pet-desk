import React from 'react';

/**
 * Renders an accessory pixel grid overlaid on the pet.
 * Uses same technique as PetSprite but smaller cells.
 */
function Accessory({ accessory, speciesOffsets, cellSize = 4 }) {
  if (!accessory || !accessory.pixels) return null;

  const categoryOffset = speciesOffsets?.[accessory.category] || { x: 0, y: 0 };
  const accOffset = accessory.offset || { x: 0, y: 0 };

  const totalOffsetX = (categoryOffset.x + accOffset.x) * cellSize;
  const totalOffsetY = (categoryOffset.y + accOffset.y) * cellSize;

  const rows = accessory.pixels.length;
  const cols = accessory.pixels[0]?.length || 0;
  const width = cols * cellSize;
  const height = rows * cellSize;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        top: '50%',
        left: '50%',
        transform: `translate(calc(-50% + ${totalOffsetX}px), calc(-50% + ${totalOffsetY}px))`,
        zIndex: 10,
      }}
    >
      {accessory.pixels.map((row, y) => (
        <div key={y} className="flex">
          {row.map((color, x) => (
            <div
              key={`${x}-${y}`}
              style={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                backgroundColor: color || 'transparent',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Accessory;
