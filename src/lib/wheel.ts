// The painted Glücksrad on its canvas: a wooden rim with bulbs, brass nails between the slices, a
// leather flapper that the nails push aside and that snaps back with a click, and the hub's star.
// The face is drawn once per list of names; a frame only turns it, so a spin costs one drawImage
// and a few dozen small shapes. Drag to turn it, flick or tap to spin it. Where it stops comes from
// staging.ts (wheelSpin), already decided before it moves. From the desktop sketch
// (plans/randomiser/desktop.html in the workspace).

import { contactAngle, sliceAt, wheelSpin, type Drama } from './staging';
import type { Person } from './state.svelte';

const TAU = Math.PI * 2;
const FONT = '"Alfa Slab One", Rockwell, Georgia, serif';
const W = {
  rim: ['#b0733f', '#8a5228', '#5e3416'],
  edge: '#e8bf5a',
  inner: '#1d2a5c',
  bulbs: 22,
  bulb: '#ffd36b',
  bulbOff: '#4a2e14',
  peg: ['#6b4a12', '#e8bf5a'],
  hub: ['#fff6e0', '#e8bf5a', '#9c6b14'],
  hubRing: '#1d2a5c',
  star: '#d7263d',
  flap: ['#3a4d8f', '#1d2a5c'],
  flapEdge: '#fff6e0',
  pin: '#e8bf5a',
  sep: '#1d2a5c',
  dim: 'rgba(29, 42, 92, 0.5)',
  ring: '#1d2a5c',
  shadow: 'rgba(60, 30, 10, 0.32)',
  blank: ['#d7263d', '#fbefd5'],
};

export type WheelHooks = {
  busy: () => boolean;
  drama: () => Drama;
  /** How long a spin runs and how many turns it makes at least (Settings → Machines, tune.ts). */
  tune: () => { seconds: number; turns: number };
  reduced: () => boolean;
  random: () => number;
  tick: () => void;
  roll: (seconds: number) => void;
  /** A flick or a tap on the wheel: dir 1 or -1 (0 for a tap: the way Settings says), power 1 to 3. */
  flick: (dir: number, power: number) => void;
};

type Anim = { start: number; pre: number; end: number; t0: number; T: number; fake: boolean; hold: number; creep: number; dir: number; C: number; w: number; decoy: number; rolled: boolean; resolve: (r: { decoy: number }) => void };

export class WheelEngine {
  private ctx: CanvasRenderingContext2D;
  private S = 0;
  private cx = 0;
  private cy = 0;
  private Rr = 0;
  private Rf = 0;
  private Rb = 0;
  private Rp = 0;
  private face: HTMLCanvasElement | null = null;
  private faceR = 0;
  private sprites = new Map<string, HTMLCanvasElement>();
  private names: Person[] = [];
  private seg = TAU;
  private theta = 0;
  private prevTheta = 0;
  private lastPeg = 0;
  private dirMem = 1;
  private tau = 0;
  private tauV = 0;
  private anim: Anim | null = null;
  private drag: { a: number; t: number; moved: number; samples: { t: number; th: number }[] } | null = null;
  private glow: { i: number; t0: number } | null = null;
  private needs = true;
  private running = false;
  private raf = 0;
  private lastT = 0;
  private lastBulbs = '';
  private resize: ResizeObserver;

  constructor(
    private cv: HTMLCanvasElement,
    private hooks: WheelHooks,
  ) {
    this.ctx = cv.getContext('2d')!;
    cv.addEventListener('pointerdown', this.down);
    cv.addEventListener('pointermove', this.move);
    cv.addEventListener('pointerup', this.up);
    cv.addEventListener('pointercancel', this.up);
    this.resize = new ResizeObserver(() => this.layout());
    this.resize.observe(cv);
    document.fonts?.load(`400 20px ${FONT}`).then(() => {
      this.renderFace();
      this.needs = true;
    });
  }

