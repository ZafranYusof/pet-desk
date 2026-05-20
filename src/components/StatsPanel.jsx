import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { speciesConfig } from '../data/sprites';
import { getEvolutionStage, getNextEvolution, getEvolutionProgress } from '../services/evolutionService';
import { getAgingData, getPetAge, getAgeStage, getAgeStageInfo } from '../services/agingService';
import { getActiveEffects } from '../services/foodService';
import { getCurrentActivity, getCategoryInfo } from '../services/activityMonitorService';

const moodEmojis = {
  happy: '😊',
  content: '🙂',
  hungry: '😫',
  tired: '😴',
  sad: '😢',
  excited: '🤩',
  neutral: '🙂',
  sleepy: '😴',
};

const moodColors = {
  happy: '#fbbf24',
  content: '#a78bfa',
  hungry: '#f87171',
  tired: '#60a5fa',
  sad: '#93c5fd',
  excited: '#f472b6',
  neutral: '#a78bfa',
  sleepy: '#60a5fa',
};

const ageStageColors = {
  Baby: 'from-pink-500 to-pink-600',
  Teen: 'from-blue-500 to-blue-600',
  Adult: 'from-purple-500 to-purple-600',
  Elder: 'from-amber-500 to-amber-600',
};

function CircularStat({ value, max = 100, label, icon, color, gradientId, size = 52 }) {
  const progress = Math.min(1, Math.max(0, value / max));
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke="rgba(55, 65, 81, 0.5)"
            strokeWidth="4"
          />
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color[0]} />
              <stop offset="100%" stopColor={color[1]} />
            </linearGradient>
          </defs>
        </svg>
        <div className="z-10 flex flex-col items-center">
          <span className="text-sm">{icon}</span>
        </div>
      </div>
      <div className="text-center">
        <motion.span
          className="text-[11px] font-bold text-white block leading-none"
          key={Math.round(value)}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {Math.round(value)}
        </motion.span>
        <span className="text-[8px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
}

function XPRing({ xp, xpToNext, level }) {
  const progress = Math.min(1, xp / xpToNext);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative w-[84px] h-[84px] flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 84 84">
        <circle
          cx="42" cy="42" r={radius}
          fill="none"
          stroke="rgba(55, 65, 81, 0.4)"
          strokeWidth="5"
        />
        <motion.circle
          cx="42" cy="42" r={radius}
          fill="none"
          stroke="url(#xpGradientNew)"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="xpGradientNew" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center z-10">
        <motion.div
          className="text-white font-black text-xl leading-none"
          style={{ textShadow: '0 0 12px rgba(168,85,247,0.6)' }}
          key={level}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, type: 'spring' }}
        >
          {level}
        </motion.div>
        <div className="text-[8px] text-purple-300/80 mt-0.5 font-bold tracking-widest">LEVEL</div>
      </div>
    </div>
  );
}

