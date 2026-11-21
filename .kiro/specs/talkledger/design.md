# TalkLedger — Design

## Architecture

Single-page web app. No server, no framework, no build step. Four modules plus wiring:

- `storage.js` — load/save entries in localStorage (`talkledger.entries.v1`).
- `parse.js` — spoken or typed sale text → `{ item, qty, amountPesewas }`.
- `voice.js` — wraps `SpeechRecognition`; handles start/stop, errors, and the confirm step.
- `sms.js` — MoMo receipt parser; pure functions, no DOM.
- `ledger.js` — totals, balance, per-day filtering, delete.
- `app.js` — wires the DOM: voice button, forms, rendering.

## Data model

```js
Entry = {
  id: string,            // "tl-" + Date.now() + random
  type: "sale" | "expense",
  item: string,
  qty: number,           // default 1
  amountPesewas: number, // integer, e.g. 4500 = GH₵45.00
  source: "voice" | "sms" | "manual",
  momoRef: string | null,
  note: string,
  createdAt: string      // ISO date
}
```

## Voice flow

1. Tap the big mic button → `SpeechRecognition` starts (`lang: "en-GH"`, fallback `"en-US"`).
2. On result, show the transcript plus the parsed item/qty/amount in a confirm card.
3. Trader taps Confirm → entry saved, totals update. Tap Edit → fields become editable.
4. Errors: `not-allowed` (mic blocked) → show "Microphone blocked — allow it in the browser settings, or type the sale instead." `no-speech` → "Didn't catch that — try again."

## Twi support

The browser speech engine does not reliably transcribe Twi. The design handles it two ways:

- `twi-dict.js` maps common Twi number words (baako=1, mienu=2, miensa=3, anan=4, enum=5, nsia=6, nson=7, nwotwe=8, nkron=9, du=10) and common items (e.g. "banku", "kenkey", "waakye", "rice", "oil") so mixed sentences like "sold mienu bags of rice 45 cedis" still parse.
- Anything unparsed falls back to the manual form with the raw transcript pre-filled — never silently dropped.

## MoMo SMS parsing

Match these MTN MoMo patterns (case-insensitive):

- Received: `You have received GHS <amount> from <name> ... Transaction ID: <ref>` → sale, money in.
- Payment sent: `Payment of GHS <amount> to <name> ... Transaction ID: <ref>` → expense, money out.
- Cash out / fees: treat as expense with item "MoMo fee" when the text mentions a fee.

Extract with one regex per pattern; if none matches, return `{ ok: false }` and tell the user plainly.

## Rendering

- One page, three sections: Today (totals), Record (voice + text + SMS paste), Ledger (list).
- Mobile-first CSS: minimum tap target 48px, large mic button, GH₵ formatting `GH₵45.00`.
- Totals recompute from entries on every change; no cached totals.

## Testing

- Manual checks in Chrome on Android: voice sale, typed sale, SMS paste (one receive, one send, one garbage paste), delete with confirm, reload persistence, offline recording.
- Parser unit checks: a small list of example sentences and SMS texts in `tasks.md` must all parse as specified before the MVP is called done.
