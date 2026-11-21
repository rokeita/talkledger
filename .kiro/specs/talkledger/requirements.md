# TalkLedger — Requirements

## REQ-1: Record a sale by voice

**User story:** As a trader, I speak a sale so it is logged without typing.

**Acceptance criteria:**
- WHEN the trader taps the voice button and speaks, THEN the app transcribes the speech and shows the parsed sale (item, quantity, amount) for confirmation.
- WHEN the trader confirms, THEN the sale is saved to the ledger with source `voice`.
- WHEN speech recognition is unavailable in the browser, THEN the voice button is hidden and manual entry remains available.
- WHEN the transcription cannot be parsed into an amount, THEN the app shows the raw text in the manual form for the trader to fix, and nothing is saved silently.

## REQ-2: Parse spoken sale text

**User story:** As a trader, I speak naturally ("sold 3 bags of rice 45 cedis") and the app understands it.

**Acceptance criteria:**
- WHEN the text contains a quantity, an item and an amount, THEN the parser returns all three.
- WHEN the amount is spoken as "45 cedis" or "45 Ghana cedis", THEN the amount is 4500 pesewas.
- WHEN Twi number words are used (e.g. "baako", "mienu", "miensa"), THEN the Twi dictionary maps them to digits.
- WHEN the text has an amount but no item, THEN the item defaults to "Sale" and the trader can edit it before confirming.

## REQ-3: Parse a MoMo SMS receipt

**User story:** As a trader, I paste a MoMo SMS receipt so the payment is filed automatically.

**Acceptance criteria:**
- WHEN the pasted text matches an MTN MoMo receipt pattern, THEN the app extracts the amount, the sender or recipient name, and the transaction reference.
- WHEN the receipt is money received, THEN the entry is logged as a sale (money in) with source `sms` and the MoMo reference stored.
- WHEN the receipt is money sent, THEN the entry is logged as an expense (money out) with source `sms`.
- WHEN the pasted text does not match any known receipt pattern, THEN the app says so plainly and saves nothing.

## REQ-4: Ledger and totals

**User story:** As a trader, I see today's takings at a glance.

**Acceptance criteria:**
- WHEN the app opens, THEN it shows today's sales total, expense total, balance and entry count.
- WHEN an entry is added, THEN the totals update immediately.
- WHEN the trader taps delete on an entry, THEN the app asks for confirmation before removing it.
- WHEN the trader filters by day, THEN only that day's entries are shown.

## REQ-5: Data stays on the device

**User story:** As a trader, my records work without internet and belong to me.

**Acceptance criteria:**
- WHEN the app saves an entry, THEN it is written to localStorage and survives a reload.
- WHEN there is no network, THEN recording, listing and totals all still work (except live speech recognition).
- WHEN the trader clears all data, THEN the app asks for confirmation first.
- The app makes no network requests of its own.

## REQ-6: Sample data

**User story:** As a first-time user, I see how the app works before I record anything real.

**Acceptance criteria:**
- WHEN the app is first opened with no entries, THEN three sample entries are shown, clearly marked as samples.
- WHEN the trader records their first real entry, THEN the samples disappear.
- WHEN the trader taps "Clear samples", THEN the samples are removed.
