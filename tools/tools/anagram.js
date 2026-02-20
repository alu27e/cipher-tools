/* anagram.js */

function permutations(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const seen = new Map();
  arr.forEach((el, i) => {
    const key = el;
    if (seen.has(key)) return;
    seen.set(key, true);
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    permutations(rest).forEach(p => {
      const w = el + p.join('');
      if (!seen.has(w)) seen.set(w, p);
    });
  });
  // rebuild as arrays
  const result = [];
  arr.forEach((el, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    permutations(rest).forEach(p => result.push([el, ...p]));
  });
  return [...new Map(result.map(p => [p.join(''), p])).values()];
}

async function runAnagram() {
  const text    = document.getElementById('anagram-text').value.toLowerCase().trim();
  const pattern = document.getElementById('anagram-pattern').value.toLowerCase().trim();
  const mode    = document.getElementById('anagram-mode').value;

  if (!text || !pattern) { showToast('Enter both text and pattern'); return; }
  if (text.length !== pattern.length) { showToast('Text and pattern must be same length'); return; }

  showProgress('anagram-progress', 0, 'Loading dictionary…');
  const dict    = await loadDictionary();
  const results = [];

  if (mode === 'pre') {
    // Group input letters by pattern code
    const groups = {};
    for (let i = 0; i < pattern.length; i++) {
      const k = pattern[i];
      if (!groups[k]) groups[k] = [];
      groups[k].push(text[i]);
    }
    const groupKeys  = Object.keys(groups).sort();
    const groupPerms = groupKeys.map(k => permutations(groups[k]));

    function* combineGroups(perms, idx = 0, current = []) {
      if (idx === perms.length) { yield current; return; }
      for (const p of perms[idx]) yield* combineGroups(perms, idx + 1, [...current, p]);
    }

    let count = 0;
    const total = groupPerms.reduce((a, p) => a * p.length, 1);
    for (const combo of combineGroups(groupPerms)) {
      const pos = {};
      groupKeys.forEach((k, i) => pos[k] = [...combo[i]]);
      let word = '';
      for (const pk of pattern) word += pos[pk].shift();
      if (dict.has(word)) results.push(word);
      count++;
      if (count % 300 === 0) { showProgress('anagram-progress', Math.min(99, Math.round((count / total) * 100))); await yield_(); }
    }

  } else {
    // Post-anagram: each unique pattern letter = one word
    const wordGroups = {};
    for (let i = 0; i < pattern.length; i++) {
      const k = pattern[i];
      if (!wordGroups[k]) wordGroups[k] = [];
      wordGroups[k].push(text[i]);
    }
    const groupKeys  = [...new Set(pattern.split(''))];
    const groupPerms = groupKeys.map(k => permutations(wordGroups[k]).map(p => p.join('')));

    function* combinePost(perms, idx = 0, current = []) {
      if (idx === perms.length) { yield current; return; }
      for (const p of perms[idx]) yield* combinePost(perms, idx + 1, [...current, p]);
    }

    let count = 0;
    const total = groupPerms.reduce((a, p) => a * p.length, 1);
    for (const combo of combinePost(groupPerms)) {
      if (combo.every(w => dict.has(w))) results.push(combo.join(' '));
      count++;
      if (count % 300 === 0) { showProgress('anagram-progress', Math.min(99, Math.round((count / total) * 100))); await yield_(); }
    }
  }

  hideProgress('anagram-progress');

  const unique = [...new Set(results)];
  let html = `<b style="color:var(--text-bright)">${unique.length} solution(s) found</b><br><br>`;
  if (!unique.length) html += '<span class="result-no-match">No valid words found.</span>';
  else html += unique.slice(0, 100).map(w => `<div class="result-item"><span class="plain-val">${escapeHTML(w)}</span></div>`).join('');
  if (unique.length > 100) html += `<div style="color:var(--text-dim);padding:8px">…and ${unique.length - 100} more</div>`;
  showOutput('anagram-out', 'anagram-out-content', html);
}
