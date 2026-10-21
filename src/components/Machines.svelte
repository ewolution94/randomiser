<!--
  Settings → Machines: how each machine runs (tune.ts). Pick the machine (it opens on the one in
  use), then its length on Folio's <ewo-slider> (in the fair's look: the lever's red ball, a gold mark
  at the default, a tick per step when sounds are on) and its feel: the wheel's speed and direction,
  the jackpot's speed, how much the ducks overtake. Each setting says underneath what it does; Drama
  keeps the tricks. A length is kept when the slider is let go; it applies from the next draw.
-->
<script lang="ts">
  import { secs, t } from '../lib/i18n.svelte';
  import { MODE_ICON } from '../lib/icons';
  import { sfx } from '../lib/sound.svelte';
  import { MODES, app, save, type Mode } from '../lib/state.svelte';
  import { LENGTH, OVERTAKING, PACES, TURNS, defaultTune, isDefault, reelSteps, wheelTurns, type Overtaking, type Pace, type Turn } from '../lib/tune';

  let { machine = $bindable<Mode>('wheel') }: { machine?: Mode } = $props();

  // What the hints promise: a spin adds up to one turn and up to three names to these.
  const turns = $derived(Math.round(wheelTurns(app.tune.wheel.seconds, app.tune.wheel.pace)));
  const names = $derived(reelSteps(app.tune.slots.seconds, app.tune.slots.pace) + 1);

  /** While dragging: the value and its hints follow, a tick per step; kept on release (onchange). */
  function slide(m: Mode, n: number) {
    app.tune[m].seconds = n;
    sfx.tick(1.25);
  }
  function setWheel(patch: Partial<{ pace: Pace; turn: Turn }>) {
    Object.assign(app.tune.wheel, patch);
    save();
  }
  function setSlots(pace: Pace) {
    app.tune.slots.pace = pace;
    save();
  }
  function setRace(overtaking: Overtaking) {
    app.tune.race.overtaking = overtaking;
    save();
  }
  function reset(m: Mode) {
    const d = defaultTune();
    if (m === 'wheel') app.tune.wheel = d.wheel;
    else if (m === 'slots') app.tune.slots = d.slots;
    else app.tune.race = d.race;
    save();
  }
</script>

