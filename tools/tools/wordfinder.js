/* wordfinder.js */

function parseBrackets(pattern) {
  const positions = [];
  const regex = /\[([^\]]+)\]/g;
  let m;
  while ((m = regex.exec(pattern)) !== null) {
    const opts = m[1].trim().split(/\s+/);
    positions.push(opts.map(o => o.toLowerCase()));
  }
  return positions;
}

function* genCombinations(positions, index = 0, current = '') {
  if (index === positions.length) { yield current; return; }
  for (const opt of positions[index]) yield* genCombinations(positions, index + 1, current + opt);
}

async function runWordFinder() {
  const input = document.getElementById('word-finder-input').value.trim();
  if (!input) { showToast('Enter a bracket pattern'); return; }

  const positions = parseBrackets(input);
  if (!positions.length) { showToast('No valid brackets found'); return; }

  showProgress('word-finder-progress', 0, 'Loading dictionary…');
  const dict   = await loadDictionary();
  const combos = [...genCombinations(positions)];
  const results = [];

  for (let i = 0; i < combos.length; i++) {
    if (dict.has(combos[i])) results.push(combos[i]);
    if (i % 5000 === 0) { showProgress('word-finder-progress', Math.round((i / combos.length) * 100)); await yield_(); }
  }
  hideProgress('word-finder-progress');

  let html = `<b style="color:var(--text-bright)">${results.length} word(s) found</b><br><br>`;
  if (!results.length) html += '<span class="result-no-match">No valid words for this pattern.</span>';
  else html += results.map(w => `<div class="result-item"><span class="plain-val">${escapeHTML(w)}</span></div>`).join('');
  showOutput('word-finder-out', 'word-finder-out-content', html);
}
