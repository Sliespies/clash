'use client';

import { useEffect, useRef } from 'react';

const COLORS = ['#FFD700', '#FF4444', '#4488FF', '#44BB44', '#FF69B4', '#FF8C00'];
const PARTICLE_COUNT = 80;
const DURATION = 3000;

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface ConfettiProps {
  originX?: number;
  originY?: number;
}

export default function Confetti({ originX, originY }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const cx = originX ?? window.innerWidth / 2;
    const cy = originY ?? window.innerHeight / 2;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      return {
        x: cx,
        y: cy,
        w: 4 + Math.random() * 4,
        h: 6 + Math.random() * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      };
    });

    let animationId: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > DURATION) return;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const opacity = elapsed > DURATION - 800 ? (DURATION - elapsed) / 800 : 1;
      ctx.globalAlpha = opacity;

      for (const p of particles) {
        p.x += p.vx;
        p.vy += 0.05;
        p.vx += (Math.random() - 0.5) * 0.1;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const onResize = () => {
      const r = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * r;
      canvas.height = window.innerHeight * r;
      ctx.scale(r, r);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, pointerEvents: 'none' }}
    />
  );
}