<section class="machines">
  <h3 class="label">{t('machines')}</h3>
  <p class="intro">{t('machinesHint')}</p>
  <ewo-segmented stretch value={machine} label={t('machines')} onchange={(e) => (machine = e.detail.value as Mode)}>
    {#each MODES as m (m)}
      <option value={m}>{t(m)}</option>
      <span slot="icon-{m}" class="icon"><svg viewBox="0 0 24 24" aria-hidden="true">{@html MODE_ICON[m]}</svg></span>
    {/each}
  </ewo-segmented>

  <!-- All three panels share one grid cell, so the sheet keeps the tallest one's height and
       doesn't jump when another machine is picked; the hidden ones are out of reach. -->
  <div class="panels">
    {#each MODES as m (m)}
      <div class="panel" class:on={machine === m} inert={machine !== m}>
        <div class="setting">
          <div class="head">
            <span class="name">{t('length')}</span>
            <b class="value">{secs(app.tune[m].seconds)}</b>
          </div>
          <ewo-slider
            label={t('length')}
            min={LENGTH[m].min}
            max={LENGTH[m].max}
            step={LENGTH[m].step}
            mark={LENGTH[m].def}
            unit="s"
            value={app.tune[m].seconds}
            ticks
            ends
            oninput={(e) => slide(m, e.detail.value)}
            onchange={save}
          ></ewo-slider>
          <span class="hint">{t(`lengthHint_${m}`)}</span>
        </div>
        {#if m === 'wheel'}
          <div class="setting">
            <span class="name">{t('pace')}</span>
            <ewo-segmented stretch value={app.tune.wheel.pace} label={t('pace')} onchange={(e) => setWheel({ pace: e.detail.value as Pace })}>
              {#each PACES as p (p)}<option value={p}>{t(p)}</option>{/each}
            </ewo-segmented>
            <span class="hint">{t('paceHint_wheel', { n: turns })}</span>
          </div>
          <div class="setting">
            <span class="name">{t('turn')}</span>
            <ewo-segmented stretch value={app.tune.wheel.turn} label={t('turn')} onchange={(e) => setWheel({ turn: e.detail.value as Turn })}>
              {#each TURNS as d (d)}<option value={d}>{t(d)}</option>{/each}
            </ewo-segmented>
            <span class="hint">{t('turnHint')}</span>
          </div>
        {:else if m === 'slots'}
          <div class="setting">
            <span class="name">{t('pace')}</span>
            <ewo-segmented stretch value={app.tune.slots.pace} label={t('pace')} onchange={(e) => setSlots(e.detail.value as Pace)}>
              {#each PACES as p (p)}<option value={p}>{t(p)}</option>{/each}
            </ewo-segmented>
            <span class="hint">{t('paceHint_slots', { n: names })}</span>
          </div>
        {:else}
          <div class="setting">
            <span class="name">{t('overtaking')}</span>
            <ewo-segmented stretch value={app.tune.race.overtaking} label={t('overtaking')} onchange={(e) => setRace(e.detail.value as Overtaking)}>
              {#each OVERTAKING as o (o)}<option value={o}>{t(o)}</option>{/each}
            </ewo-segmented>
            <span class="hint">{t(`overtakingHint_${app.tune.race.overtaking}`)}</span>
          </div>
        {/if}
        <button type="button" class="reset" disabled={isDefault(app.tune, m)} onclick={() => reset(m)}>{t('reset')}</button>
      </div>
    {/each}
  </div>
</section>

<style>
  .machines {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0 8px;
  }
  .label {
    margin: 0;
    font: 800 12px/1.2 var(--body);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .intro {
    margin: -8px 0 0;
    font: 500 13px/1.4 var(--body);
    color: var(--ink-3);
  }
  .icon {
    display: inline-flex;
  }
  /* "Entenrennen" with its icon only just fits a third of a 390 px sheet: smaller phones go without. */
  @media (max-width: 400px) {
    .icon {
      display: none;
    }
  }
  .icon svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .panels {
    display: grid;
  }
  .panel {
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    visibility: hidden;
  }
  .panel.on {
    visibility: visible;
  }
  .setting {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .name {
    font: 800 16px/1.2 var(--body);
  }
  .value {
    font: 400 20px/1 var(--heavy);
    color: var(--red);
    font-variant-numeric: tabular-nums;
  }
  /* Folio's slider in the fair's look: a red rail, the jackpot lever's ball, a gold mark. */
  ewo-slider {
    --ewo-slider-knob-size: 26px;
    --ewo-slider-track-height: 10px;
    --ewo-slider-fill: var(--red);
    --ewo-slider-track: rgba(29, 42, 92, 0.13);
    --ewo-slider-track-shadow: inset 0 1px 2px rgba(29, 42, 92, 0.28);
    --ewo-slider-knob: radial-gradient(circle at 35% 30%, #ff8f8f, var(--red) 45%, #7a1020);
    --ewo-slider-knob-shadow: 0 0 0 2px var(--navy), 0 3px 6px rgba(80, 20, 20, 0.35);
    --ewo-slider-mark: var(--gold);
    --ewo-slider-tick: rgba(29, 42, 92, 0.3);
    --ewo-slider-bubble: var(--navy);
    --ewo-slider-bubble-ink: var(--cream);
    color: var(--navy);
  }
  ewo-slider::part(bubble) {
    font: 800 13px/1 var(--body);
  }
  ewo-slider::part(ends) {
    font: 700 11px/1.2 var(--body);
    color: var(--ink-3);
  }
  .hint {
    font: 500 13px/1.4 var(--body);
    color: var(--ink-3);
  }
  .reset {
    align-self: flex-start;
    padding: 6px 0;
    border: 0;
    background: none;
    font: 800 13px/1.2 var(--body);
    color: var(--ink-2);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .reset:disabled {
    visibility: hidden;
  }
</style>
