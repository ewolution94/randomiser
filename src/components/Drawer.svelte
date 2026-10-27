<!--
  The drawer behind "8 in the draw": the names (tap to leave one out today, × to remove, add
  comma-separated or paste a list), Everyone once, and the last draws with their time. From the
  right on a wide screen, a sheet from the bottom on a phone. The page holds still while it's open
  (Folio's lockScroll); Escape, the ×, or a tap on the veil closes it.
-->
<script lang="ts">
  import { lockScroll } from '../../vendor/ewo/elements/scroll-lock.js';
  import { i18n, t } from '../lib/i18n.svelte';
  import { parseNames } from '../lib/staging';
  import { MAX_NAMES, app, nextPaint, paint, save, type Draw } from '../lib/state.svelte';

  let { open = $bindable(false), busy, ontoast }: { open?: boolean; busy: boolean; ontoast: (text: string) => void } = $props();

  let input: HTMLInputElement;
  let panel: HTMLElement;
  let draft = $state('');

  $effect(() => {
    if (!open) return;
    const unlock = lockScroll();
    const back = document.activeElement as HTMLElement | null;
    // The empty list asks for names straight away; otherwise the close button takes the focus.
    queueMicrotask(() => (app.names.length ? panel.querySelector<HTMLElement>('.x') : input)?.focus({ preventScroll: true }));
    return () => {
      unlock();
      back?.focus?.({ preventScroll: true });
    };
  });

  function add(text: string) {
    let added = 0;
    for (const n of parseNames(text)) {
      if (app.names.length >= MAX_NAMES) {
        ontoast(t('full'));
        break;
      }
      if (app.names.some((x) => x.n.toLowerCase() === n.toLowerCase())) continue;
      app.names.push({ n, c: nextPaint(), out: false });
      added++;
    }
    if (added) save();
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    add(draft);
    draft = '';
  }

  function paste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text') ?? '';
    if (/[\n,;]/.test(text)) {
      e.preventDefault();
      add(text);
    }
  }

  function toggle(i: number) {
    if (busy) return;
    app.names[i].out = !app.names[i].out;
    save();
  }

  function remove(i: number) {
    if (busy) return;
    app.names.splice(i, 1);
    save();
  }

  function setOnce(on: boolean) {
    app.once = on;
    save();
  }

  const time = (d: Draw) => new Date(d.t).toLocaleTimeString(i18n.lang === 'de' ? 'de-DE' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  const day = (d: Draw) => {
    const date = new Date(d.t);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return time(d);
    return `${date.toLocaleDateString(i18n.lang === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' })}, ${time(d)}`;
  };
  const active = $derived(app.names.filter((x) => !x.out).length);
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -- Escape and the × close it too -->
  <div class="veil" onclick={() => (open = false)}></div>
{/if}
<aside class="drawer" class:open aria-label={t('drawer')} aria-hidden={!open} inert={!open} bind:this={panel}>
  <div class="head">
    <h2>{t('drawer')} <small>{t('tally', { a: active, b: app.names.length })}</small></h2>
    <button type="button" class="x" aria-label={t('close')} onclick={() => (open = false)}>×</button>
  </div>
  <form class="add" onsubmit={submit}>
    <label class="sr-only" for="add-names">{t('addLabel')}</label>
    <input id="add-names" bind:this={input} bind:value={draft} onpaste={paste} placeholder={t('addPlaceholder')} autocomplete="off" enterkeyhint="done" />
    <button type="submit">{t('add')}</button>
  </form>
  {#if app.names.length}
    <ul class="names">
      {#each app.names as x, i (x.n + '\u0000' + x.c)}
        <li class:out={x.out} style:--c={paint(x.c)[0]}>
          <button type="button" class="who" aria-pressed={!x.out} title={x.out ? t('putBack') : t('leaveOut')} disabled={busy} onclick={() => toggle(i)}>
            <i aria-hidden="true"></i>
            <span>{x.n}</span>
            {#if x.out}<em>{t('outToday')}</em>{/if}
          </button>
          <button type="button" class="del" aria-label={t('remove', { name: x.n })} disabled={busy} onclick={() => remove(i)}>×</button>
        </li>
      {/each}
    </ul>
    <p class="hint">{t('tapOut')}</p>
  {:else}
    <p class="empty">{t('emptyNames')}</p>
  {/if}
  <div class="row">
    <span class="label">{t('once')}<small>{t('onceHint')}</small></span>
    <ewo-switch checked={app.once} aria-label={t('once')} onchange={(e) => setOnce(e.detail.checked)}></ewo-switch>
  </div>
  <h3 class="cap">{t('last')}</h3>
  <ul class="history">
    {#each app.history as d (d.t)}
      <li style:--c={paint(d.c)[0]}>
        <i aria-hidden="true"></i>
        <span>{d.n} · {t(d.mode)}</span>
        <small>{day(d)}</small>
      </li>
    {:else}
      <li class="none">{t('none')}</li>
    {/each}
  </ul>
</aside>

<style>
  .veil {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(29, 42, 92, 0.35);
    animation: fade 0.25s both;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  .drawer {
    position: fixed;
    z-index: 41;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, 100%);
    padding: max(24px, env(safe-area-inset-top, 0px)) max(22px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--paper);
    border-left: 3px solid var(--navy);
    box-shadow: -20px 0 40px rgba(29, 42, 92, 0.2);
    transform: translateX(105%);
    visibility: hidden;
    transition:
      transform 0.4s cubic-bezier(0.3, 1.1, 0.5, 1),
      visibility 0s 0.4s;
  }
  .drawer.open {
    transform: none;
    visibility: visible;
    transition: transform 0.4s cubic-bezier(0.3, 1.1, 0.5, 1);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font: 400 24px/1.2 var(--heavy);
  }
  h2 small {
    font: 700 13px/1 var(--body);
    color: var(--ink-3);
    margin-left: 6px;
  }
  .x {
    flex: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 0;
    background: var(--field);
    font-size: 22px;
    line-height: 1;
  }
  .add {
    display: flex;
    gap: 8px;
  }
  .add input {
    flex: 1;
    min-width: 0;
    height: 44px;
    border-radius: 10px;
    border: 1.5px solid var(--line);
    background: var(--page);
    color: var(--navy);
    padding: 0 12px;
    font: 500 16px var(--body);
  }
  .add input::placeholder {
    color: var(--ink-3);
  }
  .add button {
    height: 44px;
    padding: 0 16px;
    border-radius: 10px;
    border: 0;
    background: var(--navy);
    color: var(--cream);
    font: 800 15px/1 var(--body);
  }
  .names {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .names li {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 10px;
    border: 1.5px solid var(--line);
    background: var(--page);
  }
  .who {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: none;
    padding: 9px 10px;
    text-align: left;
    font: 800 16px/1.15 var(--body);
  }
  .who i {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 0 1.5px var(--navy);
  }
  .who span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who em {
    margin-left: auto;
    font: 700 11px/1 var(--body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-style: normal;
    color: var(--ink-3);
  }
  .del {
    flex: none;
    width: 34px;
    height: 34px;
    margin-right: 4px;
    border: 0;
    background: none;
    border-radius: 50%;
    color: var(--ink-3);
    font-size: 20px;
  }
  /* With a mouse, × shows on the row under the pointer; on a phone it stays. */
  @media (hover: hover) and (pointer: fine) {
    .del {
      opacity: 0;
      transition: opacity 0.15s;
    }
    li:hover .del,
    .del:focus-visible {
      opacity: 1;
    }
  }
  .out {
    opacity: 0.55;
  }
  .out .who span {
    text-decoration: line-through;
  }
  .out .who i {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--c);
  }
  .hint,
  .empty {
    margin: 0;
    font-size: 14px;
    color: var(--ink-3);
  }
  .empty {
    font-size: 16px;
    color: var(--ink-2);
    padding: 8px 2px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 6px;
  }
  .label {
    display: grid;
    gap: 2px;
    font: 800 16px/1.2 var(--body);
  }
  .label small {
    font: 500 13px/1.35 var(--body);
    color: var(--ink-3);
  }
  .cap {
    margin: 8px 0 0;
    font: 800 12px/1 var(--body);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
  .history {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .history li {
    display: grid;
    grid-template-columns: 14px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 7px 2px;
    border-bottom: 1px dashed var(--line);
    font: 700 15px/1.2 var(--body);
  }
  .history li:last-child {
    border-bottom: 0;
  }
  .history i {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--c);
    box-shadow: 0 0 0 1.5px var(--navy);
  }
  .history span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .history small {
    font: 600 13px/1 var(--body);
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .history .none {
    grid-template-columns: 1fr;
    color: var(--ink-3);
    font-weight: 500;
    border: 0;
  }
  /* A phone: a sheet from the bottom. */
  @media (max-width: 760px) {
    .drawer {
      top: auto;
      left: 0;
      width: 100%;
      max-height: 86svh;
      border-left: 0;
      border-top: 3px solid var(--navy);
      border-radius: 20px 20px 0 0;
      padding: 20px max(18px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(18px, env(safe-area-inset-left, 0px));
      box-shadow: 0 -20px 40px rgba(29, 42, 92, 0.2);
      transform: translateY(105%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drawer,
    .drawer.open {
      transition: none;
    }
  }
</style>
