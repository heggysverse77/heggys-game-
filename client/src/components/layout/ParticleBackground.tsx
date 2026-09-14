import { useEffect, useRef } from 'react';

interface Orb {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: string;
  opacity: number;
}

const COLORS = ['#F6BD60', '#F7EDE2', '#F5CAC3', '#84A59D', '#F28482'];

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const orbs: Orb[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const spawnOrbs = () => {
      const count = Math.floor(window.innerWidth / 120);
      for (let i = 0; i < count; i++) {
        orbs.push({
          x:       Math.random() * canvas.width,
          y:       Math.random() * canvas.height,
          vx:      (Math.random() - 0.5) * 0.3,
          vy:      (Math.random() - 0.5) * 0.3,
          r:       Math.random() * 120 + 40,
          color:   COLORS[Math.floor(Math.random() * COLORS.length)],
          opacity: Math.random() * 0.12 + 0.04,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -orb.r) orb.x = canvas.width + orb.r;
        if (orb.x > canvas.width + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = canvas.height + orb.r;
        if (orb.y > canvas.height + orb.r) orb.y = -orb.r;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, `${orb.color}${Math.round(orb.opacity * 255).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    spawnOrbs();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
