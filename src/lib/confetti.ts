// Paper streamers in the fair's paints when a name is drawn, and gold coins for the jackpot. One
// fixed canvas over the page; it draws only while something is falling, then clears and stops.
// Nothing under reduced motion.

const TAU = Math.PI * 2;

type Part = { x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; coin: boolean; wob: number; life: number };

export function makeConfetti(cv: HTMLCanvasElement) {
  const g = cv.getContext('2d')!;
  let parts: Part[] = [];
  let raf = 0;
  let w = 0;
  let h = 0;
  let last = 0;

  function burst(colors: string[], coins = false) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    w = innerWidth;
    h = innerHeight;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const scale = Math.min(1, w / 1280) * 0.6 + 0.4;
    const add = (x: number, y: number, angle: number, spread: number, speed: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = speed * (0.5 + Math.random() * 0.7);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 0.3, s: 8 + Math.random() * 8, c: colors[i % colors.length], coin: false, wob: Math.random() * TAU, life: 0 });
      }
    };
    const speed = 16 + 10 * scale;
    add(0, h, -Math.PI / 3, 0.7, speed, Math.round(80 * scale));
    add(w, h, (-2 * Math.PI) / 3, 0.7, speed, Math.round(80 * scale));
    add(w / 2, h * 0.4, -Math.PI / 2, TAU, speed * 0.6, Math.round(90 * scale));
    if (coins) {
      for (let i = 0; i < Math.round(60 * scale); i++) {
        parts.push({ x: Math.random() * w, y: -20 - Math.random() * h * 0.7, vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 3, r: 0, vr: 0, s: 16 + Math.random() * 6, c: '#e8bf5a', coin: true, wob: Math.random() * TAU, life: 0 });
      }
    }
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(step);
    }
  }

  function step(now: number) {
    const dt = Math.min(2.5, (now - last) / 16.67);
    last = now;
    g.clearRect(0, 0, w, h);
    parts = parts.filter((p) => p.y < h + 40 && p.life < 420);
    for (const p of parts) {
      p.life += dt;
      p.vx *= Math.pow(0.985, dt);
      p.vy = p.vy * Math.pow(0.985, dt) + 0.4 * dt;
      p.x += p.vx * dt + Math.sin(p.wob + p.life * 0.1) * 0.7;
      p.y += p.vy * dt;
      p.r += p.vr * dt;
      const flip = Math.cos(p.life * 0.15 + p.wob);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      if (p.coin) {
        g.scale(Math.abs(flip) * 0.9 + 0.1, 1);
        g.fillStyle = '#9c6b14';
        g.beginPath();
        g.arc(0, 0, p.s / 2, 0, TAU);
        g.fill();
        g.fillStyle = p.c;
        g.beginPath();
        g.arc(0, 0, p.s / 2.6, 0, TAU);
        g.fill();
      } else {
        g.scale(flip, 1);
        g.fillStyle = p.c;
        g.fillRect(-p.s * 0.18, -p.s, p.s * 0.36, p.s * 2);
      }
      g.restore();
    }
    if (parts.length) raf = requestAnimationFrame(step);
    else {
      raf = 0;
      g.clearRect(0, 0, w, h);
    }
  }

  return { burst };
}
