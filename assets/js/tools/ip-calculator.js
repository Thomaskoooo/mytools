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
  function intToOctets(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function intToIp(n) { return intToOctets(n).join('.'); }
  function intToBinary(n) { return (n >>> 0).toString(2).padStart(32, '0').match(/.{8}/g).join('.'); }

  function cidrToMaskInt(cidr) {
    if (cidr === 0) return 0;
    return (0xFFFFFFFF << (32 - cidr)) >>> 0;
  }

  function maskIntToCidr(maskInt) {
    var bin = (maskInt >>> 0).toString(2).padStart(32, '0');
    if (!/^1*0*$/.test(bin)) return null; // must be contiguous ones then zeros
    return bin.split('').filter(function (b) { return b === '1'; }).length;
  }

  function parseMaskOrCidr(input) {
    var v = input.trim();
    if (v === '') return null;
    if (v[0] === '/') v = v.slice(1);
    if (/^\d{1,2}$/.test(v) && parseInt(v, 10) <= 32) {
      return cidrToMaskInt(parseInt(v, 10));
    }
    var octets = parseOctets(v);
    if (!octets) return null;
    var maskInt = octetsToInt(octets);
    return maskIntToCidr(maskInt) === null ? null : maskInt;
  }

  function calculate() {
    var errorBox = document.getElementById('ip-error');
    var resultsBox = document.getElementById('ip-results');
    errorBox.classList.remove('visible');
    errorBox.textContent = '';
    resultsBox.style.display = 'none';

    var ipInput = document.getElementById('ip-address').value.trim();
    var maskInput = document.getElementById('ip-mask').value.trim();

    var ipPart = ipInput;
    var cidrFromSlash = null;
    if (ipInput.indexOf('/') !== -1) {
      var pieces = ipInput.split('/');
      ipPart = pieces[0];
      cidrFromSlash = pieces[1];
    }

    var octets = parseOctets(ipPart);
    if (!octets) {
      errorBox.textContent = 'Enter a valid IPv4 address, e.g. 192.168.1.10';
      errorBox.classList.add('visible');
      return;
    }

    var maskInt;
    if (cidrFromSlash !== null) {
      if (!/^\d{1,2}$/.test(cidrFromSlash) || parseInt(cidrFromSlash, 10) > 32) {
        errorBox.textContent = 'CIDR must be a number between 0 and 32.';
        errorBox.classList.add('visible');
        return;
      }
      maskInt = cidrToMaskInt(parseInt(cidrFromSlash, 10));
    } else if (maskInput) {
      maskInt = parseMaskOrCidr(maskInput);
      if (maskInt === null) {
        errorBox.textContent = 'Enter a valid subnet mask (e.g. 255.255.255.0) or CIDR (e.g. 24 or /24).';
        errorBox.classList.add('visible');
        return;
      }
    } else {
      errorBox.textContent = 'Provide a subnet mask or CIDR (either as 192.168.1.10/24, or fill in the mask field).';
      errorBox.classList.add('visible');
      return;
    }

    var ipInt = octetsToInt(octets);
    var cidr = maskIntToCidr(maskInt);
    var wildcardInt = (~maskInt) >>> 0;
    var networkInt = (ipInt & maskInt) >>> 0;
    var broadcastInt = (networkInt | wildcardInt) >>> 0;
    var totalAddresses = Math.pow(2, 32 - cidr);
    var usableHosts, firstUsable, lastUsable;

    if (cidr >= 31) {
      usableHosts = cidr === 32 ? 1 : 2;
      firstUsable = intToIp(networkInt);
      lastUsable = intToIp(broadcastInt);
    } else {
      usableHosts = totalAddresses - 2;
      firstUsable = intToIp((networkInt + 1) >>> 0);
      lastUsable = intToIp((broadcastInt - 1) >>> 0);
    }

    var rows = [
      ['IP Address', intToIp(ipInt)],
      ['CIDR', '/' + cidr],
      ['Subnet Mask', intToIp(maskInt)],
      ['Wildcard Mask', intToIp(wildcardInt)],
      ['Network Address', intToIp(networkInt)],
      ['Broadcast Address', intToIp(broadcastInt)],
      ['First Usable Host', firstUsable],
      ['Last Usable Host', lastUsable],
      ['Usable Hosts', usableHosts.toLocaleString('en-US')],
      ['Total Addresses', totalAddresses.toLocaleString('en-US')],
      ['Binary Subnet Mask', intToBinary(maskInt)]
    ];

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
    document.getElementById('ip-calculate').addEventListener('click', calculate);
    document.getElementById('ip-reset').addEventListener('click', function () {
      document.getElementById('ip-address').value = '';
      document.getElementById('ip-mask').value = '';
      document.getElementById('ip-error').classList.remove('visible');
      document.getElementById('ip-results').style.display = 'none';
    });
    document.getElementById('ip-address').value = '192.168.1.10/24';
    ['ip-address', 'ip-mask'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') calculate();
      });
    });
    calculate();
  });
})();
