import React, { useEffect, useRef } from 'react';

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animFrame: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Color pop node palette: Sky Blue, Indigo, Purple, Emerald, Cyan
    const COLORS = [
      'rgba(2, 132, 199, ',   // sky blue
      'rgba(79, 70, 229, ',   // indigo
      'rgba(124, 58, 237, ',  // purple
      'rgba(16, 185, 129, ',  // emerald
      'rgba(6, 182, 212, ',   // cyan
    ];

    const nodeCount = Math.min(Math.floor((width * height) / 14000), 65);
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      colorIndex: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2.8 + 2,
        colorIndex: Math.floor(Math.random() * COLORS.length),
      });
    }

    const pulses: Array<{
      from: number;
      to: number;
      progress: number;
      speed: number;
      color: string;
    }> = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect lines with soft vibrant gradient opacity
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];

        if (!prefersReducedMotion) {
          n1.x += n1.vx;
          n1.y += n1.vy;

          if (n1.x < 0 || n1.x > width) n1.vx *= -1;
          if (n1.y < 0 || n1.y > height) n1.vy *= -1;
        }

        // Mouse hover interaction: attract/connect nodes to cursor
        const mdx = mouseX - n1.x;
        const mdy = mouseY - n1.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 180) {
          const mAlpha = (1 - mdist / 180) * 0.45;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(2, 132, 199, ${mAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.32;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `${COLORS[n1.colorIndex]}${alpha})`;
            ctx.lineWidth = 1.25;
            ctx.stroke();

            if (!prefersReducedMotion && Math.random() < 0.0012 && pulses.length < 18) {
              pulses.push({
                from: i,
                to: j,
                progress: 0,
                speed: 0.009 + Math.random() * 0.014,
                color: COLORS[n1.colorIndex],
              });
            }
          }
        }

        // Draw node with glowing outer aura
        const glowGrad = ctx.createRadialGradient(n1.x, n1.y, 0, n1.x, n1.y, n1.radius * 3.5);
        glowGrad.addColorStop(0, `${COLORS[n1.colorIndex]}0.9)`);
        glowGrad.addColorStop(0.5, `${COLORS[n1.colorIndex]}0.3)`);
        glowGrad.addColorStop(1, `${COLORS[n1.colorIndex]}0)`);

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n1.x, n1.y, n1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${COLORS[n1.colorIndex]}0.95)`;
        ctx.fill();
      }

      // Draw transaction data pulses along edges
      if (!prefersReducedMotion) {
        for (let k = pulses.length - 1; k >= 0; k--) {
          const p = pulses[k];
          p.progress += p.speed;
          if (p.progress >= 1) {
            pulses.splice(k, 1);
            continue;
          }

          const n1 = nodes[p.from];
          const n2 = nodes[p.to];
          if (!n1 || !n2) continue;

          const px = n1.x + (n2.x - n1.x) * p.progress;
          const py = n1.y + (n2.y - n1.y) * p.progress;

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}1)`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#0284c7';
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        animFrame = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-85 z-0"
    />
  );
}

