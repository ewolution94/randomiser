// The order a family setting is decided in (Dashboard, plans/dashboard.md in the workspace): this
// device's own choice, then Dashboard's default (the family's, or one set for Randomiser alone),
// then the built-in one, which is today's. public/boot.js does the same for the language before
// first paint. No Svelte and no DOM here, so the tests load it as it is.

export type Lang = 'de' | 'en';

/** The language to show: this device's choice, else Dashboard's, else the browser's (`detected`). */
export const languageFor = (own: Lang | 'system', dashboard: unknown, detected: Lang): Lang =>
  own !== 'system' ? own : dashboard === 'de' || dashboard === 'en' ? dashboard : detected;

/** Sounds: this device's switch once it was used (`stored`), else Dashboard's, else off. */
export const soundsFor = (stored: string | null, dashboard: unknown): boolean =>
  stored === 'on' ? true : stored === 'off' ? false : typeof dashboard === 'boolean' ? dashboard : false;
