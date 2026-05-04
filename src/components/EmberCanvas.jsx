import React, { useEffect, useRef } from 'react';

export function EmberCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let width, height, scale;
    const particles = [];
    const mouse = { x: -1000, y: -1000, radius: 110 };

    // Anchor settings based on your preferred 1080p look
    const REF_WIDTH = 1920;
    const REF_HEIGHT = 1080;
    const REF_COUNT = 135;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      // Linear scale for sizes (clamped so they don't get too tiny)
      scale = Math.max(width / REF_WIDTH, 0.7);

      // NEW DENSITY LOGIC:
      // Instead of pure area, we use a weighted calculation.
      // This forces a higher density on smaller screens so they never feel empty.
      const areaRatio = (width * height) / (REF_WIDTH * REF_HEIGHT);
      const targetCount = Math.max(Math.floor(REF_COUNT * areaRatio), 60); // 60 is the "Never Empty" floor

      if (particles.length < targetCount) {
        for (let i = particles.length; i < targetCount; i++) particles.push(new Particle());
      } else if (particles.length > targetCount) {
        particles.splice(targetCount);
      }

      mouse.radius = 110 * scale;
    }

    class Particle {
      constructor() { this.reset(true); }

      reset(initial = false) {
        this.x = initial ? Math.random() * width : -50;
        this.y = Math.random() * height;

        this.radiusY = (Math.random() * 2.2 + 0.8) * scale;
        this.radiusX = this.radiusY * (Math.random() * 0.4 + 1.1);
        this.angle = (Math.random() - 0.5) * 0.6;

        // Speed stays consistent relative to screen size
        this.baseSpeedX = (Math.random() * 8 + 6) * scale;
        this.vx = this.baseSpeedX;
        this.vy = (Math.random() - 0.5) * 0.6 * scale;

        this.driftFrequency = 0.012 + 0.003;
        this.driftAmplitude = (Math.random() * 1.2 + 0.4) * scale;
        this.driftOffset = Math.random() * 1000;

        const palette = [
          { hex: '#ffcc00', weight: 1.0 },
          { hex: '#ff9500', weight: 0.8 },
          { hex: '#ff5e00', weight: 0.6 },
          { hex: '#ffc15e', weight: 0.9 }
        ];
        const chosen = palette[Math.floor(Math.random() * palette.length)];
        this.color = chosen.hex;
        this.opacity = (Math.random() * 0.3 + 0.4) * chosen.weight;
      }

      update() {
        let windFlow = Math.sin((this.x * this.driftFrequency) + this.driftOffset) * this.driftAmplitude;
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouse.radius - distance) * 0.06;
          this.vx += Math.cos(angle) * force;
          this.vy += Math.sin(angle) * force;
        }

        this.vx += (this.baseSpeedX - this.vx) * 0.04;
        this.x += this.vx;
        this.y += this.vy + windFlow;

        if (this.x > width + 100 || this.x < -150 || this.y < -100 || this.y > height + 100) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + (this.vy * 0.12));
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 7 * scale;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radiusX, this.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    let animId;

    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animId = requestAnimationFrame(animate);
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    resize();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
