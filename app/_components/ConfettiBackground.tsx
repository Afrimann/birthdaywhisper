"use client";

import { useEffect, useRef } from "react";

const PALETTE = ["#F4C0D1", "#ED93B1", "#D4537E", "#FAC775", "#F5C4B3"];

interface Particle {
  x: number;
  y: number;
  size: number;
  shape: "circle" | "square";
  color: string;
  opacity: number;
  speed: number;      // upward px per frame
  swayAmp: number;    // horizontal sway amplitude
  swayFreq: number;
  swayPhase: number;
  angle: number;      // square rotation
}

function makeParticles(width: number, height: number): Particle[] {
  // density scales with viewport area so mobile gets far fewer particles
  const count = Math.max(10, Math.min(Math.round((width * height) / 26000), 60));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 2 + Math.random() * 4,
    shape: Math.random() < 0.5 ? "circle" : "square",
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    opacity: 0.25 + Math.random() * 0.35,
    speed: 0.12 + Math.random() * 0.28,
    swayAmp: 8 + Math.random() * 18,
    swayFreq: 0.002 + Math.random() * 0.004,
    swayPhase: Math.random() * Math.PI * 2,
    angle: Math.random() * Math.PI * 2,
  }));
}

export default function ConfettiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let rafId = 0;
    let time = 0;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const draw = (drift: boolean) => {
      const { width, height } = canvas;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.scale(dpr, dpr);
      for (const p of particles) {
        const x = p.x + (drift ? Math.sin(time * p.swayFreq + p.swayPhase) * p.swayAmp : 0);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(p.angle);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    const tick = () => {
      time += 16;
      const viewH = canvas.height / (window.devicePixelRatio || 1);
      const viewW = canvas.width / (window.devicePixelRatio || 1);
      for (const p of particles) {
        p.y -= p.speed;
        p.angle += 0.002;
        if (p.y < -p.size) {
          p.y = viewH + p.size;
          p.x = Math.random() * viewW;
        }
      }
      draw(true);
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const start = () => {
      if (rafId || motionQuery.matches || document.hidden) return;
      rafId = requestAnimationFrame(tick);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      particles = makeParticles(window.innerWidth, window.innerHeight);
      // reduced motion: same particles, frozen in place as static dots
      if (motionQuery.matches) draw(false);
    };

    const onMotionChange = () => {
      stop();
      if (motionQuery.matches) draw(false);
      else start();
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}
