<!--
  The winner: a striped curtain drops, the first-prize rosette, the question, and the name on a
  hanging sign that swings in on its ropes; under it the quip. "New ticket" (Space) draws again,
  "Done" (Escape) closes. The way out is always a visible button (learnings/dialogs-and-overlays.md),
  and closing happens at once.
-->
<script lang="ts">
  import { lockScroll } from '../../vendor/ewo/elements/scroll-lock.js';
  import { t, type Key } from '../lib/i18n.svelte';
  import type { Person } from '../lib/state.svelte';

  let {
    winner,
    quip,
    once,
    onagain,
    ondone,
  }: { winner: Person; quip: { key: Key; vars?: Record<string, string> }; once: boolean; onagain: () => void; ondone: () => void } = $props();

  let done: HTMLButtonElement;
  const len = $derived(Math.max(3, [...winner.n].length));

  $effect(() => {
    const unlock = lockScroll();
    const timer = setTimeout(() => done?.focus({ preventScroll: true }), 60);
    return () => {
      clearTimeout(timer);
      unlock();
    };
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

<div class="reveal" role="dialog" aria-modal="true" aria-labelledby="winner-name" style:--c={winner.bg}>
  <div class="curtain" aria-hidden="true"></div>
  <div class="body">
    <p class="prize">{t('prize')}</p>
    <p class="q">{t('question')}</p>
    <h2 class="name" id="winner-name" style:--len={len}>{winner.n}</h2>
    <p class="quip">{t(quip.key, quip.vars)}</p>
    <div class="actions">
      <button type="button" class="again" onclick={onagain}>{once ? t('next') : t('again')}<kbd>Space</kbd></button>
      <button type="button" class="done" bind:this={done} onclick={ondone}>{t('done')}<kbd>Esc</kbd></button>
    </div>
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
    animation: fade 0.25s both;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .curtain {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(90deg, var(--red) 0 clamp(30px, 3.2vw, 48px), var(--cream) clamp(30px, 3.2vw, 48px) clamp(60px, 6.4vw, 96px));
    animation: drop 0.5s cubic-bezier(0.3, 1.25, 0.5, 1) both;
  }
  @keyframes drop {
    from {
      translate: 0 -100%;
    }
  }
  .body {
    position: relative;
    display: grid;
    justify-items: center;
    gap: clamp(12px, 1.6vh, 18px);
    text-align: center;
    max-width: min(1100px, 100%);
  }
  .body p {
    margin: 0;
  }
  .prize {
    width: clamp(88px, 9vw, 120px);
    aspect-ratio: 1;
    border-radius: 50%;
    display: grid;
    place-items: center;
    padding: 14px;
    background: radial-gradient(var(--mustard) 54%, var(--red) 55% 63%, var(--mustard) 64%);
    box-shadow:
      0 0 0 3px var(--navy),
      0 6px 0 rgba(29, 42, 92, 0.35);
    font: 400 clamp(13px, 1.2vw, 16px) / 1.05 var(--heavy);
    color: var(--navy);
    text-transform: uppercase;
  }
  .q,
  .quip {
    background: var(--paper);
    color: var(--navy);
    border: 2px solid var(--navy);
    border-radius: 999px;
    padding: 7px 18px;
  }
  .q {
    font: 800 clamp(13px, 1.1vw, 15px) / 1.3 var(--body);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .quip {
    font: 400 clamp(16px, 1.5vw, 20px) / 1.35 var(--heavy);
    max-width: 36ch;
    text-wrap: balance;
  }
  .name {
    position: relative;
    margin: clamp(40px, 6vh, 60px) 0 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    background: var(--paper);
    color: var(--navy);
    border: 5px solid var(--navy);
    border-radius: 12px;
    padding: 0.12em 0.45em 0.08em;
    font: 400 min(160px, 15vh, calc(88vw / (var(--len) * 0.62))) / 1.05 var(--display);
    box-shadow:
      0 9px 0 var(--red-deep),
      0 20px 30px rgba(0, 0, 0, 0.28);
    transform-origin: 50% calc(-1 * clamp(40px, 6vh, 60px));
    animation: swing 1.5s cubic-bezier(0.3, 1.2, 0.4, 1) 0.25s both;
  }
  .name::before {
    content: '';
    position: absolute;
    left: 16%;
    right: 16%;
    top: calc(-1 * clamp(40px, 6vh, 60px) - 5px);
    height: clamp(40px, 6vh, 60px);
    border-left: 4px solid var(--navy);
    border-right: 4px solid var(--navy);
  }
  @keyframes swing {
    0% {
      rotate: -28deg;
      translate: 0 -80px;
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    42% {
      rotate: 12deg;
      translate: 0 0;
    }
    62% {
      rotate: -6deg;
    }
    80% {
      rotate: 3deg;
    }
    100% {
      rotate: 0deg;
    }
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 10px;
  }
  .actions button {
    height: 54px;
    padding: 0 26px;
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
  @media (prefers-reduced-motion: reduce) {
    .curtain,
    .name {
      animation: none;
    }
  }
</style>
