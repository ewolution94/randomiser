// The draw and its staging, with no DOM: who wins, and how each mode plays its way there. The winner
// is drawn first and uniformly; the wheel, the jackpot and the race only stage a result that is
// already fixed. Pure functions with the random source passed in, so tests/staging.test.mjs can
// check that every staging lands on the winner. Self-contained on purpose: Node runs this file
// directly in the tests (type stripping), so it imports nothing.

export type Drama = 'chill' | 'normal' | 'max';
export type Random = () => number;

const TAU = Math.PI * 2;

/** An index into `n` from `random()` in [0, 1), for the staging's own choices (the show, not the draw). */
export function pickIndex(n: number, random: Random): number {
  if (n <= 0) return -1;
  return Math.min(n - 1, Math.floor(random() * n));
}

/**
 * The draw itself: an index into `n`, exactly uniform, from 32-bit random words (the browser's crypto
 * in the app). Scaling or `% n` on a word favours the low indices by up to n in 2^32; instead, a word
 * at or above the largest multiple of n is drawn again (Würfle's solo dice do the same), so every
 * index has exactly the same number of words. For 30 names that redraw happens 7 times in a billion.
 */
export function fairIndex(n: number, word: () => number): number {
  if (n <= 0) return -1;
  const limit = Math.floor(0x100000000 / n) * n;
  let w = word() >>> 0;
  while (w >= limit) w = word() >>> 0;
  return w % n;
}

// ---------------------------------------------------------------- the wheel

/**
 * The slice under the pointer when the wheel stands at `theta`. Slice i spans the wheel angles
 * [i, i + 1) × 2π/n clockwise from the top; turning the wheel by +theta moves it clockwise, so the
 * pointer (fixed at the top) reads the wheel at -theta.
 */
export function sliceAt(theta: number, n: number): number {
  const seg = TAU / n;
  const p = (((-theta) % TAU) + TAU) % TAU;
  return Math.min(n - 1, Math.floor(p / seg));
}

export type WheelSpin = {
  /** Where the wheel comes to rest, and (with a fake-out) where it first stops, against the neighbour's peg. */
  end: number;
  pre: number;
  fake: boolean;
  /** The main run's length in ms (the fake-out's hold and creep come on top). */
  duration: number;
  /** With a fake-out, the slice it nearly stopped on. */
  decoy: number;
};

/** How wide a peg and the flapper's tip are together, as an angle; the fake-out stops just short of it. */
export const contactAngle = (n: number) => Math.min(0.075, (TAU / n) * 0.3);

/**
 * A spin from `theta` that rests in slice `w`, for `seconds` (Settings, tune.ts) and at least
 * `turns` times round. dir: 1 clockwise, -1 the other way; power: 1 for a tap, up to 3 for a hard
 * flick (more turns). On Max drama it first stops one slice short, against the peg, then creeps
 * over; the result is the same either way.
 */
export function wheelSpin(o: { theta: number; n: number; w: number; dir?: number; power?: number; seconds?: number; turns?: number; drama: Drama; random: Random; reduced?: boolean }): WheelSpin {
  const { theta, n, w, drama, random } = o;
  const dir = o.dir && o.dir < 0 ? -1 : 1;
  const power = Math.max(1, Math.min(3, o.power ?? 1));
  const seg = TAU / n;
  const fake = drama === 'max' && !o.reduced && n > 1;
  const C = contactAngle(n);
  // Where in the slice it stops: anywhere but the edges, or just inside the edge it entered by.
  const f = fake ? (dir > 0 ? 0.88 : 0.12) : 0.18 + random() * 0.64;
  const base = -(w + f) * seg;
  const turns = Math.max(1, o.turns ?? 5) + random() + (power - 1);
  const k = dir > 0 ? Math.ceil((theta + turns * TAU - base) / TAU) : Math.floor((theta - turns * TAU - base) / TAU);
  const end = base + k * TAU;
  const pre = fake ? end - dir * (0.12 * seg + 0.45 * C) : end;
  const duration = (o.seconds ?? 5) * 1000 * (o.reduced ? 0.4 : 1);
  const decoy = fake ? (w + (dir > 0 ? 1 : n - 1)) % n : -1;
  return { end, pre, fake, duration, decoy };
}

// ---------------------------------------------------------------- the duck race

export type Curve = { K: number; knots: number[]; fin: number };
export type RacePlan = { curves: Curve[]; runnerUp: number };

