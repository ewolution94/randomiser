<!--
  The painted signs beside the machine (layout C, "Big screen"): the three modes down the left (keys
  1, 2, 3), Drama down the right. On a phone they become two rows under the bar. The picked sign is
  red and leans a little; while a draw runs they stay still.
-->
<script lang="ts">
  import { t } from '../lib/i18n.svelte';
  import { DRAMAS, MODES, type Mode } from '../lib/state.svelte';
  import type { Drama } from '../lib/staging';

  let {
    kind,
    mode,
    drama,
    disabled,
    onmode,
    ondrama,
  }: { kind: 'modes' | 'drama'; mode: Mode; drama: Drama; disabled: boolean; onmode: (m: Mode) => void; ondrama: (d: Drama) => void } = $props();

  const ICON: Record<Mode, string> = {
    wheel: '<circle cx="12" cy="13" r="8"/><path d="M12 5v16M4 13h16M6.3 7.3l11.4 11.4M17.7 7.3 6.3 18.7"/><path d="M12 1.5 10.5 4h3z"/>',
    slots: '<rect x="3" y="5" width="15" height="15" rx="2"/><path d="M3 12.5h15"/><path d="M21 8v6M21 14h-3"/><circle cx="21" cy="7" r="1.5"/>',
    race: '<path d="M4 14c0-3 2.5-4.5 6-4.3l4 .3c.5-2.5 1.5-4 3.5-4s3 1.5 3 3.5c0 1-.5 2-1.5 2.5 1.5 1 2 3 .5 4.5-2 2-6 2.5-9.5 2.3S4 17.5 4 14z"/><path d="M2 20c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>',
  };
</script>

{#if kind === 'modes'}
  <nav class="signs" aria-label={t('mode')}>
    <span class="cap" aria-hidden="true">{t('mode')}</span>
    {#each MODES as m, i (m)}
      <button type="button" class="sign" aria-pressed={mode === m} {disabled} onclick={() => onmode(m)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{@html ICON[m]}</svg>
        <span>{t(m)}</span>
        <small aria-hidden="true">{i + 1}</small>
      </button>
    {/each}
  </nav>
{:else}
  <div class="signs drama" role="radiogroup" aria-label={t('drama')}>
    <span class="cap" aria-hidden="true">{t('drama')}</span>
    {#each DRAMAS as d (d)}
      <button type="button" class="sign" role="radio" aria-checked={drama === d} onclick={() => ondrama(d)}>
        <span>{t(d)}</span>
      </button>
    {/each}
  </div>
{/if}

<style>
  .signs {
    display: grid;
    gap: 14px;
    align-content: center;
    justify-items: center;
  }
  .cap {
    font: 800 11px/1 var(--body);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .sign {
    width: 124px;
    padding: 12px 8px 10px;
    border-radius: 12px;
    border: 2px solid var(--navy);
    background: var(--paper);
    display: grid;
    justify-items: center;
    gap: 6px;
    font: 400 15px/1.1 var(--heavy);
    box-shadow: 0 4px 0 rgba(29, 42, 92, 0.18);
    transition:
      rotate 0.25s,
      background-color 0.2s,
      color 0.2s;
  }
  .drama .sign {
    padding: 11px 8px;
  }
  .sign svg {
    width: 34px;
    height: 34px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .sign small {
    font: 700 10px/1 var(--body);
    letter-spacing: 0.1em;
    opacity: 0.7;
  }
  .sign[aria-pressed='true'],
  .sign[aria-checked='true'] {
    background: var(--red);
    color: var(--cream);
    rotate: -3deg;
  }
  .sign:disabled {
    cursor: default;
  }
  @media (hover: hover) {
    .sign:not(:disabled):hover {
      scale: 1.04;
      transition: scale 0.2s;
    }
  }
  /* A phone: a row of compact signs under the bar. */
  @media (max-width: 760px) {
    .signs {
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: 8px;
      width: 100%;
    }
    .cap,
    .sign small {
      display: none;
    }
    .sign {
      width: auto;
      padding: 8px 4px;
      gap: 4px;
      font-size: 14px;
    }
    .sign svg {
      width: 24px;
      height: 24px;
    }
    .drama .sign {
      padding: 7px 4px;
      font-size: 13px;
      box-shadow: 0 3px 0 rgba(29, 42, 92, 0.18);
    }
  }
</style>
