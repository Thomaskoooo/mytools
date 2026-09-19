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
  function intToIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  function cidrToMaskInt(cidr) { return cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0; }
  function nextPowerOfTwo(n) { return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2)))); }

  var rowCount = 0;
  function addRow(name, hosts) {
    rowCount++;
    var wrap = document.getElementById('vlsm-requirements');
    var row = document.createElement('div');
    row.className = 'field-row vlsm-row';
    row.style.alignItems = 'flex-end';
    row.innerHTML =
      '<div class="field" style="flex:2"><label>Name</label><input type="text" class="vlsm-name" value="' + (name || '') + '" placeholder="e.g. Students"></div>' +
      '<div class="field" style="flex:1"><label>Hosts needed</label><input type="number" class="vlsm-hosts" min="1" value="' + (hosts || '') + '" placeholder="60"></div>' +
      '<div class="field" style="flex:0 0 auto"><button type="button" class="btn btn-sm vlsm-remove" aria-label="Remove requirement">' + mtIcon('x') + '</button></div>';
    wrap.appendChild(row);
    row.querySelector('.vlsm-remove').addEventListener('click', function () { row.remove(); });
  }

  function calculate() {
    var errorBox = document.getElementById('vlsm-error');
    var resultsWrap = document.getElementById('vlsm-results-wrap');
    errorBox.classList.remove('visible');
    errorBox.textContent = '';
    resultsWrap.style.display = 'none';

    var networkInput = document.getElementById('vlsm-network').value.trim();
    if (networkInput.indexOf('/') === -1) {
      errorBox.textContent = 'Enter the network in CIDR form, e.g. 192.168.1.0/24';
      errorBox.classList.add('visible');
      return;
    }
    var parts = networkInput.split('/');
    var octets = parseOctets(parts[0]);
    var cidr = parseInt(parts[1], 10);
    if (!octets || !/^\d{1,2}$/.test(parts[1]) || cidr < 0 || cidr > 32) {
      errorBox.textContent = 'Enter a valid network address and CIDR, e.g. 192.168.1.0/24';
      errorBox.classList.add('visible');
      return;
    }

    var baseInt = octetsToInt(octets) & cidrToMaskInt(cidr);
    var totalSize = Math.pow(2, 32 - cidr);

    var rows = Array.from(document.querySelectorAll('.vlsm-row'));
    if (rows.length === 0) {
      errorBox.textContent = 'Add at least one host requirement.';
      errorBox.classList.add('visible');
      return;
    }

    var requirements = [];
    for (var i = 0; i < rows.length; i++) {
      var name = rows[i].querySelector('.vlsm-name').value.trim();
      var hostsStr = rows[i].querySelector('.vlsm-hosts').value.trim();
      if (!name) { errorBox.textContent = 'Every requirement needs a name.'; errorBox.classList.add('visible'); return; }
      if (!/^\d+$/.test(hostsStr) || parseInt(hostsStr, 10) < 1) {
        errorBox.textContent = 'Requirement "' + name + '" needs a valid host count of at least 1.';
        errorBox.classList.add('visible');
        return;
      }
      requirements.push({ name: name, hosts: parseInt(hostsStr, 10) });
    }

    requirements.sort(function (a, b) { return b.hosts - a.hosts; });

    var current = baseInt;
    var allocations = [];
    for (var j = 0; j < requirements.length; j++) {
      var req = requirements[j];
      var blockSize = nextPowerOfTwo(req.hosts + 2);
      var subnetCidr = 32 - Math.log2(blockSize);
      if (current + blockSize > baseInt + totalSize) {
        errorBox.textContent = 'The network ' + networkInput + ' is too small to fit all requirements (ran out of space allocating "' + req.name + '").';
        errorBox.classList.add('visible');
        return;
      }
      var networkAddr = current;
      var broadcastAddr = current + blockSize - 1;
      allocations.push({
        name: req.name,
        hosts: req.hosts,
        network: intToIp(networkAddr),
        cidr: subnetCidr,
        mask: intToIp(cidrToMaskInt(subnetCidr)),
        first: intToIp(networkAddr + 1),
        last: intToIp(broadcastAddr - 1),
        broadcast: intToIp(broadcastAddr),
        usable: blockSize - 2
      });
      current += blockSize;
    }

    var tbody = document.querySelector('#vlsm-table tbody');
    tbody.innerHTML = allocations.map(function (a) {
      return '<tr><td style="font-family:var(--font-sans)">' + mtEscapeHtml(a.name) + '</td>' +
        '<td>' + a.hosts + '</td><td>' + a.network + '</td><td>/' + a.cidr + '</td>' +
        '<td>' + a.mask + '</td><td>' + a.first + '</td><td>' + a.last + '</td>' +
        '<td>' + a.broadcast + '</td><td>' + a.usable + '</td></tr>';
    }).join('');
    resultsWrap.style.display = 'block';
  }

  document.addEventListener('DOMContentLoaded', function () {
    addRow('Students', 60);
    addRow('Servers', 25);
    addRow('Management', 10);
    addRow('Cameras', 10);
    document.getElementById('vlsm-add-row').addEventListener('click', function () { addRow('', ''); });
    document.getElementById('vlsm-calculate').addEventListener('click', calculate);
    document.getElementById('vlsm-reset').addEventListener('click', function () {
      document.getElementById('vlsm-requirements').innerHTML = '';
      document.getElementById('vlsm-network').value = '192.168.1.0/24';
      document.getElementById('vlsm-error').classList.remove('visible');
      document.getElementById('vlsm-results-wrap').style.display = 'none';
      addRow('Students', 60);
      addRow('Servers', 25);
      addRow('Management', 10);
      addRow('Cameras', 10);
    });
    calculate();
  });
})();
