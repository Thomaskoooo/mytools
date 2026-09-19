(function () {
  'use strict';

  function showError(msg) {
    var box = document.getElementById('rgx-error');
    box.textContent = msg;
    box.classList.add('visible');
    document.getElementById('rgx-highlighted').innerHTML = '';
    document.getElementById('rgx-match-count').textContent = '0';
    document.getElementById('rgx-match-list').innerHTML = '';
  }

  function hideError() {
    var box = document.getElementById('rgx-error');
    box.textContent = '';
    box.classList.remove('visible');
  }

  function currentFlags() {
    var flags = '';
    if (document.getElementById('rgx-flag-g').checked) flags += 'g';
    if (document.getElementById('rgx-flag-i').checked) flags += 'i';
    if (document.getElementById('rgx-flag-m').checked) flags += 'm';
    return flags;
  }

  function getMatches(regex, text, isGlobal) {
    var matches = [];
    if (isGlobal) {
      var iter = text.matchAll(regex);
      for (var m of iter) matches.push(m);
    } else {
      var single = regex.exec(text);
      if (single) matches.push(single);
    }
    return matches;
  }

  function renderHighlighted(text, matches) {
    var container = document.getElementById('rgx-highlighted');
    if (matches.length === 0) {
      container.textContent = text;
      return;
    }
    var html = '';
    var lastEnd = 0;
    matches.forEach(function (m) {
      var start = m.index;
      var end = start + m[0].length;
      if (start > lastEnd) {
        html += mtEscapeHtml(text.slice(lastEnd, start));
      }
      html += '<mark>' + mtEscapeHtml(text.slice(start, end)) + '</mark>';
      lastEnd = Math.max(lastEnd, end);
    });
    if (lastEnd < text.length) {
      html += mtEscapeHtml(text.slice(lastEnd));
    }
    container.innerHTML = html;
  }

  function renderMatchList(matches) {
    var list = document.getElementById('rgx-match-list');
    if (matches.length === 0) {
      list.innerHTML = '<div class="result-item"><span class="r-value">No matches</span></div>';
      return;
    }
    list.innerHTML = matches.map(function (m, i) {
      var details = [];
      for (var g = 1; g < m.length; g++) {
        details.push('Group ' + g + ': ' + (m[g] === undefined ? '<em>undefined</em>' : mtEscapeHtml(m[g])));
      }
      if (m.groups) {
        Object.keys(m.groups).forEach(function (name) {
          var val = m.groups[name];
          details.push(mtEscapeHtml(name) + ': ' + (val === undefined ? '<em>undefined</em>' : mtEscapeHtml(val)));
        });
      }
      var detailsHtml = details.length
        ? '<div style="font-size:0.82rem; color:var(--text-muted); margin-top:4px">' + details.join('<br>') + '</div>'
        : '';
      return '<div class="result-item" style="flex-direction:column; align-items:flex-start; gap:4px">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:10px">' +
          '<span class="r-label">Match ' + (i + 1) + ' (index ' + m.index + ')</span>' +
          '<button class="copy-mini" type="button" data-copy-index="' + i + '" aria-label="Copy match ' + (i + 1) + '">' + mtIcon('copy') + '</button>' +
        '</div>' +
        '<span class="r-value">' + mtEscapeHtml(m[0]) + '</span>' +
        detailsHtml +
      '</div>';
    }).join('');

    list.querySelectorAll('[data-copy-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-copy-index'), 10);
        mtCopy(matches[idx][0]);
      });
    });
  }

  function run() {
    hideError();
    var pattern = document.getElementById('rgx-pattern').value;
    var text = document.getElementById('rgx-test-string').value;

    if (pattern === '') {
      document.getElementById('rgx-highlighted').textContent = text;
      document.getElementById('rgx-match-count').textContent = '0';
      document.getElementById('rgx-match-list').innerHTML = '<div class="result-item"><span class="r-value">No matches</span></div>';
      return;
    }

    var flags = currentFlags();
    var isGlobal = flags.indexOf('g') !== -1;
    var regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch (e) {
      var msg = e.message || 'unknown error';
      showError(/invalid regular expression/i.test(msg) ? msg : 'Invalid regular expression: ' + msg);
      return;
    }

    var matches;
    try {
      matches = getMatches(regex, text, isGlobal);
    } catch (e) {
      showError('Error while matching: ' + e.message);
      return;
    }

    renderHighlighted(text, matches);
    document.getElementById('rgx-match-count').textContent = String(matches.length);
    renderMatchList(matches);
  }

  document.addEventListener('DOMContentLoaded', function () {
    ['rgx-pattern', 'rgx-test-string'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', run);
    });
    ['rgx-flag-g', 'rgx-flag-i', 'rgx-flag-m'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', run);
    });

    document.getElementById('rgx-pattern').value = '\\b[A-Z][a-z]+\\b';
    document.getElementById('rgx-test-string').value = 'Hello World, this is a Regex Test with Some Capitalized Words.';
    run();
  });
})();
