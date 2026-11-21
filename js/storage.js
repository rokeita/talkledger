/**
 * storage.js — load/save entries in localStorage.
 *
 * Key: talkledger.entries.v1
 * Entry shape:
 *   {
 *     id:            string        // "tl-" + timestamp + random
 *     type:          "sale" | "expense"
 *     item:          string
 *     qty:           number        // default 1
 *     amountPesewas: number        // integer; 4500 = GH₵45.00
 *     source:        "voice" | "sms" | "manual"
 *     momoRef:       string | null
 *     note:          string
 *     createdAt:     string        // ISO 8601
 *   }
 */

const STORAGE_KEY = 'talkledger.entries.v1';

/**
 * Generate a unique entry id.
 * @returns {string}
 */
function generateId() {
  return 'tl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

/**
 * Build a new entry object, filling in defaults for omitted fields.
 * @param {Partial<Entry>} fields
 * @returns {Entry}
 */
function createEntry(fields) {
  if (typeof fields.amountPesewas !== 'number' || !Number.isInteger(fields.amountPesewas)) {
    throw new Error('amountPesewas must be an integer');
  }
  if (!['sale', 'expense'].includes(fields.type)) {
    throw new Error('type must be "sale" or "expense"');
  }
  return {
    id:            fields.id        ?? generateId(),
    type:          fields.type,
    item:          fields.item      ?? 'Sale',
    qty:           fields.qty       ?? 1,
    amountPesewas: fields.amountPesewas,
    source:        fields.source    ?? 'manual',
    momoRef:       fields.momoRef   ?? null,
    note:          fields.note      ?? '',
    createdAt:     fields.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Load all entries from localStorage.
 * Returns an empty array if storage is empty or unreadable.
 * @returns {Entry[]}
 */
function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist the full entries array to localStorage.
 * @param {Entry[]} entries
 */
function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Append a single entry and persist.
 * @param {Entry[]} entries  Current in-memory array (mutated).
 * @param {Entry}   entry
 */
function addEntry(entries, entry) {
  entries.push(entry);
  saveEntries(entries);
}

/**
 * Remove an entry by id and persist.
 * @param {Entry[]} entries  Current in-memory array (mutated).
 * @param {string}  id
 * @returns {boolean} true if the entry was found and removed.
 */
function removeEntry(entries, id) {
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  saveEntries(entries);
  return true;
}

/**
 * Remove all entries and persist (clear all data).
 * @param {Entry[]} entries  Current in-memory array (mutated).
 */
function clearEntries(entries) {
  entries.splice(0, entries.length);
  saveEntries(entries);
}
