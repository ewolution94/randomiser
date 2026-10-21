import { test } from 'node:test';
import assert from 'node:assert/strict';
// Node runs the TypeScript directly (type stripping, Node 24).
import { LENGTH, cleanSeconds, cleanTune, defaultTune, isDefault, reelSteps, wheelTurns } from '../src/lib/tune.ts';

test('the defaults are what Normal drama used to run', () => {
  const d = defaultTune();
  assert.equal(d.wheel.seconds, 5);
  assert.equal(wheelTurns(d.wheel.seconds, d.wheel.pace), 5, 'five turns, as Normal had');
  assert.equal(d.slots.seconds, 2.5);
  assert.equal(reelSteps(d.slots.seconds, d.slots.pace), 20, 'about the 18 to 21 names Normal ran');
  assert.equal(d.race.seconds, 8);
  for (const m of ['wheel', 'slots', 'race']) assert.ok(isDefault(d, m));
});

test('what comes back from the device is checked: lengths in range and on their step, choices known', () => {
  assert.deepEqual(cleanTune(null), defaultTune());
  assert.deepEqual(cleanTune('nonsense'), defaultTune());
  const t = cleanTune({ wheel: { seconds: 99, pace: 'ludicrous', turn: 'ccw' }, slots: { seconds: 2.7 }, race: { seconds: 'soon', overtaking: 'many' } });
  assert.equal(t.wheel.seconds, LENGTH.wheel.max);
  assert.equal(t.wheel.pace, 'brisk');
  assert.equal(t.wheel.turn, 'ccw');
  assert.equal(t.slots.seconds, 2.5);
  assert.equal(t.slots.pace, 'brisk');
  assert.equal(t.race.seconds, LENGTH.race.def);
  assert.equal(t.race.overtaking, 'many');
  assert.equal(cleanSeconds('race', -4), LENGTH.race.min);
  assert.ok(!isDefault(t, 'wheel'));
});

test('the reel runs past a sensible number of names at every length and speed', () => {
  for (const pace of ['gentle', 'brisk', 'wild']) {
    for (let s = LENGTH.slots.min; s <= LENGTH.slots.max; s += LENGTH.slots.step) {
      const n = reelSteps(s, pace);
      assert.ok(n >= 6 && n <= 150, `${s} s ${pace}: ${n}`);
    }
  }
  assert.ok(reelSteps(5, 'wild') > reelSteps(5, 'gentle'));
  assert.ok(wheelTurns(2, 'gentle') >= 2, 'the wheel always goes round at least twice');
});
