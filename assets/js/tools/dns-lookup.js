(function () {
  'use strict';

  var RECORD_LABELS = { A: 'A (IPv4)', AAAA: 'AAAA (IPv6)', MX: 'MX (Mail)', CNAME: 'CNAME (Alias)', NS: 'NS (Nameserver)', TXT: 'TXT' };

  function setLoading(isLoading) {
    var btn = document.getElementById('dns-lookup-btn');
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Looking up…' : 'Look up';
  }

  async function lookup() {
    var errorBox = document.getElementById('dns-error');
    var resultsWrap = document.getElementById('dns-results');
    errorBox.classList.remove('visible');
    resultsWrap.innerHTML = '';

    var domain = document.getElementById('dns-domain').value.trim();
    if (!domain) {
      errorBox.textContent = 'Enter a domain name, e.g. example.com';
      errorBox.classList.add('visible');
      return;
    }

    setLoading(true);
    try {
      var resp = await fetch('/api/dns?domain=' + encodeURIComponent(domain));
      var data = await resp.json();

      if (!resp.ok) {
        errorBox.textContent = data.error || 'Something went wrong. Please try again.';
        errorBox.classList.add('visible');
        return;
      }

      var order = ['A', 'AAAA', 'MX', 'CNAME', 'NS', 'TXT'];
      resultsWrap.innerHTML = order.map(function (type) {
        var values = data.records[type] || [];
        var body = values.length
          ? '<div class="result-list">' + values.map(function (v) {
              return '<div class="result-item"><span class="r-value" style="word-break:break-all">' + mtEscapeHtml(v) + '</span>' +
                '<button class="copy-mini" type="button" data-copy="' + mtEscapeHtml(v) + '" aria-label="Copy">' + mtIcon('copy') + '</button></div>';
            }).join('') + '</div>'
          : '<p class="field-hint" style="margin:0">No ' + type + ' records found.</p>';
        return '<div class="card" style="margin-bottom:14px"><h3 style="margin:0 0 10px;font-size:0.95rem">' + RECORD_LABELS[type] + '</h3>' + body + '</div>';
      }).join('');

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
    document.getElementById('dns-lookup-btn').addEventListener('click', lookup);
    document.getElementById('dns-domain').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookup(); });
    document.getElementById('dns-clear').addEventListener('click', function () {
      document.getElementById('dns-domain').value = '';
      document.getElementById('dns-error').classList.remove('visible');
      document.getElementById('dns-results').innerHTML = '';
      document.getElementById('dns-domain').focus();
    });
  });
})();
