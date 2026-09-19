(function () {
  'use strict';

  function countStats(text) {
    if (!text) {
      return { chars: 0, charsNoSpace: 0, words: 0, lines: 0, sentences: 0, paragraphs: 0 };
    }

    var chars = text.length;
    var charsNoSpace = text.replace(/\s/g, '').length;
    var words = text.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
    var lines = text.split('\n').length;
    var sentenceMatches = text.match(/[.!?]+(?=\s|$)/g);
    var sentences = sentenceMatches ? sentenceMatches.length : 0;
    var paragraphs = text.split(/\n\s*\n/).filter(function (p) { return p.trim().length > 0; }).length;

    return {
      chars: chars,
      charsNoSpace: charsNoSpace,
      words: words,
      lines: lines,
      sentences: sentences,
      paragraphs: paragraphs
    };
  }

  function update() {
    var text = document.getElementById('tc-input').value;
    var stats = countStats(text);
    document.getElementById('tc-chars').textContent = stats.chars.toLocaleString('en-US');
    document.getElementById('tc-chars-nospace').textContent = stats.charsNoSpace.toLocaleString('en-US');
    document.getElementById('tc-words').textContent = stats.words.toLocaleString('en-US');
    document.getElementById('tc-lines').textContent = stats.lines.toLocaleString('en-US');
    document.getElementById('tc-sentences').textContent = stats.sentences.toLocaleString('en-US');
    document.getElementById('tc-paragraphs').textContent = stats.paragraphs.toLocaleString('en-US');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('tc-input');
    input.addEventListener('input', update);

    document.getElementById('tc-clear').addEventListener('click', function () {
      input.value = '';
      update();
      input.focus();
    });

    update();
  });
})();
