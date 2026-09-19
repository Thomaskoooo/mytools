(function () {
  'use strict';

  function toUpper(text) { return text.toUpperCase(); }
  function toLower(text) { return text.toLowerCase(); }

  function toTitleCase(text) {
    return text.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function toSentenceCase(text) {
    return text.toLowerCase().replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, function (m) {
      return m.toUpperCase();
    });
  }

  // Split arbitrary input into normalized lowercase words, handling
  // camelCase boundaries, digit boundaries and non-alphanumeric separators.
  function toWords(text) {
    var s = text;
    s = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    s = s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    s = s.replace(/([a-zA-Z])([0-9])/g, '$1 $2');
    s = s.replace(/([0-9])([a-zA-Z])/g, '$1 $2');
    s = s.replace(/[^a-zA-Z0-9]+/g, ' ');
    return s.trim().split(/\s+/).filter(function (w) { return w.length > 0; }).map(function (w) {
      return w.toLowerCase();
    });
  }

  function capitalize(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  function toCamelCase(text) {
    var words = toWords(text);
    return words.map(function (w, i) { return i === 0 ? w : capitalize(w); }).join('');
  }

  function toPascalCase(text) {
    var words = toWords(text);
    return words.map(capitalize).join('');
  }

  function toSnakeCase(text) {
    return toWords(text).join('_');
  }

  function toKebabCase(text) {
    return toWords(text).join('-');
  }

  var converters = {
    upper: toUpper,
    lower: toLower,
    title: toTitleCase,
    sentence: toSentenceCase,
    camel: toCamelCase,
    pascal: toPascalCase,
    snake: toSnakeCase,
    kebab: toKebabCase
  };

  function showError(msg) {
    var box = document.getElementById('cc-error');
    if (msg) {
      box.textContent = msg;
      box.classList.add('visible');
    } else {
      box.textContent = '';
      box.classList.remove('visible');
    }
  }

  function convert(caseKey) {
    var input = document.getElementById('cc-input');
    var output = document.getElementById('cc-output');
    var text = input.value;

    if (!text) {
      showError('Enter some text to convert first.');
      return;
    }
    showError('');

    var fn = converters[caseKey];
    if (!fn) return;

    var result = fn(text);
    input.value = result;
    output.textContent = result;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('cc-input');
    var output = document.getElementById('cc-output');

    document.getElementById('cc-buttons').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-case]');
      if (!btn) return;
      convert(btn.getAttribute('data-case'));
    });

    document.getElementById('cc-copy').addEventListener('click', function () {
      var text = input.value;
      if (!text) {
        showError('Nothing to copy yet.');
        return;
      }
      showError('');
      mtCopy(text);
    });

    document.getElementById('cc-clear').addEventListener('click', function () {
      input.value = '';
      output.textContent = '';
      showError('');
      input.focus();
    });
  });
})();
