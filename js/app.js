/**
 * app.js — DOM wiring, rendering, and boot.
 *
 * Depends on (loaded first in index.html):
 *   storage.js  → loadEntries, saveEntries, createEntry, addEntry, removeEntry, clearEntries
 *   ledger.js   → filterToday, filterByDate, computeTotals, sortNewestFirst, formatCedis, deleteEntry, toLocalDateString
 *   twi-dict.js → replaceTwiNumbers, TWI_ITEMS (used by parse.js)
 *   parse.js    → parseSaleText
 *   voice.js    → initVoice
 *   sms.js      → parseMoMoSMS
 */

(function () {
  'use strict';

  // ── Sample entries ─────────────────────────────────────────────────────────
  // Seeded only on first open (no entries in storage). Flagged as samples via note field.
  const SAMPLE_FLAG = '__sample__';

  function isSample(entry) {
    return entry.note === SAMPLE_FLAG;
  }

  function buildSamples() {
    const now = new Date();
    const todayISO = now.toISOString();

    return [
      createEntry({
        type:          'sale',
        item:          'bags of rice',
        qty:           3,
        amountPesewas: 4500,
        source:        'voice',
        note:          SAMPLE_FLAG,
        createdAt:     todayISO,
      }),
      createEntry({
        type:          'sale',
        item:          'kenkey',
        qty:           1,
        amountPesewas: 2000,
        source:        'manual',
        note:          SAMPLE_FLAG,
        createdAt:     todayISO,
      }),
      createEntry({
        type:          'expense',
        item:          'MoMo fee',
        qty:           1,
        amountPesewas: 500,
        source:        'manual',
        note:          SAMPLE_FLAG,
        createdAt:     todayISO,
      }),
    ];
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let entries = loadEntries();
  let ledgerDateFilter = '';   // YYYY-MM-DD or '' for all

  // ── Seed samples on first open ─────────────────────────────────────────────
  if (entries.length === 0) {
    const samples = buildSamples();
    for (const s of samples) addEntry(entries, s);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /** Remove all sample entries and persist. */
  function clearSamples() {
    const toRemove = entries.filter(isSample).map(e => e.id);
    for (const id of toRemove) removeEntry(entries, id);
  }

  /** True if the entry array contains any sample entries. */
  function hasSamples() {
    return entries.some(isSample);
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Build the HTML string for a single entry row.
   * @param {Entry} entry
   * @param {boolean} [compact=false]  omit date in today view
   */
  function renderEntryRow(entry, compact) {
    const sample     = isSample(entry);
    const typeClass  = sample ? 'sample' : entry.type;
    const amountSign = entry.type === 'expense' ? '−' : '+';
    const dateStr    = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDate   = new Date(entry.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

    const typeBadge   = sample
      ? '<span class="entry-badge badge-sample">Sample</span>'
      : entry.type === 'sale'
        ? '<span class="entry-badge badge-sale">Sale</span>'
        : '<span class="entry-badge badge-expense">Expense</span>';

    const sourceBadge = sample ? '' :
      entry.source === 'voice'  ? '<span class="entry-badge badge-voice">Voice</span>'  :
      entry.source === 'sms'    ? '<span class="entry-badge badge-sms">SMS</span>'      :
      '<span class="entry-badge badge-manual">Manual</span>';

    const momoLine = entry.momoRef
      ? `<span>Ref: ${entry.momoRef}</span>`
      : '';

    const noteLine = entry.note && entry.note !== SAMPLE_FLAG
      ? `<span>${entry.note}</span>`
      : '';

    const timeLabel = compact ? dateStr : `${fullDate} ${dateStr}`;

    return `
      <li class="entry-item ${typeClass}" data-id="${entry.id}">
        <div class="entry-body">
          <div class="entry-top">
            <span class="entry-item-name">${escapeHtml(entry.item)}</span>
            ${typeBadge}${sourceBadge}
          </div>
          <div class="entry-meta">
            <span>${timeLabel}</span>
            ${entry.qty !== 1 ? `<span>Qty: ${entry.qty}</span>` : ''}
            ${momoLine}
            ${noteLine}
          </div>
        </div>
        <span class="entry-amount">${amountSign}${formatCedis(entry.amountPesewas)}</span>
        <button class="entry-delete" aria-label="Delete ${escapeHtml(entry.item)}" data-id="${entry.id}">🗑</button>
      </li>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Today section ──────────────────────────────────────────────────────────

  function refreshTotals() {
    const todayEntries = filterToday(entries);
    const { salesPesewas, expensesPesewas, balancePesewas, count } = computeTotals(todayEntries);

    const balanceEl = document.getElementById('today-balance');
    balanceEl.textContent = formatCedis(Math.abs(balancePesewas));
    balanceEl.classList.toggle('negative', balancePesewas < 0);

    document.getElementById('today-sales').textContent    = formatCedis(salesPesewas);
    document.getElementById('today-expenses').textContent = formatCedis(expensesPesewas);
    document.getElementById('today-count').textContent    = String(count);
  }

  function refreshTodayList() {
    const list   = document.getElementById('today-entry-list');
    const empty  = document.getElementById('today-empty');
    const today  = sortNewestFirst(filterToday(entries));

    if (today.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      list.innerHTML = today.map(e => renderEntryRow(e, true)).join('');
      attachDeleteHandlers(list);
    }
  }

  // ── Ledger section ─────────────────────────────────────────────────────────

  function refreshLedgerList() {
    const list        = document.getElementById('ledger-entry-list');
    const empty       = document.getElementById('ledger-empty');
    const sampleBanner = document.getElementById('samples-banner');

    let visible = ledgerDateFilter
      ? filterByDate(entries, ledgerDateFilter)
      : [...entries];

    visible = sortNewestFirst(visible);

    // Samples banner
    if (hasSamples() && !ledgerDateFilter) {
      sampleBanner.classList.remove('hidden');
    } else {
      sampleBanner.classList.add('hidden');
    }

    if (visible.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      list.innerHTML = visible.map(e => renderEntryRow(e, false)).join('');
      attachDeleteHandlers(list);
    }
  }

  // ── Delete handler (shared) ────────────────────────────────────────────────

  function attachDeleteHandlers(container) {
    container.querySelectorAll('.entry-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const deleted = deleteEntry(entries, id, removeEntry);
        if (deleted) refreshUI();
      });
    });
  }

  // ── Full refresh ───────────────────────────────────────────────────────────

  function refreshUI() {
    refreshTotals();
    refreshTodayList();
    refreshLedgerList();
  }

  // ── After a real entry is saved, clear samples ─────────────────────────────

  function saveRealEntry(entry) {
    if (hasSamples()) clearSamples();
    addEntry(entries, entry);
    refreshUI();
  }

  // ── Tab navigation ─────────────────────────────────────────────────────────

  function initTabs() {
    const tabs     = document.querySelectorAll('.nav-tab');
    const sections = document.querySelectorAll('.section');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('aria-controls');

        tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
        sections.forEach(s => s.classList.remove('active'));

        tab.setAttribute('aria-selected', 'true');
        document.getElementById(targetId).classList.add('active');
      });
    });
  }

  // ── Manual entry form ──────────────────────────────────────────────────────

  function initManualForm() {
    const form   = document.getElementById('manual-form');
    const msgEl  = document.getElementById('manual-msg');

    function showMsg(text, type) {
      msgEl.textContent = text;
      msgEl.className = 'msg msg-' + type;
      msgEl.classList.remove('hidden');
    }

    function clearMsg() {
      msgEl.classList.add('hidden');
      msgEl.textContent = '';
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      clearMsg();

      const itemVal   = document.getElementById('manual-item').value.trim();
      const qtyVal    = document.getElementById('manual-qty').value.trim();
      const amountVal = document.getElementById('manual-amount').value.trim();
      const typeVal   = document.getElementById('manual-type').value;

      if (!amountVal || isNaN(parseFloat(amountVal))) {
        showMsg('Please enter an amount.', 'error');
        return;
      }

      const amountPesewas = Math.round(parseFloat(amountVal) * 100);
      if (amountPesewas <= 0) {
        showMsg('Amount must be greater than zero.', 'error');
        return;
      }

      const entry = createEntry({
        type:          typeVal,
        item:          itemVal || (typeVal === 'sale' ? 'Sale' : 'Expense'),
        qty:           qtyVal ? Math.max(1, parseFloat(qtyVal)) : 1,
        amountPesewas,
        source:        'manual',
      });

      saveRealEntry(entry);
      form.reset();
      showMsg('Entry saved!', 'success');
      setTimeout(clearMsg, 2500);
    });
  }

  // ── SMS paste ──────────────────────────────────────────────────────────────

  function initSmsPane() {
    const parseBtn       = document.getElementById('sms-parse-btn');
    const smsInput       = document.getElementById('sms-input');
    const smsMsg         = document.getElementById('sms-msg');
    const smsConfirmCard = document.getElementById('sms-confirm-card');
    const smsSaveBtn     = document.getElementById('sms-save-btn');
    const smsCancelBtn   = document.getElementById('sms-cancel-btn');

    let _pendingSMS = null;

    function showSmsMsg(text, type) {
      smsMsg.textContent = text;
      smsMsg.className = 'msg msg-' + type;
      smsMsg.classList.remove('hidden');
    }

    function clearSmsMsg() {
      smsMsg.classList.add('hidden');
      smsMsg.textContent = '';
    }

    function showSmsConfirm(parsed) {
      _pendingSMS = parsed;
      document.getElementById('sms-confirm-type').textContent   =
        parsed.type === 'sale' ? '📥 Money in' : '📤 Money out';
      document.getElementById('sms-confirm-amount').textContent = formatCedis(parsed.amountPesewas);
      document.getElementById('sms-confirm-ref').textContent    = parsed.momoRef
        ? 'Ref: ' + parsed.momoRef
        : '';
      smsConfirmCard.classList.remove('hidden');
    }

    function hideSmsConfirm() {
      smsConfirmCard.classList.add('hidden');
      _pendingSMS = null;
    }

    parseBtn.addEventListener('click', () => {
      clearSmsMsg();
      hideSmsConfirm();

      const text = smsInput.value.trim();
      if (!text) {
        showSmsMsg('Paste an MTN MoMo SMS receipt first.', 'info');
        return;
      }

      const result = parseMoMoSMS(text);
      if (!result.ok) {
        showSmsMsg(
          'This doesn\u2019t look like an MTN MoMo receipt. Nothing was saved. Check the text and try again.',
          'error'
        );
        return;
      }

      showSmsConfirm(result);
    });

    smsSaveBtn.addEventListener('click', () => {
      if (!_pendingSMS) return;

      const entry = createEntry({
        type:          _pendingSMS.type,
        item:          _pendingSMS.item,
        qty:           1,
        amountPesewas: _pendingSMS.amountPesewas,
        source:        'sms',
        momoRef:       _pendingSMS.momoRef,
        note:          _pendingSMS.note,
      });

      saveRealEntry(entry);
      hideSmsConfirm();
      smsInput.value = '';
      showSmsMsg('MoMo entry saved!', 'success');
      setTimeout(clearSmsMsg, 2500);
    });

    smsCancelBtn.addEventListener('click', () => {
      hideSmsConfirm();
      clearSmsMsg();
    });
  }

  // ── Ledger controls ────────────────────────────────────────────────────────

  function initLedgerControls() {
    const dateFilter    = document.getElementById('ledger-date-filter');
    const clearFilterBtn = document.getElementById('ledger-clear-filter-btn');
    const clearAllBtn   = document.getElementById('clear-all-btn');
    const clearSamplesBtn = document.getElementById('clear-samples-btn');

    dateFilter.addEventListener('change', () => {
      ledgerDateFilter = dateFilter.value || '';
      refreshLedgerList();
    });

    clearFilterBtn.addEventListener('click', () => {
      dateFilter.value  = '';
      ledgerDateFilter  = '';
      refreshLedgerList();
    });

    clearAllBtn.addEventListener('click', () => {
      if (!window.confirm('Delete ALL entries? This cannot be undone.')) return;
      clearEntries(entries);
      refreshUI();
    });

    clearSamplesBtn.addEventListener('click', () => {
      clearSamples();
      refreshUI();
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  function boot() {
    initTabs();
    initManualForm();
    initSmsPane();
    initLedgerControls();

    // Wire voice module
    initVoice({
      onSaved: (entry) => {
        saveRealEntry(entry);
      },
    });

    refreshUI();
  }

  document.addEventListener('DOMContentLoaded', boot);
}());
