import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoryProgress, saveStoryProgress, getAvailableChapters, getScene, getChapter, makeChoice, completeChapter, isChapterComplete, startChapter, chapters } from '../services/storyService';

function StoryMode({ petLevel, onClose, onEffect }) {
  const [view, setView] = useState('chapters'); // 'chapters' | 'scene'
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeScene, setActiveScene] = useState(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [fadeTransition, setFadeTransition] = useState(false);
  const typewriterRef = useRef(null);
  const progress = getStoryProgress();

  const available = getAvailableChapters(petLevel || 1);

  const startScene = useCallback((chapterId, sceneId) => {
    const scene = getScene(chapterId, sceneId);
    if (!scene) {
      // Chapter complete
      const reward = completeChapter(chapterId);
      if (reward && onEffect) {
        onEffect({ xp: reward.xp || 0 });
      }
      setView('chapters');
      setActiveChapter(null);
      setActiveScene(null);
      return;
    }
    setActiveScene(scene);
    setDisplayedText('');
    setShowChoices(false);
    setIsTyping(true);

    // Typewriter effect
    let i = 0;
    const text = scene.text;
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        setIsTyping(false);
        setTimeout(() => setShowChoices(true), 300);
      }
    }, 30);
  }, [onEffect]);

  const handleChapterSelect = useCallback((chapterId) => {
    const chapter = getChapter(chapterId);
    if (!chapter) return;
    startChapter(chapterId);
    setActiveChapter(chapter);
    setView('scene');
    startScene(chapterId, null);
  }, [startScene]);

  const handleChoice = useCallback((choiceIndex) => {
    if (!activeChapter || !activeScene) return;
    const result = makeChoice(activeChapter.id, activeScene.id, choiceIndex);
    if (!result) return;

    // Apply effects
    if (result.effects && onEffect) {
      onEffect(result.effects);
    }

    // Fade transition
    setFadeTransition(true);
    setTimeout(() => {
      setFadeTransition(false);
      startScene(activeChapter.id, result.nextScene);
    }, 400);
  }, [activeChapter, activeScene, onEffect, startScene]);

  const skipTypewriter = useCallback(() => {
    if (isTyping && typewriterRef.current && activeScene) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
      setDisplayedText(activeScene.text);
      setIsTyping(false);
      setTimeout(() => setShowChoices(true), 100);
    }
  }, [isTyping, activeScene]);

  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  // Chapter select view
  if (view === 'chapters') {
    return (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-[350px] max-h-[500px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-700/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📖</span> Story Mode
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl leading-none cursor-pointer"
            >
              ×
            </button>
          </div>

          {/* Chapter list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chapters.map((chapter) => {
              const unlocked = chapter.unlockLevel <= (petLevel || 1);
              const completed = isChapterComplete(chapter.id);
              return (
                <button
                  key={chapter.id}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    unlocked
                      ? completed
                        ? 'bg-green-900/30 border border-green-700/50 hover:bg-green-900/50 cursor-pointer'
                        : 'bg-gray-800/50 border border-gray-600/50 hover:bg-gray-700/50 cursor-pointer'
                      : 'bg-gray-800/20 border border-gray-800/30 cursor-not-allowed opacity-50'
                  }`}
                  disabled={!unlocked}
                  onClick={() => unlocked && handleChapterSelect(chapter.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {completed ? '⭐' : unlocked ? '📖' : '🔒'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        Ch.{chapter.id}: {chapter.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {unlocked ? (completed ? 'Completed' : 'Available') : `Unlocks at Lv.${chapter.unlockLevel}`}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Scene view
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        className="relative w-[350px] h-[400px] rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden flex flex-col"
        style={{ background: activeChapter?.theme?.bg || '#1a1a2e' }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Chapter title bar */}
        <div className="px-4 py-3 bg-black/30 flex items-center justify-between">
          <span className="text-sm font-medium text-white/90 truncate">
            📖 Ch.{activeChapter?.id}: {activeChapter?.title}
          </span>
          <button
            onClick={() => { setView('chapters'); setActiveChapter(null); setActiveScene(null); }}
            className="text-white/60 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scene illustration area */}
        <div
          className="h-[100px] flex items-center justify-center relative overflow-hidden"
          style={{ background: activeChapter?.theme?.bg || '#1a1a2e' }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${activeChapter?.theme?.accent || '#fff'} 0%, transparent 70%)`
            }}
          />
          <span className="text-4xl relative z-10">
            {activeChapter?.id === 1 && '💫'}
            {activeChapter?.id === 2 && '🌲'}
            {activeChapter?.id === 3 && '🚇'}
            {activeChapter?.id === 4 && '🗑️'}
            {activeChapter?.id === 5 && '🌊'}
            {activeChapter?.id === 6 && '⛰️'}
            {activeChapter?.id === 7 && '🦠'}
            {activeChapter?.id === 8 && '☁️'}
            {activeChapter?.id === 9 && '🕸️'}
            {activeChapter?.id === 10 && '✨'}
          </span>
        </div>

        {/* Text area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene?.id}
            className="flex-1 px-5 py-4 overflow-y-auto"
            initial={{ opacity: fadeTransition ? 0 : 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={skipTypewriter}
          >
            <p className="text-sm text-white/90 leading-relaxed min-h-[60px]">
              {displayedText}
              {isTyping && <span className="animate-pulse">|</span>}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Choices */}
        <div className="px-4 pb-4 space-y-2">
          <AnimatePresence>
            {showChoices && activeScene?.choices?.length > 0 && activeScene.choices.map((choice, idx) => (
              <motion.button
                key={idx}
                className="w-full px-4 py-2 rounded-lg text-left text-sm text-white/90 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => handleChoice(idx)}
              >
                <span className="text-white/50 mr-2">▸</span>
                {choice.text}
              </motion.button>
            ))}
            {showChoices && activeScene?.choices?.length === 0 && (
              <motion.button
                className="w-full px-4 py-2 rounded-lg text-center text-sm text-white/90 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  const reward = completeChapter(activeChapter.id);
                  if (reward && onEffect) onEffect({ xp: reward.xp || 0 });
                  setView('chapters');
                  setActiveChapter(null);
                  setActiveScene(null);
                }}
              >
                ✨ Complete Chapter
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default StoryMode;
