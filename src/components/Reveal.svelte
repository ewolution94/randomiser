<!--
  The winner as a prize ticket (look C of plans/randomiser/winner.html, picked 2026-10-21): the room
  goes dark, a lamp under the canopy throws a spotlight, and the ticket that was pressed rises into
  it and turns into the prize: the name on cream, the ticket's number on the stub, a First-prize
  stamp, a few gold sparks. "New ticket" (Space) draws again, "Done" (Escape) closes. The way out is
  always a visible button (learnings/dialogs-and-overlays.md), and closing happens at once.
-->
<script lang="ts">
  import { lockScroll } from '../../vendor/ewo/elements/scroll-lock.js';
  import { t, type Key } from '../lib/i18n.svelte';
  import type { Mode, Person } from '../lib/state.svelte';

  let {
    winner,
    quip,
    once,
    mode,
    ticket,
    from,
    reduced,
    onagain,
    ondone,
  }: {
    winner: Person;
    quip: { key: Key; vars?: Record<string, string> };
    once: boolean;
    mode: Mode;
    ticket: number;
    /** The pressed ticket's box, where the prize rises from; null when it can't be measured. */
    from: DOMRect | null;
    reduced: boolean;
    onagain: () => void;
    ondone: () => void;
  } = $props();

  let done: HTMLButtonElement;
  let wrap: HTMLDivElement;
  const len = $derived(Math.max(3, [...winner.n].length));
  const serial = $derived(t('ticket', { n: String(ticket).padStart(4, '0') }));
  const rise = $derived(!reduced && from !== null);
  // Where the sparks fall in the light: decoration only, so Math.random will do.
  const sparks = Array.from({ length: 16 }, () => ({
    x: 15 + Math.random() * 70,
    d: 2.8 + Math.random() * 1.8,
    dl: 0.7 + Math.random() * 2.6,
    sx: Math.round((Math.random() - 0.5) * 140),
  }));

  $effect(() => {
    const unlock = lockScroll();
    const timer = setTimeout(() => done?.focus({ preventScroll: true }), 60);
    return () => {
      clearTimeout(timer);
      unlock();
    };
  });

  // The ticket rises from the button that was pressed, grows into the card and settles.
  $effect(() => {
    if (!rise || !from) return;
    const to = wrap.getBoundingClientRect();
    const dx = from.x + from.width / 2 - (to.x + to.width / 2);
    const dy = from.y + from.height / 2 - (to.y + to.height / 2);
    const s = from.width / to.width;
    // Eased per step, as a CSS keyframe would be: up and a touch over, then down into place.
    const ease = 'cubic-bezier(0.2, 0.9, 0.25, 1)';
    const a = wrap.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s})`, easing: ease },
        { transform: 'translate(0, -10px) scale(1.015)', offset: 0.62, easing: ease },
        { transform: 'none' },
      ],
      { duration: 950, delay: 100, fill: 'backwards' },
    );
    return () => a.cancel();
  });

  function key(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      ondone();
    } else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      onagain();
    }
  }
</script>

<svelte:window onkeydown={key} />

<div class="reveal" class:rise role="dialog" aria-modal="true" aria-labelledby="winner-name">
  <div class="veil" aria-hidden="true"></div>
  <div class="light" aria-hidden="true">
    <div class="cone"></div>
    <div class="sparks">
      {#each sparks as s, i (i)}
        <i style:left="{s.x}%" style:--d="{s.d}s" style:--dl="{s.dl}s" style:--sx="{s.sx}px"></i>
      {/each}
    </div>
    <div class="lamp"></div>
  </div>
  <div class="wrap" bind:this={wrap} style:--c={winner.bg} style:--len={len}>
    <div class="card">
      <div class="stub"><i></i><span>{serial}</span></div>
      <div class="main">
        <p class="kick">{t('winner')}</p>
        <h2 class="name" id="winner-name">{winner.n}</h2>
        <p class="quip">{t(quip.key, quip.vars)}</p>
        <div class="actions">
          <button type="button" class="again" onclick={onagain}>{once ? t('next') : t('again')}<kbd>Space</kbd></button>
          <button type="button" class="done" bind:this={done} onclick={ondone}>{t('done')}<kbd>Esc</kbd></button>
        </div>
      </div>
      <div class="cover" aria-hidden="true"><b>{t(`go_${mode}`)}</b><small>{serial}</small></div>
    </div>
    <p class="stamp">{t('prize')}</p>
  </div>
</div>

<style>
  .reveal {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: max(24px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
  }
  .veil,
  .light {
    position: absolute;
    inset: 0;
  }
  .veil {
    background: rgba(17, 23, 54, 0.84);
    animation: fade 0.35s ease both;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .light {
    pointer-events: none;
    animation: fade 0.6s ease 0.25s both;
  }
  /* The lamp hangs from the canopy; its cone is blurred once, as a still layer. */
  .lamp {
    position: absolute;
    left: 50%;
    top: calc(var(--canopy) - 18px + env(safe-area-inset-top, 0px));
    translate: -50% 0;
    width: 68px;
    height: 30px;
    border-radius: 0 0 34px 34px;
    background: #2a3768;
    box-shadow:
      0 0 0 2px #3a4a85,
      0 10px 26px rgba(255, 238, 196, 0.55);
  }
  .cone {
    position: absolute;
    left: 50%;
    top: calc(var(--canopy) - 4px + env(safe-area-inset-top, 0px));
    translate: -50% 0;
    width: min(820px, 150vw);
    height: 84%;
    filter: blur(10px);
  }
  .cone::before {
    content: '';
    position: absolute;
    inset: 0;
    clip-path: polygon(45% 0, 55% 0, 86% 100%, 14% 100%);
    background: linear-gradient(rgba(255, 238, 196, 0.28), rgba(255, 238, 196, 0.07));
  }
  .cone::after {
    content: '';
    position: absolute;
    left: 4%;
    right: 4%;
    bottom: -60px;
    height: 190px;
    background: radial-gradient(closest-side, rgba(255, 238, 196, 0.2), transparent);
  }
  .sparks {
    position: absolute;
    left: 50%;
    top: var(--canopy);
    translate: -50% 0;
    width: min(440px, 80vw);
    height: 76%;
    overflow: hidden;
  }
  .sparks i {
    position: absolute;
    top: -10px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ffd77a;
    box-shadow: 0 0 6px #ffd77a;
    opacity: 0;
    animation: spark var(--d) linear var(--dl) infinite;
  }
  @keyframes spark {
    0% {
      opacity: 0;
      transform: translate(0, 0);
    }
    15% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--sx), 72vh);
    }
  }

  .wrap {
    position: relative;
    width: min(620px, 100%);
    filter: drop-shadow(0 20px 32px rgba(0, 0, 0, 0.45));
  }
  .card {
    --notch: 50%;
    position: relative;
    display: grid;
    grid-template-columns: 118px minmax(0, 1fr);
    min-height: 340px;
    border-radius: 14px;
    overflow: hidden;
    background: var(--paper);
    -webkit-mask:
      radial-gradient(circle 17px at 0 var(--notch), transparent 97%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 17px at 100% var(--notch), transparent 97%, #000) right / 51% 100% no-repeat;
    mask:
      radial-gradient(circle 17px at 0 var(--notch), transparent 97%, #000) left / 51% 100% no-repeat,
      radial-gradient(circle 17px at 100% var(--notch), transparent 97%, #000) right / 51% 100% no-repeat;
  }
  .stub {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 18px;
    background: #f7ead0;
    border-right: 2px dashed rgba(29, 42, 92, 0.32);
  }
  .stub i {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 0 2px var(--navy);
  }
  .stub span {
    writing-mode: vertical-rl;
    rotate: 180deg;
    font: 800 13px/1 var(--body);
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .main {
    container-type: inline-size;
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 10px;
    padding: 26px 34px;
    text-align: center;
  }
  .main p {
    margin: 0;
  }
  .kick {
    font: 800 13px/1 var(--body);
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--red);
  }
  .name {
    margin: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    font: 400 min(92px, calc(100cqi / (var(--len) * 0.7))) / 1.05 var(--heavy);
    color: var(--navy);
  }
  .quip {
    max-width: 34ch;
    font: italic 500 18px/1.35 var(--body);
    color: var(--ink-2);
    text-wrap: balance;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 10px;
  }
  .actions button {
    height: 52px;
    padding: 0 24px;
    border-radius: 10px;
    font: 400 18px/1 var(--heavy);
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .again {
    border: 0;
    background: var(--navy);
    color: var(--cream);
    box-shadow: 0 5px 0 #0e1638;
  }
  .again:active {
    transform: translateY(4px);
    box-shadow: 0 1px 0 #0e1638;
  }
  .done {
    border: 2px solid var(--navy);
    background: var(--paper);
    color: var(--navy);
  }
  kbd {
    font: 700 11px/1 var(--body);
    opacity: 0.7;
  }
  @media (hover: none) {
    kbd {
      display: none;
    }
  }
  /* The red face of the pressed ticket, fading to the prize as it rises. */
  .cover {
    display: none;
  }
  .rise .cover {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    gap: 10px;
    background: var(--red);
    color: var(--cream);
    pointer-events: none;
    animation: cover 0.5s ease 0.35s both;
  }
  @keyframes cover {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  .cover b {
    font: 400 96px/1 var(--heavy);
  }
  .cover small {
    font: 700 26px/1 var(--body);
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #ffe7a3;
  }
  .stamp {
    position: absolute;
    right: -28px;
    top: -34px;
    width: 108px;
    height: 108px;
    margin: 0;
    padding: 12px;
    border-radius: 50%;
    rotate: -14deg;
    display: grid;
    place-items: center;
    text-align: center;
    font: 400 15px/1.05 var(--display);
    color: var(--red);
    background: var(--paper);
    border: 3px solid var(--red);
    box-shadow:
      inset 0 0 0 4px var(--paper),
      inset 0 0 0 6px var(--red);
    animation: thump 0.45s cubic-bezier(0.3, 1.4, 0.5, 1) 1.05s both;
  }
  @keyframes thump {
    0% {
      opacity: 0;
      scale: 2.6;
    }
    70% {
      opacity: 1;
      scale: 0.94;
    }
    100% {
      opacity: 1;
      scale: 1;
    }
  }
  /* A phone: the stub on top, the notches at its perforation. */
  @media (max-width: 600px) {
    .card {
      --notch: 46px;
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: 46px auto;
      min-height: 0;
    }
    .stub {
      display: flex;
      gap: 10px;
      justify-content: center;
      border-right: 0;
      border-bottom: 2px dashed rgba(29, 42, 92, 0.32);
    }
    .stub i {
      width: 14px;
      height: 14px;
    }
    .stub span {
      writing-mode: horizontal-tb;
      rotate: none;
      font-size: 11px;
    }
    .main {
      padding: 22px 18px 24px;
    }
    .quip {
      font-size: 16px;
    }
    .actions button {
      height: 48px;
      padding: 0 20px;
      font-size: 16px;
    }
    .cover b {
      font-size: 64px;
    }
    .cover small {
      font-size: 16px;
    }
    .stamp {
      right: -6px;
      top: -26px;
      width: 84px;
      height: 84px;
      padding: 8px;
      font-size: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .veil,
    .light,
    .stamp {
      animation: none;
    }
    .sparks {
      display: none;
    }
  }
</style>
