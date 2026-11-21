# TalkLedger — Tasks

Build in order. Check a task off only when its acceptance criteria in `requirements.md` pass.

## 1. Shell and storage

- [ ] 1.1 Create `index.html` with the three sections (Today, Record, Ledger) and link `css/style.css` and the JS modules.
- [ ] 1.2 Create `css/style.css`: mobile-first, large tap targets, GH₵ formatting, dark header.
- [ ] 1.3 Create `js/storage.js`: load/save entries in localStorage (`talkledger.entries.v1`), entry model with `id`, `type`, `item`, `qty`, `amountPesewas`, `source`, `momoRef`, `note`, `createdAt`.
- [ ] 1.4 Create `js/ledger.js`: today totals, balance, entry count, per-day filter, delete with confirm.

## 2. Manual entry and samples

- [ ] 2.1 Add the manual sale form (item, quantity, amount) and save path with source `manual`.
- [ ] 2.2 Render the ledger list, newest first, with delete on each row.
- [ ] 2.3 Seed three clearly-marked sample entries on first open; clear them on the first real entry or via "Clear samples".

## 3. Voice sales

- [ ] 3.1 Create `js/twi-dict.js`: Twi number words 1–10 and common item words.
- [ ] 3.2 Create `js/parse.js`: text → `{ item, qty, amountPesewas }`; handles "45 cedis", Twi numbers, missing item (defaults to "Sale").
- [ ] 3.3 Create `js/voice.js`: SpeechRecognition wrapper (`en-GH`, fallback `en-US`), confirm card showing transcript + parsed sale, Edit and Confirm actions, error messages for blocked mic and no speech.
- [ ] 3.4 Hide the voice button entirely when `SpeechRecognition` is unavailable.

## 4. MoMo SMS receipts

- [ ] 4.1 Create `js/sms.js`: parsers for MoMo received, MoMo sent, and fee messages; returns `{ ok: false }` on no match.
- [ ] 4.2 Add the SMS paste box; on parse success show the parsed entry for confirmation before saving.
- [ ] 4.3 Store `momoRef` on SMS entries and show it in the ledger row.

## 5. Polish and verify

- [ ] 5.1 Verify every parser example: "sold 3 bags of rice 45 cedis", "sold mienu bags of rice 45 cedis", "sold kenkey 20 cedis", one MoMo received SMS, one MoMo sent SMS, one unparseable paste.
- [ ] 5.2 Test on Chrome (Android): voice sale end-to-end, reload persistence, offline recording.
- [ ] 5.3 Check the demo path: the app loads from a plain static host with no console errors.
