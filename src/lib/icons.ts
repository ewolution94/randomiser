// The line icons the signs and Settings share: the three machines on a 24 × 24 grid, drawn with
// `stroke: currentColor` (fill none) by whoever shows them.

import type { Mode } from './state.svelte';

export const MODE_ICON: Record<Mode, string> = {
  wheel: '<circle cx="12" cy="13" r="8"/><path d="M12 5v16M4 13h16M6.3 7.3l11.4 11.4M17.7 7.3 6.3 18.7"/><path d="M12 1.5 10.5 4h3z"/>',
  slots: '<rect x="3" y="5" width="15" height="15" rx="2"/><path d="M3 12.5h15"/><path d="M21 8v6M21 14h-3"/><circle cx="21" cy="7" r="1.5"/>',
  race: '<path d="M4 14c0-3 2.5-4.5 6-4.3l4 .3c.5-2.5 1.5-4 3.5-4s3 1.5 3 3.5c0 1-.5 2-1.5 2.5 1.5 1 2 3 .5 4.5-2 2-6 2.5-9.5 2.3S4 17.5 4 14z"/><path d="M2 20c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/>',
};

/** A stopwatch, for the length plaque under the Drama signs. */
export const WATCH_ICON = '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 2.5h4M12 2.5V6M18.5 6.5l1.5-1.5"/>';
