<!--
  Randomiser, layout C "Big screen" (plans/randomiser.md in the workspace, picked 2026-10-21): the
  machine as big as the window allows, the mode signs down the left, Drama down the right, the
  ticket at the bottom; the names in a drawer. Made for a laptop shared in the meeting; on a phone
  the signs fold into rows under the bar and the drawer becomes a sheet.

  A draw: the winner is picked first (staging.ts, the browser's crypto random), then the mode in
  use plays its way there, then the reveal. Everything lives on this device (state.svelte.ts).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import Bar from './components/Bar.svelte';
  import Canopy from './components/Canopy.svelte';
  import Drawer from './components/Drawer.svelte';
  import JackpotMachine from './components/JackpotMachine.svelte';
  import RaceMachine from './components/RaceMachine.svelte';
  import Reveal from './components/Reveal.svelte';
  import Settings from './components/Settings.svelte';
  import Signs from './components/Signs.svelte';
  import Ticket from './components/Ticket.svelte';
  import WheelMachine from './components/WheelMachine.svelte';
  import { loadCensus } from './lib/census';
  import { t, type Key } from './lib/i18n.svelte';
  import { pickIndex, sitOut, type Drama } from './lib/staging';
  import { MODES, app, pool, save, type Mode, type Person } from './lib/state.svelte';
  import { sfx, sound, unlock } from './lib/sound.svelte';

  /** The browser's crypto source: fair enough for a draw. */
  function random() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] / 4294967296;
  }

  const people = $derived(pool());
  const ready = $derived(people.length >= 2 || (app.once && people.length === 1));
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = $state(reducedQuery.matches);
  reducedQuery.addEventListener('change', () => (reduced = reducedQuery.matches));

  let busy = $state(false);
  let drawerOpen = $state(false);
  let settingsOpen = $state(false);
  let won: { winner: Person; quip: { key: Key; vars?: Record<string, string> }; no: number; from: DOMRect | null } | null = $state(null);
  let toastText = $state('');
  let toastTimer = 0;
  let announce = $state('');
  let machineEl: HTMLElement;
  let footEl: HTMLElement;

  let wheel: WheelMachine;
  let jackpot: JackpotMachine;
  let race: RaceMachine;

  onMount(() => {
    loadCensus();
    // A first visit has no names: the drawer asks for them.
    if (!app.names.length) drawerOpen = true;
  });

  function toast(text: string) {
    toastText = text;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toastText = ''), 2800);
  }

  const wheelHooks = {
    busy: () => busy || Boolean(won),
    drama: () => app.drama,
    reduced: () => reduced,
    random,
    tick: () => sfx.tick(0.9 + random() * 0.2),
    roll: (seconds: number) => sfx.roll(seconds),
    flick: (dir: number, power: number) => void go({ dir, power }),
  };

  async function go(o: { dir?: number; power?: number } = {}) {
    if (busy || won) return;
    const p = people;
    unlock();
    if (p.length === 1 && app.once) {
      reveal(p[0], { key: 'lastOne' }, app.ticket);
      return;
    }
    if (p.length < 2) {
      drawerOpen = true;
      if (app.names.length) toast(t('needTwo'));
      return;
    }
    const no = app.ticket;
    app.ticket++;
    save();
    busy = true;
    const w = pickIndex(p.length, random);
    const mode = app.mode;
    let quip: { key: Key; vars?: Record<string, string> };
    try {
      if (mode === 'wheel') {
        const r = await wheel.spin(w, o.dir ?? 1, o.power ?? 1);
        quip = r.decoy >= 0 ? { key: 'q_wheel_near', vars: { name: p[r.decoy].n } } : { key: (['q_wheel_1', 'q_wheel_2', 'q_wheel_3'] as Key[])[pickIndex(3, random)] };
      } else if (mode === 'slots') {
        const r = await jackpot.spin(w);
        quip = r.decoy >= 0 ? { key: 'q_slots_near', vars: { name: p[r.decoy].n } } : { key: 'q_slots' };
      } else {
        quip = await race.run(w);
      }
    } finally {
      busy = false;
    }
    app.history.unshift({ n: p[w].n, c: p[w].c, mode, t: Date.now() });
    app.history = app.history.slice(0, 12);
    save();
    reveal(p[w], quip, no);
  }

  /** `no` is the number on the ticket that was pressed; the prize carries it. */
  function reveal(winner: Person, quip: { key: Key; vars?: Record<string, string> }, no: number) {
    won = { winner, quip, no, from: footEl.querySelector('button')?.getBoundingClientRect() ?? null };
    announce = t('drawn', { name: winner.n });
    if (!reduced) {
      machineEl.classList.remove('shake');
      void machineEl.offsetWidth;
      machineEl.classList.add('shake');
    }
    sfx.tusch();
    if (app.drama === 'max') sfx.horn(1.1);
  }

  function close(again: boolean) {
    if (!won) return;
    const { winner } = won;
    won = null;
    if (app.mode === 'wheel') wheel.settle();
    if (app.mode === 'slots') jackpot.settle();
    if (app.once) {
      const r = sitOut(app.names, winner);
      app.names = r.names;
      if (r.fresh) toast(t('allBack'));
    }
    save();
    if (again) void go();
  }

  function setMode(m: Mode) {
    if (busy || won) return;
    app.mode = m;
    save();
  }

  function setDrama(d: Drama) {
    app.drama = d;
    save();
  }

  function horn(e: MouseEvent) {
    unlock();
    sfx.horn();
    const b = e.currentTarget as HTMLElement;
    b.classList.remove('honk');
    void b.offsetWidth;
    b.classList.add('honk');
    if (!sound.on) toast(t('soundOff'));
  }

  // The keyboard, for the laptop in the meeting: Space draws, 1 2 3 pick the mode. The reveal, the
  // drawer and the sheet handle their own keys.
  function keydown(e: KeyboardEvent) {
    if (won || drawerOpen || settingsOpen || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable], ewo-sheet')) return;
    if (e.key === ' ' && !(target instanceof HTMLButtonElement)) {
      e.preventDefault();
      void go();
    } else if (['1', '2', '3'].includes(e.key)) {
      setMode(MODES[Number(e.key) - 1]);
    }
  }
