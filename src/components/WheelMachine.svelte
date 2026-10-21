<!--
  The Glücksrad on its wooden stand (the drawing is lib/wheel.ts). The app calls spin(); a drag,
  flick or tap on the wheel asks the app to draw (hooks.flick).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { t } from '../lib/i18n.svelte';
  import { poolKey, type Person } from '../lib/state.svelte';
  import { WheelEngine, type WheelHooks } from '../lib/wheel';

  let { people, active, hooks }: { people: Person[]; active: boolean; hooks: WheelHooks } = $props();

  let canvas: HTMLCanvasElement;
  let engine: WheelEngine | null = $state(null);
  let key = '';

  onMount(() => {
    const e = new WheelEngine(canvas, hooks);
    e.setNames(people);
    key = poolKey(people);
    engine = e;
    return () => e.destroy();
  });

  $effect(() => {
    const k = poolKey(people);
    if (engine && k !== key) {
      key = k;
      engine.setNames(people);
    }
  });

  $effect(() => {
    if (!engine) return;
    if (active) engine.start();
    else engine.stop();
  });

  export function spin(w: number, dir = 1, power = 1) {
    return engine!.spin(w, dir, power);
  }
  export function settle() {
    engine?.settle();
  }
</script>

<div class="wheel" role="img" aria-label={t('wheelLabel', { n: people.length })}>
  <canvas bind:this={canvas} aria-hidden="true"></canvas>
</div>

<style>
  .wheel {
    position: relative;
    isolation: isolate;
    display: grid;
    justify-items: center;
  }
  /* The stand: two wooden legs behind the wheel. */
  .wheel::after {
    content: '';
    position: absolute;
    z-index: -1;
    left: 50%;
    bottom: -12px;
    width: 46%;
    height: 30%;
    translate: -50% 0;
    background: linear-gradient(90deg, transparent 0 8%, var(--wood) 8% 18%, transparent 18% 82%, var(--wood) 82% 92%, transparent 92%);
    clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%);
  }
  canvas {
    display: block;
    width: var(--wheel);
    aspect-ratio: 1;
    touch-action: none;
    cursor: grab;
  }
  canvas:active {
    cursor: grabbing;
  }
</style>
