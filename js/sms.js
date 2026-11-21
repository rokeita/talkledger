/**
 * sms.js — MTN MoMo SMS receipt parser.
 *
 * All functions are pure (no DOM, no network, no storage).
 *
 * Public API:
 *   parseMoMoSMS(text) → ParsedSMS | { ok: false }
 *
 * ParsedSMS = {
 *   ok:            true,
 *   type:          "sale" | "expense",
 *   item:          string,         // human-readable label
 *   amountPesewas: number,
 *   momoRef:       string | null,
 *   note:          string,         // counterparty name
 * }
 */

(function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Parse a GHS amount string ("45.00", "45", "1,200.50") to pesewas.
   * @param {string} str
   * @returns {number}
   */
  function ghsToPesewas(str) {
    const normalised = str.replace(/,/g, '');
    return Math.round(parseFloat(normalised) * 100);
  }

  /**
   * Extract a transaction reference from text.
   * Looks for "Transaction ID: XXXXXX" or "Ref: XXXXXX" patterns.
   * @param {string} text
   * @returns {string|null}
   */
  function extractRef(text) {
    const patterns = [
      /Transaction\s+ID[:\s]+([A-Z0-9]+)/i,
      /Reference[:\s]+([A-Z0-9]+)/i,
      /Ref[:\s]+([A-Z0-9]+)/i,
      /TxnID[:\s]+([A-Z0-9]+)/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m) return m[1];
    }
    return null;
  }

  // ── Patterns ───────────────────────────────────────────────────────────────

  /**
   * Pattern 1 — Money received.
   * "You have received GHS 45.00 from Kofi Mensah on …  Transaction ID: MP123456789"
   * "GHS 45.00 has been deposited into your Mobile Money wallet from Kofi …"
   */
  const RECEIVED_RE = /(?:you have received|received)\s+GHS\s*([\d,]+(?:\.\d{1,2})?)\s+from\s+([^\.]+?)(?:\s+on\b|\.\s|,\s)/i;

  // Also match the deposit form
  const DEPOSIT_RE  = /GHS\s*([\d,]+(?:\.\d{1,2})?)\s+has been deposited[^.]+from\s+([^\.]+?)(?:\s+on\b|\.\s|,\s|$)/i;

  /**
   * Pattern 2 — Payment sent / money out.
   * "Payment of GHS 45.00 to Ama Owusu on … Transaction ID: MP987654321"
   * "You have sent GHS 45.00 to Ama Owusu …"
   */
  const PAYMENT_RE  = /(?:payment of|you have sent)\s+GHS\s*([\d,]+(?:\.\d{1,2})?)\s+to\s+([^\.]+?)(?:\s+on\b|\.\s|,\s|$)/i;

  /**
   * Pattern 3 — Cash-out / airtime purchase / fees.
   * "A charge of GHS 0.50 has been made …"
   * "GHS 0.50 has been charged …"
   * "… fee of GHS 0.25 …"
   */
  const FEE_RE = /(?:(?:a\s+)?charge\s+of|fee\s+of)\s+GHS\s*([\d,]+(?:\.\d{1,2})?)/i;

  // Generic "cash out" pattern
  const CASHOUT_RE  = /cash[\s-]?out.*?GHS\s*([\d,]+(?:\.\d{1,2})?)/i;

  // ── Main parser ────────────────────────────────────────────────────────────

  /**
   * Parse an MTN MoMo SMS receipt string.
   * @param {string} text
   * @returns {{ ok: true, type: string, item: string, amountPesewas: number, momoRef: string|null, note: string }
   *          |{ ok: false }}
   */
  function parseMoMoSMS(text) {
    if (!text || !text.trim()) return { ok: false };

    const t = text.trim();

    // ── Received money (sale) ────────────────────────────────────────────────
    let m = t.match(RECEIVED_RE) || t.match(DEPOSIT_RE);
    if (m) {
      return {
        ok:            true,
        type:          'sale',
        item:          'MoMo received',
        amountPesewas: ghsToPesewas(m[1]),
        momoRef:       extractRef(t),
        note:          ('from ' + m[2].trim()).replace(/\.$/, ''),
      };
    }

    // ── Payment sent (expense) ───────────────────────────────────────────────
    m = t.match(PAYMENT_RE);
    if (m) {
      return {
        ok:            true,
        type:          'expense',
        item:          'MoMo payment',
        amountPesewas: ghsToPesewas(m[1]),
        momoRef:       extractRef(t),
        note:          ('to ' + m[2].trim()).replace(/\.$/, ''),
      };
    }

    // ── Fee / charge (expense) ───────────────────────────────────────────────
    m = t.match(FEE_RE) || t.match(CASHOUT_RE);
    if (m) {
      return {
        ok:            true,
        type:          'expense',
        item:          'MoMo fee',
        amountPesewas: ghsToPesewas(m[1]),
        momoRef:       extractRef(t),
        note:          '',
      };
    }

    return { ok: false };
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  window.parseMoMoSMS = parseMoMoSMS;
}());