</script>

<svelte:window onkeydown={keydown} />

<Canopy live={busy} />
<div class="app" class:live={busy}>
  <Bar count={people.length} onnames={() => (drawerOpen = true)} onhorn={horn} onsettings={() => (settingsOpen = true)} />
  <div class="stage">
    <div class="side left">
      <Signs kind="modes" mode={app.mode} drama={app.drama} disabled={busy || Boolean(won)} onmode={setMode} ondrama={setDrama} />
    </div>
    <div class="machine" bind:this={machineEl}>
        <div class="slot" hidden={app.mode !== 'wheel'}>
          <WheelMachine bind:this={wheel} {people} active={app.mode === 'wheel'} hooks={wheelHooks} />
        </div>
        <div class="slot" hidden={app.mode !== 'slots'}>
          <JackpotMachine bind:this={jackpot} {people} drama={app.drama} {reduced} {random} onpull={() => void go()} />
        </div>
        <div class="slot" hidden={app.mode !== 'race'}>
          <RaceMachine bind:this={race} {people} drama={app.drama} {reduced} {random} />
        </div>
    </div>
    <div class="side right">
      <Signs kind="drama" mode={app.mode} drama={app.drama} disabled={busy} onmode={setMode} ondrama={setDrama} />
    </div>
  </div>
  <footer class="foot" bind:this={footEl}>
    <Ticket mode={app.mode} ticket={app.ticket} {ready} disabled={busy} onclick={() => void go()} />
    <p class="keys"><kbd>Space</kbd> {t('keysSpin')} · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> {t('keysMode')}</p>
  </footer>
</div>

<Drawer bind:open={drawerOpen} {busy} ontoast={toast} />
<Settings bind:open={settingsOpen} />
{#if won}
  <Reveal winner={won.winner} quip={won.quip} once={app.once} mode={app.mode} ticket={won.no} from={won.from} {reduced} onagain={() => close(true)} ondone={() => close(false)} />
{/if}
<div class="toast" class:on={toastText} role="status" aria-live="polite">{toastText}</div>
<p class="sr-only" aria-live="assertive">{announce}</p>

<style>
  .app {
    position: relative;
    min-height: 100svh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    padding-top: calc(var(--canopy) + 18px + env(safe-area-inset-top, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .stage {
    display: grid;
    grid-template-columns: var(--side) minmax(0, 1fr) var(--side);
    align-items: center;
    gap: 16px;
    padding: 0 var(--gutter);
  }
  .side {
    display: grid;
    justify-items: center;
  }
  .machine {
    display: grid;
    place-items: center;
    min-height: var(--stage-h);
  }
  .machine:global(.shake) {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
  }
  @keyframes shake {
    20%,
    80% {
      translate: 4px -1px;
    }
    35%,
    65% {
      translate: -6px 2px;
    }
    50% {
      translate: 6px 0;
    }
  }
  .slot {
    display: grid;
    place-items: center;
  }
  .foot {
    display: grid;
    justify-items: center;
    gap: 8px;
    padding: 6px var(--gutter) 22px;
  }
  .keys {
    margin: 0;
    font: 600 12px/1.3 var(--body);
    color: var(--ink-3);
    letter-spacing: 0.04em;
  }
  .keys kbd {
    font: 700 11px/1 var(--body);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1.5px solid var(--line);
    background: var(--paper);
  }
  @media (hover: none) {
    .keys {
      display: none;
    }
  }
  /* A phone: the signs become rows under the bar, the machine takes the width. */
  @media (max-width: 760px) {
    .stage {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
      align-content: start;
    }
    .side.left {
      order: -2;
    }
    .side.right {
      order: -1;
    }
    .machine {
      min-height: 0;
      padding-top: 6px;
    }
    .foot {
      padding-bottom: 8px;
    }
  }
  .toast {
    position: fixed;
    z-index: 80;
    left: 50%;
    bottom: max(22px, env(safe-area-inset-bottom, 0px));
    translate: -50% 12px;
    opacity: 0;
    pointer-events: none;
    max-width: calc(100% - 32px);
    padding: 12px 18px;
    border-radius: 999px;
    background: var(--navy);
    color: var(--cream);
    font: 800 14px/1.3 var(--body);
    text-align: center;
    transition:
      opacity 0.25s,
      translate 0.25s;
  }
  .toast.on {
    opacity: 1;
    translate: -50% 0;
  }
</style>
