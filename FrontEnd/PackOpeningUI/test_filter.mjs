import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jaSetsCache = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/ja-sets.json'), 'utf8'));
const jaEnNamesCache = JSON.parse(fs.readFileSync(path.join(__dirname, 'public/ja-en-names.json'), 'utf8'));

function fetchJapaneseSeriesDetails(seriesId) {
  const allSets = jaSetsCache || [];
  const nameMap = jaEnNamesCache || {};

  const filteredSets = allSets.filter(s => {
    const id = s.id;
    if (seriesId === 'me_ja') {
      return !!id.match(/^M\d/);
    }
    if (seriesId === 'sv_ja') {
      if (id.startsWith('SVK') || id.startsWith('SVLS') || id.startsWith('SVLN')) return false;
      const nameLow = (nameMap[id] || s.name || '').toLowerCase();
      if (nameLow.includes('starter set') || nameLow.includes('deck build box') || nameLow.includes('starter deck') || nameLow.includes('build & battle') || s.name.includes('スターターセット') || s.name.includes('デッキビルド')) return false;
      return id.startsWith('SV');
    }
    if (seriesId === 'swsh_ja') {
      return (id.startsWith('S') && !id.startsWith('SV') && !id.startsWith('SM') && !id.startsWith('SVK')) || id.startsWith('sn');
    }
    if (seriesId === 'sm_ja') {
      return id.startsWith('SM') || id.startsWith('SMP');
    }
    if (seriesId === 'xy_ja') {
      return id.startsWith('XY') || id.startsWith('CP');
    }
    if (seriesId === 'classic_ja') {
      return id.startsWith('PMCG') || id.startsWith('neo') || id.startsWith('VS') || id.startsWith('web') || id.startsWith('E') || id.startsWith('ADV') || id.startsWith('PCG') || id.startsWith('DP') || id.startsWith('L') || id.startsWith('LL');
    }
    return false;
  });

  return filteredSets.length;
}

console.log('sv_ja:', fetchJapaneseSeriesDetails('sv_ja'));
console.log('swsh_ja:', fetchJapaneseSeriesDetails('swsh_ja'));
console.log('sm_ja:', fetchJapaneseSeriesDetails('sm_ja'));
console.log('classic_ja:', fetchJapaneseSeriesDetails('classic_ja'));
