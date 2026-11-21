# TalkLedger

Voice-and-SMS bookkeeping for Ghanaian small businesses.

A trader speaks a sale in Twi or English — "sold 3 bags of rice, 45 cedis" — and TalkLedger logs it. Paste a MoMo SMS receipt and it files the payment too. No typing, no spreadsheet, no smartphone skills needed beyond talking.

Built for **Kiroween 2026** (Frankenstein category) with [Kiro](https://kiro.dev), AWS's spec-driven AI coding tool.

## What it does

- **Voice sales:** speak a sale, TalkLedger transcribes it, parses item / quantity / amount, and asks you to confirm before saving.
- **MoMo receipts:** paste an MTN MoMo SMS receipt and it is parsed (amount, sender, transaction reference) and logged as money in or money out.
- **Ledger:** every entry in one list, with daily totals and balance in GH₵. Delete or correct any entry.
- **Offline-first:** everything is stored on the device (localStorage). No account, no internet needed to record a sale.

## Run it

No build step, no framework. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Tech

Plain HTML, CSS and JavaScript. Web Speech API for voice input. localStorage for data. Mobile-first, built for a phone in a trader's hand.

## Kiro spec

The build is driven by the spec in `.kiro/specs/talkledger/` (requirements, design, tasks) and the steering files in `.kiro/steering/`. Kiro implements from the spec.

## Status

MVP in progress. Kiroween 2026 submission deadline: 4 December 2026.
