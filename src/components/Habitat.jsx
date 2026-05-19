import React from 'react';
import { motion } from 'framer-motion';
import { getHabitatById } from '../services/habitatService';

// --- Forest Elements ---
function ForestHabitat() {
  return (
    <>
      {/* Sky gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(34,139,34,0.05) 0%, rgba(34,100,34,0.3) 60%, rgba(45,90,39,0.8) 100%)' }} />

      {/* Trees */}
      <div className="absolute bottom-16 left-[10%]">
        <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[40px] border-l-transparent border-r-transparent border-b-[#1a5c1a]" />
        <div className="w-0 h-0 border-l-[22px] border-r-[22px] border-b-[35px] border-l-transparent border-r-transparent border-b-[#1a5c1a] -mt-4 -ml-1" />
        <div className="w-3 h-8 bg-[#4a2f1a] mx-auto" />
      </div>
      <div className="absolute bottom-16 left-[30%]">
        <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[32px] border-l-transparent border-r-transparent border-b-[#2d7a2d]" />
        <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[28px] border-l-transparent border-r-transparent border-b-[#2d7a2d] -mt-3 -ml-1" />
        <div className="w-2.5 h-6 bg-[#5c3a1e] mx-auto" />
      </div>
      <div className="absolute bottom-16 right-[15%]">
        <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[45px] border-l-transparent border-r-transparent border-b-[#1a6b1a]" />
        <div className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[38px] border-l-transparent border-r-transparent border-b-[#1a6b1a] -mt-5 -ml-1" />
        <div className="w-3.5 h-9 bg-[#4a2f1a] mx-auto" />
      </div>
      <div className="absolute bottom-16 right-[40%]">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[28px] border-l-transparent border-r-transparent border-b-[#237a23]" />
        <div className="w-2 h-5 bg-[#5c3a1e] mx-auto" />
      </div>

      {/* Bushes */}
      <div className="absolute bottom-14 left-[20%] w-10 h-5 bg-[#2d8a2d] rounded-full opacity-80" />
      <div className="absolute bottom-14 right-[25%] w-12 h-6 bg-[#1f7a1f] rounded-full opacity-80" />
      <div className="absolute bottom-14 left-[55%] w-8 h-4 bg-[#3d9a3d] rounded-full opacity-70" />

      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-14" style={{ background: 'linear-gradient(to bottom, #3d8a3d, #2d5a27)' }} />

      {/* Falling leaves */}
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={`leaf-${i}`}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: ['#4a9a2d', '#8ab33d', '#c4a32d', '#6b8a2d', '#9ab34d', '#7a9a3d', '#5c8a2d'][i],
            left: `${10 + i * 13}%`,
            top: '-8px',
          }}
          animate={{
            y: [0, 200],
            x: [0, Math.sin(i) * 30, Math.cos(i) * -20, Math.sin(i + 1) * 25],
            rotate: [0, 360],
            opacity: [0.8, 0.6, 0],
          }}
          transition={{
            duration: 6 + i * 0.8,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}

// --- Space Elements ---
function SpaceHabitat() {
  return (
    <>
      {/* Background nebula */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(80,20,120,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(20,40,120,0.2) 0%, transparent 40%), radial-gradient(ellipse at center, #1a0533 0%, #0d0015 50%, #000000 100%)' }} />

      {/* Stars */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full"
          style={{
            width: i % 4 === 0 ? 3 : 2,
            height: i % 4 === 0 ? 3 : 2,
            backgroundColor: i % 5 === 0 ? '#ffffaa' : '#ffffff',
            left: `${(i * 17 + 5) % 95}%`,
            top: `${(i * 23 + 10) % 85}%`,
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5 + (i % 3) * 0.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Asteroids */}
      <motion.div
        className="absolute w-5 h-4 bg-[#5a5a6a] rounded-md"
        style={{ top: '30%', left: '20%' }}
        animate={{ x: [0, 40, 0], y: [0, 10, 0], rotate: [0, 45, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-3 h-3 bg-[#6a6a7a] rounded-sm"
        style={{ top: '60%', right: '25%' }}
        animate={{ x: [0, -30, 0], y: [0, -15, 0], rotate: [0, -90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />

      {/* Ground - dark space floor */}
      <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(to bottom, #1a0533, #0d0020)' }} />
    </>
  );
}

// --- Ocean Elements ---
function OceanHabitat() {
  return (
    <>
      {/* Water gradient */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #1a8fc4 0%, #0e5f8a 40%, #0a3d5c 70%, #062a40 100%)' }} />

      {/* Wave at top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-8"
        style={{
          background: 'linear-gradient(to bottom, rgba(100,200,255,0.4), transparent)',
          borderRadius: '0 0 50% 50%',
        }}
        animate={{ scaleX: [1, 1.02, 1], y: [0, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Seaweed */}
      {[15, 35, 65, 80].map((left, i) => (
        <motion.div
          key={`seaweed-${i}`}
          className="absolute bottom-8 w-1.5 rounded-full"
          style={{
            height: 20 + i * 8,
            left: `${left}%`,
            backgroundColor: ['#1a8a3d', '#2d9a4d', '#1a7a3d', '#3daa5d'][i],
            transformOrigin: 'bottom center',
          }}
          animate={{ rotateZ: [-5, 5, -5] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Bubbles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          className="absolute rounded-full border border-white/30"
          style={{
            width: 4 + (i % 3) * 3,
            height: 4 + (i % 3) * 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            left: `${8 + i * 9}%`,
            bottom: '10px',
          }}
          animate={{
            y: [0, -(120 + i * 15)],
            x: [0, Math.sin(i) * 10],
            opacity: [0.6, 0.3, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Sand floor */}
      <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(to bottom, #c2a366, #a08850)' }} />
    </>
  );
}

// --- Castle Elements ---
function CastleHabitat() {
  return (
    <>
      {/* Stone wall background */}
      <div className="absolute inset-0" style={{
        background: `
          repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(0,0,0,0.2) 18px, rgba(0,0,0,0.2) 20px),
          repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.15) 38px, rgba(0,0,0,0.15) 40px),
          linear-gradient(to bottom, #3d3d3d 0%, #2a2a2a 50%, #1a1a1a 100%)
        `,
      }} />

      {/* Torch left */}
      <div className="absolute bottom-20 left-[12%]">
        <div className="w-2 h-8 bg-[#5c3a1e] mx-auto" />
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          style={{ background: 'radial-gradient(circle, #ff8c00 0%, #ff4500 40%, transparent 70%)' }}
          animate={{ opacity: [0.7, 1, 0.8, 1, 0.7], scale: [0.9, 1.1, 0.95, 1.05, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.2) 0%, transparent 70%)' }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [0.95, 1.1, 0.95] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      {/* Torch right */}
      <div className="absolute bottom-20 right-[12%]">
        <div className="w-2 h-8 bg-[#5c3a1e] mx-auto" />
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full"
          style={{ background: 'radial-gradient(circle, #ff8c00 0%, #ff4500 40%, transparent 70%)' }}
          animate={{ opacity: [0.8, 1, 0.7, 1, 0.8], scale: [1, 1.1, 0.9, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,140,0,0.2) 0%, transparent 70%)' }}
          animate={{ opacity: [0.5, 0.7, 0.5], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      </div>

      {/* Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2">
        <div className="w-12 h-16 bg-[#8b1a1a] border border-[#5c1010] relative">
          <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[24px] border-r-[24px] border-b-[10px] border-l-transparent border-r-transparent border-b-[#3d3d3d]" style={{ bottom: '-10px', left: '0' }} />
        </div>
      </div>

      {/* Stone floor */}
      <div className="absolute bottom-0 left-0 right-0 h-10" style={{
        background: `
          repeating-linear-gradient(90deg, #3a3a3a, #3a3a3a 48px, #2a2a2a 48px, #2a2a2a 50px),
          linear-gradient(to bottom, #4a4a4a, #3a3a3a)
        `,
      }} />
    </>
  );
}

// --- Neon City Elements ---
function NeonCityHabitat() {
  return (
    <>
      {/* Dark background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0a0a0f 0%, #0f0a1a 60%, #1a0a2e 100%)' }} />

      {/* Neon building outlines */}
      <div className="absolute bottom-10 left-[5%] w-14 h-28 border border-[#ff00ff] opacity-60" style={{ boxShadow: '0 0 8px #ff00ff, inset 0 0 4px rgba(255,0,255,0.2)' }} />
      <div className="absolute bottom-10 left-[20%] w-10 h-36 border border-[#00ffff] opacity-60" style={{ boxShadow: '0 0 8px #00ffff, inset 0 0 4px rgba(0,255,255,0.2)' }} />
      <div className="absolute bottom-10 right-[8%] w-12 h-32 border border-[#ff00ff] opacity-50" style={{ boxShadow: '0 0 8px #ff00ff, inset 0 0 4px rgba(255,0,255,0.2)' }} />
      <div className="absolute bottom-10 right-[25%] w-16 h-24 border border-[#00ffff] opacity-50" style={{ boxShadow: '0 0 8px #00ffff, inset 0 0 4px rgba(0,255,255,0.2)' }} />
      <div className="absolute bottom-10 left-[42%] w-10 h-20 border border-[#a855f7] opacity-50" style={{ boxShadow: '0 0 6px #a855f7, inset 0 0 3px rgba(168,85,247,0.2)' }} />

      {/* Pulsing neon signs */}
      <motion.div
        className="absolute bottom-24 left-[22%] w-6 h-2 bg-[#ff00ff]"
        style={{ boxShadow: '0 0 10px #ff00ff' }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-32 right-[10%] w-8 h-1.5 bg-[#00ffff]"
        style={{ boxShadow: '0 0 10px #00ffff' }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      />

      {/* Rain streaks */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          className="absolute w-px bg-white/20"
          style={{
            height: 12 + (i % 3) * 4,
            left: `${(i * 5.5 + 2) % 98}%`,
            top: '-16px',
          }}
          animate={{ y: [0, 220], opacity: [0.3, 0.1] }}
          transition={{
            duration: 0.8 + (i % 4) * 0.2,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'linear',
          }}
        />
      ))}

      {/* Ground with neon reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-10" style={{
        background: 'linear-gradient(to bottom, #0a0a15, #050510)',
        boxShadow: 'inset 0 2px 20px rgba(255,0,255,0.1), inset 0 2px 20px rgba(0,255,255,0.1)',
      }} />
    </>
  );
}

// --- Main Habitat Component ---
function Habitat({ habitatId }) {
  if (!habitatId || habitatId === 'desktop') return null;

  const renderHabitat = () => {
    switch (habitatId) {
      case 'forest': return <ForestHabitat />;
      case 'space': return <SpaceHabitat />;
      case 'ocean': return <OceanHabitat />;
      case 'castle': return <CastleHabitat />;
      case 'neon': return <NeonCityHabitat />;
      default: return null;
    }
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-[200px] pointer-events-none overflow-hidden z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {renderHabitat()}
    </motion.div>
  );
}

export default Habitat;
