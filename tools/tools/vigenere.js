/* vigenere.js */

function toggleVigOptions() {
  document.getElementById('vig-brute-options').style.display =
    document.getElementById('vig-mode').value === 'brute' ? '' : 'none';
}

function vigenereDecrypt(ciphertext, key) {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  let plain = '', ki = 0;
  for (const ch of ciphertext) {
    if (alpha.includes(ch)) {
      const c = alpha.indexOf(ch);
      const k = alpha.indexOf(key[ki % key.length]);
      plain += alpha[(c - k + 26) % 26];
      ki++;
    }
  }
  return plain;
}

async function runVigenere() {
  const input = document.getElementById('vig-input').value.toLowerCase().replace(/[^a-z]/g, '');
  const mode  = document.getElementById('vig-mode').value;
  if (!input) { showToast('Enter ciphertext'); return; }

  //IoC chart first
  const maxP  = Math.min(20, Math.floor(input.length / 2));
  const iocData = [];
  for (let p = 1; p <= maxP; p++) iocData.push({ period: p, ioc: computeIoC(input, p) });
  const sorted     = [...iocData].sort((a, b) => b.ioc - a.ioc);
  const topPeriods = sorted.slice(0, 3).map(d => d.period);
  showPanel('vig-ioc-panel');
  drawIoCChart('vig-ioc-canvas', iocData, topPeriods);

  //Crack
  showProgress('vig-progress', 0, 'Loading dictionary…');
  const dict    = await loadDictionary();
  const results = [];

  if (mode === 'dictionary') {
    const words = Array.from(dict).filter(w => w.length >= 2 && w.length <= Math.min(input.length, 12));
    for (let i = 0; i < words.length; i++) {
      const key   = words[i];
      const plain = vigenereDecrypt(input, key);
      if (dict.has(plain)) results.push({ key, plain });
      if (i % 1500 === 0) { showProgress('vig-progress', Math.round((i / words.length) * 100)); await yield_(); }
    }
  } else {
    const maxLen = parseInt(document.getElementById('vig-max-length').value);
    const alpha  = 'abcdefghijklmnopqrstuvwxyz';
    function* genKeys(len, prefix = '') {
      if (prefix.length === len) { yield prefix; return; }
      for (const c of alpha) yield* genKeys(len, prefix + c);
    }
    for (let len = 2; len <= maxLen; len++) {
      let count = 0, total = Math.pow(26, len);
      for (const key of genKeys(len)) {
        const plain = vigenereDecrypt(input, key);
        if (dict.has(plain)) results.push({ key, plain });
        count++;
        if (count % 15000 === 0) { showProgress('vig-progress', Math.round((count / total) * 100), `Length ${len}…`); await yield_(); }
      }
    }
  }

  hideProgress('vig-progress');

  let html = `<b style="color:var(--text-bright)">Found ${results.length} solution(s)</b>`;
  html += `&nbsp;<small style="color:var(--text-dim)">— Likely key lengths: ${topPeriods.join(', ')}</small><br><br>`;
  if (!results.length) {
    html += '<span class="result-no-match">No valid words found. Try brute force or longer ciphertext.</span>';
  } else {
    results.slice(0, 60).forEach(r => {
      html += `<div class="result-item"><span class="key-label">Key: </span><span class="key-val">${escapeHTML(r.key)}</span> &rarr; <span class="plain-val">${escapeHTML(r.plain)}</span></div>`;
    });
    if (results.length > 60) html += `<div style="color:var(--text-dim);padding:8px 0">…and ${results.length - 60} more results</div>`;
  }
  showOutput('vig-out', 'vig-out-content', html);
}

function clearVig() {
  clearOutput('vig-out');
  hidePanel('vig-ioc-panel');
  hideProgress('vig-progress');
}
