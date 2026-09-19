(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function showError(message) {
    var errorBox = el('json-error');
    errorBox.textContent = message;
    errorBox.classList.add('visible');
    var successBox = el('json-success');
    successBox.style.display = 'none';
    successBox.textContent = '';
  }

  function clearError() {
    var errorBox = el('json-error');
    errorBox.textContent = '';
    errorBox.classList.remove('visible');
  }

  function showSuccess(message) {
    var successBox = el('json-success');
    successBox.textContent = message;
    successBox.style.display = 'block';
    clearError();
  }

  function hideSuccess() {
    var successBox = el('json-success');
    successBox.style.display = 'none';
    successBox.textContent = '';
  }

  function locateError(input, err) {
    var match = /position (\d+)/.exec(err.message);
    if (!match) return err.message;
    var pos = parseInt(match[1], 10);
    var before = input.slice(0, pos);
    var line = (before.match(/\n/g) || []).length + 1;
    var lastNewline = before.lastIndexOf('\n');
    var column = pos - lastNewline;
    return err.message + ' (near line ' + line + ', column ' + column + ')';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function syntaxHighlight(json) {
    var escaped = escapeHtml(json);
    var pattern = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g;
    return escaped.replace(pattern, function (match) {
      var color = 'var(--text)';
      if (/^"/.test(match)) {
        color = /:$/.test(match) ? 'var(--accent)' : 'var(--success)';
      } else if (/^(true|false)$/.test(match)) {
        color = 'var(--warning)';
      } else if (/^null$/.test(match)) {
        color = 'var(--text-muted)';
      } else {
        color = 'var(--warning)';
      }
      return '<span style="color:' + color + '">' + match + '</span>';
    });
  }

  function renderOutput(text) {
    el('json-output').innerHTML = syntaxHighlight(text);
  }

  function getInput() {
    return el('json-input').value;
  }

  function format() {
    hideSuccess();
    var input = getInput();
    if (!input.trim()) {
      showError('Enter some JSON to format.');
      return;
    }
    try {
      var obj = JSON.parse(input);
      var pretty = JSON.stringify(obj, null, 2);
      el('json-input').value = pretty;
      renderOutput(pretty);
      clearError();
    } catch (err) {
      showError('Invalid JSON: ' + locateError(input, err));
    }
  }

  function minify() {
    hideSuccess();
    var input = getInput();
    if (!input.trim()) {
      showError('Enter some JSON to minify.');
      return;
    }
    try {
      var obj = JSON.parse(input);
      var minified = JSON.stringify(obj);
      el('json-input').value = minified;
      renderOutput(minified);
      clearError();
    } catch (err) {
      showError('Invalid JSON: ' + locateError(input, err));
    }
  }

  function validate() {
    var input = getInput();
    if (!input.trim()) {
      showError('Enter some JSON to validate.');
      return;
    }
    try {
      var obj = JSON.parse(input);
      var type = Array.isArray(obj) ? 'array' : typeof obj;
      showSuccess('Valid JSON — parsed successfully as ' + type + '.');
    } catch (err) {
      showError('Invalid JSON: ' + locateError(input, err));
    }
  }

  function copyOutput() {
    var text = getInput();
    if (!text.trim()) {
      showError('Nothing to copy yet.');
      return;
    }
    mtCopy(text);
  }

  function downloadOutput() {
    var text = getInput();
    if (!text.trim()) {
      showError('Nothing to download yet.');
      return;
    }
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    el('json-input').value = '';
    el('json-output').innerHTML = '';
    clearError();
    hideSuccess();
    el('json-input').focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    el('json-format').addEventListener('click', format);
    el('json-minify').addEventListener('click', minify);
    el('json-validate').addEventListener('click', validate);
    el('json-copy').addEventListener('click', copyOutput);
    el('json-download').addEventListener('click', downloadOutput);
    el('json-clear').addEventListener('click', clearAll);

    el('json-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        format();
      }
    });

    var sample = '{\n  "name": "MyTools",\n  "active": true,\n  "count": 3,\n  "tags": ["json", "formatter"],\n  "meta": null\n}';
    el('json-input').value = sample;
    format();
  });
})();
