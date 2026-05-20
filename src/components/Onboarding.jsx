import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  shouldShowOnboarding, getCurrentStep, nextStep, prevStep,
  skipOnboarding, completeOnboarding
} from '../services/onboardingService';

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 80 : -80, opacity: 0, scale: 0.95 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction) => ({ x: direction > 0 ? -80 : 80, opacity: 0, scale: 0.95 }),
};

function Onboarding({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(null);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (shouldShowOnboarding()) {
      const timer = setTimeout(() => {
        setVisible(true);
        setStep(getCurrentStep());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleNext() {
    setDirection(1);
    const next = nextStep();
    if (next) {
      setStep(next);
    } else {
      handleComplete();
    }
  }

  function handlePrev() {
    setDirection(-1);
    const prev2 = prevStep();
    if (prev2) setStep(prev2);
  }

  function handleSkip() {
    skipOnboarding();
    setVisible(false);
    if (onComplete) onComplete();
  }

  function handleComplete() {
    completeOnboarding();
    setVisible(false);
    if (onComplete) onComplete();
  }

  if (!visible || !step) return null;

  const isFirst = step.stepIndex === 0;
  const isLast = step.stepIndex === step.totalSteps - 1;
  const progress = ((step.stepIndex + 1) / step.totalSteps) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Content card */}
        <motion.div
          className="relative w-[280px] bg-gray-900/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
          initial={{ scale: 0.85, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {/* Progress bar at top */}
          <div className="h-1 bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Animated content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="px-6 pt-6 pb-5 text-center"
            >
              {/* Large emoji with bounce */}
              <motion.div
                className="text-5xl mb-4"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              >
                {step.emoji}
              </motion.div>

              {/* Title */}
              <h2 className="text-white text-lg font-bold mb-2">{step.title}</h2>

              {/* Description */}
              <p className="text-gray-400 text-xs leading-relaxed mb-5">{step.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: step.totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full transition-all"
                animate={{
                  width: i === step.stepIndex ? 16 : 6,
                  height: 6,
                  backgroundColor: i === step.stepIndex ? '#a855f7' : i < step.stepIndex ? '#7c3aed' : '#374151',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between px-6 pb-5">
            <button
              className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
              onClick={handleSkip}
            >
              Skip
            </button>

            <div className="flex gap-2">
              {!isFirst && (
                <motion.button
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs rounded-xl cursor-pointer transition-colors border border-white/10"
                  onClick={handlePrev}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Back
                </motion.button>
              )}
              <motion.button
                className={`px-5 py-1.5 text-white text-xs rounded-xl cursor-pointer transition-all font-medium ${
                  isLast
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_16px_rgba(168,85,247,0.3)] hover:shadow-[0_0_24px_rgba(168,85,247,0.5)]'
                    : 'bg-purple-600/80 hover:bg-purple-500'
                }`}
                onClick={handleNext}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {isLast ? '🚀 Get Started!' : 'Next'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Onboarding;