  destroy() {
    this.stop();
    this.resize.disconnect();
    this.cv.removeEventListener('pointerdown', this.down);
    this.cv.removeEventListener('pointermove', this.move);
    this.cv.removeEventListener('pointerup', this.up);
    this.cv.removeEventListener('pointercancel', this.up);
  }

  setNames(list: Person[]) {
    this.names = list;
    this.seg = TAU / Math.max(1, list.length);
    this.glow = null;
    this.lastPeg = Math.floor(this.theta / this.seg);
    this.renderFace();
    this.needs = true;
  }

  /** The slice under the pointer right now. */
  current() {
    return this.names.length ? sliceAt(this.theta, this.names.length) : -1;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  settle() {
    this.glow = null;
    this.needs = true;
  }

  spin(w: number, dir = 1, power = 1): Promise<{ decoy: number }> {
    this.glow = null;
    this.start();
    return new Promise((resolve) => {
      const n = this.names.length;
      const s = wheelSpin({ theta: this.theta, n, w, dir, power, ...this.hooks.tune(), drama: this.hooks.drama(), random: this.hooks.random, reduced: this.hooks.reduced() });
      this.anim = { start: this.theta, pre: s.pre, end: s.end, t0: performance.now(), T: s.duration, fake: s.fake, hold: 1100, creep: 1300, dir: dir < 0 ? -1 : 1, C: contactAngle(n), w, decoy: s.decoy, rolled: false, resolve };
    });
  }

  private layout() {
    const css = this.cv.offsetWidth;
    if (!css) return;
    const s = Math.round(css * Math.min(2, devicePixelRatio || 1));
    if (s === this.S) return;
    this.S = s;
    this.cv.width = s;
    this.cv.height = s;
    this.cx = s / 2;
    this.cy = s * 0.52;
    this.Rr = s * 0.46;
    this.Rf = s * 0.395;
    this.Rb = (this.Rr + this.Rf) / 2 + s * 0.002;
    this.Rp = this.Rf * 0.965;
    this.sprites.clear();
    this.renderFace();
    this.needs = true;
  }

  private sprite(color: string, lit: boolean) {
    const key = color + lit;
    const hit = this.sprites.get(key);
    if (hit) return hit;
    const b = Math.max(8, Math.round(this.S * 0.06));
    const r = b / 2;
    const c = document.createElement('canvas');
    c.width = c.height = b;
    const g = c.getContext('2d')!;
    if (lit) {
      const gr = g.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, '#fffbe8');
      gr.addColorStop(0.18, color);
      gr.addColorStop(0.3, alpha(color, 0.5));
      gr.addColorStop(1, alpha(color, 0));
      g.fillStyle = gr;
      g.fillRect(0, 0, b, b);
    } else {
      g.fillStyle = W.bulbOff;
      g.beginPath();
      g.arc(r, r, b * 0.15, 0, TAU);
      g.fill();
    }
    this.sprites.set(key, c);
    return c;
  }

