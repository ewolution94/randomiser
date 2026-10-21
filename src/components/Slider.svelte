<!--
  A length slider in the fair's look: a native range input (so keys, screen readers and touch work
  as they should) with a rail that fills in tent red, the jackpot lever's red ball as the knob, and
  a gold notch under the rail where the default sits. The ends are captioned below.
-->
<script lang="ts">
  let {
    value,
    min,
    max,
    step,
    def,
    label,
    format,
    onchange,
  }: {
    value: number;
    min: number;
    max: number;
    step: number;
    /** The default, marked with a notch. */
    def: number;
    label: string;
    format: (n: number) => string;
    onchange: (n: number) => void;
  } = $props();

  const at = (n: number) => (n - min) / (max - min);
</script>

<div class="slider" style:--p={at(value)} style:--d={at(def)}>
  <input type="range" {min} {max} {step} {value} aria-label={label} aria-valuetext={format(value)} oninput={(e) => onchange(Number(e.currentTarget.value))} />
  <span class="notch" aria-hidden="true"></span>
</div>
<div class="ends" aria-hidden="true"><span>{format(min)}</span><span>{format(max)}</span></div>

<style>
  .slider {
    --knob: 26px;
    position: relative;
    height: 40px;
  }
  input {
    -webkit-appearance: none;
    appearance: none;
    display: block;
    width: 100%;
    height: 34px;
    margin: 0;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
  }
  input:focus {
    outline: none;
  }
  /* The rail fills up to the knob's centre, which travels from half a knob in to half a knob short. */
  input::-webkit-slider-runnable-track {
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--red) calc(var(--knob) / 2 + (100% - var(--knob)) * var(--p)), rgba(29, 42, 92, 0.13) 0);
    box-shadow: inset 0 1px 2px rgba(29, 42, 92, 0.28);
  }
  input::-moz-range-track {
    height: 10px;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--red) calc(var(--knob) / 2 + (100% - var(--knob)) * var(--p)), rgba(29, 42, 92, 0.13) 0);
    box-shadow: inset 0 1px 2px rgba(29, 42, 92, 0.28);
  }
  input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: var(--knob);
    height: var(--knob);
    margin-top: calc((10px - var(--knob)) / 2);
    border: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ff8f8f, var(--red) 45%, #7a1020);
    box-shadow:
      0 0 0 2px var(--navy),
      0 3px 6px rgba(80, 20, 20, 0.35);
    transition: scale 0.15s;
  }
  input::-moz-range-thumb {
    width: var(--knob);
    height: var(--knob);
    border: 0;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #ff8f8f, var(--red) 45%, #7a1020);
    box-shadow:
      0 0 0 2px var(--navy),
      0 3px 6px rgba(80, 20, 20, 0.35);
  }
  input:active::-webkit-slider-thumb {
    scale: 1.12;
  }
  input:focus-visible::-webkit-slider-thumb {
    box-shadow:
      0 0 0 2px var(--navy),
      0 0 0 5px var(--mustard);
  }
  input:focus-visible::-moz-range-thumb {
    box-shadow:
      0 0 0 2px var(--navy),
      0 0 0 5px var(--mustard);
  }
  .notch {
    position: absolute;
    top: 30px;
    left: calc(var(--knob) / 2 + (100% - var(--knob)) * var(--d));
    translate: -50% 0;
    border: 5px solid transparent;
    border-top: 0;
    border-bottom: 7px solid var(--gold);
    pointer-events: none;
  }
  .ends {
    display: flex;
    justify-content: space-between;
    margin-top: -4px;
    font: 700 11px/1 var(--body);
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
</style>
