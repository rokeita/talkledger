# TalkLedger — Structure

```
talkledger/
├── index.html            # Single page: voice entry, SMS paste, ledger, totals
├── css/
│   └── style.css         # Mobile-first, large tap targets, dark header
├── js/
│   ├── app.js            # Wiring: events, rendering, boot
│   ├── storage.js        # localStorage load/save, entry model
│   ├── ledger.js         # Totals, balance, filtering, delete
│   ├── voice.js          # SpeechRecognition wrapper, confirm flow
│   ├── twi-dict.js       # Twi keywords: numbers, common items, units
│   ├── sms.js            # MoMo SMS receipt parser
│   └── parse.js          # Spoken/typed sale text -> entry (item, qty, amount)
├── .kiro/
│   ├── steering/         # Product, tech and structure guidance for Kiro
│   └── specs/
│       └── talkledger/   # requirements.md, design.md, tasks.md
└── README.md
```

## Data model

An entry:

```js
{
  id: "tl-...",
  type: "sale" | "expense",
  item: "bags of rice",
  qty: 3,
  amountPesewas: 4500,
  source: "voice" | "sms" | "manual",
  momoRef: "MP123456789" | null,
  note: "",
  createdAt: "2026-11-21T10:30:00.000Z"
}
```

## Pages / views (single page, sections)

1. **Today** — today's balance, sales total, expense total, entry count.
2. **Record** — big voice button, text field fallback, SMS paste box.
3. **Ledger** — all entries, newest first, with delete on each row.
