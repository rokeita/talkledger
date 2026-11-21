/**
 * twi-dict.js — Twi keyword mappings for the voice/text parser.
 *
 * TWI_NUMBERS maps Twi number words to their digit equivalents (1–10).
 * TWI_ITEMS maps common Ghanaian food/market item words (Twi or local names)
 *   to a normalised English label for display.
 *
 * Both objects are keyed in lowercase for case-insensitive matching.
 */

const TWI_NUMBERS = {
  'baako':  1,
  'mienu':  2,
  'miensa': 3,
  'anan':   4,
  'enum':   5,
  'nsia':   6,
  'nson':   7,
  'nwotwe': 8,
  'nkron':  9,
  'du':     10,
};

/**
 * Common market items — these are already well understood by Chrome's speech
 * engine so they mainly serve as a normalisation / confirmation table.
 * Extend as needed; the parser falls back to raw text for unknown items.
 */
const TWI_ITEMS = {
  'banku':    'banku',
  'kenkey':   'kenkey',
  'waakye':   'waakye',
  'jollof':   'jollof rice',
  'rice':     'rice',
  'fufu':     'fufu',
  'tuo':      'tuo zaafi',
  'kelewele': 'kelewele',
  'plantain': 'plantain',
  'yam':      'yam',
  'cassava':  'cassava',
  'tomato':   'tomatoes',
  'tomatoes': 'tomatoes',
  'onion':    'onions',
  'onions':   'onions',
  'pepper':   'pepper',
  'oil':      'oil',
  'water':    'water',
  'bread':    'bread',
  'egg':      'eggs',
  'eggs':     'eggs',
  'fish':     'fish',
  'chicken':  'chicken',
  'meat':     'meat',
  'milk':     'milk',
  'sugar':    'sugar',
  'flour':    'flour',
  'soap':     'soap',
  'charcoal': 'charcoal',
};

/**
 * Replace any Twi number words found in `text` with their digit equivalents.
 * Matching is case-insensitive and whole-word only.
 * @param {string} text
 * @returns {string}
 */
function replaceTwiNumbers(text) {
  let result = text;
  for (const [word, digit] of Object.entries(TWI_NUMBERS)) {
    const re = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(re, String(digit));
  }
  return result;
}
