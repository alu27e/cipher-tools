/* binspace.js */

// ── Shared ─────────────────────────────────────────────

function validAscii(number, base, low, high) {
  if (number === '') return false;
  const n = parseInt(number, base);
  return n >= low && n <= high;
}

// ── No-space ASCII (all modes) ─────────────────────────

function spaceBrute(ct, mode, low, high) {
  const len = ct.length;
  let i = 0;
  const spaced = [];

  if (mode === 0 || mode === 1) {
    // Decimal / Octal — window of 2-3
    const base = mode === 0 ? 10 : 8;
    while (i < len - 1) {
      for (let j = 3; j > 1; j--) {
        const chunk = ct.slice(i, i + j);
        if (validAscii(chunk, base, low, high)) { spaced.push(chunk); i += j - 1; break; }
      }
      i++;
    }
  } else if (mode === 2) {
    // Hex — window of 1-2
    while (i < len - 1) {
      for (let j = 2; j > 0; j--) {
        const chunk = ct.slice(i, i + j);
        if (validAscii(chunk, 16, low, high)) { spaced.push(chunk); i += j - 1; break; }
      }
      i++;
    }
  } else if (mode === 3 || mode === 4) {
    // Binary forward — high (3) or low (4)
    while (i < len - 1) {
      const range = mode === 3 ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
      for (const j of range) {
        const chunk = ct.slice(i, i + j);
        if (validAscii(chunk, 2, low, high)) { spaced.push(chunk); i += j - 1; break; }
      }
      i++;
    }
  } else if (mode === 5 || mode === 6) {
    // Binary backwards — high (5) or low (6)
    i = len;
    while (i >= 0) {
      const range = mode === 5 ? [7,6,5,4,3,2,1] : [1,2,3,4,5,6,7];
      for (const j of range) {
        const chunk = ct.slice(i, i + j);
        if (validAscii(chunk, 2, low, high)) { spaced.push(chunk); i -= j - 1; break; }
      }
      i--;
    }
    spaced.reverse();
  }

  const base = [10, 8, 16, 2, 2, 2, 2][mode];
  return spaced.map(b => String.fromCharCode(parseInt(b, base))).join('');
}

function runSpaceless() {
  const ct   = document.getElementById('binspace-input').value.trim();
  const low  = parseInt(document.getElementById('binspace-low').value)  || 32;
  const high = parseInt(document.getElementById('binspace-high').value) || 126;
  if (!ct) { showToast('Enter a ciphertext'); return; }

  const modes = [
    { label: 'Decimal',            mode: 0 },
    { label: 'Octal',              mode: 1 },
    { label: 'Hex',                mode: 2 },
    { label: 'Binary — Forward / High', mode: 3 },
    { label: 'Binary — Forward / Low',  mode: 4 },
    { label: 'Binary — Backward / High',mode: 5 },
    { label: 'Binary — Backward / Low', mode: 6 },
  ];

  let html = '';
  for (const { label, mode } of modes) {
    const result = spaceBrute(ct, mode, low, high);
    html += `<div class="result-item">
      <span class="key-label">${escapeHTML(label)}</span><br>
      <span class="plain-val">${escapeHTML(result || '(no result)')}</span>
    </div>`;
  }

  showOutput('binspace-out', 'binspace-out-content', html);
}

// ── Interactive binary choice ──────────────────────────

const BinState = {
  ct: '',
  history: [],

  init(ct) {
    this.ct = ct;
    this.history = [];
    this.updatePlaintext();
    this.showChoices();
  },

  possibilities() {
    const possible = [];
    for (let j = 7; j > 0; j--) {
      const chunk = this.ct.slice(0, j);
      if (validAscii(chunk, 2, 32, 126)) possible.push(chunk);
    }
    return possible;
  },

  preview(bits) {
    const rest = this.ct.slice(bits.length);
    let i = 0, out = '';
    while (i < rest.length - 1) {
      for (let j = 7; j > 0; j--) {
        const chunk = rest.slice(i, i + j);
        if (validAscii(chunk, 2, 32, 126)) { out += String.fromCharCode(parseInt(chunk, 2)); i += j - 1; break; }
      }
      i++;
    }
    return out;
  },

  choose(idx) {
    const opts = this.possibilities();
    if (!opts[idx]) return;
    this.history.push(opts[idx]);
    this.ct = this.ct.slice(opts[idx].length);
    this.updatePlaintext();
    this.showChoices();
  },

  undo() {
    if (!this.history.length) return;
    const last = this.history.pop();
    this.ct = last + this.ct;
    this.updatePlaintext();
    this.showChoices();
  },

  updatePlaintext() {
    const text = this.history.map(b => String.fromCharCode(parseInt(b, 2))).join('');
    document.getElementById('binchoice-output').textContent = text || '—';
  },

  showChoices() {
    const area = document.getElementById('binchoice-options');
    area.innerHTML = '';
    const opts = this.possibilities();

    if (this.ct.length === 0) {
      area.innerHTML = '<span style="color:#2c3e50;font-weight:600">Done — all bits consumed.</span>';
      return;
    }

    if (opts.length === 0) {
      area.innerHTML = '<span style="color:#e74c3c">No valid options — try undo.</span>';
      return;
    }

    opts.forEach((bits, i) => {
      const letter  = String.fromCharCode(parseInt(bits, 2));
      const display = letter === ' ' ? '{Space}' : letter;
      const rest    = this.preview(bits);

      const div = document.createElement('div');
      div.className = 'binchoice-option';
      div.innerHTML = `<span class="binchoice-letter">${escapeHTML(display)}</span><span class="binchoice-preview">${escapeHTML(rest)}</span>`;
      div.onclick = () => BinState.choose(i);
      area.appendChild(div);
    });
  }
};

function runBinChoice() {
  const ct = document.getElementById('binchoice-input').value.trim();
  if (!ct) { showToast('Enter binary ciphertext'); return; }
  BinState.init(ct);
  document.getElementById('binchoice-area').style.display = '';
}

function undoBinChoice() { BinState.undo(); }

// ── Tab switching ──────────────────────────────────────

function switchBinTab(tab) {
  document.getElementById('tab-spaceless').style.display = tab === 'spaceless' ? '' : 'none';
  document.getElementById('tab-choice').style.display    = tab === 'choice'    ? '' : 'none';
  document.querySelectorAll('.bin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('bintab-' + tab).classList.add('active');
}
