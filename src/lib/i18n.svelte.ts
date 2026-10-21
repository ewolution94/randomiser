// German and English, following the browser until a language is picked in Settings. The choice is
// kept under `ewo:lang` (the family's key; System removes it); public/boot.js applies it before
// first paint. From Skibbo's i18n.svelte.ts.

export type Lang = 'de' | 'en';
export type LangChoice = Lang | 'system';

const KEY = 'ewo:lang';

function storedChoice(): LangChoice {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    // storage blocked: follow the browser
  }
  return 'system';
}

export function systemLang(): Lang {
  return (navigator.language ?? '').toLowerCase().startsWith('de') ? 'de' : 'en';
}

const choice = storedChoice();
export const i18n = $state({ choice, lang: choice === 'system' ? systemLang() : choice });

/** Applies a choice; Settings wraps it in Folio's themeShift when the language on screen changes. */
export function setLanguage(next: LangChoice) {
  i18n.choice = next;
  try {
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // not kept, still applied
  }
  i18n.lang = next === 'system' ? systemLang() : next;
  document.documentElement.lang = i18n.lang;
}

addEventListener('languagechange', () => {
  if (i18n.choice === 'system') {
    i18n.lang = systemLang();
    document.documentElement.lang = i18n.lang;
  }
});

const STRINGS = {
  de: {
    mode: 'Modus',
    wheel: 'Glücksrad',
    slots: 'Jackpot',
    race: 'Entenrennen',
    drama: 'Drama',
    chill: 'Gemütlich',
    normal: 'Normal',
    max: 'Maximal',
    go_wheel: 'Dreh!',
    go_slots: 'Zieh!',
    go_race: 'Quak!',
    aria_wheel: 'Glücksrad drehen',
    aria_slots: 'Hebel ziehen',
    aria_race: 'Rennen starten',
    ticket: 'Los Nº {n}',
    addFirst: 'Namen eintragen',
    inDraw: '{n} im Topf',
    keysSpin: 'dreht',
    keysMode: 'wählen den Modus',
    needTwo: 'Mindestens zwei Namen eintragen.',
    drawer: 'Im Topf',
    tally: '{a} von {b}',
    addLabel: 'Namen hinzufügen',
    addPlaceholder: 'Namen, mit Komma getrennt',
    add: 'Hinzufügen',
    tapOut: 'Antippen: heute nicht dabei.',
    outToday: 'heute nicht',
    putBack: 'Wieder dabei',
    leaveOut: 'Heute nicht dabei',
    remove: '{name} entfernen',
    emptyNames: 'Noch keine Namen. Trag die Runde ein, dann geht’s los.',
    full: '30 Namen, mehr passen nicht aufs Rad.',
    once: 'Jeder einmal',
    onceHint: 'Wer gezogen wurde, setzt aus, bis alle dran waren.',
    last: 'Letzte Ziehungen',
    none: 'Noch nichts gezogen.',
    close: 'Schließen',
    allBack: 'Alle waren dran. Alle wieder im Topf!',
    winner: 'Gewonnen',
    prize: 'Haupt\u00adgewinn',
    again: 'Neues Los',
    next: 'Nächste Runde',
    done: 'Fertig',
    lastOne: 'Als Letztes übrig.',
    q_wheel_1: 'Das Rad hat gesprochen.',
    q_wheel_2: 'Kein Umtausch.',
    q_wheel_3: 'Rundherum, und dann du.',
    q_wheel_near: '{name} war ganz knapp dran.',
    q_slots: 'Jackpot. Herzlichen Glückwunsch, irgendwie.',
    q_slots_near: '{name} ist entwischt.',
    q_race_beak: '{name} war einen Schnabel dahinter.',
    q_race_post: 'Zuerst im Ziel.',
    q_race_mile: 'Die schnellste Ente im Teich.',
    pull: 'Zieh den Hebel',
    spinning: 'Dreht …',
    jackpot: 'Jackpot!',
    near: '{name} …?',
    r_start: 'Enten an den Start',
    r_marks: 'Auf die Plätze …',
    r_quack: 'Quak!',
    r_off: 'Und los!',
    r_lead_1: '{a} geht in Führung!',
    r_lead_2: '{a} überholt {b}!',
    r_lead_3: '{a} paddelt an {b} vorbei!',
    r_lead_4: '{a} liegt vorn!',
    r_mid_1: '{z} macht Pause für einen Snack.',
    r_mid_2: '{z} steckt im Strudel.',
    r_mid_3: '{z} winkt ins Publikum.',
    r_mid_4: '{z} hat die Richtung vergessen.',
    r_late_1: '{a} oder {b}!',
    r_late_2: 'Kopf an Kopf: {a} und {b}!',
    r_late_3: '{b} holt auf {a} auf!',
    r_win_beak: '{name} gewinnt um Schnabelbreite!',
    r_win: '{name} gewinnt!',
    r_win_mile: '{name} gewinnt mit Riesenvorsprung!',
    settings: 'Einstellungen',
    general: 'Allgemein',
    language: 'Sprache',
    langSystem: 'System',
    sounds: 'Klänge',
    soundsHint: 'Ticks, Tusch und Hupe',
    horn: 'Hupe',
    soundOff: 'Die Klänge sind aus (Einstellungen).',
    wheelLabel: 'Glücksrad mit {n} Namen',
    drawn: 'Gezogen: {name}',
  },
  en: {
    mode: 'Mode',
    wheel: 'Wheel',
    slots: 'Jackpot',
    race: 'Duck race',
    drama: 'Drama',
    chill: 'Chill',
    normal: 'Normal',
    max: 'Max',
    go_wheel: 'Spin!',
    go_slots: 'Pull!',
    go_race: 'Quack!',
    aria_wheel: 'Spin the wheel',
    aria_slots: 'Pull the lever',
    aria_race: 'Start the race',
    ticket: 'Ticket Nº {n}',
    addFirst: 'Add names',
    inDraw: '{n} in the draw',
    keysSpin: 'spins',
    keysMode: 'pick the mode',
    needTwo: 'Add at least two names to draw from.',
    drawer: 'In the draw',
    tally: '{a} of {b}',
    addLabel: 'Add names',
    addPlaceholder: 'Names, comma-separated',
    add: 'Add',
    tapOut: 'Tap a name to leave it out today.',
    outToday: 'out today',
    putBack: 'Put back in',
    leaveOut: 'Leave out today',
    remove: 'Remove {name}',
    emptyNames: 'No names yet. Add the meeting, then off you go.',
    full: 'That’s 30 names, the most the wheel holds.',
    once: 'Everyone once',
    onceHint: 'Winners sit out until all have had a turn.',
    last: 'Last draws',
    none: 'Nothing drawn yet.',
    close: 'Close',
    allBack: 'Everyone has had a turn. All back in!',
    winner: 'Winner',
    prize: 'First prize',
    again: 'New ticket',
    next: 'Next one',
    done: 'Done',
    lastOne: 'Last one standing.',
    q_wheel_1: 'The wheel has spoken.',
    q_wheel_2: 'No take-backs.',
    q_wheel_3: 'Round and round, and it stopped on you.',
    q_wheel_near: '{name} was this close.',
    q_slots: 'Jackpot. Congratulations, sort of.',
    q_slots_near: '{name} got away.',
    q_race_beak: '{name} was a beak behind.',
    q_race_post: 'First past the post.',
    q_race_mile: 'Fastest duck in the pond.',
    pull: 'Pull the lever',
    spinning: 'Spinning…',
    jackpot: 'Jackpot!',
    near: '{name}…?',
    r_start: 'Ducks to the start',
    r_marks: 'On your marks…',
    r_quack: 'Quack!',
    r_off: 'And they’re off!',
    r_lead_1: '{a} takes the lead!',
    r_lead_2: '{a} overtakes {b}!',
    r_lead_3: '{a} paddles past {b}!',
    r_lead_4: '{a} is out in front!',
    r_mid_1: '{z} stopped for a snack.',
    r_mid_2: '{z} is caught in an eddy.',
    r_mid_3: '{z} waves at the crowd.',
    r_mid_4: '{z} forgot which way to swim.',
    r_late_1: 'It’s {a} or {b}!',
    r_late_2: 'Neck and neck: {a} and {b}!',
    r_late_3: '{b} is closing in on {a}!',
    r_win_beak: '{name} wins by a beak!',
    r_win: '{name} wins!',
    r_win_mile: '{name} wins by a mile!',
    settings: 'Settings',
    general: 'General',
    language: 'Language',
    langSystem: 'System',
    sounds: 'Sounds',
    soundsHint: 'The ticks, the Tusch, the horn',
    horn: 'Clown horn',
    soundOff: 'Sounds are off (Settings).',
    wheelLabel: 'Wheel with {n} names',
    drawn: 'Drawn: {name}',
  },
} satisfies Record<Lang, Record<string, string>>;

export type Key = keyof typeof STRINGS.en;

/** A string in the current language, with {name} placeholders filled in. */
export function t(key: Key, vars: Record<string, string | number> = {}): string {
  return STRINGS[i18n.lang][key].replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}
