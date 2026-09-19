(function () {
  'use strict';

  var lastCanvas = null;

  function generate() {
    var errorBox = document.getElementById('qr-error');
    var wrap = document.getElementById('qr-canvas-wrap');
    errorBox.classList.remove('visible');
    wrap.style.display = 'none';

    var text = document.getElementById('qr-text').value.trim();
    if (!text) {
      errorBox.textContent = 'Enter some text or a URL to generate a QR code.';
      errorBox.classList.add('visible');
      return;
    }

    var size = parseInt(document.getElementById('qr-size').value, 10);
    var level = document.getElementById('qr-level').value;

    try {
      var qr = window.qrcode(0, level);
      qr.addData(text);
      qr.make();

      var moduleCount = qr.getModuleCount();
      var quietZone = 4;
      var totalModules = moduleCount + quietZone * 2;
      var scale = Math.max(1, Math.round(size / totalModules));
      var canvasSize = totalModules * scale;

      var canvas = document.getElementById('qr-canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = '#000000';
      for (var r = 0; r < moduleCount; r++) {
        for (var c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect((c + quietZone) * scale, (r + quietZone) * scale, scale, scale);
          }
        }
      }

      lastCanvas = canvas;
      wrap.style.display = 'flex';
    } catch (e) {
      errorBox.textContent = 'Could not generate a QR code for this input — it may be too long. Try shortening the text or lowering the error correction level.';
      errorBox.classList.add('visible');
    }
  }

  function download() {
    if (!lastCanvas) return;
    var link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = lastCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('qr-generate').addEventListener('click', generate);
    document.getElementById('qr-download').addEventListener('click', download);
    document.getElementById('qr-text').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
    });
    document.getElementById('qr-text').value = 'https://mytools.pages.dev/';
    generate();
  });
})();
