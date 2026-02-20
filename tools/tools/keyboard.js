/* keyboard.js */

const LAYOUTS = {
  qwerty: [['q','w','e','r','t','y','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['z','x','c','v','b','n','m']],
  azerty: [['a','z','e','r','t','y','u','i','o','p'],['q','s','d','f','g','h','j','k','l','m'],['w','x','c','v','b','n']],
  qwertz: [['q','w','e','r','t','z','u','i','o','p'],['a','s','d','f','g','h','j','k','l'],['y','x','c','v','b','n','m']],
  dvorak: [["'",',','.','p','y','f','g','c','r','l'],['a','o','e','u','i','d','h','t','n','s'],['q','j','k','x','b','m','w','v','z']]
};

function runKeyboard() {
  const text   = document.getElementById('keyboard-input').value.toLowerCase();
  const layout = document.getElementById('keyboard-layout').value;
  if (!text.trim()) { showToast('Enter text to analyse'); return; }

  const freq = {};
  for (const c of text) if (/[a-z']/.test(c)) freq[c] = (freq[c] || 0) + 1;
  const maxF = Math.max(...Object.values(freq), 1);

  const offsets = [0, 22, 44];
  let html = '<div class="keyboard-visual">';

  LAYOUTS[layout].forEach((row, ri) => {
    html += `<div class="keyboard-row" style="margin-left:${offsets[ri] || 0}px">`;
    row.forEach(k => {
      const f         = freq[k] || 0;
      const intensity = f / maxF;
      const r = Math.round(intensity * 240);
      const g = Math.round(240 - intensity * 180);
      const b = Math.round(240 - intensity * 220);
      const bg    = f > 0 ? `rgb(${r},${g},${b})` : '#111520';
      const color = intensity > 0.5 ? '#050810' : 'var(--text)';
      html += `<div class="key" style="background:${bg};color:${color};border-color:${f > 0 ? 'transparent' : 'var(--border)'}">`;
      html += escapeHTML(k.toUpperCase());
      if (f > 0) html += `<span class="key-count">${f}</span>`;
      html += '</div>';
    });
    html += '</div>';
  });
  html += '</div>';

  //Frequency table
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  if (sorted.length) {
    html += '<div style="margin-top:18px;font-size:12px;color:var(--text-dim);line-height:2">';
    html += sorted.map(([c, n]) => `<span style="margin-right:16px"><b style="color:var(--text)">${c.toUpperCase()}</b>:${n}</span>`).join('');
    html += '</div>';
  }

  showOutput('keyboard-out', 'keyboard-out-content', html, 'output-text');
}
