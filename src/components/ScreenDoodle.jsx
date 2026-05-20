import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Doodle shapes: hearts, stars, paw prints, squiggly lines
const DOODLE_TYPES = ['heart', 'star', 'paw', 'squiggle'];

const MOOD_COLORS = {
  happy: ['#f472b6', '#a78bfa', '#34d399', '#fbbf24'],
  sad: ['#6b7280', '#9ca3af', '#4b5563', '#374151'],
  neutral: ['#a78bfa', '#60a5fa', '#f472b6', '#34d399'],
  energetic: ['#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'],
};

/**
 * Draw a heart shape on canvas
 */
function drawHeart(ctx, x, y, size, color, progress) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.globalAlpha = Math.min(1, progress * 2);

  const totalPoints = 60;
  const pointsToDraw = Math.floor(totalPoints * progress);

  ctx.beginPath();
  for (let i = 0; i <= pointsToDraw; i++) {
    const t = (i / totalPoints) * Math.PI * 2;
    const hx = x + size * 16 * Math.pow(Math.sin(t), 3) / 16;
    const hy = y - size * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a star shape on canvas
 */
function drawStar(ctx, x, y, size, color, progress) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.globalAlpha = Math.min(1, progress * 2);

  const points = 5;
  const outerR = size * 1.2;
  const innerR = size * 0.5;
  const totalPoints = points * 2;
  const pointsToDraw = Math.floor(totalPoints * progress);

  ctx.beginPath();
  for (let i = 0; i <= pointsToDraw; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const sx = x + r * Math.cos(angle);
    const sy = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  if (progress >= 1) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a paw print on canvas
 */
function drawPaw(ctx, x, y, size, color, progress) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.min(1, progress * 1.5);

  const pads = [
    { ox: 0, oy: size * 0.3, r: size * 0.4 },     // main pad
    { ox: -size * 0.35, oy: -size * 0.2, r: size * 0.2 },  // top left
    { ox: size * 0.35, oy: -size * 0.2, r: size * 0.2 },   // top right
    { ox: -size * 0.15, oy: -size * 0.45, r: size * 0.18 }, // upper left
    { ox: size * 0.15, oy: -size * 0.45, r: size * 0.18 },  // upper right
  ];

  const padsToDraw = Math.ceil(pads.length * progress);
  for (let i = 0; i < padsToDraw; i++) {
    const pad = pads[i];
    const padProgress = Math.min(1, (progress * pads.length - i));
    if (padProgress <= 0) continue;

    ctx.beginPath();
    ctx.arc(x + pad.ox, y + pad.oy, pad.r * padProgress, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draw a squiggly line on canvas
 */
function drawSquiggle(ctx, x, y, size, color, progress) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.globalAlpha = Math.min(1, progress * 2);

  const totalPoints = 40;
  const pointsToDraw = Math.floor(totalPoints * progress);

  ctx.beginPath();
  for (let i = 0; i <= pointsToDraw; i++) {
    const t = i / totalPoints;
    const sx = x + t * size * 3 - size * 1.5;
    const sy = y + Math.sin(t * Math.PI * 4) * size * 0.5;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.restore();
}

function ScreenDoodle({ active, mood = 'neutral', onComplete }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [doodles, setDoodles] = useState([]);

  // Generate random doodles when activated
  useEffect(() => {
    if (!active) return;

    const count = 2 + Math.floor(Math.random() * 3); // 2-4 doodles
    const newDoodles = [];
    const colors = MOOD_COLORS[mood] || MOOD_COLORS.neutral;

    for (let i = 0; i < count; i++) {
      newDoodles.push({
        id: Date.now() + i,
        type: DOODLE_TYPES[Math.floor(Math.random() * DOODLE_TYPES.length)],
        x: 100 + Math.random() * (window.innerWidth - 200),
        y: 100 + Math.random() * (window.innerHeight - 200),
        size: 15 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        startTime: Date.now() + i * 500, // stagger start
        duration: 2000, // draw duration
        fadeStart: Date.now() + i * 500 + 5000, // start fading after 5s
        fadeDuration: 3000, // fade over 3s
      });
    }

    setDoodles(newDoodles);

    // Auto-complete after all doodles fade
    const totalDuration = count * 500 + 5000 + 3000 + 500;
    const timer = setTimeout(() => {
      setDoodles([]);
      if (onComplete) onComplete();
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [active, mood]);

  // Animation loop
  useEffect(() => {
    if (doodles.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    function animate() {
      const now = Date.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let anyActive = false;

      doodles.forEach((doodle) => {
        if (now < doodle.startTime) { anyActive = true; return; }

        // Calculate draw progress
        const drawElapsed = now - doodle.startTime;
        const drawProgress = Math.min(1, drawElapsed / doodle.duration);

        // Calculate fade
        let opacity = 1;
        if (now > doodle.fadeStart) {
          const fadeElapsed = now - doodle.fadeStart;
          opacity = Math.max(0, 1 - fadeElapsed / doodle.fadeDuration);
        }

        if (opacity <= 0) return;
        anyActive = true;

        ctx.save();
        ctx.globalAlpha = opacity;

        switch (doodle.type) {
          case 'heart':
            drawHeart(ctx, doodle.x, doodle.y, doodle.size, doodle.color, drawProgress);
            break;
          case 'star':
            drawStar(ctx, doodle.x, doodle.y, doodle.size, doodle.color, drawProgress);
            break;
          case 'paw':
            drawPaw(ctx, doodle.x, doodle.y, doodle.size, doodle.color, drawProgress);
            break;
          case 'squiggle':
            drawSquiggle(ctx, doodle.x, doodle.y, doodle.size, doodle.color, drawProgress);
            break;
        }

        ctx.restore();
      });

      if (anyActive) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [doodles]);

  if (!active && doodles.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[5] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

export default ScreenDoodle;
