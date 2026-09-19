(function () {
  'use strict';

  var MS_THRESHOLD = 99999999999; // abs values above this are treated as milliseconds

  function pad(n) { return String(n).padStart(2, '0'); }

  function formatRelative(date) {
    var diffMs = date.getTime() - Date.now();
    var diffSec = Math.round(diffMs / 1000);
    var absSec = Math.abs(diffSec);

    var units = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1]
    ];

    var unit = 'second';
    var value = diffSec;
    for (var i = 0; i < units.length; i++) {
      if (absSec >= units[i][1] || units[i][0] === 'second') {
        unit = units[i][0];
        value = Math.round(diffSec / units[i][1]);
        break;
      }
    }

    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      try {
        var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
        return rtf.format(value, unit);
      } catch (e) { /* fall through to manual formatting */ }
    }

    var plural = Math.abs(value) === 1 ? unit : unit + 's';
    if (value === 0) return 'just now';
    return value > 0 ? 'in ' + Math.abs(value) + ' ' + plural : Math.abs(value) + ' ' + plural + ' ago';
  }

  function buildRows(date) {
    var seconds = Math.floor(date.getTime() / 1000);
    var ms = date.getTime();
    return [
      ['Unix Seconds', String(seconds)],
      ['Unix Milliseconds', String(ms)],
      ['UTC', date.toISOString()],
      ['Local time', date.toLocaleString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })],
      ['Relative', formatRelative(date)]
    ];
  }

  function renderResults(containerId, rows) {
    var box = document.getElementById(containerId);
    box.innerHTML = rows.map(function (r) {
      return '<div class="result-item"><span class="r-label">' + r[0] + '</span>' +
        '<span style="display:flex;align-items:center;gap:6px"><span class="r-value">' + r[1] + '</span>' +
        '<button class="copy-mini" type="button" data-copy="' + r[1].replace(/"/g, '&quot;') + '" aria-label="Copy ' + r[0] + '">' + mtIcon('copy') + '</button></span></div>';
    }).join('');
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.querySelectorAll('.copy-mini').forEach(function (btn) {
      btn.addEventListener('click', function () { mtCopy(btn.getAttribute('data-copy')); });
    });
  }

  function showError(id, msg) {
    var box = document.getElementById(id);
    if (msg) {
      box.textContent = msg;
      box.classList.add('visible');
    } else {
      box.textContent = '';
      box.classList.remove('visible');
    }
  }

  function convertTimestamp() {
    var input = document.getElementById('ts-input').value.trim();
    var resultsBox = document.getElementById('ts-results');
    resultsBox.style.display = 'none';

    if (input === '') {
      showError('ts-error', 'Enter a Unix timestamp to convert.');
      return;
    }

    var num = Number(input);
    if (isNaN(num) || !isFinite(num)) {
      showError('ts-error', 'Enter a valid numeric Unix timestamp.');
      return;
    }

    var ms = Math.abs(num) > MS_THRESHOLD ? num : num * 1000;
    var date = new Date(ms);

    if (isNaN(date.getTime())) {
      showError('ts-error', 'That timestamp is out of range for a valid date.');
      return;
    }

    showError('ts-error', '');
    renderResults('ts-results', buildRows(date));
  }

  function convertDate() {
    var input = document.getElementById('dt-input').value;
    var resultsBox = document.getElementById('dt-results');
    resultsBox.style.display = 'none';

    if (!input) {
      showError('dt-error', 'Pick a date and time to convert.');
      return;
    }

    var date = new Date(input);
    if (isNaN(date.getTime())) {
      showError('dt-error', 'Enter a valid date and time.');
      return;
    }

    showError('dt-error', '');
    renderResults('dt-results', buildRows(date));
  }

  function updateCurrent() {
    var now = new Date();
    document.getElementById('ts-now').textContent =
      Math.floor(now.getTime() / 1000) + '  (' + now.toISOString() + ')';
  }

  function localDatetimeValue(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('ts-convert').addEventListener('click', convertTimestamp);
    document.getElementById('dt-convert').addEventListener('click', convertDate);

    document.getElementById('ts-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') convertTimestamp();
    });
    document.getElementById('dt-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') convertDate();
    });

    document.getElementById('ts-use-current').addEventListener('click', function () {
      var now = new Date();
      document.getElementById('ts-input').value = Math.floor(now.getTime() / 1000);
      convertTimestamp();
    });

    document.getElementById('dt-input').value = localDatetimeValue(new Date());

    updateCurrent();
    setInterval(updateCurrent, 1000);

    document.getElementById('ts-input').value = Math.floor(Date.now() / 1000);
    convertTimestamp();
  });
})();
