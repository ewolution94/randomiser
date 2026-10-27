// The draw on the real source: the browser's crypto (Node's webcrypto here), millions of draws, and
// every name's share checked against a fair one. Stochastic, so it lives with the simulations
// (npm run test:sim, CLAUDE.md) instead of CI: a fair source fails a 1-in-a-million bound once in a
// million runs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { fairIndex } from '../src/lib/staging.ts';

const buf = new Uint32Array(4096);
let at = buf.length;
const word = () => {
  if (at === buf.length) {
    webcrypto.getRandomValues(buf);
    at = 0;
  }
  return buf[at++];
};

/** The chi-square value the given degrees of freedom stay under with probability 1 - 1e-6 (Wilson–Hilferty). */
function bound(df) {
  const z = 4.753; // one-sided normal quantile for 1e-6
  return df * (1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df))) ** 3;
}

test('a million draws per list size land evenly on every name', () => {
  for (const n of [2, 3, 5, 8, 13, 30]) {
    const draws = 1_000_000;
    const count = new Array(n).fill(0);
    for (let i = 0; i < draws; i++) count[fairIndex(n, word)]++;
    const e = draws / n;
    const chi = count.reduce((sum, c) => sum + (c - e) ** 2 / e, 0);
    const worst = Math.max(...count.map((c) => Math.abs(c - e) / e));
    console.log(`  ${String(n).padStart(2)} names: chi-square ${chi.toFixed(1)} (bound ${bound(n - 1).toFixed(1)}), largest share off by ${(worst * 100).toFixed(2)} %`);
    assert.ok(chi < bound(n - 1), `n ${n}: chi-square ${chi.toFixed(1)}`);
  }
});
