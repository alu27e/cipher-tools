/* anagram.js */

function getAnagrams(letters, dict) {
  const sorted = letters.split('').sort().join('');
  const matches = [];
  for (const word of dict) {
    if (word.length === letters.length && word.split('').sort().join('') === sorted) {
      matches.push(word);
    }
  }
  return matches;
}

function getWordLengths(pattern) {
  const lengths = [];
  let cur = pattern[0], len = 1;
  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i] === cur) { len++; }
    else { lengths.push(len); cur = pattern[i]; len = 1; }
  }
  lengths.push(len);
  return lengths;
}

async function runAnagram() {
  const text    = document.getElementById('anagram-text').value.trim().toLowerCase().replace(/[^a-z]/g, '');
  const pattern = document.getElementById('anagram-pattern').value.trim().toLowerCase().replace(/[^a-z]/g, '');
  const mode    = document.getElementById('anagram-mode').value;

  if (!text || !pattern) { showToast('Enter both text and pattern'); return; }
  if (text.length !== pattern.length) { showToast('Text and pattern must be same length'); return; }

  showProgress('anagram-progress', 0, 'Loading dictionary…');
  const dict = await loadDictionary();
  await yield_();

  let html = '';

  if (mode === 'pre') {
    //Group letters by pattern key
    const groups = {};
    for (let i = 0; i < pattern.length; i++) {
      const k = pattern[i];
      if (!groups[k]) groups[k] = '';
      groups[k] += text[i];
    }
    const groupKeys = Object.keys(groups).sort();

    //Find all dictionary anagrams for each group
    const groupMatches = {};
    let anyEmpty = false;
    for (const k of groupKeys) {
      const matches = getAnagrams(groups[k], dict);
      groupMatches[k] = matches;
      if (matches.length === 0) anyEmpty = true;
    }

    //Show group breakdown
    for (const k of groupKeys) {
      const m = groupMatches[k];
      html += `<div class="result-item">`;
      html += `<span class="key-label">Group '${escapeHTML(k)}' (${escapeHTML(groups[k])}) → </span>`;
      if (m.length > 0) {
        html += `<span class="plain-val">${escapeHTML(m.join(', '))}</span>`;
      } else {
        html += `<span class="key-label">no matches found</span>`;
      }
      html += `</div>`;
    }

    if (anyEmpty) {
      html += `<br><span class="result-no-match">One or more groups had no dictionary matches — no full solutions possible.</span>`;
    } else {
      //Combine every combination across groups and reassemble into full string
      const results = new Set();

      function combine(idx, chosen) {
        if (idx === groupKeys.length) {
          results.add(chosen.join(''));
          return;
        }
        for (const w of groupMatches[groupKeys[idx]]) combine(idx + 1, [...chosen, w]);
      }

      combine(0, []);

      const sorted = [...results].sort();
      html += `<br><b style="color:#2c3e50">${sorted.length} solution(s)</b><br><br>`;
      html += sorted.map(w => `<div class="result-item"><span class="plain-val">${escapeHTML(w)}</span></div>`).join('');
    }

  } else {
    //Post-anagram: lengths from pattern, find words from dict that use the letters
    const lengths = getWordLengths(pattern);
    html += `<b style="color:#2c3e50">Word lengths: ${lengths.join(' + ')}</b><br><br>`;
    showProgress('anagram-progress', 10, 'Searching…');
    await yield_();

    const wordsByLength = {};
    for (const len of lengths) {
      if (!wordsByLength[len]) {
        wordsByLength[len] = [...dict].filter(w => w.length === len);
      }
    }

    const results = [];
    const seen = new Set();
    let checked = 0;

    async function search(pos, remaining, current) {
      if (pos === lengths.length) {
        if (remaining.length === 0) {
          const key = current.join('|');
          if (!seen.has(key)) { seen.add(key); results.push([...current]); }
        }
        return;
      }
      for (const word of (wordsByLength[lengths[pos]] || [])) {
        const chars = remaining.split('');
        const used = [];
        let ok = true;
        for (const ch of word) {
          const idx = chars.findIndex((c, i) => c === ch && !used.includes(i));
          if (idx === -1) { ok = false; break; }
          used.push(idx);
        }
        if (!ok) continue;
        const next = chars.filter((_, i) => !used.includes(i)).join('');
        current.push(word);
        await search(pos + 1, next, current);
        current.pop();
        checked++;
        if (checked % 5000 === 0) await yield_();
      }
    }

    await search(0, text, []);
    hideProgress('anagram-progress');

    if (results.length === 0) {
      html += '<span class="result-no-match">No valid combinations found.</span>';
    } else {
      html += `<b style="color:#2c3e50">${results.length} solution(s)</b><br><br>`;
      html += results.map(words =>
        `<div class="result-item"><span class="plain-val">${escapeHTML(words.join(' '))}</span></div>`
      ).join('');
    }
  }

  hideProgress('anagram-progress');
  showOutput('anagram-out', 'anagram-out-content', html);
}
