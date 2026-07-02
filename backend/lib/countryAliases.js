// Accepted alternative names per country. Keys are the country's `name.common`
// value as stored in the DB (from restcountries). Values are extra strings that
// should also count as a correct guess. Matching is case- and diacritic-
// insensitive and ignores spaces/punctuation (see lib/guessing.js), so you only
// need to add genuinely different names/abbreviations here — not casing or
// accent variants.
//
// This is intentionally a starter set; add more as you find gaps.
const countryAliases = {
    'United States': ['us', 'usa', 'united states of america', 'america'],
    'United Kingdom': ['uk', 'britain', 'great britain', 'england'],
    'United Arab Emirates': ['uae'],
    'Brazil': ['brasil'],
    'Russia': ['russian federation'],
    'South Korea': ['korea', 'republic of korea'],
    'North Korea': ['dprk', 'democratic peoples republic of korea'],
    'Czechia': ['czech republic'],
    'Netherlands': ['holland', 'the netherlands'],
    'Myanmar': ['burma'],
    'Eswatini': ['swaziland'],
    'Cape Verde': ['cabo verde'],
    'Ivory Coast': ['cote divoire', "cote d'ivoire"],
    'DR Congo': ['democratic republic of the congo', 'congo kinshasa', 'drc'],
    'Republic of the Congo': ['congo', 'congo brazzaville'],
    'East Timor': ['timor leste'],
    'Vatican City': ['vatican', 'holy see'],
    'North Macedonia': ['macedonia'],
    'Turkey': ['turkiye'],
    'Vietnam': ['viet nam'],
};

export default countryAliases;
