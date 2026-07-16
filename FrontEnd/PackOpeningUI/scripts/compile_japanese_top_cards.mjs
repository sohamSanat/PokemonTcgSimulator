import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priceChartsDir = path.resolve(__dirname, '../../Japanese-PriceCharts');
const publicDir = path.resolve(__dirname, '../public');

// ----- SCRYDEX IMAGE VALIDATION -----
// scrydex.com always returns HTTP 200 — even for non-existent cards (serves card back).
// The card back placeholder is a fixed 186,316 byte file.
// We fingerprint it once, then reject any image that has the same size.

const SCRYDEX_BASE = 'https://images.scrydex.com';
let scrydexCardBackSize = null;  // bytes, set after fingerprint fetch

async function fetchScrydexCardBackSize() {
  try {
    const r = await fetch(`${SCRYDEX_BASE}/pokemon/NONEXISTENT_FINGERPRINT_XYZ_00000/large`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }
    });
    const buf = await r.arrayBuffer();
    scrydexCardBackSize = buf.byteLength;
    console.log(`[Fingerprint] scrydex card-back size = ${scrydexCardBackSize} bytes`);
  } catch (e) {
    console.warn('[Fingerprint] Failed to get scrydex card-back fingerprint:', e.message);
    scrydexCardBackSize = 186316; // known value from probe
  }
}

// Returns true if the URL points to a real card image (not the card back placeholder)
// Uses HEAD where possible; falls back to full fetch for scrydex (which ignores HEAD content-length)
async function isScrydexUrlReal(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' }
    });
    clearTimeout(timer);
    if (!r.ok) return false;
    const buf = await r.arrayBuffer();
    const size = buf.byteLength;
    if (scrydexCardBackSize !== null && size === scrydexCardBackSize) {
      return false; // placeholder card back
    }
    // Sanity: real card images are typically > 50 KB
    if (size < 50000) return false;
    return true;
  } catch {
    return false;
  }
}

// Validate a batch of {url, meta} objects concurrently, return those that pass
async function validateBatch(items, concurrency = 12) {
  const results = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const slice = items.slice(i, i + concurrency);
    const checks = await Promise.all(
      slice.map(async item => ({ item, ok: await isScrydexUrlReal(item.url) }))
    );
    for (const { item, ok } of checks) {
      if (ok) results.push(item);
    }
    process.stdout.write(`  validated ${Math.min(i + concurrency, items.length)}/${items.length} URLs...\r`);
  }
  console.log('');
  return results;
}

// Folder name to set ID overrides if redirect_link is missing
const folderToIdMap = {
  "ancient roar": "sv4k",
  "battle partners": "sv9",
  "black bolt": "sv11b",
  "clay burst": "sv2d",
  "crimson haze": "sv6m",
  "cyber judge": "sv5m",
  "future flash": "sv4m",
  "glory of team rocket": "sv8a",
  "hot air arena": "sv7a",
  "night wanderer": "sv6a",
  "paradise dragona": "sv7a",
  "pokémon card 151": "sv3pt5",
  "pokemon card 151": "sv3pt5",
  "raging surf": "sv3a",
  "ruler of the black flame": "sv3",
  "scarlet ex": "sv1s",
  "shiny treasure ex": "sv4a",
  "snow hazard": "sv2p",
  "stellar miracle": "sv7",
  "super electric breaker": "sv8",
  "terastal fest ex": "sv8a",
  "transformation mask": "sv6",
  "triplet beat": "sv1a",
  "violet ex": "sv1v",
  "white flare": "sv11a",
  "wild force": "sv5k",
  "eevee heroes": "s6a",
  "vstar universe": "s12a",
  "vmax climax": "s8b",
  "shiny star v": "s4a",
  "blue sky stream": "s7r",
  "lost abyss": "s11",
  "paradigm trigger": "s12",
  "star birth": "s9",
  "tag bolt": "sm9",
  "dream league": "sm11b",
  "alter genesis": "sm12",
  "tag team gx_ tag all stars": "sm12a",
  "gx ultra shiny": "sm8b"
};

const generations = ['Scarlet & Violet', 'Sword & Shield', 'Sun & Moon'];

