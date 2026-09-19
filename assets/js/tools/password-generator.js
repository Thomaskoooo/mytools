(function () {
  'use strict';

  var SETS = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?~'
  };

  function secureRandomInt(maxExclusive) {
    var range = Math.floor(0xFFFFFFFF / maxExclusive) * maxExclusive;
    var x;
    do { x = crypto.getRandomValues(new Uint32Array(1))[0]; } while (x >= range);
    return x % maxExclusive;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = secureRandomInt(i + 1);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function generatePassword(length, activeSets) {
    var combined = activeSets.map(function (k) { return SETS[k]; }).join('');
    var chars = [];
    activeSets.forEach(function (k) {
      chars.push(SETS[k][secureRandomInt(SETS[k].length)]);
    });
    while (chars.length < length) {
      chars.push(combined[secureRandomInt(combined.length)]);
    }
    return shuffle(chars).slice(0, length).join('');
  }

  function entropyBits(length, activeSets) {
    var poolSize = activeSets.reduce(function (sum, k) { return sum + SETS[k].length; }, 0);
    if (poolSize === 0) return 0;
    return Math.round(length * Math.log2(poolSize) * 10) / 10;
  }

  function strengthMeta(bits) {
    if (bits < 40) return { label: 'Weak', color: 'var(--danger)', pct: 25 };
    if (bits < 65) return { label: 'Fair', color: 'var(--warning)', pct: 50 };
    if (bits < 90) return { label: 'Good', color: '#22c55e', pct: 75 };
    return { label: 'Strong', color: 'var(--success)', pct: 100 };
  }

  function getActiveSets() {
    var sets = [];
    if (document.getElementById('pw-lower').checked) sets.push('lower');
    if (document.getElementById('pw-upper').checked) sets.push('upper');
    if (document.getElementById('pw-numbers').checked) sets.push('numbers');
    if (document.getElementById('pw-symbols').checked) sets.push('symbols');
    return sets;
  }

  function generate() {
    var errorBox = document.getElementById('pw-error');
    errorBox.classList.remove('visible');

    var length = parseInt(document.getElementById('pw-length').value, 10);
    if (isNaN(length) || length < 8 || length > 128) {
      errorBox.textContent = 'Length must be between 8 and 128.';
      errorBox.classList.add('visible');
      return;
    }

    var activeSets = getActiveSets();
    if (activeSets.length === 0) {
      errorBox.textContent = 'Select at least one character set.';
      errorBox.classList.add('visible');
      return;
    }

    var password = generatePassword(length, activeSets);
    document.getElementById('pw-output').value = password;

    var bits = entropyBits(length, activeSets);
    var meta = strengthMeta(bits);
    document.getElementById('pw-strength-label').textContent = meta.label + ' — ~' + bits + ' bits of entropy';
    var bar = document.getElementById('pw-strength-bar');
    bar.style.width = meta.pct + '%';
    bar.style.background = meta.color;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var lengthInput = document.getElementById('pw-length');
    var lengthValue = document.getElementById('pw-length-value');
    lengthInput.addEventListener('input', function () { lengthValue.textContent = lengthInput.value; generate(); });

    ['pw-lower', 'pw-upper', 'pw-numbers', 'pw-symbols'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', generate);
    });

    document.getElementById('pw-generate').addEventListener('click', generate);
    document.getElementById('pw-copy').addEventListener('click', function () {
      var val = document.getElementById('pw-output').value;
      if (val) mtCopy(val, 'Password copied to clipboard');
    });

    generate();
  });
})();
