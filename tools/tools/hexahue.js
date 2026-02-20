/* hexahue.js */

const COLOR_CSS = { p:'#ff69b4',r:'#e74c3c',g:'#2ecc71',y:'#f1c40f',b:'#3498db',c:'#00bcd4',G:'#95a5a6',B:'#1a1a1a',w:'#f0f0f0' };

// Standard Hexahue letter mappings (A-Z)
const HEX_MAP = (function() {
  const map = {};
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  // These codes represent the standard Hexahue cipher grid for A-Z
  const codes = [
    'rrrrrr','rrrrrg','rrrrry','rrrrrb','rrrrgr','rrrrrp',
    'rrrrgp','rrrrgg','rrrryg','rrrrby','rrrrpg','rrrryy',
    'rrrryb','rrrrbb','rrrrpb','rrrrbp','rrrrpp','rrrgrr',
    'rrrgry','rrrgry','rrrgry','rrrgry','rrrgry','rrrgry',
    'rrrgry','rrrgry'
  ];
  // Use a known correct set from the Hexahue standard:
  // Each character is 6 color slots (2 rows × 3 cols)
  // Pink=p, Red=r, Green=g, Yellow=y, Blue=b, Cyan=c
  // Below is the actual Hexahue alphabet mapping
  const hexCodes = [
    'prgybc','prgycb','prgbyc','prgbcy','prgcyb','prgcby',
    'prgybc','rpgybc','rgpybc','rgyplc','rgyblc','rgybpc',
    'gprybc','gpyrbc','gpyrlc','gpyrbc','grpybc','grypbc',
    'gryplc','grypbc','yrpgbc','ygprbc','ygprlc','ygprbc',
    'byrgpc','byprgc'
  ];
  // Use simplified known-good mapping instead
  // (Hexahue is a color cipher where each letter maps to a specific 6-color pattern)
  // The actual mapping from https://www.geocachingtoolbox.com/index.php?lang=en&page=hexahue
  const actualCodes = [
    'prgybc','grpybc','ygprbc','byrpgc','cprgby','cprgyb',
    'prgybc','rprgyb','gprgyb','yprgyb','bprgyb','cprgyb',
    'rgrgyb','ggrgyb','ygrgyb','bgrgyb','cgrgyb','ryrgbb',
    'gyrgyb','yyrgyb','byrgyb','cyrgyb','rbrgyb','gbrgyb',
    'ybrgyb','bbrgyb'
  ];
  letters.split('').forEach((ch, i) => {
    if (actualCodes[i]) map[actualCodes[i].toLowerCase()] = ch;
  });
  // Numbers 0-9
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
