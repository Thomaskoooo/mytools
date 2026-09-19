(function () {
  'use strict';

  function setupTabs() {
    var tabs = [
      { btn: 'url-tab-encode', panel: 'url-panel-encode' },
      { btn: 'url-tab-decode', panel: 'url-panel-decode' }
    ];
    tabs.forEach(function (t) {
      document.getElementById(t.btn).addEventListener('click', function () {
        tabs.forEach(function (o) {
          var isActive = o.btn === t.btn;
          document.getElementById(o.btn).classList.toggle('active', isActive);
          document.getElementById(o.btn).setAttribute('aria-selected', isActive ? 'true' : 'false');
          document.getElementById(o.panel).classList.toggle('active', isActive);
        });
      });
    });
  }

  function showError(id, msg) {
    var box = document.getElementById(id);
    box.textContent = msg;
    box.classList.add('visible');
  }

  function hideError(id) {
    var box = document.getElementById(id);
    box.textContent = '';
    box.classList.remove('visible');
  }

  function encode() {
    hideError('url-encode-error');
    var input = document.getElementById('url-encode-input').value;
    var output = document.getElementById('url-encode-output');
    try {
      output.textContent = encodeURIComponent(input);
    } catch (e) {
      output.textContent = '';
      showError('url-encode-error', 'Could not encode this input.');
    }
  }

  function decode() {
    hideError('url-decode-error');
    var input = document.getElementById('url-decode-input').value;
    var output = document.getElementById('url-decode-output');
    try {
      output.textContent = decodeURIComponent(input);
    } catch (e) {
      output.textContent = '';
      showError('url-decode-error', 'Invalid percent-encoding — could not decode this input.');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTabs();

    document.getElementById('url-encode-btn').addEventListener('click', encode);
    document.getElementById('url-decode-btn').addEventListener('click', decode);

    document.getElementById('url-encode-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) encode();
    });
    document.getElementById('url-decode-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) decode();
    });

    document.getElementById('url-encode-clear').addEventListener('click', function () {
      document.getElementById('url-encode-input').value = '';
      document.getElementById('url-encode-output').textContent = '';
      hideError('url-encode-error');
    });
    document.getElementById('url-decode-clear').addEventListener('click', function () {
      document.getElementById('url-decode-input').value = '';
      document.getElementById('url-decode-output').textContent = '';
      hideError('url-decode-error');
    });

    document.getElementById('url-encode-copy').addEventListener('click', function () {
      mtCopy(document.getElementById('url-encode-output').textContent);
    });
    document.getElementById('url-decode-copy').addEventListener('click', function () {
      mtCopy(document.getElementById('url-decode-output').textContent);
    });

    document.getElementById('url-encode-input').value = 'https://example.com/search?q=hello world';
    encode();
  });
})();
