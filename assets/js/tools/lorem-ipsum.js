(function () {
  'use strict';

  var WORD_BANK = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod ' +
    'tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam ' +
    'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo ' +
    'consequat duis aute irure dolor in reprehenderit in voluptate velit esse ' +
    'cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat ' +
    'non proident sunt in culpa qui officia deserunt mollit anim id est laborum').split(' ');

  var LIMITS = {
    paragraphs: { min: 1, max: 50, def: 3 },
    sentences: { min: 1, max: 200, def: 5 },
    words: { min: 1, max: 500, def: 50 }
  };

  var CLASSIC_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomWord() {
    return WORD_BANK[randInt(0, WORD_BANK.length - 1)];
  }

  function capitalize(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }

  function generateSentence() {
    var count = randInt(8, 18);
    var words = [];
    for (var i = 0; i < count; i++) words.push(randomWord());
    words[0] = capitalize(words[0]);
    return words.join(' ') + '.';
  }

  function generateParagraph(sentenceCount) {
    var n = sentenceCount || randInt(4, 8);
    var sentences = [];
    for (var i = 0; i < n; i++) sentences.push(generateSentence());
    return sentences.join(' ');
  }

  function generateWords(count) {
    var words = [];
    for (var i = 0; i < count; i++) words.push(randomWord());
    return words.join(' ');
  }

  function generateParagraphs(count) {
    var paragraphs = [];
    for (var p = 0; p < count; p++) {
      if (p === 0) {
        var extra = randInt(3, 7);
        var sentences = [CLASSIC_SENTENCE];
        for (var i = 0; i < extra; i++) sentences.push(generateSentence());
        paragraphs.push(sentences.join(' '));
      } else {
        paragraphs.push(generateParagraph());
      }
    }
    return paragraphs.join('\n\n');
  }

  function generateSentences(count) {
    var sentences = [CLASSIC_SENTENCE];
    for (var i = 1; i < count; i++) sentences.push(generateSentence());
    return sentences.join(' ');
  }

  function showError(msg) {
    var box = document.getElementById('li-error');
    if (msg) {
      box.textContent = msg;
      box.classList.add('visible');
    } else {
      box.textContent = '';
      box.classList.remove('visible');
    }
  }

  function applyLimits() {
    var mode = document.getElementById('li-mode').value;
    var limits = LIMITS[mode];
    var countInput = document.getElementById('li-count');
    countInput.min = limits.min;
    countInput.max = limits.max;
  }

  function generate() {
    var mode = document.getElementById('li-mode').value;
    var limits = LIMITS[mode];
    var countInput = document.getElementById('li-count');
    var count = parseInt(countInput.value, 10);

    if (isNaN(count) || count < limits.min || count > limits.max) {
      showError('Enter a count between ' + limits.min + ' and ' + limits.max + ' for ' + mode + '.');
      return;
    }
    showError('');

    var result;
    if (mode === 'paragraphs') {
      result = generateParagraphs(count);
    } else if (mode === 'sentences') {
      result = generateSentences(count);
    } else {
      result = generateWords(count);
    }

    document.getElementById('li-output').textContent = result;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var modeSelect = document.getElementById('li-mode');
    var countInput = document.getElementById('li-count');

    modeSelect.addEventListener('change', function () {
      applyLimits();
      countInput.value = LIMITS[modeSelect.value].def;
    });

    document.getElementById('li-generate').addEventListener('click', generate);

    document.getElementById('li-copy').addEventListener('click', function () {
      var text = document.getElementById('li-output').textContent;
      if (!text) {
        showError('Generate some text first.');
        return;
      }
      showError('');
      mtCopy(text);
    });

    applyLimits();
    generate();
  });
})();
