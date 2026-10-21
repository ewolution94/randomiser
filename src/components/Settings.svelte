<!--
  Settings, the family's way (plans/settings-alignment.md): Folio's ewo-sheet, opened from the bar's
  ewo-settings-button, General first: the language and the sounds. Randomiser is light only, so
  there's no theme (as in Skibbo, whose Settings.svelte this follows).
-->
<script lang="ts">
  import { themeShift } from '../../vendor/ewo/elements/theme-shift.js';
  import { i18n, setLanguage, systemLang, t, type LangChoice } from '../lib/i18n.svelte';
  import { setSound, sound } from '../lib/sound.svelte';

  let { open = $bindable(false) }: { open?: boolean } = $props();

  function pickLanguage(next: LangChoice) {
    if (next === i18n.choice) return;
    const shows = next === 'system' ? systemLang() : next;
    if (shows === i18n.lang) setLanguage(next);
    else themeShift(() => setLanguage(next));
  }
</script>

<ewo-sheet {open} label={t('settings')} oncancel={() => (open = false)} onclose={() => (open = false)}>
  <span slot="heading">{t('settings')}</span>
  <section>
    <h3 class="label">{t('general')}</h3>
    <div class="row">
      <span class="name">{t('language')}</span>
      <ewo-segmented stretch value={i18n.choice} label={t('language')} onchange={(e) => pickLanguage(e.detail.value as LangChoice)}>
        <option value="system">{t('langSystem')}</option>
        <option value="de">Deutsch</option>
        <option value="en">English</option>
      </ewo-segmented>
    </div>
    <div class="row">
      <span class="name">{t('sounds')}<small>{t('soundsHint')}</small></span>
      <ewo-switch checked={sound.on} aria-label={t('sounds')} onchange={(e) => setSound(e.detail.checked)}></ewo-switch>
    </div>
  </section>
</ewo-sheet>

<style>
  section {
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
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .name {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font: 800 16px/1.2 var(--body);
  }
  .name small {
    font: 500 13px/1.35 var(--body);
    color: var(--ink-3);
  }
</style>
