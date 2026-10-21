// The fair's three faces, self-hosted (the CSP allows fonts from 'self' only): Rye for the signs,
// Alfa Slab One for the names, Bitter for the text.
import '@fontsource/rye/400.css';
import '@fontsource/alfa-slab-one/400.css';
import '@fontsource/bitter/500.css';
import '@fontsource/bitter/700.css';
import '@fontsource/bitter/800.css';
import './app.css';
// Folio's shared elements (vendor/ewo); each defines itself once.
import '../vendor/ewo/elements/sheet.js';
import '../vendor/ewo/elements/settings-button.js';
import '../vendor/ewo/elements/segmented.js';
import '../vendor/ewo/elements/switch.js';
import '../vendor/ewo/elements/slot-reel.js';
// Every tap answers on a phone, the games' lively way (Folio's pressFeedback).
import { pressFeedback } from '../vendor/ewo/elements/press.js';

import { mount } from 'svelte';
import App from './App.svelte';

pressFeedback({ preset: 'lively' });

function start() {
  mount(App, { target: document.getElementById('app')! });
  requestAnimationFrame(() => dispatchEvent(new Event('splash:ready')));
}

// Installed, the app opens on the splash screen (index.html, switched on by public/boot.js; written by
// development/plans/splash-rollout). iOS fades its launch image into the page as soon as the page has
// laid out, so the splash has to be on screen before the app's first render takes the main thread, or
// the fade goes through a blank white web view. It lifts a frame after the app has mounted.
if (document.documentElement.classList.contains('splash')) {
  let started = false;
  const once = () => {
    if (started) return;
    started = true;
    start();
  };
  requestAnimationFrame(() => setTimeout(once));
  setTimeout(once, 100);
} else {
  start();
}

/**
 * The offline shell (see public/sw.js). Production only: a worker in front of the dev server
 * would cache the modules Vite is trying to hot-replace.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
