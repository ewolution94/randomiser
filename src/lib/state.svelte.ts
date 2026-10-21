// What Randomiser keeps, all of it on this device (the user, 2026-10-21: "one device"): the names,
// who sits out, the mode, the drama, how each machine runs (tune.ts), Everyone once, the ticket
// number and the last draws. Kept under `randomiser:state`; a broken or missing entry starts empty.

import type { Drama, Name } from './staging';
import { cleanTune, type Tune } from './tune';

export type Mode = 'wheel' | 'slots' | 'race';
export type Draw = { n: string; c: number; mode: Mode; t: number };
export type Person = { n: string; c: number; bg: string; ink: string };

export const MODES: Mode[] = ['wheel', 'slots', 'race'];
export const DRAMAS: Drama[] = ['chill', 'normal', 'max'];
/** The wheel holds 30 names at most; past that the slices get too thin to read. */
export const MAX_NAMES = 30;

/**
 * The fair's paints, ground and ink: tent red, cream, navy, mustard, mint, pink, orange, sky. Each
 * ink keeps 4.5:1 on its ground; a name keeps its colour (`c`) when others come and go.
 */
export const PAINTS: [string, string][] = [
  ['#d7263d', '#fff6e0'],
  ['#fbefd5', '#1d2a5c'],
  ['#1d2a5c', '#fff6e0'],
  ['#f2b134', '#1d2a5c'],
  ['#3fb8a6', '#10213f'],
  ['#f28cb1', '#1d2a5c'],
  ['#f07a2b', '#1d2a5c'],
  ['#8fd0f5', '#1d2a5c'],
];

type Saved = { names: Name[]; mode: Mode; drama: Drama; tune: Tune; once: boolean; ticket: number; history: Draw[] };

const KEY = 'randomiser:state';

function load(): Saved {
  const empty: Saved = { names: [], mode: 'wheel', drama: 'normal', tune: cleanTune(null), once: false, ticket: 1, history: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!raw || !Array.isArray(raw.names)) return empty;
    return {
      names: raw.names
        .filter((x: Name) => x && typeof x.n === 'string' && x.n.trim())
        .slice(0, MAX_NAMES)
        .map((x: Name) => ({ n: x.n.slice(0, 24), c: Number.isInteger(x.c) ? x.c : 0, out: Boolean(x.out) })),
      mode: (['wheel', 'slots', 'race'] as Mode[]).includes(raw.mode) ? raw.mode : 'wheel',
      drama: (['chill', 'normal', 'max'] as Drama[]).includes(raw.drama) ? raw.drama : 'normal',
      tune: cleanTune(raw.tune),
      once: Boolean(raw.once),
      ticket: Number.isInteger(raw.ticket) && raw.ticket > 0 ? raw.ticket : 1,
      history: Array.isArray(raw.history) ? raw.history.slice(0, 12) : [],
    };
  } catch {
    return empty;
  }
}

export const app = $state<Saved>(load());

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify($state.snapshot(app)));
  } catch {
    // not kept, still shown
  }
}

export const paint = (c: number) => PAINTS[((c % PAINTS.length) + PAINTS.length) % PAINTS.length];

/** The names in the draw today, with their paints. */
export function pool(): Person[] {
  return app.names.filter((x) => !x.out).map((x) => ({ n: x.n, c: x.c, bg: paint(x.c)[0], ink: paint(x.c)[1] }));
}

/** The next name's paint: the one after the last name's, so neighbours differ. */
export function nextPaint() {
  const last = app.names.at(-1);
  return last ? (last.c + 1) % PAINTS.length : 0;
}

/** A stable key for a list of people: a machine rebuilds only when it changes. */
export const poolKey = (p: Person[]) => p.map((x) => `${x.n}\u0000${x.c}`).join('\u0001');
