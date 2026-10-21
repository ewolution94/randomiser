import { test } from 'node:test';
import assert from 'node:assert/strict';
// Node runs the TypeScript directly (type stripping, Node 24).
import { contactAngle, jackpotRows, parseNames, pickIndex, raceAt, racePlan, sitOut, sliceAt, wheelSpin } from '../src/lib/staging.ts';
import { wheelTurns } from '../src/lib/tune.ts';
import { reelStrip } from '../vendor/ewo/elements/reel-strip.js';

/** A seeded random source, so every run checks the same draws. */
function seeded(seed = 7) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DRAMAS = ['chill', 'normal', 'max'];

test('the draw reaches every name and nothing else', () => {
  const random = seeded(3);
  const seen = new Set();
  for (let i = 0; i < 4000; i++) {
    const w = pickIndex(9, random);
    assert.ok(w >= 0 && w < 9);
    seen.add(w);
  }
  assert.equal(seen.size, 9);
  assert.equal(pickIndex(0, random), -1);
  assert.equal(pickIndex(1, () => 0.999), 0);
});

test('the wheel always comes to rest in the winner’s slice', () => {
  const random = seeded(11);
  for (const n of [2, 3, 8, 13, 30]) {
    for (const drama of DRAMAS) {
      for (const dir of [1, -1]) {
        for (let trial = 0; trial < 40; trial++) {
          const w = pickIndex(n, random);
          const theta = (random() - 0.5) * 40;
          const spin = wheelSpin({ theta, n, w, dir, power: 1 + random() * 2, drama, random });
          assert.equal(sliceAt(spin.end, n), w, `n ${n}, ${drama}, dir ${dir}`);
          // It turns the way it was flicked, at least three times round.
          assert.ok(dir * (spin.end - theta) >= 3 * Math.PI * 2, 'too few turns');
        }
      }
    }
  }
});

test('on Max the wheel first stops on the neighbour, just short of the peg, then creeps over', () => {
  const random = seeded(5);
  for (const n of [2, 5, 8, 20]) {
    for (const dir of [1, -1]) {
      const w = pickIndex(n, random);
      const spin = wheelSpin({ theta: 0, n, w, dir, drama: 'max', random });
      assert.equal(spin.fake, true);
      assert.equal(sliceAt(spin.pre, n), spin.decoy, 'the near miss shows the neighbour');
      assert.notEqual(spin.decoy, w);
      // The creep is less than a slice and runs the same way.
      const seg = (Math.PI * 2) / n;
      assert.ok(dir * (spin.end - spin.pre) > 0 && dir * (spin.end - spin.pre) < seg);
      assert.ok(contactAngle(n) <= seg * 0.3 + 1e-9);
    }
  }
  const calm = wheelSpin({ theta: 0, n: 8, w: 3, drama: 'normal', random });
  assert.equal(calm.fake, false);
  assert.equal(calm.pre, calm.end);
  assert.equal(wheelSpin({ theta: 0, n: 8, w: 3, drama: 'max', random, reduced: true }).fake, false, 'no fake-out under reduced motion');
});

test('the race’s winner always crosses first, and paddles only forwards', () => {
  const random = seeded(23);
  for (const n of [2, 4, 8, 16]) {
    for (const drama of DRAMAS) {
      for (let trial = 0; trial < 20; trial++) {
        const w = pickIndex(n, random);
        const { curves, runnerUp } = racePlan(n, w, drama, random);
        assert.equal(raceAt(curves[w], 1), 1);
        assert.notEqual(runnerUp, w);
        for (let i = 0; i < n; i++) {
          if (i !== w) assert.ok(raceAt(curves[i], 1) < 1, 'someone else reached the line');
          let before = 0;
          for (let t = 0; t <= 1; t += 0.01) {
            const p = raceAt(curves[i], t);
            assert.ok(p >= before - 1e-9, 'paddled backwards');
            before = p;
          }
        }
      }
    }
  }
});

test('the wheel spins for its length, and makes more turns the wilder it is set', () => {
  const random = seeded(17);
  for (const seconds of [2, 5, 12, 20]) {
    const calm = wheelSpin({ theta: 0, n: 8, w: 4, seconds, turns: wheelTurns(seconds, 'gentle'), drama: 'normal', random });
    const wild = wheelSpin({ theta: 0, n: 8, w: 4, seconds, turns: wheelTurns(seconds, 'wild'), drama: 'normal', random });
    assert.equal(calm.duration, seconds * 1000);
    assert.equal(sliceAt(calm.end, 8), 4);
    assert.equal(sliceAt(wild.end, 8), 4);
    assert.ok(wild.end > calm.end, `${seconds} s: wild turns further`);
    assert.ok(calm.end >= 2 * Math.PI * 2, 'at least twice round');
  }
  assert.equal(wheelSpin({ theta: 0, n: 8, w: 1, seconds: 10, drama: 'chill', random, reduced: true }).duration, 4000, 'reduced motion runs it quicker');
});