function StatsPanel({ petState, onClose, onRename, onOpenPetSelector, onOpenAccessoryShop }) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(petState?.name || 'Pet');

  const mood = petState?.mood || 'content';
  const level = petState?.level || 1;
  const xp = petState?.xp || 0;
  const xpToNext = petState?.xpToNext || 100;
  const stats = petState?.stats || {};
  const species = petState?.species || 'slime';
  const speciesName = speciesConfig[species]?.name || 'Slime';

  function handleNameSubmit() {
    if (nameInput.trim()) {
      onRename?.(nameInput.trim());
    }
    setEditing(false);
  }

  const agingData = getAgingData();
  let ageStage = 'Adult';
  let ageDisplay = '';
  if (agingData) {
    const age = getPetAge(agingData.birthDate);
    const stage = getAgeStage(age.days);
    const stageInfo = getAgeStageInfo(stage);
    ageStage = stageInfo.label;
    ageDisplay = age.displayText;
  }

  return (
    <motion.div
      className="fixed right-4 top-4 w-[260px] bg-gray-900/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/60 z-40 overflow-hidden"
      initial={{ x: 80, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 80, opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Decorative top gradient line */}
      <div className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {moodEmojis[mood] || '🙂'}
          </motion.span>
          {editing ? (
            <input
              className="bg-gray-800/80 text-white text-sm rounded-lg px-2 py-0.5 w-24 outline-none border border-purple-500/50 focus:border-purple-400 transition-colors"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
          ) : (
            <span
              className="text-white font-bold text-sm cursor-pointer hover:text-purple-300 transition-colors"
              onClick={() => setEditing(true)}
              title="Click to rename"
            >
              {petState?.name || 'Pet'}
            </span>
          )}
        </div>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-all hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Species + Age + Mood */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <span className="text-[10px] text-gray-500">{speciesName}</span>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium text-white bg-gradient-to-r ${ageStageColors[ageStage] || 'from-gray-500 to-gray-600'}`}>
          {ageStage}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium border"
          style={{ color: moodColors[mood], borderColor: moodColors[mood] + '40' }}
        >
          {mood}
        </span>
      </div>

      {/* XP Ring centered */}
      <div className="flex items-center justify-center py-3">
        <XPRing xp={xp} xpToNext={xpToNext} level={level} />
      </div>
      <div className="text-center text-[10px] text-gray-400 -mt-1 mb-3 font-mono">
        <span className="text-purple-300">{xp}</span>
        <span className="text-gray-600"> / </span>
        <span>{xpToNext} XP</span>
      </div>

      {/* Circular Stats */}
      <div className="flex justify-center gap-4 px-4 mb-4">
        <CircularStat
          value={petState?.hunger ?? 50}
          label="Food"
          icon="🍖"
          color={['#f87171', '#ef4444']}
          gradientId="hungerGrad"
        />
        <CircularStat
          value={petState?.happiness ?? 50}
          label="Happy"
          icon="💛"
          color={['#fbbf24', '#f59e0b']}
          gradientId="happyGrad"
        />
        <CircularStat
          value={petState?.energy ?? 50}
          label="Energy"
          icon="⚡"
          color={['#60a5fa', '#3b82f6']}
          gradientId="energyGrad"
        />
      </div>

      {/* Evolution */}
      {(() => {
        const evoStage = getEvolutionStage(species, level);
        const nextEvo = getNextEvolution(species, level);
        const evoProgress = getEvolutionProgress(species, level);
        return (
          <div className="px-4 mb-3">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-gray-500">Evolution</span>
                <span className="text-purple-300 font-medium">
                  {evoStage.name}
                  {evoProgress.percent >= 100 && (
                    <span className="ml-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-1.5 py-0.5 rounded text-[9px] font-bold shadow-[0_0_6px_rgba(251,191,36,0.4)]">MAX</span>
                  )}
                </span>
              </div>
              {nextEvo && (
                <>
                  <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
                    <span>Lv.{level}</span>
                    <span>Lv.{nextEvo.level} → {nextEvo.name}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800/80 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      animate={{ width: `${evoProgress.percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* Action Buttons */}
      <div className="flex gap-2 px-4 mb-3">
        <motion.button
          className="flex-1 text-[10px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 py-1.5 px-2 rounded-xl transition-colors border border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-[0_0_12px_rgba(99,102,241,0.2)]"
          onClick={onOpenPetSelector}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Change Pet
        </motion.button>
        <motion.button
          className="flex-1 text-[10px] bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 py-1.5 px-2 rounded-xl transition-colors border border-pink-500/30 hover:border-pink-400/50 hover:shadow-[0_0_12px_rgba(236,72,153,0.2)]"
          onClick={onOpenAccessoryShop}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          Accessories
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="px-4 pb-3">
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-1.5">
          {agingData && (
            <div className="flex justify-between text-[10px]">
              <span className="text-gray-500">Age</span>
              <span className="text-gray-300">{ageDisplay}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Total Pets</span>
            <span className="text-gray-300">{stats.totalPets || 0}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Days Alive</span>
            <span className="text-gray-300">{stats.daysAlive || 0}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-500">Times Fed</span>
            <span className="text-gray-300">{stats.timesFed || 0}</span>
          </div>
        </div>
      </div>

      {/* Active Food Effects */}
      {(() => {
        const effects = getActiveEffects();
        if (effects.length === 0) return null;
        return (
          <div className="px-4 pb-3">
            <div className="bg-blue-500/10 rounded-xl p-2.5 border border-blue-500/20">
              <span className="text-[9px] text-blue-400 uppercase tracking-wide font-bold">Active Effects</span>
              {effects.map((eff, i) => (
                <div key={i} className="flex justify-between text-[10px] text-gray-300 mt-1">
                  <span>{eff.foodEmoji} {eff.type === 'xpMultiplier' ? '2x XP' : eff.type === 'speedBoost' ? 'Speed+' : 'Dance'}</span>
                  <span className="text-blue-400 font-mono">
                    {Math.floor(eff.remainingSeconds / 60)}:{String(eff.remainingSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Current Activity */}
      {(() => {
        const activity = getCurrentActivity();
        if (!activity) return null;
        const info = getCategoryInfo(activity.category);
        return (
          <div className="px-4 pb-3">
            <div className="bg-emerald-500/10 rounded-xl p-2.5 border border-emerald-500/20">
              <span className="text-[9px] text-emerald-400 uppercase tracking-wide font-bold">Current Activity</span>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{info.icon}</span>
                  <span className="text-[10px] text-gray-300">{info.label}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {activity.durationMinutes > 0 ? `${activity.durationMinutes}m` : '<1m'}
                </span>
              </div>
              {activity.windowTitle && (
                <div className="text-[9px] text-gray-500 mt-1 truncate" title={activity.windowTitle}>
                  {activity.windowTitle.length > 30 ? activity.windowTitle.slice(0, 30) + '...' : activity.windowTitle}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
}

export default StatsPanel;
