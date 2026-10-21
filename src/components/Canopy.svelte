<!--
  The fair's canopy across the top: red and cream stripes with a scalloped edge, and a string of
  coloured bulbs under it that chase slowly, and fast while a draw runs (`live`). Only opacity
  animates, on the compositor; nothing under reduced motion.
-->
<script lang="ts">
  let { live = false }: { live?: boolean } = $props();
  const BULBS = 44;
</script>

<div class="canopy" aria-hidden="true"></div>
<div class="lights" class:live aria-hidden="true">
  {#each Array.from({ length: BULBS }, (_, i) => i) as i (i)}
    <span style:--f={(i / BULBS).toFixed(3)}></span>
  {/each}
</div>

<style>
  .canopy {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: calc(var(--canopy) + env(safe-area-inset-top, 0px));
    z-index: 20;
    background: repeating-linear-gradient(90deg, var(--red) 0 30px, var(--cream) 30px 60px);
    -webkit-mask:
      linear-gradient(#000, #000) 0 0 / 100% calc(var(--canopy) - 14px + env(safe-area-inset-top, 0px)) no-repeat,
      radial-gradient(circle at 15px 0, #000 15px, transparent 15.5px) 0 calc(var(--canopy) - 14px + env(safe-area-inset-top, 0px)) / 30px 15px repeat-x;
    mask:
      linear-gradient(#000, #000) 0 0 / 100% calc(var(--canopy) - 14px + env(safe-area-inset-top, 0px)) no-repeat,
      radial-gradient(circle at 15px 0, #000 15px, transparent 15.5px) 0 calc(var(--canopy) - 14px + env(safe-area-inset-top, 0px)) / 30px 15px repeat-x;
    filter: drop-shadow(0 3px 0 rgba(29, 42, 92, 0.22));
    pointer-events: none;
  }
  .lights {
    position: absolute;
    top: calc(var(--canopy) + 6px + env(safe-area-inset-top, 0px));
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    overflow: hidden;
  }
  .lights::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 4px;
    border-top: 1.5px solid rgba(29, 42, 92, 0.4);
  }
  span {
    position: relative;
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ffe7a3;
    box-shadow: 0 0 8px 2px rgba(255, 180, 60, 0.7);
    animation: bulb 1.4s linear infinite;
    animation-delay: calc(var(--f) * -1.4s);
  }
  span:nth-child(3n + 1) {
    background: #ff8f8f;
    box-shadow: 0 0 8px 2px rgba(215, 38, 61, 0.55);
  }
  span:nth-child(3n + 2) {
    background: #9be0d5;
    box-shadow: 0 0 8px 2px rgba(63, 184, 166, 0.55);
  }
  .live span {
    animation-duration: 0.4s;
    animation-delay: calc(var(--f) * -0.4s);
  }
  @keyframes bulb {
    0%,
    100% {
      opacity: 0.25;
    }
    12% {
      opacity: 1;
    }
    40% {
      opacity: 0.25;
    }
  }
  /* A phone shows every other bulb: the string keeps its spacing on a narrow screen. */
  @media (max-width: 760px) {
    span:nth-child(even) {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
      opacity: 0.7;
    }
  }
</style>
