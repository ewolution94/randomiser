<!--
  The duck race from the pond stall: a lane per name in a wooden trough, the names on little tags,
  a commentary board above. Every duck paddles in strokes towards a finish staging.ts planned
  around the winner (racePlan), so the lead changes by itself and the board calls it; how long the
  race runs and how much they overtake comes from Settings → Machines. Only the ducks' transforms
  move.
-->
<script lang="ts">
  import { t, type Key } from '../lib/i18n.svelte';
  import { raceAt, racePlan, type Drama, type Overtaking } from '../lib/staging';
  import type { Person } from '../lib/state.svelte';
  import { sfx } from '../lib/sound.svelte';

  let {
    people,
    drama,
    tune,
    reduced,
    random,
  }: { people: Person[]; drama: Drama; tune: { seconds: number; overtaking: Overtaking }; reduced: boolean; random: () => number } = $props();

  type Line = { key: Key; vars?: Record<string, string> };

  let box: HTMLElement;
  let ducks: HTMLElement[] = $state([]);
  let line = $state<Line>({ key: 'r_start' });
  let pop = $state(0);
  let count = $state<{ text: string; n: number } | null>(null);
  let racing = $state(false);
  let won = $state(-1);
  let lane = $state(40);

  // The lanes share the height the stage gives the river (measured, so it follows the window).
  $effect(() => {
    const n = Math.max(1, people.length);
    const measure = () => {
      const h = box?.clientHeight ?? 0;
      // As thin as 14 px, so every duck fits however short the window (the river clips).
      lane = Math.round(Math.max(14, Math.min(56, (h - 70) / n)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box) ro.observe(box);
    return () => ro.disconnect();
  });

  // A new list of names puts the ducks back at the start.
  $effect(() => {
    void people;
    won = -1;
    line = { key: 'r_start' };
    for (const d of ducks) if (d) d.style.transform = '';
  });

  function say(next: Line) {
    line = next;
    pop++;
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const pick = <T,>(list: T[]) => list[Math.min(list.length - 1, Math.floor(random() * list.length))];

  export async function run(w: number): Promise<{ key: Key; vars?: Record<string, string> }> {
    const n = people.length;
    const names = people.map((p) => p.n);
    const { curves, runnerUp } = racePlan(n, w, drama, random, tune.overtaking, tune.seconds);
    won = -1;
    for (const d of ducks) if (d) d.style.transform = '';
    if (drama !== 'chill' && !reduced) {
      say({ key: 'r_marks' });
      for (const s of ['3', '2', '1']) {
        count = { text: s, n: (count?.n ?? 0) + 1 };
        sfx.beep(587);
        await wait(700);
      }
      count = { text: t('r_quack'), n: (count?.n ?? 0) + 1 };
      sfx.beep(1175);
      sfx.quack(0.08);
    } else sfx.quack();
    racing = true;
    say({ key: 'r_off' });
    const T = tune.seconds * 1000 * (reduced ? 0.4 : 1);
    const track = box.querySelector('.track') as HTMLElement;
    const span = Math.max(40, track.clientWidth - (ducks[0]?.offsetWidth ?? 50) - 2);
    const margin = 1 - curves[runnerUp].fin;
    const final: Line = { key: margin < 0.025 ? 'r_win_beak' : margin < 0.08 ? 'r_win' : 'r_win_mile', vars: { name: names[w] } };
    const quip: Line = margin < 0.025 ? { key: 'q_race_beak', vars: { name: names[runnerUp] } } : { key: margin < 0.08 ? 'q_race_post' : 'q_race_mile' };
    return new Promise((resolve) => {
      const t0 = performance.now();
      const pos = new Array(n).fill(0);
      let lastCheck = 0;
      let lastLine = 0;
      let leader = -1;
      let finished = false;
      const frame = (now: number) => {
        const e = now - t0;
        const tt = e / T;
        for (let i = 0; i < n; i++) {
          const c = curves[i];
          pos[i] = tt < 1 ? raceAt(c, tt) : i === w ? 1 : Math.min(1.03, c.fin + (1 - Math.exp(-(tt - 1) * 4)) * 0.05);
          const d = ducks[i];
          if (d) d.style.transform = `translate3d(${(pos[i] * span).toFixed(1)}px, 0, 0)`;
        }
        if (!finished && tt > 0.14 && e - lastCheck > 320) {
          lastCheck = e;
          const order = pos.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]);
          const [first, second] = order;
          const last = order[order.length - 1];
          if (first[1] !== leader && e - lastLine > 700) {
            const was = leader;
            leader = first[1];
            say({ key: pick(['r_lead_1', 'r_lead_2', 'r_lead_3', 'r_lead_4'] as Key[]), vars: { a: names[leader], b: names[was >= 0 ? was : second[1]] } });
            sfx.quack();
            lastLine = e;
          } else if (e - lastLine > 1500) {
            if (tt > 0.65 && first[0] - second[0] < 0.05) say({ key: pick(['r_late_1', 'r_late_2', 'r_late_3'] as Key[]), vars: { a: names[first[1]], b: names[second[1]] } });
            else say({ key: pick(['r_mid_1', 'r_mid_2', 'r_mid_3', 'r_mid_4'] as Key[]), vars: { z: names[last[1]] } });
            lastLine = e;
          }
        }
        if (!finished && tt >= 1) {
          finished = true;
          won = w;
          sfx.splash();
          sfx.quack(0);
          sfx.quack(0.2);
          say(final);
        }
        if (e < T + 900) requestAnimationFrame(frame);
        else {
          racing = false;
          resolve(quip);
        }
      };
      requestAnimationFrame(frame);
    });
  }
</script>

<div class="race" bind:this={box} style:--lh="{lane}px">
  {#key pop}
    <div class="board" class:pop={pop > 0}>{t(line.key, line.vars)}</div>
  {/key}
  <div class="river">
    <ul class="lanes" class:racing>
      {#each people as p, i (p.n + '\u0000' + p.c)}
        <li class="lane" class:won={won === i} style:--c={p.bg}>
          <span class="name"><span>{p.n}</span></span>
          <div class="track">
            <div class="duck" bind:this={ducks[i]}>
              <div class="bob" style:animation-delay="{-((i * 0.37) % 1).toFixed(2)}s">
                <svg viewBox="0 0 64 52" aria-hidden="true">
                  <ellipse class="wake" cx="30" cy="47" rx="26" ry="3.2" />
                  <path class="b" d="M5 24 L1 14 L14 22 Z" />
                  <path class="b" d="M4 30c0-9 9-13 20-12l14 1c7 1 15 5 15 14 0 9-9 14-24 14S4 41 4 30z" />
                  <circle class="b" cx="44" cy="17" r="11" />
                  <path class="beak" d="M53 15c6 0 10 2 10 4.5S58 24 53 23z" />
                  <path class="wing" d="M17 30c5-6 15-6 19 0-5 5-14 5-19 0z" />
                  <circle class="eye" cx="47.5" cy="14.5" r="2.3" />
                  <circle class="glint" cx="48.3" cy="13.7" r="0.8" />
                </svg>
              </div>
            </div>
          </div>
        </li>
      {/each}
    </ul>
    {#if count}
      {#key count.n}
        <div class="count" aria-hidden="true">{count.text}</div>
      {/key}
    {/if}
  </div>
</div>

<style>
  .race {
    width: var(--race);
    height: var(--race-h);
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .board {
    min-height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 8px 12px;
    margin-bottom: 12px;
    background: var(--paper);
    border: 3px solid var(--navy);
    border-radius: 8px;
    font: 400 16px/1.25 var(--heavy);
    letter-spacing: 0.03em;
    box-shadow: 0 4px 0 var(--navy);
  }
  .board.pop {
    animation: pop 0.35s cubic-bezier(0.3, 1.6, 0.5, 1);
  }
  @keyframes pop {
    from {
      scale: 0.92;
      opacity: 0.4;
    }
  }
  .river {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(#4aa3cf, #2f7fae);
    border: 6px solid var(--wood);
    box-shadow:
      inset 0 0 0 2px var(--wood-dark),
      0 10px 20px rgba(60, 30, 10, 0.25);
  }
  .river::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: 16px;
    background: repeating-conic-gradient(var(--cream) 0 25%, var(--navy) 0 50%) 0 0 / 8px 8px;
  }
  .lanes {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .lane {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: clamp(84px, 10vw, 130px) minmax(0, 1fr);
    align-items: center;
    height: var(--lh);
  }
  .lane:nth-child(odd) {
    background: rgba(255, 255, 255, 0.08);
  }
  .lane + .lane {
    border-top: 2px dotted rgba(255, 246, 224, 0.6);
  }
  .lane::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: -48px;
    pointer-events: none;
    opacity: 0.3;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='10'%3E%3Cpath d='M0 5 Q12 0 24 5 T48 5' fill='none' stroke='%23fff6e0' stroke-width='1.6'/%3E%3C/svg%3E") repeat-x 0 78% / 48px 10px;
    animation: flow 2.6s linear infinite;
  }
  .racing .lane::before {
    animation-duration: 0.9s;
  }
  @keyframes flow {
    to {
      translate: -48px 0;
    }
  }
  .name {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 10px;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    font: 800 clamp(13px, 1.1vw, 16px) / 1 var(--body);
  }
  .name::before {
    content: '';
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 0 1.5px var(--navy);
  }
  .name span {
    overflow: hidden;
    text-overflow: ellipsis;
    background: var(--paper);
    padding: 3px 6px 2px;
    border-radius: 4px;
  }
  .won .name span {
    background: var(--mustard);
  }
  .track {
    position: relative;
    height: 100%;
    margin-right: 16px;
    border-left: 2px dashed rgba(255, 246, 224, 0.7);
  }
  .duck {
    position: absolute;
    left: 2px;
    top: 50%;
    width: calc(var(--lh) * 1.25);
    margin-top: calc(var(--lh) * -0.55);
    will-change: transform;
  }
  .bob {
    animation: bob 0.9s ease-in-out infinite alternate;
    transform-origin: 50% 80%;
  }
  .racing .bob {
    animation-duration: 0.3s;
  }
  .won .bob {
    animation: hop 0.5s cubic-bezier(0.3, 1.6, 0.5, 1) 3;
  }
  @keyframes bob {
    from {
      rotate: -5deg;
      translate: 0 1px;
    }
    to {
      rotate: 4deg;
      translate: 0 -2px;
    }
  }
  @keyframes hop {
    50% {
      translate: 0 -45%;
      rotate: -12deg;
    }
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .b {
    fill: var(--c);
    stroke: rgba(0, 0, 0, 0.3);
    stroke-width: 1.2;
  }
  .beak {
    fill: #ff8a00;
    stroke: rgba(0, 0, 0, 0.35);
    stroke-width: 1;
  }
  .wing {
    fill: rgba(0, 0, 0, 0.16);
  }
  .eye {
    fill: #1b1234;
  }
  .glint {
    fill: #fff;
  }
  .wake {
    fill: rgba(255, 255, 255, 0.22);
  }
  .count {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    font: 400 clamp(64px, 9vw, 120px) / 1 var(--display);
    color: var(--cream);
    text-shadow: 3px 3px 0 var(--navy);
    animation: count 0.65s ease-out both;
  }
  @keyframes count {
    0% {
      scale: 2.2;
      opacity: 0;
    }
    30% {
      scale: 1;
      opacity: 1;
    }
    100% {
      scale: 0.9;
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lane::before,
    .bob {
      animation: none;
    }
  }
</style>
