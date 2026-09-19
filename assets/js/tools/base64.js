(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function showError(id, message) {
    var box = el(id);
    box.textContent = message;
    box.classList.add('visible');
  }

  function clearError(id) {
    var box = el(id);
    box.textContent = '';
    box.classList.remove('visible');
  }

  function bytesToBase64(bytes) {
    var chunkSize = 8000;
    var chunks = [];
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var slice = bytes.subarray(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, slice));
    }
    return btoa(chunks.join(''));
  }

  function encodeText(text) {
    var bytes = new TextEncoder().encode(text);
    return bytesToBase64(bytes);
  }

  function isValidBase64(str) {
    if (str === '') return true;
    if (str.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
  }

  function decodeBase64(str) {
    var binary = atob(str);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  function initTabs() {
    var tabs = [
      { btn: 'tab-btn-encode', panel: 'tab-panel-encode' },
      { btn: 'tab-btn-decode', panel: 'tab-panel-decode' }
    ];
    tabs.forEach(function (t) {
      el(t.btn).addEventListener('click', function () {
        tabs.forEach(function (other) {
          var isActive = other.btn === t.btn;
          el(other.btn).classList.toggle('active', isActive);
          el(other.btn).setAttribute('aria-selected', isActive ? 'true' : 'false');
          el(other.panel).classList.toggle('active', isActive);
        });
      });
    });
  }

  function doEncode() {
    clearError('b64-encode-error');
    var text = el('b64-encode-input').value;
    if (!text) {
      showError('b64-encode-error', 'Enter some text to encode.');
      el('b64-encode-output').textContent = '';
      return;
    }
    try {
      var result = encodeText(text);
      el('b64-encode-output').textContent = result;
    } catch (err) {
      showError('b64-encode-error', 'Could not encode this input: ' + err.message);
      el('b64-encode-output').textContent = '';
    }
  }

  function doDecode() {
    clearError('b64-decode-error');
    var raw = el('b64-decode-input').value;
    var stripped = raw.replace(/\s+/g, '');
    if (!stripped) {
      showError('b64-decode-error', 'Enter some Base64 text to decode.');
      el('b64-decode-output').textContent = '';
      return;
    }
    if (!isValidBase64(stripped)) {
      showError('b64-decode-error', 'This does not look like valid Base64 (unexpected characters or wrong length).');
      el('b64-decode-output').textContent = '';
      return;
    }
    try {
      var text = decodeBase64(stripped);
      el('b64-decode-output').textContent = text;
    } catch (err) {
      showError('b64-decode-error', 'Could not decode: the Base64 data does not contain valid UTF-8 text.');
      el('b64-decode-output').textContent = '';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTabs();

    el('b64-encode-btn').addEventListener('click', doEncode);
    el('b64-decode-btn').addEventListener('click', doDecode);

    el('b64-encode-clear').addEventListener('click', function () {
      el('b64-encode-input').value = '';
      el('b64-encode-output').textContent = '';
      clearError('b64-encode-error');
      el('b64-encode-input').focus();
    });

    el('b64-decode-clear').addEventListener('click', function () {
      el('b64-decode-input').value = '';
      el('b64-decode-output').textContent = '';
      clearError('b64-decode-error');
      el('b64-decode-input').focus();
    });

    el('b64-encode-copy').addEventListener('click', function () {
      var text = el('b64-encode-output').textContent;
      if (!text) {
        showError('b64-encode-error', 'Nothing to copy yet — encode some text first.');
        return;
      }
      mtCopy(text);
    });

    el('b64-decode-copy').addEventListener('click', function () {
      var text = el('b64-decode-output').textContent;
      if (!text) {
        showError('b64-decode-error', 'Nothing to copy yet — decode some Base64 first.');
        return;
      }
      mtCopy(text);
    });

    el('b64-encode-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doEncode();
      }
    });
    el('b64-decode-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doDecode();
      }
    });

    el('b64-encode-input').value = 'Hello, MyTools! 👋';
    doEncode();
  });
})();
