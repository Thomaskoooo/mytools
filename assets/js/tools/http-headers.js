(function () {
  'use strict';

  function setLoading(isLoading) {
    var btn = document.getElementById('hh-check-btn');
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Checking…' : 'Check';
  }

  function formatBytes(bytes) {
    var n = parseInt(bytes, 10);
    if (isNaN(n)) return null;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async function check() {
    var errorBox = document.getElementById('hh-error');
    var resultsWrap = document.getElementById('hh-results');
    errorBox.classList.remove('visible');
    resultsWrap.innerHTML = '';
    resultsWrap.style.display = 'none';

    var target = document.getElementById('hh-url').value.trim();
    if (!target) {
      errorBox.textContent = 'Enter a URL, e.g. https://example.com';
      errorBox.classList.add('visible');
      return;
    }

    setLoading(true);
    try {
      var resp = await fetch('/api/http-headers?url=' + encodeURIComponent(target));
      var data = await resp.json();

      if (!resp.ok) {
        errorBox.textContent = data.error || 'Something went wrong. Please try again.';
        errorBox.classList.add('visible');
        return;
      }

      var statusClass = data.status < 300 ? 'var(--success)' : data.status < 400 ? 'var(--warning)' : 'var(--danger)';
      var summaryRows = [
        ['Requested URL', data.requestedUrl],
        ['Final URL', data.finalUrl],
        ['HTTP Status', data.status + ' ' + data.statusText],
        ['Server', data.server || '—'],
        ['Content-Type', data.contentType || '—'],
        ['Content-Length', data.contentLength ? formatBytes(data.contentLength) + ' (' + data.contentLength + ' bytes)' : 'unknown']
      ];

      var redirectsHtml = '';
      if (data.redirects && data.redirects.length) {
        redirectsHtml = '<div class="card" style="margin-top:14px"><h3 style="margin:0 0 10px;font-size:0.95rem">Redirect chain (' + data.redirects.length + ')</h3>' +
          '<div class="result-list">' + data.redirects.map(function (r, i) {
            return '<div class="result-item" style="align-items:flex-start;flex-direction:column;gap:4px">' +
              '<span class="r-label">Hop ' + (i + 1) + ' — HTTP ' + r.status + '</span>' +
              '<span class="r-value" style="word-break:break-all;font-size:0.82rem">' + mtEscapeHtml(r.url) + ' → ' + mtEscapeHtml(r.location) + '</span></div>';
          }).join('') + '</div></div>';
      }

      var headersHtml = Object.keys(data.headers).sort().map(function (k) {
        return '<div class="result-item"><span class="r-label">' + mtEscapeHtml(k) + '</span>' +
          '<span style="display:flex;align-items:center;gap:6px"><span class="r-value" style="word-break:break-all;font-weight:400">' + mtEscapeHtml(data.headers[k]) + '</span>' +
          '<button class="copy-mini" type="button" data-copy="' + mtEscapeHtml(data.headers[k]) + '" aria-label="Copy">' + mtIcon('copy') + '</button></span></div>';
      }).join('');

      resultsWrap.innerHTML =
        '<div class="card"><h3 style="margin:0 0 10px;font-size:0.95rem"><span style="color:' + statusClass + '">●</span> Summary</h3>' +
        '<div class="result-list">' + summaryRows.map(function (r) {
          return '<div class="result-item"><span class="r-label">' + r[0] + '</span><span class="r-value" style="word-break:break-all">' + mtEscapeHtml(String(r[1])) + '</span></div>';
        }).join('') + '</div></div>' +
        redirectsHtml +
        '<div class="card" style="margin-top:14px"><h3 style="margin:0 0 10px;font-size:0.95rem">All response headers</h3><div class="result-list">' + headersHtml + '</div></div>';

      resultsWrap.style.display = 'block';
      resultsWrap.querySelectorAll('.copy-mini').forEach(function (btn) {
        btn.addEventListener('click', function () { mtCopy(btn.getAttribute('data-copy')); });
      });
    } catch (e) {
      errorBox.textContent = 'Something went wrong. Please try again.';
      errorBox.classList.add('visible');
    } finally {
      setLoading(false);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('hh-check-btn').addEventListener('click', check);
    document.getElementById('hh-url').addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    document.getElementById('hh-clear').addEventListener('click', function () {
      document.getElementById('hh-url').value = '';
      document.getElementById('hh-error').classList.remove('visible');
      document.getElementById('hh-results').style.display = 'none';
      document.getElementById('hh-url').focus();
    });
  });
})();
