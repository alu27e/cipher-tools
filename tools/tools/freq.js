/* freq.js */

const EN_FREQ = {a:8.17,b:1.49,c:2.78,d:4.25,e:12.70,f:2.23,g:2.02,h:6.09,i:6.97,j:0.15,k:0.77,l:4.03,m:2.41,n:6.75,o:7.51,p:1.93,q:0.10,r:5.99,s:6.33,t:9.06,u:2.76,v:0.98,w:2.36,x:0.15,y:1.97,z:0.07};

function runFreqAnalysis() {
  const raw     = document.getElementById('freq-input').value;
  const letters = raw.toLowerCase().replace(/[^a-z]/g, '');
  if (letters.length < 10) { showToast('Need at least 10 letters'); return; }

  const freq = {};
  for (const c of letters) freq[c] = (freq[c] || 0) + 1;

  // Chi-squared for each Caesar shift
  let bestShift = 0, bestChi = Infinity;
  for (let s = 0; s < 26; s++) {
    let chi = 0;
    for (const [c, exp] of Object.entries(EN_FREQ)) {
      const shifted  = String.fromCharCode(((c.charCodeAt(0) - 97 + s) % 26) + 97);
      const observed = ((freq[shifted] || 0) / letters.length) * 100;
      chi += Math.pow(observed - exp, 2) / exp;
    }
    if (chi < bestChi) { bestChi = chi; bestShift = s; }
  }

  // Stats output
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  let statsHtml = `<b style="color:var(--text-bright)">Total letters: ${letters.length}</b>\n`;
  statsHtml += `<span style="color:var(--text-dim)">Best Caesar shift: </span><span style="color:var(--amber)">${bestShift === 0 ? 'none (likely not Caesar)' : 'ROT-' + bestShift}</span>\n`;
  statsHtml += `<span style="color:var(--text-dim)">Chi²: </span><span style="color:var(--cyan)">${bestChi.toFixed(2)}</span>\n\n`;
  statsHtml += `<span style="color:var(--text-dim)">Frequencies:</span>\n`;
  sorted.forEach(([c, n]) => {
    const pct = ((n / letters.length) * 100).toFixed(2);
    const bar = '▓'.repeat(Math.round(parseFloat(pct)));
    const diff = parseFloat(pct) - (EN_FREQ[c] || 0);
    const col  = diff > 2 ? 'var(--pink-deep)' : diff < -2 ? 'var(--red)' : 'var(--green)';
    statsHtml += `<span style="color:${col}">${c.toUpperCase()} ${String(pct).padStart(5,' ')}%  ${escapeHTML(bar)}</span>\n`;
  });

  showOutput('freq-stats', 'freq-stats-content', statsHtml);

  // Canvas
  showPanel('freq-canvas-panel');
  const canvas = document.getElementById('freq-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

  const letters26 = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const barW  = Math.floor((W - 70) / 26);
  const maxPct = 14;
  const padL = 55, padB = 36, padT = 30, chartH = H - padT - padB;

  // Grid
  ctx.strokeStyle = '#f0dce3'; ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = padT + chartH - (g * 3.5 / maxPct) * chartH;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - 10, y); ctx.stroke();
    ctx.fillStyle = '#a07a88'; ctx.font = '11px sans-serif';
    ctx.fillText((g * 3.5).toFixed(0) + '%', 4, y + 4);
  }

  // English ref bars
  letters26.forEach((c, i) => {
    const x = padL + 2 + i * barW;
    const eH = (EN_FREQ[c] / maxPct) * chartH;
    ctx.fillStyle = 'rgba(212,117,143,0.12)';
    ctx.fillRect(x, padT + chartH - eH, barW - 3, eH);
  });

  // Observed bars
  letters26.forEach((c, i) => {
    const x   = padL + 2 + i * barW;
    const pct = ((freq[c] || 0) / letters.length) * 100;
    const bH  = (pct / maxPct) * chartH;
    const diff = pct - EN_FREQ[c];
    ctx.fillStyle = diff > 2 ? '#d4758f' : diff < -2 ? '#f0a0b8' : '#8fc4a8';
    ctx.fillRect(x + 3, padT + chartH - bH, barW - 9, bH);
    ctx.fillStyle = '#a07a88'; ctx.font = '11px sans-serif';
    ctx.fillText(c.toUpperCase(), x + 3, padT + chartH + 15);
  });

  // Legend
  const leg = [['#8fc4a8','Normal'],['#d4758f','High'],['#f0a0b8','Low'],['rgba(212,117,143,0.3)','English ref']];
  leg.forEach(([col, lbl], i) => {
    ctx.fillStyle = col; ctx.fillRect(padL + i * 140, 8, 10, 10);
    ctx.fillStyle = '#a07a88'; ctx.font = '11px sans-serif';
    ctx.fillText(lbl, padL + i * 140 + 14, 18);
  });
}

function clearFreq() {
  document.getElementById('freq-input').value = '';
  clearOutput('freq-stats');
  hidePanel('freq-canvas-panel');
}
