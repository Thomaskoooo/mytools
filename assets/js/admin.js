(function () {
  'use strict';

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function relativeExpiry(iso) {
    if (!iso) return 'never';
    var ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'expired';
    var hours = Math.floor(ms / 3600000);
    var mins = Math.floor((ms % 3600000) / 60000);
    if (hours >= 24) return Math.floor(hours / 24) + 'd ' + (hours % 24) + 'h';
    return hours + 'h ' + mins + 'm';
  }

  function showLogin() {
    document.getElementById('admin-login-view').style.display = 'block';
    document.getElementById('admin-panel-view').style.display = 'none';
  }
  function showPanel() {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-panel-view').style.display = 'block';
  }

  function renderFiles(files) {
    var list = document.getElementById('admin-file-list');
    if (!files.length) {
      list.innerHTML = '<p class="field-hint">No files uploaded yet.</p>';
      return;
    }
    list.innerHTML = files.map(function (f) {
      return '<div class="result-item" style="align-items:flex-start;flex-direction:column;gap:8px">' +
        '<div style="display:flex;justify-content:space-between;width:100%;gap:10px;flex-wrap:wrap">' +
        '<strong>' + mtEscapeHtml(f.name) + '</strong>' +
        '<span class="field-hint">' + humanSize(f.size) + ' · expires in ' + relativeExpiry(f.expiresAt) + '</span></div>' +
        '<div style="display:flex;gap:8px;width:100%;align-items:center;flex-wrap:wrap">' +
        '<input type="text" readonly value="' + f.url + '" style="flex:1;min-width:180px;font-family:var(--font-mono);font-size:0.82rem">' +
        '<button class="btn btn-sm" type="button" data-copy="' + f.url + '">Copy</button>' +
        '<button class="btn btn-sm" type="button" data-delete="' + f.id + '" style="color:var(--danger);border-color:var(--danger)">Delete</button>' +
        '</div></div>';
    }).join('');

    list.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () { mtCopy(btn.getAttribute('data-copy'), 'Link copied'); });
    });
    list.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!window.confirm('Delete this file? This cannot be undone.')) return;
        await fetch('/api/admin-delete', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' },
          body: JSON.stringify({ id: btn.getAttribute('data-delete') })
        });
        checkSession();
      });
    });
  }

  async function checkSession() {
    var resp = await fetch('/api/admin-files', { headers: { 'X-Admin-Request': '1' }, credentials: 'same-origin' });

    if (resp.status === 401) { showLogin(); return; }

    if (!resp.ok) {
      // Not a plain "you're not logged in" — surface the real error (e.g. R2
      // not bound yet) instead of silently bouncing back to a blank login form.
      var errData = await resp.json().catch(function () { return {}; });
      showLogin();
      var errorBox = document.getElementById('admin-login-error');
      errorBox.textContent = errData.error || ('Server error (HTTP ' + resp.status + ').');
      errorBox.classList.add('visible');
      return;
    }

    var data = await resp.json();
    showPanel();
    renderFiles(data.files || []);
  }

  document.addEventListener('DOMContentLoaded', function () {
    checkSession();

    document.getElementById('admin-login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var errorBox = document.getElementById('admin-login-error');
      errorBox.classList.remove('visible');
      var password = document.getElementById('admin-password').value;
      var resp = await fetch('/api/admin-login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Request': '1' },
        body: JSON.stringify({ password: password })
      });
      if (!resp.ok) {
        var data = await resp.json().catch(function () { return {}; });
        errorBox.textContent = data.error || 'Login failed.';
        errorBox.classList.add('visible');
        return;
      }
      document.getElementById('admin-password').value = '';
      checkSession();
    });

    document.getElementById('admin-logout').addEventListener('click', async function () {
      await fetch('/api/admin-logout', { method: 'POST', credentials: 'same-origin', headers: { 'X-Admin-Request': '1' } });
      showLogin();
    });

    document.getElementById('admin-upload-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var fileInput = document.getElementById('admin-file-input');
      var errorBox = document.getElementById('admin-upload-error');
      var statusEl = document.getElementById('admin-upload-status');
      errorBox.classList.remove('visible');
      statusEl.textContent = '';

      var file = fileInput.files[0];
      if (!file) { errorBox.textContent = 'Choose a file first.'; errorBox.classList.add('visible'); return; }
      if (file.size > 100 * 1024 * 1024) {
        errorBox.textContent = 'File is too large — maximum is 100 MB.';
        errorBox.classList.add('visible');
        return;
      }

      statusEl.textContent = 'Uploading…';
      try {
        var resp = await fetch('/api/admin-upload', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-Admin-Request': '1',
            'X-File-Name': encodeURIComponent(file.name),
            'Content-Type': file.type || 'application/octet-stream'
          },
          body: file
        });
        var data = await resp.json();
        if (!resp.ok) {
          errorBox.textContent = data.error || 'Upload failed.';
          errorBox.classList.add('visible');
          statusEl.textContent = '';
          return;
        }
        statusEl.textContent = 'Uploaded — link copied to clipboard.';
        mtCopy(data.url, 'Link copied to clipboard');
        fileInput.value = '';
        checkSession();
      } catch (err) {
        errorBox.textContent = 'Something went wrong. Please try again.';
        errorBox.classList.add('visible');
        statusEl.textContent = '';
      }
    });
  });
})();
