/* punycode.js — full RFC 3492 Bootstring implementation */

function decodePunycode(input) {
  const BASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700;
  const INITIAL_BIAS = 72, INITIAL_N = 128, DELIMITER = '-';

  function adapt(delta, numPoints, firstTime) {
    delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    let k = 0;
    while (delta > ((BASE - TMIN) * TMAX) >> 1) { delta = Math.floor(delta / (BASE - TMIN)); k += BASE; }
    return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
  }

  function basicToDigit(cp) {
    if (cp - 0x30 < 10) return cp - 22;
    if (cp - 0x41 < 26) return cp - 65;
    if (cp - 0x61 < 26) return cp - 97;
    return BASE;
  }

  const output = [];
  let n = INITIAL_N, i = 0, bias = INITIAL_BIAS;

  const delimIdx = input.lastIndexOf(DELIMITER);
  const basic    = delimIdx < 0 ? '' : input.slice(0, delimIdx);
  const rest     = delimIdx < 0 ? input : input.slice(delimIdx + 1);

  for (const c of basic) output.push(c.codePointAt(0));

  let pos = 0;
  while (pos < rest.length) {
    const oldi = i;
    let w = 1, k = BASE;
    while (true) {
      if (pos >= rest.length) throw new Error('Invalid punycode: unexpected end');
      const digit = basicToDigit(rest.charCodeAt(pos++));
      if (digit >= BASE) throw new Error('Invalid character in punycode');
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      k += BASE;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi === 0);
    n += Math.floor(i / out);
    i %= out;
    output.splice(i, 0, n);
    i++;
  }
  return output.map(cp => String.fromCodePoint(cp)).join('');
}

function encodePunycode(input) {
  // Basic ASCII pass-through + encode non-ASCII
  const codePoints = [...input].map(c => c.codePointAt(0));
  const basicPoints = codePoints.filter(cp => cp < 128);
  let output = basicPoints.map(cp => String.fromCodePoint(cp)).join('');
  let handled = basicPoints.length;
  if (handled) output += '-';

  const BASE = 36, TMIN = 1, TMAX = 26, SKEW = 38, DAMP = 700;
  const INITIAL_BIAS = 72, INITIAL_N = 128;

  function adapt(delta, numPoints, firstTime) {
    delta = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    let k = 0;
    while (delta > ((BASE - TMIN) * TMAX) >> 1) { delta = Math.floor(delta / (BASE - TMIN)); k += BASE; }
    return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + SKEW));
  }

  function digitToBasic(digit) {
    return digit + (digit < 26 ? 97 : 22);
  }

  let n = INITIAL_N, delta = 0, bias = INITIAL_BIAS;
  const total = codePoints.length;

  while (handled < total) {
    const m = codePoints.filter(cp => cp >= n).reduce((min, cp) => Math.min(min, cp), Infinity);
    delta += (m - n) * (handled + 1);
    n = m;

    codePoints.forEach(cp => {
      if (cp < n) delta++;
      if (cp === n) {
        let q = delta, k = BASE;
        while (true) {
          const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
          if (q < t) break;
          output += String.fromCharCode(digitToBasic(t + (q - t) % (BASE - t)));
          q = Math.floor((q - t) / (BASE - t));
          k += BASE;
        }
        output += String.fromCharCode(digitToBasic(q));
        bias = adapt(delta, handled + 1, handled === basicPoints.length);
        delta = 0;
        handled++;
      }
    });
    delta++;
    n++;
  }
  return output;
}

function runPunycode() {
  const raw = document.getElementById('punycode-input').value.trim();
  if (!raw) { showToast('Enter punycode'); return; }

  const direction = document.getElementById('punycode-dir')?.value || 'decode';

  try {
    if (direction === 'decode') {
      const input   = raw.toLowerCase().replace(/^xn--/i, '');
      const decoded = decodePunycode(input);
      const codepoints = [...decoded].map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
      const html = `<div class="result-item">
        <span class="key-label">Input (punycode): </span><span class="key-val">${escapeHTML(raw)}</span><br>
        <span class="key-label">Decoded: </span><span class="plain-val" style="font-size:22px;letter-spacing:2px;">${escapeHTML(decoded)}</span><br>
        <span class="key-label">Codepoints: </span><span style="color:var(--text-dim);font-size:11px;">${escapeHTML(codepoints)}</span>
      </div>`;
      showOutput('punycode-out', 'punycode-out-content', html);
    } else {
      const encoded = encodePunycode(raw);
      const html = `<div class="result-item">
        <span class="key-label">Input (Unicode): </span><span class="key-val">${escapeHTML(raw)}</span><br>
        <span class="key-label">Punycode: </span><span class="plain-val">xn--${escapeHTML(encoded)}</span>
      </div>`;
      showOutput('punycode-out', 'punycode-out-content', html);
    }
  } catch(e) {
    showOutput('punycode-out', 'punycode-out-content',
      `<span style="color:var(--red)">Error: ${escapeHTML(e.message)}</span>\n\nFor decoding, remove the "xn--" prefix before pasting.`);
  }
}