test('the race keeps its promises at every overtaking and length', () => {
  const random = seeded(29);
  for (const overtaking of ['few', 'some', 'many']) {
    for (const seconds of [4, 8, 30]) {
      for (let trial = 0; trial < 12; trial++) {
        const n = 2 + pickIndex(12, random);
        const w = pickIndex(n, random);
        const { curves } = racePlan(n, w, DRAMAS[trial % 3], random, overtaking, seconds);
        assert.equal(raceAt(curves[w], 1), 1);
        for (let i = 0; i < n; i++) {
          if (i !== w) assert.ok(raceAt(curves[i], 1) < 1, 'someone else reached the line');
          let before = 0;
          for (let t = 0; t <= 1; t += 0.01) {
            const p = raceAt(curves[i], t);
            assert.ok(p >= before - 1e-9, 'paddled backwards');
            before = p;
          }
        }
      }
    }
  }
  // A longer race has more strokes, so the ducks keep their pace.
  assert.ok(racePlan(4, 0, 'normal', random, 'some', 30).curves[0].K > racePlan(4, 0, 'normal', random, 'some', 4).curves[0].K);
});

test('more overtaking means more lead changes', () => {
  const changes = (overtaking) => {
    const random = seeded(53);
    let total = 0;
    for (let race = 0; race < 60; race++) {
      const { curves } = racePlan(6, race % 6, 'normal', random, overtaking, 8);
      let leader = -1;
      for (let t = 0.05; t <= 1; t += 0.02) {
        const pos = curves.map((c) => raceAt(c, t));
        const now = pos.indexOf(Math.max(...pos));
        if (leader >= 0 && now !== leader) total++;
        leader = now;
      }
    }
    return total / 60;
  };
  const few = changes('few');
  const some = changes('some');
  const many = changes('many');
  assert.ok(few < some && some < many, `few ${few}, some ${some}, many ${many}`);
});

test('the runner-up’s margin shrinks with the drama', () => {
  const random = seeded(31);
  const margin = (drama) => {
    const { curves, runnerUp } = racePlan(8, 2, drama, random);
    return 1 - curves[runnerUp].fin;
  };
  for (let i = 0; i < 10; i++) {
    assert.ok(margin('max') < 0.025, 'Max is won by a beak');
    assert.ok(margin('chill') > 0.08);
  }
});

test('the jackpot’s rows start under the row on show and end on the winner', () => {
  const random = seeded(41);
  for (const n of [2, 3, 8]) {
    for (let trial = 0; trial < 30; trial++) {
      const current = pickIndex(n, random);
      const w = pickIndex(n, random);
      const strip = reelStrip(n, w, 18, current, random);
      const rows = jackpotRows(n, strip);
      assert.equal(rows[1], current, 'the spin starts on the row on show');
      assert.equal(rows[rows.length - 2], w, 'it lands on the winner');
      assert.equal(rows[0], (current + n - 1) % n);
      assert.equal(rows[rows.length - 1], (w + 1) % n);
    }
  }
});

test('everyone once: winners sit out until all have had a turn, then all come back', () => {
  let names = ['Anna', 'Ben', 'Chris'].map((n, c) => ({ n, c, out: false }));
  let r = sitOut(names, { n: 'Ben', c: 1 });
  assert.deepEqual(r.names.map((x) => x.out), [false, true, false]);
  assert.equal(r.fresh, false);
  r = sitOut(r.names, { n: 'Anna', c: 0 });
  r = sitOut(r.names, { n: 'Chris', c: 2 });
  assert.equal(r.fresh, true);
  assert.ok(r.names.every((x) => !x.out));
  // The input isn't changed.
  assert.ok(names.every((x) => !x.out));
});

test('names split on commas, semicolons and lines, trimmed and kept short', () => {
  assert.deepEqual(parseNames(' Anna, Ben;Chris\nDilara ,, '), ['Anna', 'Ben', 'Chris', 'Dilara']);
  assert.equal(parseNames('A very long name that goes on and on')[0].length, 24);
});
