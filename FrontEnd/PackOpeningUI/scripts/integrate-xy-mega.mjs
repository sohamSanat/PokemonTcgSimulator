import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const PRICE_CHARTS_ROOT = path.resolve(ROOT, '..', 'Japanese-PriceCharts');

const XY_SETS = [
  { folder: 'Collection X',               id: 'xy1x',   name: 'Collection X',                total: 51,  official: 51  },
  { folder: 'Collection Y',               id: 'xy1y',   name: 'Collection Y',                total: 47,  official: 47  },
  { folder: 'Rising Fist',                id: 'xy3',    name: 'Rising Fist',                 total: 84,  official: 84  },
  { folder: 'Gaia Volcano',               id: 'xy5g',   name: 'Gaia Volcano',                total: 48,  official: 48  },
  { folder: 'Tidal Storm',                id: 'xy5t',   name: 'Tidal Storm',                 total: 50,  official: 50  },
  { folder: 'Emerald Break',              id: 'xy6',    name: 'Emerald Break',               total: 70,  official: 70  },
  { folder: 'Bandit Ring',                id: 'xy7',    name: 'Bandit Ring',                 total: 74,  official: 74  },
  { folder: 'Red Flash',                  id: 'xy8r',   name: 'Red Flash',                   total: 49,  official: 49  },
  { folder: 'Blue Shock',                 id: 'xy8b',   name: 'Blue Shock',                  total: 46,  official: 46  },
  { folder: 'outrageous anger',           id: 'xy9',    name: 'Rage of the Broken Heavens',  total: 72,  official: 72  },
  { folder: 'Awakening super Psychic King', id: 'xy10', name: 'Awakening Psychic King',      total: 66,  official: 66  },
  { folder: 'Explosvie warrior',          id: 'xy11f',  name: 'Explosive Fighter',           total: 46,  official: 46  },
  { folder: 'Ruthless rebel',             id: 'xy11c',  name: 'Cruel Traitor',               total: 47,  official: 47  },
  { folder: 'Team magma vs Team aqua',    id: 'cp1',    name: 'Magma Gang vs Aqua Gang',     total: 27,  official: 27  },
  { folder: 'PokéKyun Collection',        id: 'cp3',    name: 'PokéKyun Collection',         total: 32,  official: 32  },
  { folder: 'Premium Champion',           id: 'cp4',    name: 'Premium Champion Pack',       total: 95,  official: 95  },
];

const XY_PACKART_ONLY = [
  { folder: 'Wild-Blaze',        id: 'xy2',   name: 'Wild Blaze',     total: 80,  official: 80  },
  { folder: 'Phantom-Gate',      id: 'xy4',   name: 'Phantom Gate',   total: 90,  official: 90  },
  { folder: 'Legendary-Kira',    id: 'cp2',   name: 'Legendary Shine',total: 54,  official: 54  },
];

const MEGA_SETS = [
  { folder: 'Mega Brave',     id: 'm1l',  name: 'Mega Brave',     total: 92,  official: 92  },
  { folder: 'Mega Symphonia', id: 'm1s',  name: 'Mega Symphonia', total: 91,  official: 91  },
  { folder: 'Inferno X',      id: 'm2',   name: 'Inferno X',      total: 116, official: 116 },
  { folder: 'munix Zero',     id: 'm3',   name: 'Nihil Zero',     total: 116, official: 116 },
];

