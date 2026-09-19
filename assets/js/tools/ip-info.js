(function () {
  'use strict';

  function parseOctets(ip) {
    var parts = ip.trim().split('.');
    if (parts.length !== 4) return null;
    var out = [];
    for (var i = 0; i < 4; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return null;
      var n = parseInt(parts[i], 10);
      if (n < 0 || n > 255) return null;
      out.push(n);
    }
    return out;
  }
  function octetsToInt(o) { return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0; }

  function classify(o) {
    var first = o[0];
    if (first >= 1 && first <= 126) return { cls: 'A', mask: '255.0.0.0' };
    if (first === 127) return { cls: 'A (loopback range)', mask: '255.0.0.0' };
    if (first >= 128 && first <= 191) return { cls: 'B', mask: '255.255.0.0' };
    if (first >= 192 && first <= 223) return { cls: 'C', mask: '255.255.255.0' };
    if (first >= 224 && first <= 239) return { cls: 'D (multicast)', mask: 'n/a' };
    return { cls: 'E (reserved)', mask: 'n/a' };
  }

  function isPrivate(o) {
    if (o[0] === 10) return true;
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
    if (o[0] === 192 && o[1] === 168) return true;
    return false;
  }
  function isLoopback(o) { return o[0] === 127; }
  function isMulticast(o) { return o[0] >= 224 && o[0] <= 239; }
  function isLinkLocal(o) { return o[0] === 169 && o[1] === 254; }
  function isBroadcast(o) { return o.every(function (n) { return n === 255; }); }
  function isCurrentNetwork(o) { return o[0] === 0; }

  function lookup() {
    var errorBox = document.getElementById('ipinfo-error');
    var resultsBox = document.getElementById('ipinfo-results');
    errorBox.classList.remove('visible');
    resultsBox.style.display = 'none';

    var ip = document.getElementById('ipinfo-address').value.trim();
    var o = parseOctets(ip);
    if (!o) {
      errorBox.textContent = 'Enter a valid IPv4 address, e.g. 8.8.8.8';
      errorBox.classList.add('visible');
      return;
    }

    var intVal = octetsToInt(o);
    var binary = o.map(function (n) { return n.toString(2).padStart(8, '0'); }).join('.');
    var hex = '0x' + o.map(function (n) { return n.toString(16).padStart(2, '0'); }).join('');
    var cls = classify(o);

    var flags = [];
    if (isPrivate(o)) flags.push(['Private / Public', 'Private (RFC 1918)']); else flags.push(['Private / Public', 'Public']);
    flags.push(['Loopback', isLoopback(o) ? 'Yes' : 'No']);
    flags.push(['Multicast', isMulticast(o) ? 'Yes' : 'No']);
    flags.push(['Link-local', isLinkLocal(o) ? 'Yes' : 'No']);
    flags.push(['Broadcast (255.255.255.255)', isBroadcast(o) ? 'Yes' : 'No']);
    flags.push(['"This network" (0.x.x.x)', isCurrentNetwork(o) ? 'Yes' : 'No']);

    var rows = [
      ['IP Address', o.join('.')],
      ['Decimal (32-bit)', intVal.toString()],
      ['Binary', binary],
      ['Hexadecimal', hex],
      ['Class', cls.cls],
      ['Default Subnet Mask', cls.mask]
    ].concat(flags);

    resultsBox.innerHTML = rows.map(function (r) {
      return '<div class="result-item"><span class="r-label">' + r[0] + '</span>' +
        '<span style="display:flex;align-items:center;gap:6px"><span class="r-value">' + r[1] + '</span>' +
        '<button class="copy-mini" type="button" data-copy="' + r[1] + '" aria-label="Copy ' + r[0] + '">' + mtIcon('copy') + '</button></span></div>';
    }).join('');
    resultsBox.style.display = 'flex';
    resultsBox.style.flexDirection = 'column';
    resultsBox.querySelectorAll('.copy-mini').forEach(function (btn) {
      btn.addEventListener('click', function () { mtCopy(btn.getAttribute('data-copy')); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('ipinfo-lookup').addEventListener('click', lookup);
    document.getElementById('ipinfo-reset').addEventListener('click', function () {
      document.getElementById('ipinfo-address').value = '';
      document.getElementById('ipinfo-error').classList.remove('visible');
      document.getElementById('ipinfo-results').style.display = 'none';
    });
    document.getElementById('ipinfo-address').addEventListener('keydown', function (e) { if (e.key === 'Enter') lookup(); });
    document.getElementById('ipinfo-address').value = '8.8.8.8';
    lookup();
  });
})();
