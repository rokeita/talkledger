# TalkLedger — Tasks

Build in order. Check a task off only when its acceptance criteria in `requirements.md` pass.

## 1. Shell and storage

- [x] 1.1 Create `index.html` with the three sections (Today, Record, Ledger) and link `css/style.css` and the JS modules.
- [x] 1.2 Create `css/style.css`: mobile-first, large tap targets, GH₵ formatting, dark header.
- [x] 1.3 Create `js/storage.js`: load/save entries in localStorage (`talkledger.entries.v1`), entry model with `id`, `type`, `item`, `qty`, `amountPesewas`, `source`, `momoRef`, `note`, `createdAt`.
- [x] 1.4 Create `js/ledger.js`: today totals, balance, entry count, per-day filter, delete with confirm.

## 2. Manual entry and samples

- [x] 2.1 Add the manual sale form (item, quantity, amount) and save path with source `manual`.
- [x] 2.2 Render the ledger list, newest first, with delete on each row.
- [x] 2.3 Seed three clearly-marked sample entries on first open; clear them on the first real entry or via "Clear samples".

## 3. Voice sales

- [x] 3.1 Create `js/twi-dict.js`: Twi number words 1–10 and common item words.
- [x] 3.2 Create `js/parse.js`: text → `{ item, qty, amountPesewas }`; handles "45 cedis", Twi numbers, missing item (defaults to "Sale").
- [x] 3.3 Create `js/voice.js`: SpeechRecognition wrapper (`en-GH`, fallback `en-US`), confirm card showing transcript + parsed sale, Edit and Confirm actions, error messages for blocked mic and no speech.
- [x] 3.4 Hide the voice button entirely when `SpeechRecognition` is unavailable.

## 4. MoMo SMS receipts

- [x] 4.1 Create `js/sms.js`: parsers for MoMo received, MoMo sent, and fee messages; returns `{ ok: false }` on no match.
- [x] 4.2 Add the SMS paste box; on parse success show the parsed entry for confirmation before saving.
- [x] 4.3 Store `momoRef` on SMS entries and show it in the ledger row.

## 5. Polish and verify

- [x] 5.1 Verify every parser example: "sold 3 bags of rice 45 cedis", "sold mienu bags of rice 45 cedis", "sold kenkey 20 cedis", one MoMo received SMS, one MoMo sent SMS, one unparseable paste. (25/25 node checks pass.)
- [ ] 5.2 Test on Chrome (Android): voice sale end-to-end, reload persistence, offline recording. (See on-device checklist below.)
- [x] 5.3 Check the demo path: the app loads from a plain static host with no console errors. (All 7 assets serve 200; JS syntax-clean; data-pipeline smoke test passes.)

### 5.2 — On-device checklist for the owner

Serve the folder from any static host (e.g. `python3 -m http.server 8080` on your laptop,
then visit `http://<laptop-ip>:8080` from the phone, or deploy to GitHub Pages / Netlify).

Open Chrome on Android and go through each step:

1. **Sample entries** — On first load, three sample entries appear in Today and Ledger, labelled "Sample". A yellow banner in Ledger shows "Clear samples".
2. **Manual entry** — Tap Record → fill in item, qty, amount → Save. Confirm the entry appears in Today and Ledger, totals update, and the sample entries are gone.
3. **Delete with confirm** — Tap the 🗑 on an entry. Confirm the browser dialog appears; tap Cancel and verify nothing was deleted; tap 🗑 again and confirm — entry disappears and totals update.
4. **Reload persistence** — Reload the page. Confirm the entry you saved in step 2 is still there.
5. **Voice entry** — Tap the mic. When prompted, allow microphone access. Say "sold 3 bags of rice 45 cedis". Confirm the transcript and parsed fields appear in the confirm card. Tap Confirm. Verify the entry is saved.
6. **Voice edit path** — Tap mic, say something with no amount (e.g. "sold some stuff"). Confirm an error message appears and the text is pre-filled in the manual form.
7. **MoMo SMS received** — Tap Record, scroll to "Paste MoMo SMS". Paste:
   `You have received GHS 45.00 from Kofi Mensah on 21/11/2024. Transaction ID: MP123456789`
   Tap Parse receipt. Confirm "📥 Money in" and GH₵45.00 appear. Tap Save. Verify the SMS badge and Ref appear in the ledger row.
8. **MoMo SMS sent** — Paste:
   `Payment of GHS 120.00 to Ama Owusu on 21/11/2024. Transaction ID: MP987654321`
   Confirm "📤 Money out" and GH₵120.00. Save. Verify expense entry.
9. **Unparseable paste** — Paste any random text. Confirm the error message appears and nothing is saved.
10. **Offline recording** — Enable Airplane Mode. Reload the page. Confirm ledger, totals, manual entry and MoMo paste all still work. (Voice recognition itself needs network; the voice button should still appear but will error gracefully if tapped.)
11. **Date filter** — In Ledger, pick yesterday's date in the filter. Confirm only entries from that date appear (or the "No entries found" state). Tap "Show all" to reset.
12. **Clear all data** — Tap "Clear all data". Confirm the browser dialog appears. Confirm. Verify all entries are gone and totals show GH₵0.00.
