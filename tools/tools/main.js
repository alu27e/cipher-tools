/*main.js*/

//Navigation
const NAV_TOOLS = [
  { id: 'cipher',      label: 'Cipher Tool',   path: 'cipher/'      },
  { id: 'freq',        label: 'Freq Analysis', path: 'freq/'        },
  { id: 'vigenere',    label: 'Vigenère',       path: 'vigenere/'    },
  { id: 'beaufort',    label: 'Beaufort',       path: 'beaufort/'    },
  { id: 'hexahue',     label: 'Hexahue',        path: 'hexahue/'     },
  { id: 'ioc',         label: 'IoC Analyzer',  path: 'ioc/'         },
  { id: 'word-finder', label: 'Word Finder',   path: 'word-finder/' },
  { id: 'keyboard',    label: 'Keyboard Map',  path: 'keyboard/'    },
  { id: 'punycode',    label: 'Punycode',       path: 'punycode/'    },
  { id: 'anagram',     label: 'Anagram',        path: 'anagram/'     },
  { id: 'b64brute',    label: 'B64 Bruteforce', path: 'b64brute/'    },
  { id: 'binspace',    label: 'Spaceless Bin',  path: 'binspace/'    },
];

function renderNav(activeId) {
  const base = document.querySelector('meta[name="ct-base"]')?.content || '../';
  const navEl = document.getElementById('main-nav');
  if (!navEl) return;

  let html = '';
  NAV_TOOLS.forEach(t => {
    const active = t.id === activeId ? ' active' : '';
    html += `<a class="nav-item${active}" href="${base}${t.path}">${t.label}</a>`;
  });
  navEl.innerHTML = html;
}

function renderHeader() {
  const base = document.querySelector('meta[name="ct-base"]')?.content || '../';
  const el = document.getElementById('main-header');
  if (!el) return;
  el.innerHTML = `
    <div class="header-content">
      <a class="header-logo" href="${base}">
        <span class="header-logo-mark">CT</span>
        <span class="header-logo-name">Ciphertool</span>
      </a>
      <div class="header-badges">
        <span class="badge live" id="dict-badge">client-side</span>
        <span class="badge">v2.0</span>
      </div>
    </div>`;
}

function renderFooter() {
  const el = document.getElementById('main-footer');
  if (!el) return;
  el.innerHTML = `<span>Ciphertool</span>`;
}

//DOM helpers
function escapeHTML(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showOutput(wrapId, contentId, html, textClass = '') {
  const wrap = document.getElementById(wrapId);
  const cont = document.getElementById(contentId);
  if (!wrap || !cont) return;
  wrap.classList.add('visible');
  cont.className = 'output' + (textClass ? ' ' + textClass : '');
  cont.innerHTML = html;
}

function clearOutput(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  wrap.classList.remove('visible');
  const cont = wrap.querySelector('.output');
  if (cont) cont.innerHTML = '';
}

function showProgress(baseId, pct, label) {
  const c = document.getElementById(baseId);
  if (c) c.classList.add('visible');
  const bar = document.getElementById(baseId + '-bar');
  const lbl = document.getElementById(baseId + '-label');
  if (bar) bar.style.width = pct + '%';
  if (lbl) lbl.textContent = label || pct + '%';
}
function hideProgress(baseId) {
  const c = document.getElementById(baseId);
  if (c) c.classList.remove('visible');
}

function showPanel(id) { document.getElementById(id)?.classList.add('visible'); }
function hidePanel(id) { document.getElementById(id)?.classList.remove('visible'); }

function yield_() { return new Promise(r => setTimeout(r, 0)); }

function copyOutput(contentId) {
  const el = document.getElementById(contentId);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText || el.textContent)
    .then(() => showToast('Copied!'));
}

function downloadOutput(contentId, filename) {
  const el = document.getElementById(contentId);
  if (!el) return;
  const blob = new Blob([el.innerText || el.textContent], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

//Dictionary
let _dictionary = null;

const FALLBACK_WORDS = new Set();

async function loadDictionary() {
  if (_dictionary) return _dictionary;
  const badge = document.getElementById('dict-badge');

  try {
    const res = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
    if (!res.ok) throw new Error();
    const text = await res.text();
    _dictionary = new Set(
      text.trim().split('\n').map(w => w.toLowerCase().trim()).filter(w => w.length >= 2)
    );
    if (badge) badge.textContent = '● ' + _dictionary.size.toLocaleString() + ' words';
  } catch(e) {
    _dictionary = FALLBACK_WORDS;
    if (badge) badge.textContent = 'dictionary unavailable';
  }
  return _dictionary;
}

//Shared IoC computation
function computeIoC(text, period) {
  const subs = Array.from({ length: period }, () => []);
  for (let i = 0; i < text.length; i++) subs[i % period].push(text[i]);
  const iocs = subs.map(sub => {
    const freq = {};
    for (const c of sub) freq[c] = (freq[c] || 0) + 1;
    const n = sub.length;
    if (n < 2) return 0;
    return Object.values(freq).reduce((s, v) => s + v * (v - 1), 0) / (n * (n - 1));
  });
  return iocs.reduce((a, b) => a + b, 0) / iocs.length;
}

//Shared IoC chart renderer
function drawIoCChart(canvasId, iocData, topPeriods) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, W, H);

  if (!iocData.length) return;
  const maxIoC = Math.max(0.072, ...iocData.map(d => d.ioc));
  const padL = 70, padR = 20, padT = 30, padB = 44;
  const chartW = W - padL - padR, chartH = H - padT - padB;

  //Grid lines
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
  for (let g = 0; g <= 5; g++) {
    const y = padT + chartH - (g / 5) * chartH;
    const val = ((g / 5) * maxIoC).toFixed(4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.font = '11px sans-serif';
    ctx.fillText(val, 4, y + 4);
  }

  //English reference line
  const refY = padT + chartH - (0.067 / maxIoC) * chartH;
  ctx.strokeStyle = 'rgba(52,152,219,0.4)'; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(padL, refY); ctx.lineTo(W - padR, refY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(52,152,219,0.8)'; ctx.font = '11px sans-serif';
  ctx.fillText('English ≈ 0.067', padL + 6, refY - 5);

  //Bars
  const bw = Math.max(3, (chartW / iocData.length) - 2);
  iocData.forEach((d, i) => {
    const x = padL + i * (chartW / iocData.length);
    const bH = (d.ioc / maxIoC) * chartH;
    const isTop = topPeriods.includes(d.period);
    ctx.fillStyle = isTop ? '#3498db' : 'rgba(52,152,219,0.25)';
    ctx.fillRect(x, padT + chartH - bH, bw, bH);
    ctx.fillStyle = '#999'; ctx.font = '11px sans-serif';
    const label = String(d.period);
    ctx.fillText(label, x + bw / 2 - (label.length * 3), padT + chartH + 15);
  });
}

//Boot
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  // Pre-load dictionary in background
  loadDictionary();
});
