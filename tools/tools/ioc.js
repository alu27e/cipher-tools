/* ioc.js */

function runIoC() {
  const raw  = document.getElementById('ioc-input').value.toLowerCase().replace(/[^a-z]/g, '');
  const maxP = parseInt(document.getElementById('ioc-max-period').value) || 30;
  if (raw.length < 10) { showToast('Need at least 10 letters'); return; }

  const iocData = [];
  for (let p = 1; p <= maxP; p++) iocData.push({ period: p, ioc: computeIoC(raw, p) });

  const sorted  = [...iocData].sort((a, b) => b.ioc - a.ioc);
  const top5    = sorted.slice(0, 5);
  const topPeriods = top5.map(d => d.period);

  showPanel('ioc-canvas-panel');
  drawIoCChart('ioc-canvas', iocData, topPeriods);

  let html = `<b style="color:var(--text-bright)">Top candidate key lengths:</b>\n\n`;
  top5.forEach((d, i) => {
    const bar = '▓'.repeat(Math.round(d.ioc * 600));
    html += `<div class="result-item">#${i + 1} &nbsp;Period <span class="key-val">${d.period}</span> &nbsp;IoC = <span style="color:var(--cyan)">${d.ioc.toFixed(4)}</span>\n<small style="color:var(--border2)">${escapeHTML(bar)}</small></div>`;
  });
  html += `\n<span style="color:var(--text-dim);font-size:12px;">English ≈ 0.0667 &nbsp;|&nbsp; Random ≈ 0.0385</span>`;
  showOutput('ioc-out', 'ioc-out-content', html);
}

function clearIoC() {
  clearOutput('ioc-out');
  hidePanel('ioc-canvas-panel');
}
