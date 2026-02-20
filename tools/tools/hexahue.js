/* hexahue.js */

const COLOR_CSS = { p:'#ff69b4',r:'#e74c3c',g:'#2ecc71',y:'#f1c40f',b:'#3498db',c:'#00bcd4',G:'#95a5a6',B:'#1a1a1a',w:'#f0f0f0' };

//Standard Hexahue letter mappings (A-Z)
const HEX_MAP = (function() {
  const map = {};
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  //Pink=p, Red=r, Green=g, Yellow=y, Blue=b, Cyan=c
  const actualCodes = [
    'prgybc','rpgybc','rgpybc','rgypbc','rgybpc','rgybcp',
    'grybcp','gyrbcp','gybrcp','gybcrp','gybcpr','ygbcpr',
    'ybgcpr','ybcgpr','ybcpgr','ybcprg','bycprg','bcyprg',
    'bcpyrg','bcpryg','bcprgy','cbprgy','cpbrgy','cprbgy',
    'cprgby','cprgyb'
  ];
  letters.split('').forEach((ch, i) => {
    if (actualCodes[i]) map[actualCodes[i].toLowerCase()] = ch;
  });
  //Numbers 0-9
  const numCodes = ['gwbgwb','wgbwgb','bgwbgw','gbwgbw','wbgwbg','bwgbwg','ggwbbw','wwbggb','bbgwwg','ggbwwb'];
  '0123456789'.split('').forEach((ch, i) => { map[numCodes[i]] = ch; });
  return map;
})();

function runHexahue() {
  const input = document.getElementById('hexahue-input').value.trim();
  if (!input) { showToast('Enter Hexahue codes'); return; }

  const codes = input.split(/\s+/);
  let text = '', visualHtml = '';

  codes.forEach(code => {
    const c6 = code.toLowerCase().slice(0, 6);
    const ch  = HEX_MAP[c6] || '?';
    text += ch;

    let gridHtml = '<div class="hexahue-grid">';
    for (const col of c6) {
      const css = COLOR_CSS[col] || '#444';
      gridHtml += `<div class="hexahue-cell" style="background:${css}"></div>`;
    }
    gridHtml += '</div>';
    visualHtml += `<div class="hexahue-char">${gridHtml}<span class="hexahue-label">${escapeHTML(ch)}</span></div>`;
  });

  document.getElementById('hexahue-visual-area').style.display = '';
  document.getElementById('hexahue-grid-display').innerHTML = visualHtml;
  showOutput('hexahue-out', 'hexahue-out-content', escapeHTML(text));
}

function clearHexahue() {
  document.getElementById('hexahue-input').value = '';
  document.getElementById('hexahue-visual-area').style.display = 'none';
  clearOutput('hexahue-out');
}
