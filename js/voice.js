/**
 * voice.js — SpeechRecognition wrapper with confirm-before-save flow.
 *
 * Relies on:
 *   parse.js   → parseSaleText()
 *   storage.js → createEntry(), addEntry()
 *   ledger.js  → formatCedis()
 *   app.js     → refreshUI() (called via callback so there's no circular dep)
 *
 * Public API (called from app.js):
 *   initVoice(options) — sets up the voice button and confirm card wiring.
 *
 * options = {
 *   onSaved: function(entry) — called when the user confirms a voice entry.
 * }
 */

(function () {
  'use strict';

  // ── Feature detection ──────────────────────────────────────────────────────
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  /**
   * Returns true when speech recognition is available in this browser.
   * @returns {boolean}
   */
  function isSpeechAvailable() {
    return SpeechRecognition !== null;
  }

  // ── Module-level state ─────────────────────────────────────────────────────
  let _recognition = null;
  let _listening    = false;
  let _pendingParsed = null;   // { item, qty, amountPesewas } waiting for confirm
  let _pendingTranscript = ''; // raw transcript shown in confirm card

  // ── DOM references (set by initVoice) ─────────────────────────────────────
  let _voiceBtn        = null;
  let _voiceLabel      = null;
  let _voiceMsg        = null;
  let _confirmCard     = null;
  let _confirmTranscript = null;
  let _confirmItem     = null;
  let _confirmQty      = null;
  let _confirmAmount   = null;
  let _confirmSaveBtn  = null;
  let _confirmEditBtn  = null;
  let _confirmCancelBtn = null;
  let _onSaved         = null;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showVoiceMsg(text, type) {
    // type: 'error' | 'info' | 'success'
    _voiceMsg.textContent = text;
    _voiceMsg.className = 'msg msg-' + type;
    _voiceMsg.classList.remove('hidden');
  }

  function clearVoiceMsg() {
    _voiceMsg.classList.add('hidden');
    _voiceMsg.textContent = '';
  }

  function setListeningState(active) {
    _listening = active;
    if (active) {
      _voiceBtn.classList.add('listening');
      _voiceBtn.setAttribute('aria-label', 'Listening… tap to stop');
      _voiceLabel.textContent = 'Listening…';
    } else {
      _voiceBtn.classList.remove('listening');
      _voiceBtn.setAttribute('aria-label', 'Tap to record a sale by voice');
      _voiceLabel.textContent = 'Tap the mic and say something like "sold 3 bags of rice 45 cedis"';
    }
  }

  function showConfirmCard(transcript, parsed) {
    _pendingTranscript = transcript;
    _pendingParsed     = parsed;

    _confirmTranscript.textContent = '\u201c' + transcript + '\u201d';
    _confirmItem.textContent   = parsed.item;
    _confirmQty.textContent    = 'Qty: ' + parsed.qty;
    _confirmAmount.textContent = formatCedis(parsed.amountPesewas);

    _confirmCard.classList.remove('hidden');
  }

  function hideConfirmCard() {
    _confirmCard.classList.add('hidden');
    _pendingParsed = null;
    _pendingTranscript = '';
  }

  /**
   * Populate the manual form with the voice transcript so the trader can
   * correct it. Called when the parse fails or the trader taps Edit.
   */
  function fillManualFormFromVoice(transcript, parsed) {
    const itemEl   = document.getElementById('manual-item');
    const qtyEl    = document.getElementById('manual-qty');
    const amountEl = document.getElementById('manual-amount');

    if (itemEl)   itemEl.value   = parsed ? parsed.item : (transcript || '');
    if (qtyEl)    qtyEl.value    = parsed ? String(parsed.qty) : '1';
    if (amountEl) amountEl.value = parsed
      ? (parsed.amountPesewas / 100).toFixed(2)
      : '';

    // Switch to the Record tab if not already on it, then scroll to the form
    const recordTab = document.getElementById('tab-record');
    if (recordTab && recordTab.getAttribute('aria-selected') !== 'true') {
      recordTab.click();
    }
    const manualCard = document.querySelector('#manual-form');
    if (manualCard) {
      setTimeout(() => manualCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }

  // ── SpeechRecognition engine ───────────────────────────────────────────────

  function createRecognition() {
    const r = new SpeechRecognition();
    r.continuous    = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    // Prefer en-GH; fall back to en-US if the browser rejects the locale
    r.lang = 'en-GH';

    r.onstart = () => {
      setListeningState(true);
      clearVoiceMsg();
      hideConfirmCard();
    };

    r.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      setListeningState(false);

      const parsed = parseSaleText(transcript);

      if (!parsed.ok) {
        // Can't parse → push raw text to manual form
        showVoiceMsg(
          'Couldn\u2019t parse that. The text has been copied to the manual form \u2014 please fill in the amount.',
          'error'
        );
        fillManualFormFromVoice(transcript, null);
        return;
      }

      showConfirmCard(transcript, parsed);
    };

    r.onerror = (event) => {
      // If en-GH is not supported, retry once with en-US.
      if (event.error === 'language-not-supported' && r.lang === 'en-GH') {
        r.lang = 'en-US';
        try {
          _recognition = createRecognition();
          _recognition.lang = 'en-US';
          _recognition.start();
        } catch (err) {
          setListeningState(false);
          hideConfirmCard();
          showVoiceMsg('Could not start the microphone: ' + err.message, 'error');
        }
        return;
      }

      setListeningState(false);
      hideConfirmCard();

      if (event.error === 'not-allowed') {
        showVoiceMsg(
          'Microphone blocked \u2014 allow it in the browser settings, or type the sale instead.',
          'error'
        );
      } else if (event.error === 'no-speech') {
        showVoiceMsg('Didn\u2019t catch that \u2014 try again.', 'info');
      } else {
        showVoiceMsg('Voice error: ' + event.error + '. Try typing the sale instead.', 'error');
      }
    };

    r.onend = () => {
      // If still marked as listening (e.g. user stopped externally), reset.
      if (_listening) setListeningState(false);
    };

    return r;
  }

  // ── Confirm card actions ───────────────────────────────────────────────────

  function handleConfirmSave() {
    if (!_pendingParsed) return;

    const entry = createEntry({
      type:          'sale',
      item:          _pendingParsed.item,
      qty:           _pendingParsed.qty,
      amountPesewas: _pendingParsed.amountPesewas,
      source:        'voice',
    });

    if (typeof _onSaved === 'function') _onSaved(entry);
    hideConfirmCard();
    clearVoiceMsg();
  }

  function handleConfirmEdit() {
    if (!_pendingParsed) return;
    fillManualFormFromVoice(_pendingTranscript, _pendingParsed);
    hideConfirmCard();
    clearVoiceMsg();
  }

  function handleConfirmCancel() {
    hideConfirmCard();
    clearVoiceMsg();
  }

  // ── Voice button toggle ────────────────────────────────────────────────────

  function handleVoiceBtnClick() {
    if (_listening) {
      // Stop listening
      if (_recognition) _recognition.stop();
      setListeningState(false);
      return;
    }

    // Start listening
    clearVoiceMsg();
    hideConfirmCard();

    try {
      _recognition = createRecognition();
      _recognition.start();
    } catch (err) {
      showVoiceMsg('Could not start the microphone: ' + err.message, 'error');
    }
  }

  // ── Public init ────────────────────────────────────────────────────────────

  /**
   * Wire up the voice button and confirm card.
   * @param {{ onSaved: function }} options
   */
  function initVoice(options) {
    _onSaved = (options && options.onSaved) || null;

    _voiceBtn          = document.getElementById('voice-btn');
    _voiceLabel        = document.getElementById('voice-label');
    _voiceMsg          = document.getElementById('voice-msg');
    _confirmCard       = document.getElementById('confirm-card');
    _confirmTranscript = document.getElementById('confirm-transcript');
    _confirmItem       = document.getElementById('confirm-item');
    _confirmQty        = document.getElementById('confirm-qty');
    _confirmAmount     = document.getElementById('confirm-amount');
    _confirmSaveBtn    = document.getElementById('confirm-save-btn');
    _confirmEditBtn    = document.getElementById('confirm-edit-btn');
    _confirmCancelBtn  = document.getElementById('confirm-cancel-btn');

    if (!isSpeechAvailable()) {
      // Hide the entire voice card; manual entry is still shown.
      const voiceCard = document.getElementById('voice-card');
      if (voiceCard) voiceCard.classList.add('hidden');
      return;
    }

    _voiceBtn.addEventListener('click', handleVoiceBtnClick);
    _confirmSaveBtn.addEventListener('click', handleConfirmSave);
    _confirmEditBtn.addEventListener('click', handleConfirmEdit);
    _confirmCancelBtn.addEventListener('click', handleConfirmCancel);
  }

  // ── Exports ────────────────────────────────────────────────────────────────
  window.initVoice        = initVoice;
  window.isSpeechAvailable = isSpeechAvailable;
}());
