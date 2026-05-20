import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  shouldShowOnboarding, getCurrentStep, nextStep, prevStep,
  skipOnboarding, completeOnboarding
} from '../services/onboardingService';

function Onboarding({ onComplete }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(null);

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
    const next = nextStep();
    if (next) {
      setStep(next);
    } else {
      handleComplete();
    }
  }

  function handlePrev() {
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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop with spotlight effect */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Content card */}
        <motion.div
          key={step.id}
          className="relative w-[260px] bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-800">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${((step.stepIndex + 1) / step.totalSteps) * 100}%` }}
            />
          </div>

          <div className="px-5 py-5 text-center">
            {/* Emoji */}
            <motion.div
              className="text-4xl mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
            >
              {step.emoji}
            </motion.div>

            {/* Title */}
            <h2 className="text-white text-base font-bold mb-2">{step.title}</h2>

            {/* Description */}
            <p className="text-gray-400 text-xs leading-relaxed mb-4">{step.description}</p>

            {/* Step indicator */}
            <div className="flex justify-center gap-1.5 mb-4">
              {Array.from({ length: step.totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === step.stepIndex ? 'bg-purple-400' : i < step.stepIndex ? 'bg-purple-700' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <button
                className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
                onClick={handleSkip}
              >
                Skip
              </button>

              <div className="flex gap-2">
                {!isFirst && (
                  <button
                    className="px-3 py-1.5 bg-gray-700/60 hover:bg-gray-600 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors"
                    onClick={handlePrev}
                  >
                    Back
                  </button>
                )}
                <button
                  className="px-4 py-1.5 bg-purple-600/80 hover:bg-purple-500 text-white text-xs rounded-lg cursor-pointer transition-colors"
                  onClick={handleNext}
                >
                  {isLast ? 'Get Started!' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default Onboarding;
