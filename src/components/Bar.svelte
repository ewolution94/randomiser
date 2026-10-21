<!--
  The bar under the canopy: the name on the left; on the right the pill that opens the drawer with
  the names ("8 in the draw"), the clown horn, and the family's settings button (Folio's sliders).
-->
<script lang="ts">
  import { t } from '../lib/i18n.svelte';

  let { count, onnames, onhorn, onsettings }: { count: number; onnames: () => void; onhorn: (e: MouseEvent) => void; onsettings: () => void } = $props();
</script>

<header class="bar">
  <span class="logo">Randomiser</span>
  <div class="tools">
    <button type="button" class="who" aria-label={t('inDraw', { n: count })} onclick={onnames}>
      <i aria-hidden="true"></i><span class="long" aria-hidden="true">{t('inDraw', { n: count })}</span><span class="short" aria-hidden="true">{count}</span>
      <svg class="short" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.4 2.8-5.2 5.5-5.2s4.9 1.8 5.5 5.2" /><path d="M15.5 5.2a3 3 0 0 1 0 5.6" /><path d="M17.5 13.9c1.7.6 2.8 2.3 3.1 5.1" /></svg>
    </button>
    <button type="button" class="icon" aria-label={t('horn')} title={t('horn')} onclick={onhorn}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h3l9 5V5L6 10H3z" /><path d="M18 9c1.2.8 1.2 5.2 0 6" /><path d="M20.5 7c2 2 2 8 0 10" /></svg>
    </button>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -- the element's own <button> inside makes Enter and Space click -->
    <ewo-settings-button onclick={onsettings}></ewo-settings-button>
  </div>
</header>

<style>
  .bar {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    height: var(--bar);
    padding: 0 var(--gutter);
  }
  .logo {
    font: 400 clamp(26px, 2.6vw, 36px) / 1 var(--display);
    color: var(--red);
    text-shadow: 2px 2px 0 var(--navy);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .who {
    height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    border: 2px solid var(--navy);
    background: var(--paper);
    font: 800 15px/1 var(--body);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .who .short {
    display: none;
  }
  .who svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .who i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--red);
  }
  .icon {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 999px;
    border: 2px solid var(--navy);
    background: var(--paper);
  }
  .icon svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .icon:global(.honk) {
    animation: honk 0.5s;
  }
  @keyframes honk {
    20% {
      scale: 1.2;
      rotate: -10deg;
    }
    60% {
      scale: 0.95;
      rotate: 6deg;
    }
  }
  ewo-settings-button {
    --ewo-fg: var(--navy);
  }
  ewo-settings-button::part(button) {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    border: 2px solid var(--navy);
    background: var(--paper);
  }
  @media (hover: hover) {
    .who:hover,
    .icon:hover {
      scale: 1.05;
      transition: scale 0.2s;
    }
  }
  /* A phone: the name a size down, the pill only the count (its full words are its label). */
  @media (max-width: 760px) {
    .logo {
      font-size: 24px;
    }
    .who {
      padding: 0 12px;
      gap: 6px;
    }
    .who .long {
      display: none;
    }
    .who .short {
      display: inline;
    }
    .tools {
      gap: 6px;
    }
  }
  @media (max-width: 360px) {
    .logo {
      font-size: 21px;
    }
  }
</style>
