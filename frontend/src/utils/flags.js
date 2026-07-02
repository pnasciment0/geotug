// Helpers for the flag imagery + the hint pattern.

// flagcdn serves fixed widths (w80, w160, w320, ...).
export const flagUrl = (code, width = 320) => `https://flagcdn.com/w${width}/${code}.png`;

// Render one pattern cell: hidden letters as "_", spaces as a wider gap, and
// revealed/structural characters as-is.
export const patternCell = (ch) => {
    if (ch === null) return '_';
    if (ch === ' ') return '\u00A0\u00A0';
    return ch;
};