export type Overtaking = 'few' | 'some' | 'many';

/**
 * How the strokes vary, how the winner's strength shifts over the race (surge > 0: late, < 0: early;
 * the runner-up the other way) and how close the rest finish. Over 200 seeded races of six: few
 * gives about one lead change, early; some about three (the race as it was); many four to five,
 * two of them in the last stretch.
 */
const OVERTAKING: Record<Overtaking, { base: number; spread: number; surge: number; pack: [number, number] }> = {
  few: { base: 0.5, spread: 0.7, surge: -0.4, pack: [0.55, 0.25] },
  some: { base: 0.35, spread: 1, surge: 0.6, pack: [0.62, 0.27] },
  many: { base: 0.08, spread: 2.4, surge: 0.6, pack: [0.82, 0.08] },
};

/**
 * Each duck paddles in strokes towards its own finishing point (1 is the line). The winner's strokes
 * grow towards the end and the runner-up's fade, so the lead changes by itself; how much is
 * `overtaking` (Settings), and the runner-up's margin shrinks with the drama (a beak on Max). A
 * longer race (`seconds`) has more strokes, so the ducks keep their pace.
 */
export function racePlan(n: number, w: number, drama: Drama, random: Random, overtaking: Overtaking = 'some', seconds = 8): RacePlan {
  let r = pickIndex(n - 1, random);
  if (r >= w) r++;
  const o = OVERTAKING[overtaking];
  const strokes = Math.max(5, Math.round(seconds * 0.9));
  const curves: Curve[] = [];
  for (let i = 0; i < n; i++) {
    const K = strokes + pickIndex(4, random);
    const fin = i === w ? 1 : i === r ? { chill: 0.9, normal: 0.955, max: 0.982 }[drama] + random() * 0.01 : o.pack[0] + random() * o.pack[1];
    const inc: number[] = [];
    for (let k = 0; k < K; k++) {
      let x = o.base + random() * o.spread;
      const at = (k + 0.5) / K;
      if (i === w) x *= 1 - o.surge / 2 + o.surge * at;
      if (i === r) x *= 1 + o.surge / 2 - o.surge * at;
      inc.push(x);
    }
    const sum = inc.reduce((a, b) => a + b, 0);
    let acc = 0;
    const knots = [0];
    for (const x of inc) {
      acc += x;
      knots.push((acc / sum) * fin);
    }
    curves.push({ K, knots, fin });
  }
  return { curves, runnerUp: n > 1 ? r : -1 };
}

/** A duck's place at t in [0, 1]: a quick pull, then a glide, stroke after stroke; never backwards. */
export function raceAt(c: Curve, t: number): number {
  if (t >= 1) return c.fin;
  const x = Math.max(0, t) * c.K;
  const k = Math.floor(x);
  const u = x - k;
  const stroke = u - (Math.sin(TAU * u) / TAU) * 0.7;
  return c.knots[k] + (c.knots[k + 1] - c.knots[k]) * stroke;
}

// ---------------------------------------------------------------- the jackpot

/**
 * The rows the shared reel (Folio's <ewo-slot-reel rows="3">) runs through: the row above the one on
 * show, the strip from the one on show to the winner (`strip`, from Folio's reelStrip), and the row
 * under the winner. It spins from row 1 to row length - 2.
 */
export function jackpotRows(n: number, strip: number[]): number[] {
  const first = strip[0];
  const last = strip[strip.length - 1];
  return [(first + n - 1) % n, ...strip, (last + 1) % n];
}

// ---------------------------------------------------------------- everyone once

export type Name = { n: string; c: number; out: boolean };

/**
 * "Everyone once": the winner sits out; once everyone has, all come back in. Returns the new list
 * and whether it started over.
 */
export function sitOut(names: Name[], winner: { n: string; c: number }): { names: Name[]; fresh: boolean } {
  const next = names.map((x) => (x.n === winner.n && x.c === winner.c ? { ...x, out: true } : { ...x }));
  if (next.length && next.every((x) => x.out)) return { names: next.map((x) => ({ ...x, out: false })), fresh: true };
  return { names: next, fresh: false };
}

/** Names typed or pasted: split on commas, semicolons and line breaks, trimmed, 24 characters at most. */
export function parseNames(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((s) => s.trim().slice(0, 24))
    .filter(Boolean);
}
