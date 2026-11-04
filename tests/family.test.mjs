import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
// What Randomiser hands Dashboard (public/ewo.config.json), checked with Folio's own rules, and the
// order a setting is decided in: this device's own choice, then Dashboard's default, then the
// built-in one (src/lib/defaults.ts, and public/boot.js before first paint).
import { checkManifest, resolve } from '../vendor/ewo/elements/config-core.js';
import { languageFor, soundsFor } from '../src/lib/defaults.ts';

const manifest = JSON.parse(readFileSync(new URL('../public/ewo.config.json', import.meta.url), 'utf8'));

test('the manifest is one Dashboard takes: the family’s language and sounds (light only: no theme)', () => {
  const { ok, problems, manifest: checked } = checkManifest(manifest);
  assert.deepEqual(problems, []);
  assert.ok(ok);
  assert.equal(checked.app, 'randomiser');
  assert.deepEqual(Object.keys(checked.settings), ['lang', 'sounds']);
});

test('with nothing set in Dashboard: the browser’s language and no sounds, the page as it ships', () => {
  const { values, sources } = resolve(manifest, {});
  assert.deepEqual(values, { lang: 'system', sounds: false });
  assert.deepEqual(sources, { lang: 'built-in', sounds: 'built-in' });
  assert.equal(languageFor('system', values.lang, 'de'), 'de');
  assert.equal(languageFor('system', values.lang, 'en'), 'en');
  assert.equal(soundsFor(null, values.sounds), false);
});

test('Dashboard’s family default and this app’s own value reach the page', () => {
  assert.deepEqual(resolve(manifest, { family: { lang: 'de', sounds: true } }).values, { lang: 'de', sounds: true });
  assert.deepEqual(resolve(manifest, { family: { sounds: true }, app: { sounds: false } }).values, { lang: 'system', sounds: false });
  assert.deepEqual(resolve(manifest, { family: { lang: 'en' }, app: { lang: 'de' } }).values, { lang: 'de', sounds: false });
  // Not one of Randomiser's settings: the theme never reaches the page.
  assert.deepEqual(Object.keys(resolve(manifest, { family: { theme: 'dark' } }).values), ['lang', 'sounds']);
});

test('the device’s own choice beats Dashboard’s default, which beats the built-in one', () => {
  // QA's `ewo:lang` = `en` is this device's own choice, so it keeps winning.
  assert.equal(languageFor('en', 'de', 'de'), 'en');
  assert.equal(languageFor('de', 'en', 'en'), 'de');
  assert.equal(languageFor('system', 'de', 'en'), 'de');
  assert.equal(languageFor('system', 'system', 'de'), 'de');
  assert.equal(languageFor('system', undefined, 'en'), 'en');
  // The switch, once used, is kept as on or off.
  assert.equal(soundsFor('off', true), false);
  assert.equal(soundsFor('on', false), true);
  assert.equal(soundsFor(null, true), true);
  assert.equal(soundsFor(null, false), false);
  assert.equal(soundsFor(null, undefined), false);
  assert.equal(soundsFor(null, 'yes'), false);
});

/** public/boot.js against a stub page: the language it applies before first paint. */
function boot({ saved, config, browser = 'en-US' }) {
  const root = { dataset: {}, lang: 'de', classList: { add() {}, remove() {} }, style: { setProperty() {} } };
  const document = {
    documentElement: root,
    getElementById: (id) => (id === 'ewo-config' && config ? { textContent: JSON.stringify(config) } : null),
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const storage = { getItem: (key) => (key === 'ewo:lang' && saved ? saved : null) };
  vm.runInNewContext(readFileSync(new URL('../public/boot.js', import.meta.url), 'utf8'), {
    document,
    localStorage: storage,
    matchMedia: () => ({ matches: false }),
    navigator: { language: browser },
    location: { search: '' },
    screen: {},
    addEventListener() {},
    setTimeout() {},
  });
  return root.lang;
}

test('before first paint: the language picked here, else Dashboard’s, else the browser’s', () => {
  assert.equal(boot({}), 'en');
  assert.equal(boot({ browser: 'de-DE' }), 'de');
  assert.equal(boot({ config: { lang: 'system', sounds: false } }), 'en');
  assert.equal(boot({ config: { lang: 'de' } }), 'de');
  assert.equal(boot({ config: { lang: 'en' }, browser: 'de-DE' }), 'en');
  assert.equal(boot({ saved: 'en', config: { lang: 'de' }, browser: 'de-DE' }), 'en');
  assert.equal(boot({ saved: 'de', config: { lang: 'en' } }), 'de');
});
