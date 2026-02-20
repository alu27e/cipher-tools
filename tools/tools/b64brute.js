/* b64brute.js */

function b64Permutations(str) {
  const results = [];
  const arr = str.split('');
  const len = Math.pow(arr.length, 2);
  for (let i = 0; i < len; i++) {
    for (let k = 0, j = i; k < arr.length; k++, j >>= 1) {
      arr[k] = (j & 1) ? arr[k].toUpperCase() : arr[k].toLowerCase();
    }
    results.push(arr.join(''));
  }
  return results;
}

function isValidB64(b64) {
  try {
    const decoded = atob(b64);
    for (let i = 0; i < decoded.length; i++) {
      if (decoded.charCodeAt(i) < 32 || decoded.charCodeAt(i) > 126) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function updateB64Output() {
  const boxes = document.querySelectorAll('#b64-select-boxes select');
  let result = '';
  boxes.forEach(sel => { result += sel.value || '###'; });
  document.getElementById('b64-output-text').value = result;
}

function runB64Brute() {
  const raw = document.getElementById('b64brute-input').value.trim();
  if (!raw) { showToast('Enter a Base64 string'); return; }

  //Pad to nearest multiple of 4
  const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, '=');

  //Build chunk possibilities
  const possibleB64 = [];
  for (let i = 0; i < padded.length; i += 4) {
    const chunk = padded.slice(i, i + 4);
    const combos = [...new Set(b64Permutations(chunk))];
    const valid = [];
    for (const combo of combos) {
      if (isValidB64(combo)) valid.push(atob(combo));
    }
    possibleB64.push(valid);
  }

  //Best guess: first valid option per chunk
  let bestGuess = '';
  for (const chunk of possibleB64) {
    bestGuess += chunk.length > 0 ? chunk[0] : '###';
  }

  //Render select boxes
  const selectArea = document.getElementById('b64-select-boxes');
  selectArea.innerHTML = '';

  possibleB64.forEach((options, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'b64-chunk';

    const label = document.createElement('div');
    label.className = 'b64-chunk-label';
    label.textContent = `${i + 1}`;
    wrap.appendChild(label);

    const sel = document.createElement('select');
    sel.id = `b64sel${i}`;
    sel.size = Math.min(Math.max(options.length, 1), 4);
    sel.onchange = updateB64Output;

    if (options.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.text = '(none)';
      sel.appendChild(opt);
    } else {
      options.forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        opt.text = val;
        sel.appendChild(opt);
      });
      sel.selectedIndex = 0;
    }

    wrap.appendChild(sel);
    selectArea.appendChild(wrap);
  });

  //Show everything
  document.getElementById('b64brute-out-area').style.display = '';
  document.getElementById('b64-output-text').value = bestGuess;

  showOutput('b64brute-out', 'b64brute-out-content',
    `<div class="result-item"><span class="key-label">Best guess: </span><span class="plain-val">${escapeHTML(bestGuess)}</span></div>`
  );
}

function clearB64Brute() {
  document.getElementById('b64brute-input').value = '';
  document.getElementById('b64-select-boxes').innerHTML = '';
  document.getElementById('b64brute-out-area').style.display = 'none';
  clearOutput('b64brute-out');
}
