(function () {
  'use strict';

  var FIELDS = {
    'nbc-binary': { base: 2, regex: /^[01]*$/, prefix: '0b', label: 'Binary' },
    'nbc-decimal': { base: 10, regex: /^[0-9]*$/, prefix: '', label: 'Decimal' },
    'nbc-hex': { base: 16, regex: /^[0-9a-fA-F]*$/, prefix: '0x', label: 'Hexadecimal' },
    'nbc-octal': { base: 8, regex: /^[0-7]*$/, prefix: '0o', label: 'Octal' }
  };

  function showError(msg) {
    var errorBox = document.getElementById('nbc-error');
    errorBox.textContent = msg;
    errorBox.classList.add('visible');
  }

  function hideError() {
    var errorBox = document.getElementById('nbc-error');
    errorBox.textContent = '';
    errorBox.classList.remove('visible');
  }

  function clearOthers(exceptId) {
    Object.keys(FIELDS).forEach(function (id) {
      if (id !== exceptId) document.getElementById(id).value = '';
    });
  }

  function handleInput(id) {
    var field = FIELDS[id];
    var input = document.getElementById(id);
    var value = input.value.trim();

    if (!field.regex.test(value)) {
      showError(field.label + ' contains characters that are not valid for base ' + field.base + '.');
      return;
    }

    hideError();

    if (value === '') {
      clearOthers(id);
      return;
    }

    var big;
    try {
      big = field.prefix ? BigInt(field.prefix + value) : BigInt(value);
    } catch (e) {
      showError('Could not parse that ' + field.label.toLowerCase() + ' value.');
      return;
    }

    Object.keys(FIELDS).forEach(function (otherId) {
      if (otherId === id) return;
      var otherField = FIELDS[otherId];
      document.getElementById(otherId).value = big.toString(otherField.base);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    Object.keys(FIELDS).forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () { handleInput(id); });
    });

    document.getElementById('nbc-clear').addEventListener('click', function () {
      Object.keys(FIELDS).forEach(function (id) { document.getElementById(id).value = ''; });
      hideError();
    });

    document.getElementById('nbc-decimal').value = '42';
    handleInput('nbc-decimal');
  });
})();