function mergePriceData(sets, genFolder) {
  const pricesPath = path.join(PUBLIC, 'ja-card-prices.json');
  const existing = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
  let added = 0;
  for (const set of sets) {
    const cardsJsonPath = path.join(PRICE_CHARTS_ROOT, genFolder, set.folder, 'cards.json');
    if (!fs.existsSync(cardsJsonPath)) {
      console.warn(`  WARN: No cards.json for: ${set.folder}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
    const cards = data.cards || [];
    const rawId = set.id.toLowerCase();
    for (const card of cards) {
      const numMatch = card.name.match(/#(\d+)$/);
      if (!numMatch) continue;
      const num = numMatch[1];
      const price = typeof card.price_numeric === 'number' ? card.price_numeric : 0;
      const keys = [`${rawId}_ja-${num}`, `${rawId}-${num}`];
      for (const key of keys) {
        if (existing[key] === undefined) { existing[key] = price; added++; }
      }
    }
    console.log(`  OK: ${set.name} (${rawId}): ${cards.length} cards`);
  }
  fs.writeFileSync(pricesPath, JSON.stringify(existing), 'utf8');
  console.log(`  -> Added ${added} new price entries\n`);
}

function updateJaSets(sets) {
  const setsPath = path.join(PUBLIC, 'ja-sets.json');
  const existingSets = JSON.parse(fs.readFileSync(setsPath, 'utf8'));
  const existingIds = new Set(existingSets.map(s => s.id.toLowerCase()));
  let added = 0;
  for (const set of sets) {
    if (existingIds.has(set.id.toLowerCase())) {
      console.log(`  SKIP: ${set.name} (${set.id}) already exists`);
      continue;
    }
    existingSets.push({ id: set.id, name: set.name, cardCount: { total: set.total || 60, official: set.official || 60 } });
    existingIds.add(set.id.toLowerCase());
    added++;
    console.log(`  OK: Added ${set.name} (${set.id})`);
  }
  fs.writeFileSync(setsPath, JSON.stringify(existingSets, null, 2), 'utf8');
  console.log(`  -> Added ${added} sets\n`);
}

function updateManifest() {
  const manifestPath = path.join(PUBLIC, 'packArts', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let added = 0;
  const allXy = [...XY_SETS, ...XY_PACKART_ONLY];

  // XY sets
  const xyArtDir = path.join(PUBLIC, 'packArts', 'Japanese-XY');
  if (fs.existsSync(xyArtDir)) {
    for (const folderName of fs.readdirSync(xyArtDir)) {
      const fp = path.join(xyArtDir, folderName);
      if (!fs.statSync(fp).isDirectory()) continue;
      const imgs = fs.readdirSync(fp).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
      if (!imgs.length) continue;
      const urls = imgs.map(img => `/packArts/Japanese-XY/${folderName}/${img}`);
      const cf = folderName.toLowerCase().replace(/[^a-z0-9]/g,'');
      const match = allXy.find(s => cf === (s.folder||'').toLowerCase().replace(/[^a-z0-9]/g,''));
      const keys = match
        ? [match.id, `${match.id}_ja`, match.name.toLowerCase(), match.name.toLowerCase().replace(/[^a-z0-9]/g,'')]
        : [cf];
      for (const k of keys) { if (!manifest[k]) { manifest[k] = urls; added++; } }
      console.log(`  OK: XY: ${match ? match.name : folderName}`);
    }
  }

  // MegaEvolution sets
  const meArtDir = path.join(PUBLIC, 'packArts', 'Japanese-MegaEvolution');
  if (fs.existsSync(meArtDir)) {
    const items = fs.readdirSync(meArtDir);
    const rootImgs = items.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    const subFolders = items.filter(f => {
      try { return fs.statSync(path.join(meArtDir, f)).isDirectory(); } catch { return false; }
    });
    if (subFolders.length > 0) {
      for (const fn of subFolders) {
        const fp = path.join(meArtDir, fn);
        const imgs = fs.readdirSync(fp).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
        if (!imgs.length) continue;
        const urls = imgs.map(img => `/packArts/Japanese-MegaEvolution/${fn}/${img}`);
        const cf = fn.toLowerCase().replace(/[^a-z0-9]/g,'');
        const match = MEGA_SETS.find(s => cf === s.folder.toLowerCase().replace(/[^a-z0-9]/g,''));
        const keys = match ? [match.id, `${match.id}_ja`, match.name.toLowerCase(), match.name.toLowerCase().replace(/[^a-z0-9]/g,'')] : [cf];
        for (const k of keys) { if (!manifest[k]) { manifest[k] = urls; added++; } }
        console.log(`  OK: Mega folder: ${match ? match.name : fn}`);
      }
    }
    if (rootImgs.length > 0) {
      const urls = rootImgs.map(img => `/packArts/Japanese-MegaEvolution/${img}`);
      for (const set of MEGA_SETS) {
        for (const k of [set.id, `${set.id}_ja`, set.name.toLowerCase(), set.name.toLowerCase().replace(/[^a-z0-9]/g,'')]) {
          if (!manifest[k]) { manifest[k] = urls; added++; }
        }
      }
      if (!manifest['japanese-megaevolution']) { manifest['japanese-megaevolution'] = urls; added++; }
      console.log(`  OK: ${rootImgs.length} root Mega images -> all Mega sets`);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`  -> Added ${added} manifest entries\n`);
}

console.log('\nIntegrating Japanese XY & MegaEvolution\n');
console.log('Step 1: XY price data');
mergePriceData(XY_SETS, 'XY');
console.log('Step 2: MegaEvolution price data');
mergePriceData(MEGA_SETS, 'MegaEvolution');
console.log('Step 3: XY sets in ja-sets.json');
updateJaSets([...XY_SETS, ...XY_PACKART_ONLY]);
console.log('Step 4: Mega sets in ja-sets.json');
updateJaSets(MEGA_SETS);
console.log('Step 5: Pack art manifest');
updateManifest();
console.log('Done!');
