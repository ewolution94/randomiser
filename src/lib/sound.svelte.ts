// The fair's band, made on the spot with Web Audio: no files, no third parties. Off by default (the
// family's rule since Stichle, 2026-10-12), switched on per device in Settings (`randomiser:sound`).
// A browser only plays sound after a tap, so the context starts on the first pointer or key press.
// The ticks, the Tusch, the clown horn and the quacks are from the sketches (plans/randomiser in
// the workspace).

const KEY = 'randomiser:sound';

function stored() {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export const sound = $state({ on: stored() });

export function setSound(on: boolean) {
  sound.on = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // not kept
  }
  if (on) unlock();
}

let ctx: AudioContext | null = null;
let out: AudioNode | null = null;
let noise: AudioBuffer | null = null;
let lastTick = 0;

/** Starts the context on a gesture (browsers keep it suspended until then). */
export function unlock() {
  if (!sound.on) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      const master = ctx.createGain();
      master.gain.value = 0.6;
      comp.connect(master);
      master.connect(ctx.destination);
      out = comp;
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

if (typeof window !== 'undefined') {
  addEventListener('pointerdown', unlock, { passive: true });
  addEventListener('keydown', unlock);
}

const live = () => sound.on && ctx && ctx.state === 'running' && out && noise;

type Tone = { type?: OscillatorType; f: number; f2?: number; t?: number; a?: number; h?: number; d?: number; v?: number; filter?: { type: BiquadFilterType; f: number; q?: number } };

function tone({ type = 'sine', f, f2 = 0, t = 0, a = 0.005, h = 0, d = 0.1, v = 0.3, filter }: Tone) {
  const c = ctx!;
  const now = c.currentTime + t;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + a + h + d);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(v, now + a);
  if (h) g.gain.setValueAtTime(v, now + a + h);
  g.gain.exponentialRampToValueAtTime(0.0001, now + a + h + d);
  let node: AudioNode = o;
  if (filter) {
    const fl = c.createBiquadFilter();
    fl.type = filter.type;
    fl.frequency.value = filter.f;
    if (filter.q) fl.Q.value = filter.q;
    o.connect(fl);
    node = fl;
  }
  node.connect(g);
  g.connect(out!);
  o.start(now);
  o.stop(now + a + h + d + 0.05);
}

function hiss({ t = 0, d = 0.05, v = 0.2, type = 'bandpass' as BiquadFilterType, f = 2000, q = 1 }) {
  const c = ctx!;
  const now = c.currentTime + t;
  const s = c.createBufferSource();
  s.buffer = noise;
  const fl = c.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(v, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + d);
  s.connect(fl);
  fl.connect(g);
  g.connect(out!);
  s.start(now, Math.random() * 0.5);
  s.stop(now + d + 0.02);
}

const kick = (t = 0) => tone({ f: 120, f2: 45, t, d: 0.22, v: 0.55 });
const cymbal = (t = 0) => hiss({ t, d: 1.3, v: 0.3, type: 'highpass', f: 5500, q: 0.7 });

export const sfx = {
  /** A peg passing the leather flapper, or a row passing the payline: a wooden click. */
  tick(pitch = 1) {
    if (!live()) return;
    const now = performance.now();
    if (now - lastTick < 30) return;
    lastTick = now;
    tone({ type: 'triangle', f: 950 * pitch, d: 0.04, v: 0.2 });
    hiss({ d: 0.03, v: 0.16, type: 'lowpass', f: 1800 });
  },
  clunk() {
    if (!live()) return;
    tone({ f: 150, f2: 55, d: 0.16, v: 0.5 });
    hiss({ d: 0.07, v: 0.25, type: 'lowpass', f: 900 });
  },
  ratchet() {
    if (!live()) return;
    for (let i = 0; i < 6; i++) tone({ type: 'square', f: 900 - i * 60, t: i * 0.028, d: 0.012, v: 0.07 });
  },
  /** A drumroll that swells for `sec` seconds. */
  roll(sec: number) {
    if (!live()) return;
    const steps = Math.floor(sec / 0.045);
    for (let i = 0; i < steps; i++) hiss({ t: i * 0.045, d: 0.04, v: 0.05 + 0.25 * (i / steps), f: 1500 + Math.random() * 600, q: 0.8 });
  },
  /** The Tusch: three short brass chords and a long one, with the bass drum and the cymbal. */
  tusch() {
    if (!live()) return;
    const chord = [262, 330, 392, 523];
    for (const t of [0, 0.14, 0.28]) for (const f of chord) tone({ type: 'sawtooth', f, t, a: 0.01, d: 0.09, v: 0.07, filter: { type: 'lowpass', f: 1800 } });
    for (const f of chord) tone({ type: 'sawtooth', f, t: 0.42, a: 0.02, h: 0.45, d: 0.5, v: 0.08, filter: { type: 'lowpass', f: 2000 } });
    tone({ type: 'triangle', f: 131, t: 0.42, a: 0.02, h: 0.45, d: 0.5, v: 0.22 });
    kick(0);
    kick(0.42);
    cymbal(0.42);
  },
  /** The clown horn: honk, honk. */
  horn(t0 = 0) {
    if (!live()) return;
    for (const t of [0, 0.24]) {
      tone({ type: 'sawtooth', f: 340, f2: 300, t: t0 + t, a: 0.01, h: 0.1, d: 0.06, v: 0.16, filter: { type: 'bandpass', f: 900, q: 2 } });
      tone({ type: 'sawtooth', f: 346, f2: 305, t: t0 + t, a: 0.01, h: 0.1, d: 0.06, v: 0.1, filter: { type: 'bandpass', f: 900, q: 2 } });
    }
  },
  quack(t = 0) {
    if (!live()) return;
    tone({ type: 'sawtooth', f: 560, f2: 310, t, a: 0.01, d: 0.13, v: 0.24, filter: { type: 'bandpass', f: 1150, q: 3 } });
    tone({ type: 'square', f: 270, f2: 170, t, a: 0.01, d: 0.12, v: 0.06, filter: { type: 'lowpass', f: 900 } });
  },
  beep(f = 660) {
    if (!live()) return;
    tone({ type: 'square', f, d: 0.14, v: 0.1, filter: { type: 'lowpass', f: 2400 } });
  },
  coin(t = 0) {
    if (!live()) return;
    tone({ type: 'square', f: 988, t, d: 0.07, v: 0.07 });
    tone({ type: 'square', f: 1319, t: t + 0.07, d: 0.28, v: 0.07 });
  },
  splash() {
    if (!live()) return;
    hiss({ d: 0.45, v: 0.35, type: 'lowpass', f: 1300, q: 0.6 });
  },
};
