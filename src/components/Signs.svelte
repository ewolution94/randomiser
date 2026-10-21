<!--
  The painted signs beside the machine (layout C, "Big screen"): the three modes down the left (keys
  1, 2, 3), Drama down the right, and under Drama the machine's length (a stopwatch plaque that
  opens Settings → Machines). On a phone they become two rows under the bar, without the plaque. The
  picked sign is red and leans a little; while a draw runs they stay still.
-->
<script lang="ts">
  import { t } from '../lib/i18n.svelte';
  import { MODE_ICON, WATCH_ICON } from '../lib/icons';
  import { DRAMAS, MODES, type Mode } from '../lib/state.svelte';
  import type { Drama } from '../lib/staging';

  let {
    kind,
    mode,
    drama,
    disabled,
    length = '',
    onmode,
    ondrama,
    ontune,
  }: {
    kind: 'modes' | 'drama';
    mode: Mode;
    drama: Drama;
    disabled: boolean;
    /** The machine's length as shown ("5 s"), for the plaque under Drama. */
    length?: string;
    onmode: (m: Mode) => void;
    ondrama: (d: Drama) => void;
    ontune?: () => void;
  } = $props();
</script>

{#if kind === 'modes'}
  <nav class="signs" aria-label={t('mode')}>
    <span class="cap" aria-hidden="true">{t('mode')}</span>
    {#each MODES as m, i (m)}
      <button type="button" class="sign" aria-pressed={mode === m} {disabled} onclick={() => onmode(m)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{@html MODE_ICON[m]}</svg>
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
    {#if ontune && length}
      <button type="button" class="tune" aria-label={t('tuneLabel', { machine: t(mode), s: length })} onclick={ontune}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{@html WATCH_ICON}</svg>
        <span>{length}</span>
      </button>
    {/if}
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
  /* The length plaque: quieter than the signs, a brass-rimmed tag under them. */
  .tune {
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px 6px 9px;
    border-radius: 999px;
    border: 1.5px solid var(--line);
    background: transparent;
    color: var(--ink-2);
    font: 800 13px/1 var(--body);
    font-variant-numeric: tabular-nums;
    transition:
      border-color 0.2s,
      color 0.2s,
      background-color 0.2s;
  }
  .tune svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (hover: hover) {
    .tune:hover {
      border-color: var(--navy);
      color: var(--navy);
      background: var(--paper);
    }
  }
  @media (hover: hover) {
    .sign:not(:disabled):hover {
      scale: 1.04;
      transition: scale 0.2s;
    }
  }
  /* A short laptop window (under ~700 px of height): smaller signs, so the column fits beside the
     machine instead of pushing it over the ticket. */
  @media (min-width: 761px) and (max-height: 700px) {
    .signs {
      gap: 9px;
    }
    .sign {
      padding: 8px 8px 7px;
      gap: 4px;
      font-size: 14px;
    }
    .drama .sign {
      padding: 8px;
    }
    .sign svg {
      width: 26px;
      height: 26px;
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
    .sign small,
    .tune {
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
