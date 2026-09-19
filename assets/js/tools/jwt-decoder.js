(function () {
  'use strict';

  function base64UrlDecode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var binary = atob(s);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function formatUnixClaim(value) {
    if (typeof value !== 'number') return String(value);
    var d = new Date(value * 1000);
    if (isNaN(d.getTime())) return String(value);
    return d.toISOString() + ' (' + d.toLocaleString() + ')';
  }

  function highlightJson(obj) {
    return mtEscapeHtml(JSON.stringify(obj, null, 2))
      .replace(/(&quot;.*?&quot;)(:)/g, '<span style="color:var(--accent)">$1</span>$2')
      .replace(/: (&quot;.*?&quot;)/g, ': <span style="color:var(--success)">$1</span>')
      .replace(/: (\d+(\.\d+)?)/g, ': <span style="color:var(--warning)">$1</span>')
      .replace(/: (true|false|null)/g, ': <span style="color:var(--text-muted)">$1</span>');
  }

  function decode() {
    var errorBox = document.getElementById('jwt-error');
    var resultsWrap = document.getElementById('jwt-results');
    errorBox.classList.remove('visible');
    resultsWrap.style.display = 'none';

    var token = document.getElementById('jwt-input').value.trim();
    if (!token) {
      errorBox.textContent = 'Paste a JWT to decode.';
      errorBox.classList.add('visible');
      return;
    }

    var parts = token.split('.');
    if (parts.length !== 3) {
      errorBox.textContent = 'Invalid JWT: expected 3 dot-separated parts (header.payload.signature), found ' + parts.length + '.';
      errorBox.classList.add('visible');
      return;
    }

    var header, payload;
    try {
      header = JSON.parse(base64UrlDecode(parts[0]));
    } catch (e) {
      errorBox.textContent = 'Invalid JWT: could not decode or parse the header.';
      errorBox.classList.add('visible');
      return;
    }
    try {
      payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch (e) {
      errorBox.textContent = 'Invalid JWT: could not decode or parse the payload.';
      errorBox.classList.add('visible');
      return;
    }

    document.getElementById('jwt-header-json').innerHTML = highlightJson(header);
    document.getElementById('jwt-payload-json').innerHTML = highlightJson(payload);
    document.getElementById('jwt-signature').textContent = parts[2];

    var claimRows = [];
    claimRows.push(['Algorithm', header.alg || '—']);
    claimRows.push(['Type', header.typ || '—']);
    if (payload.iss !== undefined) claimRows.push(['Issuer (iss)', String(payload.iss)]);
    if (payload.sub !== undefined) claimRows.push(['Subject (sub)', String(payload.sub)]);
    if (payload.aud !== undefined) claimRows.push(['Audience (aud)', Array.isArray(payload.aud) ? payload.aud.join(', ') : String(payload.aud)]);
    if (payload.iat !== undefined) claimRows.push(['Issued At (iat)', formatUnixClaim(payload.iat)]);
    if (payload.nbf !== undefined) claimRows.push(['Not Before (nbf)', formatUnixClaim(payload.nbf)]);
    if (payload.exp !== undefined) {
      var isExpired = payload.exp * 1000 < Date.now();
      claimRows.push(['Expiration (exp)', formatUnixClaim(payload.exp) + (isExpired ? '  — EXPIRED' : '  — still valid')]);
    }

    document.getElementById('jwt-claims').innerHTML = claimRows.map(function (r) {
      return '<div class="result-item"><span class="r-label">' + r[0] + '</span><span class="r-value" style="word-break:break-all">' + mtEscapeHtml(r[1]) + '</span></div>';
    }).join('');

    resultsWrap.style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('jwt-decode').addEventListener('click', decode);
    document.getElementById('jwt-clear').addEventListener('click', function () {
      document.getElementById('jwt-input').value = '';
      document.getElementById('jwt-error').classList.remove('visible');
      document.getElementById('jwt-results').style.display = 'none';
      document.getElementById('jwt-input').focus();
    });
    document.getElementById('jwt-input').addEventListener('input', decode);

    document.querySelectorAll('[data-copy-el]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var el = document.getElementById(btn.getAttribute('data-copy-el'));
        mtCopy(el.textContent);
      });
    });
  });
})();
