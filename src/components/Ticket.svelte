<!--
  The button: a numbered fairground ticket (Los Nº 0042), notched at both ends with a perforation.
  Its word follows the mode (Spin!, Pull!, Quack!). With fewer than two names it asks for names and
  opens the drawer instead.
-->
<script lang="ts">
  import { t } from '../lib/i18n.svelte';
  import type { Mode } from '../lib/state.svelte';

  let { mode, ticket, ready, disabled, onclick }: { mode: Mode; ticket: number; ready: boolean; disabled: boolean; onclick: () => void } = $props();
</script>

<button type="button" class="go" {disabled} aria-label={ready ? t(`aria_${mode}`) : t('addFirst')} {onclick}>
  <span class="word">{ready ? t(`go_${mode}`) : t('addFirst')}</span>
  <span class="serial">{t('ticket', { n: String(ticket).padStart(4, '0') })}</span>
</button>

<style>
  .go {
    position: relative;
    border: 0;
    border-radius: 8px;
    padding: 14px 54px 12px 64px;
    background: var(--red);
    color: var(--cream);
    display: grid;
    justify-items: center;
    gap: 4px;
    border-bottom: 6px solid var(--red-deep);
    -webkit-mask:
      radial-gradient(circle at 0 50%, transparent 12px, #000 12.5px) left / 51% 100% no-repeat,
      radial-gradient(circle at 100% 50%, transparent 12px, #000 12.5px) right / 51% 100% no-repeat;
    mask:
      radial-gradient(circle at 0 50%, transparent 12px, #000 12.5px) left / 51% 100% no-repeat,
      radial-gradient(circle at 100% 50%, transparent 12px, #000 12.5px) right / 51% 100% no-repeat;
  }
  .go::before {
    content: '';
    position: absolute;
    left: 34px;
    top: 9px;
    bottom: 9px;
    border-left: 2px dashed rgba(255, 246, 224, 0.6);
  }
  .word {
    font: 400 clamp(26px, 2.6vw, 34px) / 1 var(--heavy);
    white-space: nowrap;
  }
  .serial {
    font: 700 10px/1 var(--body);
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #ffe7a3;
  }
  .go:active:not(:disabled) {
    transform: translateY(4px);
    border-bottom-width: 2px;
  }
  .go:disabled {
    filter: saturate(0.5) brightness(0.92);
    cursor: default;
  }
  @media (hover: hover) {
    .go:hover:not(:disabled) {
      scale: 1.04;
      transition: scale 0.2s;
    }
  }
</style>