  private renderFace() {
    if (!this.S) return;
    const faceR = (this.faceR = Math.round(this.Rf));
    const face = (this.face = document.createElement('canvas'));
    face.width = face.height = faceR * 2;
    const g = face.getContext('2d')!;
    g.translate(faceR, faceR);
    const n = this.names.length;
    // No names yet: the wheel stands in its paint, red and cream, waiting.
    const slices = n || 8;
    const seg = TAU / slices;
    for (let i = 0; i < slices; i++) {
      const a0 = -Math.PI / 2 + i * seg;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, faceR, a0, a0 + seg);
      g.closePath();
      g.fillStyle = n ? this.names[i].bg : W.blank[i % 2];
      g.fill();
    }
    if (slices > 1) {
      g.strokeStyle = W.sep;
      g.lineWidth = Math.max(1, this.S * 0.006);
      for (let i = 0; i < slices; i++) {
        const a = -Math.PI / 2 + i * seg;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(Math.cos(a) * faceR, Math.sin(a) * faceR);
        g.stroke();
      }
    }
    if (!n) return;
    const inner = faceR * 0.27;
    const outer = faceR * 0.9;
    const maxW = outer - inner;
    const arcH = 2 * faceR * 0.6 * Math.sin(Math.min(seg, Math.PI) / 2);
    g.textAlign = 'right';
    g.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      let fs = Math.min(faceR * 0.14, arcH * 0.62) * 0.84;
      g.font = `400 ${fs}px ${FONT}`;
      let label = this.names[i].n.toUpperCase();
      const w = g.measureText(label).width;
      if (w > maxW) {
        fs = Math.max(this.S * 0.03, (fs * maxW) / w);
        g.font = `400 ${fs}px ${FONT}`;
      }
      while (g.measureText(label).width > maxW && label.length > 2) label = label.slice(0, -2) + '…';
      g.save();
      g.rotate(-Math.PI / 2 + (i + 0.5) * seg);
      g.fillStyle = this.names[i].ink;
      g.fillText(label, outer, fs * 0.05);
      g.restore();
    }
  }

  private bulbState(now: number) {
    if (this.glow) return { step: Math.floor((now - this.glow.t0) / 140), period: 2, lit: 1, color: this.names[this.glow.i]?.bg ?? W.bulb };
    if (this.anim || this.drag) return { step: Math.floor(now / 55), period: 4, lit: 2, color: W.bulb };
    return { step: Math.floor(now / 380), period: 3, lit: 1, color: W.bulb };
  }

  private draw(now: number) {
    const { ctx: g, S, cx, cy, Rr, Rf, Rb, Rp } = this;
    g.clearRect(0, 0, S, S);
    let gr = g.createRadialGradient(cx, cy + Rr * 0.08, Rr * 0.8, cx, cy + Rr * 0.08, Rr * 1.09);
    gr.addColorStop(0, W.shadow);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy + Rr * 0.08, Rr * 1.09, 0, TAU);
    g.fill();
    // the wooden rim
    gr = g.createRadialGradient(cx, cy, Rf, cx, cy, Rr);
    gr.addColorStop(0, W.rim[0]);
    gr.addColorStop(0.5, W.rim[1]);
    gr.addColorStop(1, W.rim[2]);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy, Rr, 0, TAU);
    g.fill();
    g.lineWidth = S * 0.006;
    g.strokeStyle = W.edge;
    g.beginPath();
    g.arc(cx, cy, Rr - S * 0.003, 0, TAU);
    g.stroke();
    g.lineWidth = S * 0.004;
    g.strokeStyle = W.inner;
    g.beginPath();
    g.arc(cx, cy, Rf + S * 0.002, 0, TAU);
    g.stroke();
    // the bulbs
    const b = this.bulbState(now);
    for (let i = 0; i < W.bulbs; i++) {
      const a = -Math.PI / 2 + ((i + 0.5) * TAU) / W.bulbs;
      const on = (((i - b.step) % b.period) + b.period) % b.period < b.lit;
      const sp = this.sprite(b.color, on);
      g.drawImage(sp, cx + Math.cos(a) * Rb - sp.width / 2, cy + Math.sin(a) * Rb - sp.width / 2);
    }
    // the face, the winner's slice, the nails
    const n = this.names.length;
    g.save();
    g.translate(cx, cy);
    g.rotate(this.theta);
    if (this.face) g.drawImage(this.face, -this.faceR, -this.faceR);
    if (this.glow && this.names[this.glow.i]) {
      const a0 = -Math.PI / 2 + this.glow.i * this.seg;
      const pulse = 0.5 + 0.5 * Math.sin((now - this.glow.t0) / 110);
      g.fillStyle = W.dim;
      g.beginPath();
      g.arc(0, 0, this.faceR, 0, TAU);
      g.fill();
      g.save();
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, this.faceR, a0, a0 + this.seg);
      g.closePath();
      g.clip();
      if (this.face) g.drawImage(this.face, -this.faceR, -this.faceR);
      g.fillStyle = `rgba(255,255,255,${0.08 + 0.16 * pulse})`;
      g.fill();
      g.restore();
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, this.faceR, a0, a0 + this.seg);
      g.closePath();
      g.lineWidth = S * 0.01;
      g.strokeStyle = W.ring;
      g.stroke();
    }
    const nails = n > 1 ? n : n ? 0 : 8;
    for (let i = 0; i < nails; i++) {
      const a = -Math.PI / 2 + (i * TAU) / nails;
      const x = Math.cos(a) * Rp;
      const y = Math.sin(a) * Rp;
      const pr = S * 0.0088;
      g.fillStyle = W.peg[0];
      g.beginPath();
      g.arc(x, y + S * 0.002, pr * 1.1, 0, TAU);
      g.fill();
      g.fillStyle = W.peg[1];
      g.beginPath();
      g.arc(x, y, pr, 0, TAU);
      g.fill();
    }
    g.restore();
    // the hub, lit from the top left; its star turns with the wheel
    const hr = Rf * 0.16;
    gr = g.createRadialGradient(cx - hr * 0.3, cy - hr * 0.35, hr * 0.1, cx, cy, hr);
    gr.addColorStop(0, W.hub[0]);
    gr.addColorStop(0.6, W.hub[1]);
    gr.addColorStop(1, W.hub[2]);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(cx, cy, hr, 0, TAU);
    g.fill();
    g.lineWidth = S * 0.007;
    g.strokeStyle = W.hubRing;
    g.stroke();
    g.save();
    g.translate(cx, cy);
    g.rotate(this.theta);
    g.fillStyle = W.star;
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const rr = k % 2 ? hr * 0.3 : hr * 0.66;
      const aa = -Math.PI / 2 + (k * Math.PI) / 5;
      if (k) g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
      else g.moveTo(Math.cos(aa) * rr, Math.sin(aa) * rr);
    }
    g.closePath();
    g.fill();
    g.restore();
    // the flapper
    const px = cx;
    const py = cy - Rr - S * 0.008;
    const L = cy - Rp + S * 0.012 - py;
    const w = S * 0.034;
    g.save();
    g.translate(px, py);
    g.rotate(Math.max(-0.55, Math.min(0.55, -this.tau * 4.5)));
    g.shadowColor = 'rgba(0,0,0,.4)';
    g.shadowBlur = S * 0.012;
    g.shadowOffsetY = S * 0.006;
    g.beginPath();
    g.moveTo(-w, 0);
    g.arc(0, 0, w, Math.PI, 0);
    g.lineTo(S * 0.011, L);
    g.quadraticCurveTo(0, L + S * 0.014, -S * 0.011, L);
    g.closePath();
    gr = g.createLinearGradient(-w, 0, w, 0);
    gr.addColorStop(0, W.flap[0]);
    gr.addColorStop(1, W.flap[1]);
    g.fillStyle = gr;
    g.fill();
    g.shadowColor = 'transparent';
    g.lineWidth = S * 0.005;
    g.strokeStyle = W.flapEdge;
    g.stroke();
    g.fillStyle = W.pin;
    g.beginPath();
    g.arc(0, 0, S * 0.012, 0, TAU);
    g.fill();
    g.restore();
  }

  private stepAnim(now: number) {
    const a = this.anim!;
    const e = now - a.t0;
    if (e < a.T) {
      const u = e / a.T;
      this.theta = a.start + (a.pre - a.start) * (1 - Math.pow(1 - u, 3));
      if (!a.rolled && this.hooks.drama() !== 'chill' && u > 0.72) {
        a.rolled = true;
        this.hooks.roll((a.T * 0.28 + (a.fake ? a.hold + a.creep : 0)) / 1000);
      }
    } else if (a.fake && e < a.T + a.hold) {
      // stuck against the neighbour's nail, creaking
      const h = (e - a.T) / a.hold;
      this.theta = a.pre + a.dir * a.C * 0.28 * Math.abs(Math.sin(h * Math.PI * 2.5)) * (1 - h * 0.6);
    } else if (a.fake && e < a.T + a.hold + a.creep) {
      const c = (e - a.T - a.hold) / a.creep;
      const s = c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
      this.theta = a.pre + (a.end - a.pre) * s;
    } else {
      this.theta = a.end;
      this.anim = null;
      this.glow = { i: a.w, t0: now };
      setTimeout(() => a.resolve({ decoy: a.decoy }), 700);
    }
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastT) / 1000) || 0.016;
    this.lastT = now;
    if (this.anim) this.stepAnim(now);
    const vel = (this.theta - this.prevTheta) / dt;
    this.prevTheta = this.theta;
    if (Math.abs(vel) > 0.05) this.dirMem = Math.sign(vel);
    // a click each time a nail passes the flapper
    const peg = Math.floor(this.theta / this.seg);
    if (peg !== this.lastPeg) {
      this.lastPeg = peg;
      if (this.names.length > 1) this.hooks.tick();
    }
    // the flapper: a spring, pushed aside by the nail coming at it, snapping back once it's past
    const seg = this.seg;
    const m = ((this.theta % seg) + seg) % seg;
    const x = m > seg / 2 ? m - seg : m;
    const C = Math.min(0.075, seg * 0.3);
    const tau0 = this.tau;
    this.tauV += (-320 * this.tau - 18 * this.tauV) * dt;
    this.tau += this.tauV * dt;
    if (this.names.length > 1) {
      if (this.dirMem > 0 && x <= 0 && x > -C) {
        if (this.tau < x + C) {
          this.tau = x + C;
          this.tauV = Math.max(this.tauV, Math.min(vel, 12));
        }
      } else if (this.dirMem < 0 && x >= 0 && x < C) {
        if (this.tau > x - C) {
          this.tau = x - C;
          this.tauV = Math.min(this.tauV, Math.max(vel, -12));
        }
      }
    }
    this.tau = Math.max(-0.12, Math.min(0.12, this.tau));
    this.tauV = Math.max(-12, Math.min(12, this.tauV));
    const b = this.bulbState(now);
    const bk = b.step + b.color;
    if (this.needs || this.anim || this.drag || Math.abs(this.tau - tau0) > 1e-5 || bk !== this.lastBulbs || (this.glow && now - this.glow.t0 < 1600)) {
      this.draw(now);
      this.needs = false;
      this.lastBulbs = bk;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private angleAt(e: PointerEvent) {
    const r = this.cv.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height * 0.52), e.clientX - (r.left + r.width / 2));
  }

  private down = (e: PointerEvent) => {
    if (this.hooks.busy() || this.anim || this.names.length < 2) return;
    this.glow = null;
    this.drag = { a: this.angleAt(e), t: e.timeStamp, moved: 0, samples: [{ t: e.timeStamp, th: this.theta }] };
    this.cv.setPointerCapture(e.pointerId);
  };

  private move = (e: PointerEvent) => {
    const d0 = this.drag;
    if (!d0) return;
    const a = this.angleAt(e);
    let d = a - d0.a;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    d0.a = a;
    d0.moved += Math.abs(d);
    this.theta += d;
    d0.samples.push({ t: e.timeStamp, th: this.theta });
    while (d0.samples.length > 2 && e.timeStamp - d0.samples[0].t > 120) d0.samples.shift();
  };

  private up = (e: PointerEvent) => {
    const d0 = this.drag;
    if (!d0) return;
    const first = d0.samples[0];
    const v = (this.theta - first.th) / Math.max(0.016, (e.timeStamp - first.t) / 1000);
    const tap = d0.moved < 0.05 && e.timeStamp - d0.t < 300;
    this.drag = null;
    if (e.type === 'pointercancel') return;
    if (Math.abs(v) > 4) this.hooks.flick(Math.sign(v), Math.min(3, Math.abs(v) / 8));
    else if (tap) this.hooks.flick(0, 1);
  };
}

function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
