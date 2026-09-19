(function () {
  'use strict';

  function setupTabs() {
    var tabs = [
      { btn: 'he-tab-encode', panel: 'he-panel-encode' },
      { btn: 'he-tab-decode', panel: 'he-panel-decode' }
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

  function encodeEntities(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function decodeEntities(str) {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  function encode() {
    var input = document.getElementById('he-encode-input').value;
    document.getElementById('he-encode-output').textContent = encodeEntities(input);
  }

  function decode() {
    var input = document.getElementById('he-decode-input').value;
    document.getElementById('he-decode-output').textContent = decodeEntities(input);
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupTabs();

    document.getElementById('he-encode-btn').addEventListener('click', encode);
    document.getElementById('he-decode-btn').addEventListener('click', decode);

    document.getElementById('he-encode-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) encode();
    });
    document.getElementById('he-decode-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) decode();
    });

    document.getElementById('he-encode-clear').addEventListener('click', function () {
      document.getElementById('he-encode-input').value = '';
      document.getElementById('he-encode-output').textContent = '';
    });
    document.getElementById('he-decode-clear').addEventListener('click', function () {
      document.getElementById('he-decode-input').value = '';
      document.getElementById('he-decode-output').textContent = '';
    });

    document.getElementById('he-encode-copy').addEventListener('click', function () {
      mtCopy(document.getElementById('he-encode-output').textContent);
    });
    document.getElementById('he-decode-copy').addEventListener('click', function () {
      mtCopy(document.getElementById('he-decode-output').textContent);
    });

    document.getElementById('he-encode-input').value = '<div class="box">Tom & Jerry\'s "great" day</div>';
    encode();
  });
})();
