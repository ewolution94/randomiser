// How each machine runs, set in Settings → Machines (the user, 2026-10-21: "more agency over the
// length"). Drama keeps the tricks (the near miss, the drumroll, the countdown, the photo finish);
// these decide how long a draw takes and how it moves. The defaults are what Normal drama used to
// be. Self-contained like staging.ts, so the tests import it directly.

export type Machine = 'wheel' | 'slots' | 'race';
export type Pace = 'gentle' | 'brisk' | 'wild';
export type Turn = 'cw' | 'ccw' | 'either';
export type Overtaking = 'few' | 'some' | 'many';

export type Tune = {
  wheel: { seconds: number; pace: Pace; turn: Turn };
  slots: { seconds: number; pace: Pace };
  race: { seconds: number; overtaking: Overtaking };
};

/** Each machine's length in seconds: the slider's range and step, and the default. */
export const LENGTH: Record<Machine, { min: number; max: number; step: number; def: number }> = {
  wheel: { min: 2, max: 20, step: 1, def: 5 },
  slots: { min: 1, max: 10, step: 0.5, def: 2.5 },
  race: { min: 4, max: 30, step: 1, def: 8 },
};

export const PACES: Pace[] = ['gentle', 'brisk', 'wild'];
export const TURNS: Turn[] = ['cw', 'ccw', 'either'];
export const OVERTAKING: Overtaking[] = ['few', 'some', 'many'];

/** The wheel's turns per second, and the names a second that roll past the jackpot's payline. */
const WHEEL_PACE: Record<Pace, number> = { gentle: 0.6, brisk: 1, wild: 1.6 };
const REEL_PACE: Record<Pace, number> = { gentle: 5, brisk: 8, wild: 13 };

export function defaultTune(): Tune {
  return {
    wheel: { seconds: LENGTH.wheel.def, pace: 'brisk', turn: 'cw' },
    slots: { seconds: LENGTH.slots.def, pace: 'brisk' },
    race: { seconds: LENGTH.race.def, overtaking: 'some' },
  };
}

/** A length within the machine's range, on its step; anything else gives the default. */
export function cleanSeconds(m: Machine, v: unknown): number {
  const { min, max, step, def } = LENGTH[m];
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.round(n / step) * step));
}

const pick = <T>(list: T[], v: unknown, def: T): T => (list.includes(v as T) ? (v as T) : def);

/** What was kept on the device, checked field by field; a missing or broken field takes its default. */
export function cleanTune(raw: unknown): Tune {
  const d = defaultTune();
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, Record<string, unknown> | undefined>;
  return {
    wheel: { seconds: cleanSeconds('wheel', r.wheel?.seconds ?? d.wheel.seconds), pace: pick(PACES, r.wheel?.pace, d.wheel.pace), turn: pick(TURNS, r.wheel?.turn, d.wheel.turn) },
    slots: { seconds: cleanSeconds('slots', r.slots?.seconds ?? d.slots.seconds), pace: pick(PACES, r.slots?.pace, d.slots.pace) },
    race: { seconds: cleanSeconds('race', r.race?.seconds ?? d.race.seconds), overtaking: pick(OVERTAKING, r.race?.overtaking, d.race.overtaking) },
  };
}

/** Whether a machine runs on its defaults (Settings offers a reset when it doesn't). */
export function isDefault(t: Tune, m: Machine): boolean {
  const d = defaultTune();
  return JSON.stringify(t[m]) === JSON.stringify(d[m]);
}

/** The wheel's whole turns for a spin before the random part (a spin adds up to one more). */
export const wheelTurns = (seconds: number, pace: Pace) => Math.max(2, seconds * WHEEL_PACE[pace]);

/** How many names the jackpot's reel runs past (a spin adds up to three more). */
export const reelSteps = (seconds: number, pace: Pace) => Math.max(6, Math.min(150, Math.round(seconds * REEL_PACE[pace])));
