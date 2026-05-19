import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getWeatherEmoji, getWeatherMoodEffect } from '../services/weatherService';

/**
 * Small weather indicator near the pet.
 * Shows weather emoji with tooltip on hover.
 */
const WeatherOverlay = ({ weather = 'sunny' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const emoji = getWeatherEmoji(weather);
  const { description } = getWeatherMoodEffect(weather);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        position: 'absolute',
        top: 4,
        left: 4,
        zIndex: 80,
        cursor: 'default',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          fontSize: '16px',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
          userSelect: 'none',
        }}
      >
        {emoji}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            padding: '3px 6px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            fontSize: '9px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {weather.charAt(0).toUpperCase() + weather.slice(1)} - {description}
        </motion.div>
      )}
    </motion.div>
  );
};

export default WeatherOverlay;
