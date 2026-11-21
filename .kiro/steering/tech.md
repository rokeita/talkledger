# TalkLedger — Tech

## Stack

- Plain HTML, CSS and JavaScript. No framework, no build step, no bundler.
- Data in `localStorage` under the key `talkledger.entries.v1`. Offline-first.
- Voice input via the Web Speech API (`SpeechRecognition`, `en-GH` where available, `en-US` fallback).
- Money in Ghana cedis (GH₵). Amounts stored as pesewas (integer) to avoid float errors; displayed as cedis with two decimals.

## Conventions

- One file per concern under `js/`: `storage.js`, `voice.js`, `sms.js`, `ledger.js`, `app.js`.
- All user-facing text in plain English. Twi appears only inside the voice keyword dictionary (`js/twi-dict.js`).
- Every destructive action (delete entry, clear all) needs a confirm step.
- Sample entries are clearly marked as samples and can be cleared with one tap.
- No external requests at runtime. No analytics, no tracking.

## Browser support

- Target: Chrome on Android (the trader's phone). Speech recognition needs Chrome; if it is unavailable, the voice button is hidden and manual entry remains.
- The app must work fully offline after first load, except speech recognition which needs the network.

## Kiro workflow

- Specs live in `.kiro/specs/talkledger/`. Implement tasks in order, one at a time.
- Do not change the data model without updating `design.md` first.
- Keep the MVP small: if a feature is not in `requirements.md`, do not build it yet.
