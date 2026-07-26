import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priceChartsDir = path.resolve(__dirname, '../../Japanese-PriceCharts');
const publicDir = path.resolve(__dirname, '../public');
const jaEnNamesPath = path.join(publicDir, 'ja-en-names.json');
const jaSetsPath = path.join(publicDir, 'ja-sets.json');

// Load alias mappings
let jaEnNames = {};
if (fs.existsSync(jaEnNamesPath)) {
  jaEnNames = JSON.parse(fs.readFileSync(jaEnNamesPath, 'utf8'));
}

let jaSets = [];
if (fs.existsSync(jaSetsPath)) {
  jaSets = JSON.parse(fs.readFileSync(jaSetsPath, 'utf8'));
}

// Build reverse lookup from English Set Name (lowercase) to Set IDs
const nameToIds = new Map();
for (const [id, name] of Object.entries(jaEnNames)) {
  const normName = name.trim().toLowerCase();
  if (!nameToIds.has(normName)) nameToIds.set(normName, new Set());
  nameToIds.get(normName).add(id.toLowerCase());
}
for (const s of jaSets) {
  if (s.id && s.name) {
    const normName = s.name.trim().toLowerCase();
    if (!nameToIds.has(normName)) nameToIds.set(normName, new Set());
    nameToIds.get(normName).add(s.id.toLowerCase());
  }
}

// Map alias IDs between Scrydex swshX_ja and regular sX_ja
const aliasMap = {
  // DP & Legend
  'dp1': ['dp1d', 'dp1p'],
  'dp4m': ['dp4'],
  'dp5t': ['dp5'],
  'l1hg': ['l1a'],
  'l1ss': ['l1b'],
  'll1': ['ll'],
  
  // XY
  'xy1x': ['xy1a'],
  'xy1y': ['xy1b'],
  'xy5g': ['xy5a'],
  'xy5t': ['xy5b'],
  'xy8r': ['xy8b'],
  'xy11f': ['xy11a'],
  'xy11c': ['xy11b'],

  // SWSH
  'swsh1s': ['s1w', 's1s', 'swsh1', 's1h'],
  'swsh1h': ['s1h', 'swsh1'],
  'swsh1w': ['s1w', 'swsh1'],
  'swsh1a': ['s1a'],
  'swsh2': ['s2'],
  'swsh2a': ['s2a'],
  'swsh3': ['s3'],
  'swsh3a': ['s3a'],
  'swsh4': ['s4'],
  'swsh4a': ['s4a'],
  'swsh5i': ['s5i'],
  'swsh5r': ['s5r'],
  'swsh5a': ['s5a'],
  'swsh6h': ['s6h'],
  'swsh6k': ['s6k'],
  'swsh6a': ['s6a'],
  'swsh7r': ['s7r'],
  'swsh7d': ['s7d'],
  'swsh8': ['s8'],
  'swsh8a': ['s8a'],
  'swsh8b': ['s8b'],
  'swsh9': ['s9'],
  'swsh9a': ['s9a'],
  'swsh10p': ['s10p'],
  'swsh10d': ['s10d'],
  'swsh10a': ['s10a'],
  'swsh10b': ['s10b'],
  'swsh11': ['s11'],
  'swsh11a': ['s11a'],
  'swsh12': ['s12'],
  'swsh12a': ['s12a']
};

const generations = fs.readdirSync(priceChartsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log(`Found ${generations.length} generation folders: ${generations.join(', ')}`);
const priceMap = {};
const namesMap = {};
let totalSets = 0;
let totalCards = 0;

for (const gen of generations) {
  const genDir = path.join(priceChartsDir, gen);
  if (!fs.existsSync(genDir)) {
    console.warn(`Warning: Generation folder not found: ${genDir}`);
    continue;
  }

  const setFolders = fs.readdirSync(genDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const setFolder of setFolders) {
    const cardsJsonPath = path.join(genDir, setFolder, 'cards.json');
    if (!fs.existsSync(cardsJsonPath)) continue;

    try {
      const content = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
      const meta = content.metadata || {};
      const cards = content.cards || [];
      totalSets++;

      const setName = (meta.set_name || setFolder).trim();
      const normSetName = setName.toLowerCase();

      // Extract set IDs from redirect_link (e.g., https://scrydex.com/pokemon/expansions/ancient-roar/sv4k_ja)
      const setIds = new Set();
      if (meta.redirect_link) {
        const parts = meta.redirect_link.split('/');
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart) {
          const rawId = lastPart.replace(/_ja$/i, '').toLowerCase();
          setIds.add(rawId);
          setIds.add(`${rawId}_ja`);
          if (aliasMap[rawId]) {
            aliasMap[rawId].forEach(a => {
              setIds.add(a.toLowerCase());
              setIds.add(`${a.toLowerCase()}_ja`);
            });
          }
        }
      }

      // Also add IDs from nameToIds map
      if (nameToIds.has(normSetName)) {
        for (const id of nameToIds.get(normSetName)) {
          setIds.add(id);
          setIds.add(`${id}_ja`);
        }
      }

      // Also add folder name
      setIds.add(normSetName);

      for (const card of cards) {
        const rawName = (card.name || '').trim();
        if (!rawName) continue;

        // Extract card number from name (e.g. "Pansage #1" or "Charizard ex #180")
        let cardNum = '';
        const match = rawName.match(/#(\d+)(?:\s|$|[^0-9])/);
        if (match && match[1]) {
          cardNum = match[1];
        } else {
          // Check if name ends with digits or #digits
          const endMatch = rawName.match(/(\d+)$/);
          if (endMatch && endMatch[1]) {
            cardNum = endMatch[1];
          }
        }

        // Extract clean English card name by stripping `#<number>`
        let cleanName = rawName.replace(/\s*#\d+.*$/, '').trim();
        if (cleanName === rawName) {
          cleanName = rawName.replace(/\s*\d+$/, '').trim();
        }

        if (cardNum && cleanName) {
          totalCards++;
          const numStr = parseInt(cardNum, 10).toString();
          const priceNum = (card.price_numeric !== undefined && card.price_numeric !== null) ? Number(card.price_numeric) : undefined;

          // Map every set ID + card number to clean English name and real numeric price
          for (const sId of setIds) {
            namesMap[`${sId}-${cardNum}`] = cleanName;
            namesMap[`${sId}_ja-${cardNum}`] = cleanName;
            namesMap[`${sId}-${numStr}`] = cleanName;
            namesMap[`${sId}_ja-${numStr}`] = cleanName;

            if (priceNum !== undefined && !isNaN(priceNum)) {
              priceMap[`${sId}-${cardNum}`] = priceNum;
              priceMap[`${sId}_ja-${cardNum}`] = priceNum;
              priceMap[`${sId}-${numStr}`] = priceNum;
              priceMap[`${sId}_ja-${numStr}`] = priceNum;
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error processing ${cardsJsonPath}:`, e.message);
    }
  }
}

const pricesOutputPath = path.join(publicDir, 'ja-card-prices.json');
fs.writeFileSync(pricesOutputPath, JSON.stringify(priceMap), 'utf8');

const namesOutputPath = path.join(publicDir, 'ja-card-names.json');
fs.writeFileSync(namesOutputPath, JSON.stringify(namesMap), 'utf8');

console.log(`Compiled real Japanese card prices & names for ${totalSets} sets and ${totalCards} cards!`);
console.log(`Saved ${Object.keys(priceMap).length} price keys to ${pricesOutputPath}`);
console.log(`Saved ${Object.keys(namesMap).length} name keys to ${namesOutputPath}`);

