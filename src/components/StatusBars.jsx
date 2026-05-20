import React from 'react';
import { motion } from 'framer-motion';

function getBarGradient(value) {
  if (value > 70) return 'from-green-400 to-emerald-500';
  if (value > 40) return 'from-yellow-400 to-orange-500';
  return 'from-red-400 to-rose-500';
}

function getBarShadow(value) {
  if (value > 70) return 'shadow-[0_0_8px_rgba(74,222,128,0.3)]';
  if (value > 40) return 'shadow-[0_0_8px_rgba(250,204,21,0.3)]';
  return 'shadow-[0_0_8px_rgba(248,113,113,0.3)]';
}

function StatusBars({ hunger = 50, energy = 50, happiness = 50 }) {
  const bars = [
    { label: 'Hunger', icon: '🍖', value: hunger },
    { label: 'Energy', icon: '⚡', value: energy },
    { label: 'Happiness', icon: '💚', value: happiness },
  ];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2">
          <span className="text-sm w-5">{bar.icon}</span>
          <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${getBarGradient(bar.value)} ${getBarShadow(bar.value)}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, bar.value))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[10px] text-gray-400 w-7 text-right font-mono">{Math.round(bar.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default StatusBars;
