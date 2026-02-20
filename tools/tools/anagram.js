/* anagram.js */

function permutations(str) {
  if (str.length <= 1) return [str];
  const result = new Set();
  for (let i = 0; i < str.length; i++) {
    const rest = str.slice(0, i) + str.slice(i + 1);
    for (const p of permutations(rest)) {
      result.add(str[i] + p);
    }
  }
  return [...result];
}

async function runAnagram() {
  const text    = document.getElementById('anagram-text').value.trim().toLowerCase().replace(/[^a-z]/g, '');
  const pattern = document.getElementById('anagram-pattern').value.trim().toLowerCase().replace(/[^a-z]/g, '');
  const mode    = document.getElementById('anagram-mode').value;

  if (!text || !pattern) { showToast('Enter both text and pattern'); return; }
  if (text.length !== pattern.length) { showToast('Text and pattern must be same length'); return; }

  showProgress('anagram-progress', 0, 'Working…');
  await yield_();

  let html = '';

  if (mode === 'pre') {
    // Group letters by pattern key
    const groups = {};
    for (let i = 0; i < pattern.length; i++) {
      const k = pattern[i];
      if (!groups[k]) groups[k] = '';
      groups[k] += text[i];
    }
    const groupKeys  = Object.keys(groups).sort();
    const groupPerms = groupKeys.map(k => permutations(groups[k]));

    // Combine all group permutations and reassemble into full strings
    const results = new Set();

    function combine(idx, chosen) {
      if (idx === groupKeys.length) {
        const pos = {};
        groupKeys.forEach((k, i) => pos[k] = chosen[i].split(''));
        let word = '';
        for (const pk of pattern) word += pos[pk].shift();
        results.add(word);
        return;
      }
      for (const p of groupPerms[idx]) combine(idx + 1, [...chosen, p]);
    }

    combine(0, []);

    const sorted = [...results].sort();
    html += `<b style="color:#2c3e50">${sorted.length} possibility(s)</b><br><br>`;
    html += sorted.map(w => `<div class="result-item"><span class="plain-val">${escapeHTML(w)}</span></div>`).join('');

  } else {
    // Post-anagram: get word lengths from pattern, then permute all letters and split
    const lengths = [];
    let cur = pattern[0], len = 1;
    for (let i = 1; i < pattern.length; i++) {
      if (pattern[i] === cur) { len++; }
      else { lengths.push(len); cur = pattern[i]; len = 1; }
    }
    lengths.push(len);

    const allPerms = permutations(text);
    const results  = new Set();

    for (const p of allPerms) {
      const words = [];
      let pos = 0;
      for (const l of lengths) { words.push(p.slice(pos, pos + l)); pos += l; }
      results.add(words.join(' '));
    }

    const sorted = [...results].sort();
    html += `<b style="color:#2c3e50">Word lengths: ${lengths.join(' + ')} — ${sorted.length} possibility(s)</b><br><br>`;
    html += sorted.map(w => `<div class="result-item"><span class="plain-val">${escapeHTML(w)}</span></div>`).join('');
  }

  hideProgress('anagram-progress');
  showOutput('anagram-out', 'anagram-out-content', html);
}
