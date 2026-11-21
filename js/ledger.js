/**
 * ledger.js — totals, balance, filtering and delete logic.
 *
 * All functions are pure (read-only on the array) except deleteEntry,
 * which calls storage helpers. No DOM access here.
 */

/**
 * Return the ISO date string (YYYY-MM-DD) for a given Date, in local time.
 * @param {Date} [date]
 * @returns {string}
 */
function toLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Filter entries to those whose createdAt falls on the given local date.
 * @param {Entry[]} entries
 * @param {string}  dateStr  YYYY-MM-DD in local time
 * @returns {Entry[]}
 */
function filterByDate(entries, dateStr) {
  return entries.filter(e => e.createdAt.slice(0, 10) === dateStr);
}

/**
 * Filter entries to those created today (local time).
 * @param {Entry[]} entries
 * @returns {Entry[]}
 */
function filterToday(entries) {
  return filterByDate(entries, toLocalDateString());
}

/**
 * Compute sales total, expense total, net balance and entry count
 * from a (pre-filtered) list of entries. All money values are in pesewas.
 * @param {Entry[]} entries
 * @returns {{ salesPesewas: number, expensesPesewas: number, balancePesewas: number, count: number }}
 */
function computeTotals(entries) {
  let salesPesewas = 0;
  let expensesPesewas = 0;

  for (const e of entries) {
    if (e.type === 'sale') {
      salesPesewas += e.amountPesewas;
    } else {
      expensesPesewas += e.amountPesewas;
    }
  }

  return {
    salesPesewas,
    expensesPesewas,
    balancePesewas: salesPesewas - expensesPesewas,
    count: entries.length,
  };
}

/**
 * Return entries sorted newest-first.
 * Does not mutate the input array.
 * @param {Entry[]} entries
 * @returns {Entry[]}
 */
function sortNewestFirst(entries) {
  return [...entries].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Format a pesewa integer as a GH₵ display string.
 * e.g. 4500 → "GH₵45.00"
 * @param {number} pesewas
 * @returns {string}
 */
function formatCedis(pesewas) {
  const cedis = pesewas / 100;
  return 'GH₵' + cedis.toFixed(2);
}

/**
 * Ask the user to confirm, then remove the entry with the given id.
 * Returns true if the entry was deleted, false if the user cancelled
 * or the entry was not found.
 *
 * @param {Entry[]} entries   In-memory array (passed to removeEntry).
 * @param {string}  id
 * @param {function} removeFn  removeEntry from storage.js
 * @returns {boolean}
 */
function deleteEntry(entries, id, removeFn) {
  const entry = entries.find(e => e.id === id);
  if (!entry) return false;

  const label = entry.item || 'this entry';
  const confirmed = window.confirm(`Delete "${label}" (${formatCedis(entry.amountPesewas)})?`);
  if (!confirmed) return false;

  return removeFn(entries, id);
}
