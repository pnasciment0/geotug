import countryAliases from './countryAliases.js';

// --- Tunable round/scoring constants -------------------------------------
export const HINT_INTERVAL_MS = 10000; // reveal one letter every 10s of silence
export const ROUND_MAX_MS = 60000;     // hard stop: settle as a draw after this
export const PENALTY_MS = 1000;        // wrong-guess cooldown per player
export const COUNTDOWN_MS = 3000;      // 3-2-1 before each flag is revealed
export const NEXT_ROUND_GAP_MS = 4000; // result display before the next flag
export const ABANDON_MS = 120000;      // drop a paused game if nobody returns in this time

const BASE_PULL = 1.0;     // max rope movement for a perfect answer
const FAST_MS = 2000;      // answered within this = full speed credit
const SLOW_MS = 20000;     // answered after this = minimum speed credit
const MIN_SPEED = 0.25;    // speed factor floor
const HINT_DROP = 0.15;    // each revealed hint letter shrinks the pull by this
const HINT_FLOOR = 0.2;    // hint factor floor
const MIN_PULL = 0.05;     // never move the rope by less than this on a win

// Normalize a string for comparison: strip diacritics, lowercase, and drop
// everything that isn't a letter/number (spaces, punctuation, apostrophes...).
export function normalize(str) {
    return (str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

// Build the set of accepted normalized answers for a country name.
export function buildAcceptedAnswers(name) {
    const aliases = countryAliases[name] || [];
    return new Set([normalize(name), ...aliases.map(normalize)]);
}

const isHideableChar = (ch) => /\p{L}|\p{N}/u.test(ch);

// Indices of the characters that are letters/numbers (i.e. that can be hidden
// and revealed as hints). Spaces/hyphens/apostrophes are structural and shown.
export function letterIndices(name) {
    const result = [];
    [...name].forEach((ch, i) => {
        if (isHideableChar(ch)) result.push(i);
    });
    return result;
}

// Turn a name + a per-character "revealed" mask into the pattern the client
// renders: revealed/structural chars as themselves, hidden letters as null.
export function buildPattern(name, revealed) {
    return [...name].map((ch, i) => {
        if (!isHideableChar(ch)) return ch; // space, hyphen, apostrophe, etc.
        return revealed[i] ? ch : null;
    });
}

// How far the rope moves for a correct answer, based on how fast it came and
// how many hint letters had been revealed. Faster + fewer hints = bigger pull.
export function computePull({ timeMs, hints }) {
    let speed;
    if (timeMs <= FAST_MS) speed = 1;
    else if (timeMs >= SLOW_MS) speed = MIN_SPEED;
    else speed = 1 - ((timeMs - FAST_MS) / (SLOW_MS - FAST_MS)) * (1 - MIN_SPEED);

    const hintFactor = Math.max(1 - hints * HINT_DROP, HINT_FLOOR);
    const pull = BASE_PULL * speed * hintFactor;

    return Math.max(MIN_PULL, Math.round(pull * 100) / 100);
}
