/* Shared site behaviour: theme toggle, mobile nav, global search, copy/toast helpers. */
(function () {
  'use strict';

  function initTheme() {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var root = document.documentElement;
      var current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('mt-theme', next); } catch (e) { /* storage unavailable */ }
    });
  }

  function initNavToggle() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (!header || !toggle) return;
    toggle.addEventListener('click', function () {
      var isOpen = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target)) header.classList.remove('nav-open');
    });
  }

  function scoreTool(tool, query) {
    var q = query.toLowerCase();
    var name = tool.name.toLowerCase();
    if (name === q) return 100;
    if (name.indexOf(q) === 0) return 90;
    if (name.indexOf(q) !== -1) return 70;
    if (tool.tags.some(function (t) { return t.indexOf(q) !== -1; })) return 50;
    if (tool.description.toLowerCase().indexOf(q) !== -1) return 30;
    if (mtCategoryName(tool.category).toLowerCase().indexOf(q) !== -1) return 20;
    return 0;
  }

  function searchTools(query) {
    if (!query || !query.trim()) return [];
    return (window.MT_TOOLS || [])
      .map(function (t) { return { tool: t, score: scoreTool(t, query.trim()) }; })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 8)
      .map(function (r) { return r.tool; });
  }
  window.mtSearchTools = searchTools;

  function initHeaderSearch() {
    var wrap = document.querySelector('.header-search');
    if (!wrap) return;
    var input = wrap.querySelector('input');
    var results = wrap.querySelector('.search-results');
    if (!input || !results) return;

    function render(query) {
      var matches = searchTools(query);
      if (!query.trim()) { results.classList.remove('open'); results.innerHTML = ''; return; }
      if (matches.length === 0) {
        results.innerHTML = '<div class="sr-empty">No tools found for &ldquo;' + escapeHtml(query) + '&rdquo;</div>';
      } else {
        results.innerHTML = matches.map(function (t) {
          return '<a href="' + t.url + '"><span class="sr-cat">' + mtCategoryName(t.category) + '</span>' +
            '<span class="sr-name">' + escapeHtml(t.name) + '</span>' +
            '<span class="sr-desc">' + escapeHtml(t.description) + '</span></a>';
        }).join('');
      }
      results.classList.add('open');
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('focus', function () { if (input.value.trim()) render(input.value); });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) results.classList.remove('open');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { results.classList.remove('open'); input.blur(); }
      if (e.key === 'Enter') {
        var first = results.querySelector('a');
        if (first) { window.location.href = first.getAttribute('href'); }
      }
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  window.mtEscapeHtml = escapeHtml;

  var toastTimer = null;
  function mtToast(message) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('visible'); }, 1800);
  }
  window.mtToast = mtToast;

  function mtCopy(text, message) {
    var done = function () { mtToast(message || 'Copied to clipboard'); };
    var fail = function () { mtToast('Copy failed — please copy manually'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(fail);
    } else {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) { fail(); }
    }
  }
  window.mtCopy = mtCopy;

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initNavToggle();
    initHeaderSearch();

    document.querySelectorAll('[data-copy-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = document.querySelector(btn.getAttribute('data-copy-target'));
        if (!target) return;
        var text = 'value' in target ? target.value : target.textContent;
        mtCopy(text);
      });
    });
  });
})();
