import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EVOLUTIONS, getEvolutionStage, getEvolutionProgress } from '../services/evolutionService';

const EVOLUTION_TREE = {
  slime: {
    base: { name: 'Slime', emoji: '🟢', description: 'A bouncy little blob' },
    evolutions: [
      { stage: 1, name: 'Gel Knight', emoji: '🛡️', level: 15, statReq: null, itemReq: null, description: 'Armored slime warrior' },
      { stage: 2, name: 'Slime King', emoji: '👑', level: 25, statReq: 'happiness > 80', itemReq: null, description: 'Royal ruler of slimes' },
      { stage: 3, name: 'Cosmic Slime', emoji: '🌌', level: 40, statReq: 'all stats > 70', itemReq: 'star-fragment', description: 'Transcended beyond matter' },
    ],
  },
  cat: {
    base: { name: 'Cat', emoji: '🐱', description: 'A curious feline friend' },
    evolutions: [
      { stage: 1, name: 'Shadow Cat', emoji: '🐈‍⬛', level: 15, statReq: null, itemReq: null, description: 'Moves unseen in darkness' },
      { stage: 2, name: 'Thunder Cat', emoji: '⚡', level: 25, statReq: 'energy > 80', itemReq: null, description: 'Crackling with power' },
      { stage: 3, name: 'Celestial Cat', emoji: '✨', level: 40, statReq: 'all stats > 70', itemReq: 'moon-crystal', description: 'Guardian of the stars' },
    ],
  },
  ghost: {
    base: { name: 'Ghost', emoji: '👻', description: 'A friendly spirit' },
    evolutions: [
      { stage: 1, name: 'Phantom', emoji: '💀', level: 15, statReq: null, itemReq: null, description: 'Phasing through walls' },
      { stage: 2, name: 'Wraith', emoji: '🌑', level: 25, statReq: 'hunger < 30', itemReq: null, description: 'Feeds on shadows' },
      { stage: 3, name: 'Ethereal', emoji: '🔮', level: 40, statReq: 'all stats > 70', itemReq: 'void-essence', description: 'Between dimensions' },
    ],
  },
};

function EvolutionNode({ node, isUnlocked, isCurrent, isBase, onClick }) {
  return (
    <motion.button
      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer w-[72px] h-[72px] ${
        isCurrent
          ? 'border-purple-400 bg-purple-900/40 shadow-lg shadow-purple-500/30'
          : isUnlocked
          ? 'border-green-500/50 bg-green-900/20'
          : 'border-gray-600/40 bg-gray-800/40'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-purple-400/60"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span className={`text-2xl ${!isUnlocked && !isBase ? 'grayscale opacity-50' : ''}`}>
        {isUnlocked || isBase ? node.emoji : '❓'}
      </span>
      <span className={`text-[9px] mt-0.5 text-center leading-tight ${
        isCurrent ? 'text-purple-300' : isUnlocked ? 'text-green-300' : 'text-gray-500'
      }`}>
        {isUnlocked || isBase ? node.name : '???'}
      </span>
      {node.level && (
        <span className={`text-[8px] ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
          Lv.{node.level}
        </span>
      )}
    </motion.button>
  );
}

function ConnectionLine({ from, to, isUnlocked }) {
  return (
    <div className="flex items-center justify-center w-8">
      <motion.div
        className={`h-0.5 w-full rounded-full ${isUnlocked ? 'bg-green-500/60' : 'bg-gray-600/40'}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      {isUnlocked && (
        <motion.div
          className="absolute h-0.5 w-full rounded-full bg-green-400/40"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

function EvolutionTree({ petState, onClose }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const species = petState?.species || 'slime';
  const level = petState?.level || 1;
  const currentStage = getEvolutionStage(species, level);
  const progress = getEvolutionProgress(species, level);

  const treeData = EVOLUTION_TREE[species] || EVOLUTION_TREE.slime;
  const allSpecies = Object.keys(EVOLUTION_TREE);

  const [viewSpecies, setViewSpecies] = useState(species);
  const viewTree = EVOLUTION_TREE[viewSpecies];

  return (
    <motion.div
      className="fixed z-50 w-[340px] bg-gray-900/95 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-base">🧬</span>
          <span className="text-sm font-medium text-gray-200">Evolution Tree</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-sm cursor-pointer">✕</button>
      </div>

      {/* Species tabs */}
      <div className="flex gap-1 px-3 pt-2">
        {allSpecies.map((sp) => (
          <button
            key={sp}
            className={`px-2 py-1 rounded-lg text-xs cursor-pointer transition-all ${
              viewSpecies === sp
                ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40'
                : 'bg-gray-800/40 text-gray-400 border border-gray-700/30 hover:bg-gray-700/40'
            }`}
            onClick={() => { setViewSpecies(sp); setSelectedNode(null); }}
          >
            {EVOLUTION_TREE[sp].base.emoji} {sp.charAt(0).toUpperCase() + sp.slice(1)}
          </button>
        ))}
      </div>

      {/* Evolution path */}
      <div className="p-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-center gap-1 mb-4">
          {/* Base node */}
          <EvolutionNode
            node={viewTree.base}
            isUnlocked={true}
            isCurrent={viewSpecies === species && currentStage.stage === 0}
            isBase={true}
            onClick={() => setSelectedNode({ ...viewTree.base, isBase: true })}
          />

          {/* Evolution nodes with connections */}
          {viewTree.evolutions.map((evo, idx) => {
            const isUnlocked = viewSpecies === species && level >= evo.level;
            const isCurrent = viewSpecies === species && currentStage.stage === evo.stage;
            const prevUnlocked = idx === 0 ? true : (viewSpecies === species && level >= viewTree.evolutions[idx - 1].level);

            return (
              <React.Fragment key={evo.stage}>
                <ConnectionLine from={idx} to={idx + 1} isUnlocked={isUnlocked} />
                <EvolutionNode
                  node={evo}
                  isUnlocked={isUnlocked}
                  isCurrent={isCurrent}
                  isBase={false}
                  onClick={() => setSelectedNode(evo)}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Progress bar */}
        {viewSpecies === species && progress.next > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Level {level}</span>
              <span>Next: Lv.{progress.next}</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5 text-center">{progress.percent}% to next evolution</div>
          </div>
        )}

        {/* Selected node details */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.div
              key={selectedNode.name}
              className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{selectedNode.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-gray-200">{selectedNode.name}</div>
                  <div className="text-[10px] text-gray-400">{selectedNode.description}</div>
                </div>
              </div>

              {!selectedNode.isBase && (
                <div className="space-y-1 mt-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Requirements</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">📊 Level {selectedNode.level}</span>
                    {viewSpecies === species && level >= selectedNode.level && <span className="text-green-400 text-[10px]">✓</span>}
                  </div>
                  {selectedNode.statReq && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">⚡ {selectedNode.statReq}</span>
                    </div>
                  )}
                  {selectedNode.itemReq && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">🎁 {selectedNode.itemReq}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default EvolutionTree;
