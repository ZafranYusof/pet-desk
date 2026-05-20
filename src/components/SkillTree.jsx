import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SKILLS, SKILL_CATEGORIES, getSkillState, learnSkill } from '../services/skillService';

function SkillTree({ onClose }) {
  const [skillState, setSkillState] = useState(() => getSkillState());
  const [selectedCategory, setSelectedCategory] = useState('combat');
  const [message, setMessage] = useState(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const handleLearn = (skillId) => {
    const result = learnSkill(skillId);
    if (result.success) {
      setSkillState(getSkillState());
      showMessage(`Skill upgraded to rank ${result.newRank}!`);
    } else {
      showMessage(result.reason);
    }
  };

  const categorySkills = SKILLS.filter(s => s.category === selectedCategory);
  const totalPointsSpent = Object.entries(skillState.skills).reduce((sum, [id, rank]) => {
    const skill = SKILLS.find(s => s.id === id);
    if (!skill) return sum;
    let cost = 0;
    for (let i = 0; i < rank; i++) cost += skill.costPerRank[i];
    return sum + cost;
  }, 0);

  return (
    <motion.div
      className="fixed z-50 w-[340px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: '450px' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base">📘</span>
          <span className="text-sm font-medium text-gray-200">Skills</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-purple-400">🔮 {skillState.skillPoints} pts</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer">✕</button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-3 pt-2">
        {Object.values(SKILL_CATEGORIES).map((cat) => (
          <button
            key={cat.id}
            className={`px-2 py-1 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1 ${
              selectedCategory === cat.id
                ? `${cat.bgColor} ${cat.color} border border-current/40`
                : 'bg-gray-800/40 text-gray-400 border border-gray-700/30 hover:bg-gray-700/40'
            }`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            className="mx-3 mt-2 px-2 py-1 bg-gray-800/80 rounded-lg text-xs text-center text-gray-300"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skills list */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2">
        {categorySkills.map((skill) => {
          const currentRank = skillState.skills[skill.id] || 0;
          const isMaxed = currentRank >= skill.maxRank;
          const nextCost = isMaxed ? 0 : skill.costPerRank[currentRank];
          const canAfford = skillState.skillPoints >= nextCost;
          const cat = SKILL_CATEGORIES[skill.category];

          return (
            <motion.div
              key={skill.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isMaxed
                  ? `${cat.bgColor} border-current/30`
                  : 'bg-gray-800/40 border-gray-700/30'
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">{skill.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${isMaxed ? cat.color : 'text-gray-200'}`}>
                      {skill.name}
                    </span>
                    {isMaxed && <span className="text-[8px] px-1 bg-yellow-600/30 text-yellow-300 rounded">MAX</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">{skill.description}</p>

                  {/* Rank dots */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {Array(skill.maxRank).fill(null).map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full border ${
                          i < currentRank
                            ? `${cat.bgColor} border-current/60`
                            : 'bg-gray-800 border-gray-600/40'
                        }`}
                        style={i < currentRank ? { backgroundColor: cat.color.includes('red') ? '#f87171' : cat.color.includes('green') ? '#4ade80' : '#60a5fa' } : {}}
                      />
                    ))}
                    <span className="text-[9px] text-gray-500 ml-1">
                      {currentRank}/{skill.maxRank}
                    </span>
                  </div>

                  {/* Effect preview */}
                  {currentRank > 0 && (
                    <div className="text-[9px] text-gray-400 mt-1">
                      {skill.effects.map((eff) => {
                        const val = eff.values[currentRank - 1];
                        if (eff.stat.includes('Multiplier') && eff.stat !== 'decayMultiplier') {
                          return <span key={eff.stat}>×{val.toFixed(2)}</span>;
                        } else if (eff.stat === 'decayMultiplier') {
                          return <span key={eff.stat}>-{Math.round((1 - val) * 100)}% decay</span>;
                        } else {
                          return <span key={eff.stat}>+{Math.round(val * 100)}%</span>;
                        }
                      })}
                    </div>
                  )}
                </div>

                {/* Learn button */}
                {!isMaxed && (
                  <motion.button
                    className={`px-2 py-1 rounded-lg text-[10px] cursor-pointer whitespace-nowrap ${
                      canAfford
                        ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40 hover:bg-purple-600/60'
                        : 'bg-gray-700/40 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                    }`}
                    onClick={() => canAfford && handleLearn(skill.id)}
                    disabled={!canAfford}
                    whileHover={canAfford ? { scale: 1.05 } : {}}
                    whileTap={canAfford ? { scale: 0.95 } : {}}
                  >
                    🔮 {nextCost}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-gray-700/30 flex justify-between text-[10px] text-gray-500">
        <span>Points spent: {totalPointsSpent}</span>
        <span>Available: {skillState.skillPoints}</span>
      </div>
    </motion.div>
  );
}

export default SkillTree;
