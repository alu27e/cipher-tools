/* beaufort.js */

function beaufortDecrypt(cipher, key) {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  let plain = '', ki = 0;
  for (const ch of cipher) {
    if (alpha.includes(ch)) {
      const c = alpha.indexOf(ch);
      const k = alpha.indexOf(key[ki % key.length]);
      plain += alpha[(k - c + 26) % 26];
      ki++;
    }
  }
  return plain;
}

async function runBeaufort() {
  const input = document.getElementById('beaufort-input').value.toLowerCase().replace(/[^a-z]/g, '');
  if (!input) { showToast('Enter ciphertext'); return; }

  showProgress('beaufort-progress', 0, 'Loading dictionary…');
  const dict  = await loadDictionary();
  const words = Array.from(dict).filter(w => w.length >= 2 && w.length <= input.length);
  const results = [];

  for (let i = 0; i < words.length; i++) {
    const key   = words[i];
    const plain = beaufortDecrypt(input, key);
    if (dict.has(plain)) results.push({ key, plain });
    if (i % 1500 === 0) { showProgress('beaufort-progress', Math.round((i / words.length) * 100)); await yield_(); }
  }

  hideProgress('beaufort-progress');

  let html = `<b style="color:var(--text-bright)">Found ${results.length} solution(s)</b><br><br>`;
  if (!results.length) {
    html += '<span class="result-no-match">No valid words found.</span>';
  } else {
    results.slice(0, 60).forEach(r => {
      html += `<div class="result-item"><span class="key-label">Key: </span><span class="key-val">${escapeHTML(r.key)}</span> &rarr; <span class="plain-val">${escapeHTML(r.plain)}</span></div>`;
    });
  }
  showOutput('beaufort-out', 'beaufort-out-content', html);
}
