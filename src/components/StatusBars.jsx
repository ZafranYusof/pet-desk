import React from 'react';
import { motion } from 'framer-motion';

function getBarColor(value) {
  if (value > 60) return 'bg-green-500';
  if (value >= 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

function StatusBars({ hunger = 50, energy = 50, happiness = 50 }) {
  const bars = [
    { label: 'Hunger', icon: '🍖', value: hunger, defaultColor: 'bg-orange-500' },
    { label: 'Energy', icon: '⚡', value: energy, defaultColor: 'bg-yellow-500' },
    { label: 'Happiness', icon: '💚', value: happiness, defaultColor: 'bg-green-500' },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="text-sm w-5">{bar.icon}</span>
          <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getBarColor(bar.value)}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, bar.value))}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs text-gray-400 w-7 text-right">{Math.round(bar.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default StatusBars;
