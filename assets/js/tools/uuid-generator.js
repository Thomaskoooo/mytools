(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  var lastGenerated = [];

  function generateOne() {
    if (window.crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    var hex = [];
    for (var i = 0; i < 16; i++) {
      hex.push(bytes[i].toString(16).padStart(2, '0'));
    }
    return (
      hex[0] + hex[1] + hex[2] + hex[3] + '-' +
      hex[4] + hex[5] + '-' +
      hex[6] + hex[7] + '-' +
      hex[8] + hex[9] + '-' +
      hex[10] + hex[11] + hex[12] + hex[13] + hex[14] + hex[15]
    );
  }

  function formatUuid(uuid, uppercase, hyphenated) {
    var out = hyphenated ? uuid : uuid.replace(/-/g, '');
    return uppercase ? out.toUpperCase() : out.toLowerCase();
  }

  function showError(message) {
    var box = el('uuid-error');
    box.textContent = message;
    box.classList.add('visible');
  }

  function clearError() {
    var box = el('uuid-error');
    box.textContent = '';
    box.classList.remove('visible');
  }

  function renderResults(list) {
    var resultsBox = el('uuid-results');
    resultsBox.innerHTML = list.map(function (uuid) {
      return '<div class="result-item"><span class="r-value">' + uuid + '</span>' +
        '<button class="copy-mini" type="button" data-copy="' + uuid + '" aria-label="Copy UUID">' + mtIcon('copy') + '</button></div>';
    }).join('');
    resultsBox.querySelectorAll('.copy-mini').forEach(function (btn) {
      btn.addEventListener('click', function () { mtCopy(btn.getAttribute('data-copy')); });
    });
  }

  function generate() {
    clearError();
    var countInput = el('uuid-count');
    var count = parseInt(countInput.value, 10);
    if (isNaN(count) || count < 1 || count > 100) {
      showError('Enter a count between 1 and 100.');
      return;
    }
    var uppercase = el('uuid-uppercase').checked;
    var hyphenated = el('uuid-hyphenated').checked;
    var list = [];
    for (var i = 0; i < count; i++) {
      list.push(formatUuid(generateOne(), uppercase, hyphenated));
    }
    lastGenerated = list;
    renderResults(list);
  }

  function copyAll() {
    if (!lastGenerated.length) {
      showError('Generate some UUIDs first.');
      return;
    }
    mtCopy(lastGenerated.join('\n'), 'All UUIDs copied to clipboard');
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('uuid-generate').addEventListener('click', generate);
    el('uuid-copy-all').addEventListener('click', copyAll);

    el('uuid-count').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') generate();
    });

    generate();
  });
})();
