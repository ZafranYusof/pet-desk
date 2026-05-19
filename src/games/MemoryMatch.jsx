import React, { useState, useEffect, useRef } from 'react';

const EMOJIS = ['🐱', '🐶', '🐸', '🦊', '🐼', '🐨'];
const COLS = 4;
const ROWS = 3;
const TOTAL_CARDS = COLS * ROWS;

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function MemoryMatch({ onGameEnd }) {
  const [cards, setCards] = useState(() => {
    const pairs = [...EMOJIS, ...EMOJIS]; // 6 pairs = 12 cards
    return shuffleArray(pairs).map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
  });
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [locked, setLocked] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Check for match when 2 cards flipped
  useEffect(() => {
    if (flipped.length === 2) {
      setLocked(true);
      const [first, second] = flipped;

      if (cards[first].emoji === cards[second].emoji) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === first || i === second ? { ...card, matched: true } : card
            )
          );
          setPairsFound((prev) => prev + 1);
          setFlipped([]);
          setLocked(false);
        }, 300);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card, i) =>
              i === first || i === second ? { ...card, flipped: false } : card
            )
          );
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  }, [flipped]);

  // Check win condition
  useEffect(() => {
    if (pairsFound === EMOJIS.length) {
      const xp = Math.max(5, 20 - moves);
      setTimeout(() => {
        onGameEnd(moves, xp);
      }, 500);
    }
  }, [pairsFound]);

  const handleCardClick = (index) => {
    if (locked) return;
    if (cards[index].flipped || cards[index].matched) return;
    if (flipped.length >= 2) return;

    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, flipped: true } : card))
    );
    setFlipped((prev) => [...prev, index]);

    if (flipped.length === 1) {
      setMoves((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2">
      {/* HUD */}
      <div className="w-full flex justify-between text-[10px] text-gray-400 mb-1 px-1">
        <span>Moves: {moves}</span>
        <span>{pairsFound}/{EMOJIS.length} pairs</span>
      </div>

      {/* Card grid */}
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          width: '100%',
          maxWidth: 170,
        }}
      >
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(index)}
            className={`aspect-square rounded-md flex items-center justify-center text-sm cursor-pointer transition-transform duration-200 ${
              card.flipped || card.matched
                ? 'bg-indigo-600/80 scale-100'
                : 'bg-gray-700/80 hover:bg-gray-600/80 scale-95'
            }`}
            style={{
              transform: card.flipped || card.matched ? 'scaleX(1)' : 'scaleX(1)',
              minHeight: 36,
            }}
          >
            {card.flipped || card.matched ? (
              <span className="text-base">{card.emoji}</span>
            ) : (
              <span className="text-[10px] text-gray-500">?</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MemoryMatch;