// Collect candidate cards first (no network), then bulk-validate images
const candidates = []; // { id, setId, num, name, rawPrice, img }
let totalSetsProcessed = 0;

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

      let setId = '';
      if (meta.redirect_link) {
        const parts = meta.redirect_link.split('/');
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart) {
          setId = lastPart.replace(/_ja$/i, '').replace(/_ja_ja$/i, '').toLowerCase();
        }
      }

      if (!setId) {
        const normFolder = setFolder.trim().toLowerCase();
        setId = folderToIdMap[normFolder] || normFolder.replace(/\s+/g, '-');
      }

      if (!setId) continue;
      totalSetsProcessed++;

      const validCards = cards
        .filter(c => c.price_numeric !== undefined && c.price_numeric !== null)
        .map(c => {
          let cardNum = '';
          const match = (c.name || '').match(/#(\d+)(?:\s|$|[^0-9])/);
          if (match && match[1]) {
            cardNum = match[1];
          } else {
            const endMatch = (c.name || '').match(/(\d+)$/);
            if (endMatch && endMatch[1]) cardNum = endMatch[1];
          }
          return { ...c, cardNum, price_numeric: Number(c.price_numeric) };
        })
        .filter(c => c.cardNum && !isNaN(c.price_numeric));

      validCards.sort((a, b) => b.price_numeric - a.price_numeric);
      const top50 = validCards.filter(c => c.price_numeric >= 2.0).slice(0, 50);

      for (const card of top50) {
        const nameParts = card.name.split('#');
        const cleanName = nameParts[0].trim();
        const cleanSet = setId.toLowerCase();
        const isVintage = cleanSet.startsWith('base') || cleanSet.startsWith('neo') ||
          cleanSet.startsWith('fo') || cleanSet.startsWith('ju') ||
          cleanSet.startsWith('gc') || cleanSet.startsWith('gh');

        // Japanese version
        const jpCardId = `${setId}_ja-${card.cardNum}`;
        const jpDisplayName = cleanName.toLowerCase().startsWith('japanese') ? cleanName : `Japanese ${cleanName} (${setFolder})`;
        let jpImgUrl = `https://images.scrydex.com/pokemon/${cleanSet}_ja-${card.cardNum}/large`;
        if (isVintage) {
          jpImgUrl = `https://images.pokemontcg.io/${cleanSet.replace(/1$|2$|3$|4$/, '')}/${card.cardNum}_hires.png`;
        }

        candidates.push({ id: jpCardId, setId: `${setId}_ja`, num: card.cardNum, name: jpDisplayName, rawPrice: card.price_numeric, img: jpImgUrl, _isVintage: isVintage });

        // English version (ONLY for vintage cards like Base/Neo where pokemontcg.io hosts English equivalents; never for modern Japanese sets where Scrydex returns card backs for non-_ja codes)
        if (isVintage) {
          const engCardId = `${setId}-${card.cardNum}`;
          const engDisplayName = `${cleanName} (${setFolder})`;
          const engImgUrl = `https://images.pokemontcg.io/${cleanSet.replace(/1$|2$|3$|4$/, '')}/${card.cardNum}_hires.png`;
          candidates.push({ id: engCardId, setId: `${setId}`, num: card.cardNum, name: engDisplayName, rawPrice: card.price_numeric, img: engImgUrl, _isVintage: true });
        }
      }
    } catch (e) {
      console.error(`Error compiling set ${setFolder}:`, e.message);
    }
  }
}

console.log(`\nCollected ${candidates.length} candidate cards from ${totalSetsProcessed} sets.`);

// Separate vintage (uses pokemontcg.io → proper 404) from modern (uses scrydex → 186KB card back)
const vintageCandidates = candidates.filter(c => c._isVintage);
const modernCandidates  = candidates.filter(c => !c._isVintage);

console.log(`Vintage (skip validation): ${vintageCandidates.length}`);
console.log(`Modern (need scrydex validation): ${modernCandidates.length}`);

// Get scrydex card-back fingerprint, then validate modern cards
await fetchScrydexCardBackSize();

console.log('\nValidating modern card image URLs against scrydex card-back fingerprint...');
const validatedModern = await validateBatch(
  modernCandidates.map(c => ({ url: c.img, meta: c })),
  12
).then(items => items.map(i => i.meta));

const allValidCards = [
  ...vintageCandidates,
  ...validatedModern
].map(({ _isVintage, ...card }) => card); // strip internal _isVintage field

// Sort all by rawPrice descending
allValidCards.sort((a, b) => b.rawPrice - a.rawPrice);

const outputPath = path.join(publicDir, 'ja-top-cards.json');
fs.writeFileSync(outputPath, JSON.stringify(allValidCards), 'utf8');

console.log(`\n✅ Compiled ${allValidCards.length} verified cards (removed ${candidates.length - allValidCards.length} card-back placeholders)`);
console.log(`Saved to ${outputPath}`);
