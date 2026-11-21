/**
 * parse.js — spoken or typed sale text → { item, qty, amountPesewas }
 *
 * Relies on twi-dict.js being loaded first (replaceTwiNumbers).
 *
 * Strategy
 * --------
 * 1. Replace Twi number words with digits.
 * 2. Find the amount: look for patterns like "45 cedis", "GH₵ 45", "45.50 Ghana cedis".
 * 3. Find an optional quantity: a leading digit before the item words.
 * 4. Everything that isn't the trigger verb ("sold"/"sell"/etc.), the quantity,
 *    or the amount phrase is treated as the item description.
 * 5. If no amount is found, return { ok: false } so the caller can fall back to
 *    manual editing with the raw text pre-filled.
 * 6. If no item is found, default to "Sale".
 */

/**
 * Amount patterns (all case-insensitive).
 * We look for them and capture the numeric value plus an optional "pesewas" flag.
 *
 * Supported:
 *   "45 cedis", "45.50 cedis", "GH₵45", "GH₵ 45.50",
 *   "45 Ghana cedis", "GHS 45", "45ghc"
 */
const AMOUNT_RE = /(?:GH[S₵C]\s*|Ghana\s+cedis?\s+)?(\d+(?:\.\d{1,2})?)\s*(?:Ghana\s+)?(?:cedis?|GH[S₵C]|ghc)?(?:\s|$)/i;

// A stricter left-anchored pattern so "45 cedis" doesn't eat a leading qty.
// We scan for the LAST amount-like token to avoid ambiguity with quantities.
const AMOUNT_TOKEN_RE = /\b(\d+(?:\.\d{1,2})?)\s*(?:Ghana\s+)?(?:cedis?|GH[S₵C]|ghc)\b/gi;
const BARE_CURRENCY_RE = /\bGH[S₵C]\s*(\d+(?:\.\d{1,2})?)/gi;

/**
 * Convert a cedi string ("45", "45.50") to pesewas (integer).
 * @param {string} val
 * @returns {number}
 */
function cedisToPesewas(val) {
  return Math.round(parseFloat(val) * 100);
}

/**
 * English number-word map: one–ten.
 * Applied before quantity extraction, the same way replaceTwiNumbers is applied.
 */
const ENGLISH_NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/**
 * Replace English number words (one–ten) with their digit equivalents.
 * Only replaces whole words to avoid partial matches inside other words.
 * @param {string} text
 * @returns {string}
 */
function replaceEnglishNumbers(text) {
  return text.replace(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
    (match) => ENGLISH_NUMBER_WORDS[match.toLowerCase()]
  );
}

/**
 * Parse sale text into a structured entry fragment.
 *
 * @param {string} rawText
 * @returns {{ ok: true, item: string, qty: number, amountPesewas: number }
 *          |{ ok: false }}
 */
function parseSaleText(rawText) {
  if (!rawText || !rawText.trim()) return { ok: false };

  // 1. Swap Twi number words → digits (depends on twi-dict.js), then English number words → digits
  let text = (typeof replaceTwiNumbers === 'function')
    ? replaceTwiNumbers(rawText.trim())
    : rawText.trim();
  text = replaceEnglishNumbers(text);

  // Normalise: collapse whitespace
  text = text.replace(/\s+/g, ' ');

  // 2. Extract amount
  //    Try explicit "X cedis" / "GHS X" tokens first.
  let amountPesewas = null;
  let amountMatchStr = '';

  // Reset lastIndex before using global regexes
  AMOUNT_TOKEN_RE.lastIndex = 0;
  BARE_CURRENCY_RE.lastIndex = 0;

  const tokenMatches = [...text.matchAll(AMOUNT_TOKEN_RE)];
  const bareMatches  = [...text.matchAll(BARE_CURRENCY_RE)];

  if (tokenMatches.length > 0) {
    // Use the last match (amount usually comes after item + qty)
    const m = tokenMatches[tokenMatches.length - 1];
    amountPesewas = cedisToPesewas(m[1]);
    amountMatchStr = m[0];
  } else if (bareMatches.length > 0) {
    const m = bareMatches[bareMatches.length - 1];
    amountPesewas = cedisToPesewas(m[1]);
    amountMatchStr = m[0];
  }

  if (amountPesewas === null || amountPesewas <= 0) {
    return { ok: false };
  }

  // 3. Remove the amount phrase from the text to isolate item + qty
  let remainder = text.replace(amountMatchStr.trim(), '').trim();

  // 4. Remove common leading verbs / filler words
  remainder = remainder
    .replace(/^(sold|sell|selling|bought|buy|paid|received|got)\s+/i, '')
    .trim();

  // 5. Extract a leading integer quantity
  let qty = 1;
  const qtyMatch = remainder.match(/^(\d+)\s+(.+)/);
  if (qtyMatch) {
    const candidateQty = parseInt(qtyMatch[1], 10);
    // Guard: a bare number with nothing after it (e.g. "5") isn't a qty
    if (qtyMatch[2] && qtyMatch[2].trim().length > 0) {
      qty = candidateQty;
      remainder = qtyMatch[2].trim();
    }
  }

  // 6. What's left is the item
  let item = remainder.trim();

  // Normalise known item names via Twi dictionary
  if (typeof TWI_ITEMS === 'object') {
    const lower = item.toLowerCase();
    if (TWI_ITEMS[lower]) {
      item = TWI_ITEMS[lower];
    }
  }

  if (!item) {
    item = 'Sale';
  }

  return { ok: true, item, qty, amountPesewas };
}
