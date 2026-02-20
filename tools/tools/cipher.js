/* cipher.js */

function toggleCipherOptions() {
  const t = document.getElementById('cipher-type').value;
  document.getElementById('caesar-shift-group').style.display = t === 'caesar' ? '' : 'none';
  document.getElementById('rail-group').style.display        = t === 'railfence' ? '' : 'none';
}

function runCipherTool() {
  const raw  = document.getElementById('cipher-input').value;
  const type = document.getElementById('cipher-type').value;
  if (!raw.trim()) { showToast('Enter ciphertext first'); return; }

  let html = '';
  switch (type) {
    case 'auto':      html = autoDetect(raw); break;
    case 'caesar':    html = tryCaesar(raw, parseInt(document.getElementById('caesar-shift').value)); break;
    case 'rot13':     html = makeResult('ROT-13', rot(raw, 13)); break;
    case 'atbash':    html = makeResult('Atbash', atbash(raw)); break;
    case 'base64':    html = tryBase64(raw); break;
    case 'morse':     html = makeResult('Morse Code', decodeMorse(raw) || 'Could not decode'); break;
    case 'mirror':    html = makeResult('Mirror', raw.split('').reverse().join('')); break;
    case 'l2n':       html = tryL2N(raw); break;
    case 'railfence': html = makeResult('Rail Fence (' + document.getElementById('rail-count').value + ' rails)', decodeRailFence(raw.replace(/\s/g,''), parseInt(document.getElementById('rail-count').value))); break;
  }
  showOutput('cipher-out', 'cipher-out-content', html);
}

function makeResult(label, val) {
  return `<div class="result-item"><span class="key-label">${escapeHTML(label)}: </span><span class="plain-val">${escapeHTML(val)}</span></div>`;
}

// ── Ciphers ────────────────────────────────────────────
function rot(text, n) {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + n) % 26) + base);
  });
}

function atbash(text) {
  return text.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
  });
}

function tryCaesar(raw, shift) {
  if (shift === 0) {
    return Array.from({ length: 25 }, (_, i) => makeResult('ROT-' + (i + 1), rot(raw, i + 1))).join('');
  }
  return makeResult('ROT-' + shift, rot(raw, shift));
}

function tryBase64(raw) {
  try { return makeResult('Base64', atob(raw.trim())); }
  catch(e) { return '<span class="result-no-match">Invalid Base64 input.</span>'; }
}

const MORSE_TABLE = {'.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9'};

function decodeMorse(text) {
  const words = text.trim().split(/\s{2,}|\s*\/\s*/);
  return words.map(w => w.trim().split(/\s+/).map(ch => MORSE_TABLE[ch] || '?').join('')).join(' ');
}

function decodeRailFence(text, rails) {
  const n = text.length;
  const pattern = [];
  let rail = 0, dir = 1;
  for (let i = 0; i < n; i++) {
    pattern.push(rail);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  const sorted = pattern.map((r, i) => [r, i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const result = new Array(n);
  for (let i = 0; i < n; i++) result[sorted[i][1]] = text[i];
  return result.join('');
}

function decodeL2N(text) {
  const parts = text.trim().split(/[\s,]+/);
  if (!parts.every(p => /^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.every(n => n >= 1 && n <= 26)) return nums.map(n => String.fromCharCode(64 + n)).join('');
  return null;
}

function tryL2N(raw) {
  const res = decodeL2N(raw);
  return res ? makeResult('Letter → Number', res) : '<span class="result-no-match">Input must be space/comma-separated numbers 1–26.</span>';
}

function scoreEnglish(text) {
  const common = 'etaoinshrdlu';
  const letters = text.replace(/[^a-z]/g, '');
  if (!letters.length) return 0;
  const freq = {};
  for (const c of letters) freq[c] = (freq[c] || 0) + 1;
  let score = 0;
  for (const c of common) if (freq[c]) score += freq[c] / letters.length;
  return score;
}

function autoDetect(raw) {
  let results = '';
  // Base64
  try { const b = atob(raw.trim()); if (/^[\x20-\x7e\n\r\t]+$/.test(b)) results += makeResult('Base64', b); } catch(e) {}
  // Morse
  if (/^[.\- /]+$/.test(raw.trim())) results += makeResult('Morse Code', decodeMorse(raw));
  // Mirror
  results += makeResult('Mirror', raw.split('').reverse().join(''));
  // Atbash
  results += makeResult('Atbash', atbash(raw));
  // ROT13
  results += makeResult('ROT-13', rot(raw, 13));
  // Best Caesar
  const lower = raw.toLowerCase();
  let bestScore = 0, bestShift = 0;
  for (let s = 1; s <= 25; s++) {
    const score = scoreEnglish(rot(lower, s));
    if (score > bestScore) { bestScore = score; bestShift = s; }
  }
  if (bestScore > 0.4) results += makeResult(`Best Caesar (ROT-${bestShift})`, rot(raw, bestShift));
  // L2N
  const l2n = decodeL2N(raw);
  if (l2n) results += makeResult('Letter → Number', l2n);
  return results || '<span class="result-no-match">No obvious encoding detected. Try a specific type.</span>';
}
