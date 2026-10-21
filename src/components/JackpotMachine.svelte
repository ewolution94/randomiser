<!--
  The jackpot: Folio's shared reel (<ewo-slot-reel>, the same one Aale Spiele's draw runs on) in a
  red-lacquer cabinet with brass, a ring of bulbs and a lever. Three rows show, the payline in the
  middle. A spin runs a strip from the name on show to the winner (Folio's reelStrip); on Max it
  stops one short on the near miss, strains, and clicks over. The rows are written straight into
  the reel (the element moves them), not through Svelte.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { reelStrip } from '../../vendor/ewo/elements/reel-strip.js';
  import type { EwoSlotReel } from '../../vendor/ewo/elements/slot-reel.js';
  import { t } from '../lib/i18n.svelte';
  import { jackpotRows, type Drama } from '../lib/staging';
  import { poolKey, type Person } from '../lib/state.svelte';
  import { sfx } from '../lib/sound.svelte';

  let { people, drama, reduced, random, onpull }: { people: Person[]; drama: Drama; reduced: boolean; random: () => number; onpull: () => void } = $props();

  let reel: EwoSlotReel;
  let cabinet: HTMLElement;
  let lever: HTMLButtonElement;
  let bulbs: HTMLElement;
  let sub = $state<{ key: 'pull' | 'spinning' | 'jackpot' | 'near'; name?: string }>({ key: 'pull' });
  let live = $state(false);
  let win = $state(false);
  let current = 0;
  let key = '';

  const initial = (n: string) => ([...n.trim()][0] ?? '?').toUpperCase();

  function cell(p: Person, hit = false) {
    const d = document.createElement('div');
    d.className = 'cell' + (hit ? ' hit' : '');
    d.style.setProperty('--c', p.bg);
    d.style.setProperty('--k', p.ink);
    const b = document.createElement('b');
    b.textContent = initial(p.n);
    const s = document.createElement('span');
    s.textContent = p.n;
    d.append(b, s);
    return d;
  }

  function blank() {
    const d = document.createElement('div');
    d.className = 'cell blank';
    d.textContent = '?';
    return d;
  }

  /** The reel at rest: the row on show with its neighbours. */
  function rest(i: number, hit = false) {
    const n = people.length;
    if (!n) {
      reel.replaceChildren(blank(), blank(), blank());
      return;
    }
    reel.replaceChildren(...[(i + n - 1) % n, i, (i + 1) % n].map((k, j) => cell(people[k], hit && j === 1)));
  }

  function buildBulbs() {
    const W = bulbs.offsetWidth;
    const H = bulbs.offsetHeight;
    if (!W) return;
    const m = 24;
    const step = 28;
    const pts: [number, number][] = [];
    const nx = Math.max(2, Math.round((W - 2 * m) / step));
    const ny = Math.max(2, Math.round((H - 2 * m) / step));
    for (let i = 0; i < nx; i++) pts.push([m + ((W - 2 * m) * i) / nx, 0]);
    for (let j = 0; j < ny; j++) pts.push([W, m + ((H - 2 * m) * j) / ny]);
    for (let i = 0; i < nx; i++) pts.push([W - m - ((W - 2 * m) * i) / nx, H]);
    for (let j = 0; j < ny; j++) pts.push([0, H - m - ((H - 2 * m) * j) / ny]);
    bulbs.replaceChildren(
      ...pts.map(([x, y], i) => {
        const s = document.createElement('span');
        s.style.left = `${x}px`;
        s.style.top = `${y}px`;
        s.style.setProperty('--f', (i / pts.length).toFixed(3));
        return s;
      }),
    );
  }

  onMount(() => {
    current = people.length ? Math.floor(random() * people.length) : 0;
    key = poolKey(people);
    rest(current);
    const onTick = () => sfx.tick(1.15);
    reel.addEventListener('tick', onTick);
    const ro = new ResizeObserver(buildBulbs);
    ro.observe(cabinet);
    return () => {
      reel.removeEventListener('tick', onTick);
      ro.disconnect();
    };
  });

  $effect(() => {
    const k = poolKey(people);
    if (reel && k !== key && !live) {
      key = k;
      current = people.length ? Math.floor(random() * people.length) : 0;
      win = false;
      sub = { key: 'pull' };
      rest(current);
    }
  });

  function pull() {
    lever.classList.remove('pulled');
    void lever.offsetWidth;
    lever.classList.add('pulled');
    sfx.ratchet();
    setTimeout(() => lever.classList.remove('pulled'), 260);
  }

  function bump() {
    cabinet.classList.remove('bump');
    void cabinet.offsetWidth;
    cabinet.classList.add('bump');
  }

  export async function spin(w: number): Promise<{ decoy: number }> {
    pull();
    const n = people.length;
    const tease = drama === 'max' && !reduced && n > 1;
    const strip = reelStrip(n, w, { chill: 12, normal: 18, max: 22 }[drama] + Math.floor(random() * 4), current, random);
    const rows = jackpotRows(n, strip);
    reel.replaceChildren(...rows.map((i) => cell(people[i])));
    win = false;
    live = true;
    sub = { key: 'spinning' };
    const duration = { chill: 1700, normal: 2600, max: 3000 }[drama];
    const decoy = tease ? strip[strip.length - 2] : -1;
    let timer = 0;
    if (tease) {
      timer = window.setTimeout(() => {
        sfx.clunk();
        bump();
        sub = { key: 'near', name: people[decoy].n };
        sfx.roll(1.5);
      }, duration);
    }
    await reel.spin({ from: 1, to: rows.length - 2, duration, tease, hold: 1100 });
    clearTimeout(timer);
    sfx.clunk();
    bump();
    current = w;
    rest(w, true);
    live = false;
    win = true;
    sub = { key: 'jackpot' };
    sfx.coin(0);
    sfx.coin(0.16);
    sfx.coin(0.32);
    await new Promise((r) => setTimeout(r, 650));
    return { decoy };
  }

  export function settle() {
    win = false;
    sub = { key: 'pull' };
  }
</script>

<div class="slots">
  <div class="cabinet" class:live class:win bind:this={cabinet}>
    <div class="bulbs" aria-hidden="true" bind:this={bulbs}></div>
    <div class="marquee">
      <span class="sign">Jackpot</span>
      <span class="sub" aria-live="polite">{sub.key === 'near' ? t('near', { name: sub.name ?? '' }) : t(sub.key)}</span>
    </div>
    <div class="glass">
      <ewo-slot-reel rows="3" rest={1} bind:this={reel}></ewo-slot-reel>
      <div class="payline" aria-hidden="true"></div>
    </div>
  </div>
  <button type="button" class="lever" aria-label={t('aria_slots')} bind:this={lever} onclick={onpull}>
    <span class="mount"></span><span class="rod"><span class="knob"></span></span>
  </button>
</div>

<style>
  .slots {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cabinet {
    position: relative;
    width: var(--cab);
    padding: 18px 16px 16px;
    border-radius: 26px;
    border: 3px solid var(--gold);
    background: linear-gradient(#c8283e, #a01c2f 50%, var(--red-deep));
    box-shadow:
      inset 0 0 0 6px #7a1020,
      inset 0 0 0 8px rgba(232, 191, 90, 0.45),
      0 14px 26px rgba(80, 20, 20, 0.3);
  }
  .cabinet:global(.bump) {
    animation: bump 0.16s;
  }
  @keyframes bump {
    50% {
      translate: 0 3px;
    }
  }
  .bulbs {
    position: absolute;
    inset: -1.5px;
    pointer-events: none;
  }
  .bulbs :global(span) {
    position: absolute;
    width: 10px;
    height: 10px;
    margin: -5px 0 0 -5px;
    border-radius: 50%;
    background: #fff3c4;
    box-shadow: 0 0 9px 2px rgba(255, 190, 70, 0.75);
    animation: bulb 1.2s linear infinite;
    animation-delay: calc(var(--f) * -1.2s);
  }
  .live .bulbs :global(span) {
    animation-duration: 0.42s;
    animation-delay: calc(var(--f) * -0.42s);
  }
  .win .bulbs :global(span) {
    animation: blink 0.28s steps(1) infinite;
  }
  .win .bulbs :global(span:nth-child(odd)) {
    animation-delay: -0.14s;
  }
  @keyframes bulb {
    0%,
    100% {
      opacity: 0.22;
    }
    12% {
      opacity: 1;
    }
    40% {
      opacity: 0.22;
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.12;
    }
  }
  .marquee {
    display: grid;
    justify-items: center;
    gap: 4px;
    margin-bottom: 12px;
  }
  .sign {
    font: 400 clamp(32px, 3.4vw, 46px) / 1 var(--display);
    color: var(--cream);
    text-shadow:
      2px 2px 0 var(--navy),
      0 0 14px rgba(255, 200, 90, 0.5);
  }
  .win .sign {
    animation: flicker 0.18s steps(2) 6;
  }
  @keyframes flicker {
    50% {
      opacity: 0.5;
    }
  }
  .sub {
    font: 800 12px/1.2 var(--body);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #ffe7a3;
    min-height: 1.2em;
    text-align: center;
  }
  .glass {
    position: relative;
    padding: 10px;
    border-radius: 14px;
    background: var(--navy);
  }
  ewo-slot-reel {
    --ewo-reel-row: var(--row);
    --ewo-reel-sheen: rgb(255 255 255 / 0.85);
    border-radius: 10px;
    background: linear-gradient(#efe2c4, var(--paper) 30%, var(--paper) 70%, #efe2c4);
  }
  .payline {
    position: absolute;
    left: 6px;
    right: 6px;
    top: 50%;
    height: var(--row);
    translate: 0 -50%;
    pointer-events: none;
    border-block: 3px solid var(--mustard);
  }
  .payline::before,
  .payline::after {
    content: '';
    position: absolute;
    top: 50%;
    margin-top: -9px;
    border: 9px solid transparent;
  }
  .payline::before {
    left: -11px;
    border-left-color: var(--mustard);
  }
  .payline::after {
    right: -11px;
    border-right-color: var(--mustard);
  }
  .glass :global(.cell) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: calc(var(--row) * 0.18);
    padding: 0 16px;
    color: var(--navy);
  }
  .glass :global(.cell b) {
    flex: none;
    display: grid;
    place-items: center;
    width: calc(var(--row) * 0.62);
    height: calc(var(--row) * 0.62);
    border-radius: 50%;
    background: var(--c);
    color: var(--k);
    font: 400 calc(var(--row) * 0.3) / 1 var(--heavy);
    box-shadow: 0 0 0 2px var(--navy);
  }
  .glass :global(.cell span) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: 400 calc(var(--row) * 0.38) / 1.1 var(--heavy);
  }
  .glass :global(.cell.blank) {
    font: 400 calc(var(--row) * 0.42) / 1 var(--display);
    color: var(--ink-3);
  }
  .glass :global(.cell.hit) {
    animation: hit 0.45s ease-in-out 4;
  }
  .glass :global(.cell.hit b) {
    box-shadow:
      0 0 0 3px var(--paper),
      0 0 0 6px var(--c);
  }
  @keyframes hit {
    50% {
      scale: 1.06;
    }
  }
  .lever {
    position: relative;
    flex: none;
    width: 40px;
    height: calc(var(--row) * 3.2);
    border: 0;
    background: none;
    padding: 0;
    margin-left: -3px;
  }
  .mount {
    position: absolute;
    left: 0;
    top: 50%;
    width: 18px;
    height: 46px;
    margin-top: -23px;
    border-radius: 0 10px 10px 0;
    background: linear-gradient(90deg, #8d6a1d, var(--gold) 60%, #b8861f);
  }
  .rod {
    position: absolute;
    left: 12px;
    bottom: 50%;
    width: 9px;
    height: calc(var(--row) * 1.2);
    border-radius: 4px;
    background: linear-gradient(90deg, #9c6b14, #f5d98a 45%, #9c6b14);
    transform-origin: 50% 100%;
    transition: transform 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  .knob {
    position: absolute;
    left: 50%;
    top: -16px;
    width: 32px;
    height: 32px;
    margin-left: -16px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ff8f8f, var(--red) 45%, #7a1020);
    box-shadow: 0 4px 8px rgba(80, 20, 20, 0.35);
  }
  .lever:global(.pulled) .rod {
    transform: scaleY(-1);
    transition: transform 0.16s cubic-bezier(0.6, 0, 0.9, 0.4);
  }
  @media (prefers-reduced-motion: reduce) {
    .bulbs :global(span) {
      animation: none;
      opacity: 0.7;
    }
  }
</style>
