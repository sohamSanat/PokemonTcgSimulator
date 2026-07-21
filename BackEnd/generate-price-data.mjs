// ---------------------------------------------------------------------------
// generate-price-data.mjs
// 1) Merges all Japanese-PriceCharts/*/*/cards.json into ja-card-prices.json
// 2) Fetches English card prices from TCGdex API into en-card-prices.json
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT = join(import.meta.dirname, '..');
const PRICE_CHARTS = join(ROOT, 'FrontEnd', 'Japanese-PriceCharts');
const PUBLIC_DIR = join(ROOT, 'FrontEnd', 'PackOpeningUI', 'public');
if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

const JA_OUT = join(PUBLIC_DIR, 'ja-card-prices.json');
const EN_OUT = join(PUBLIC_DIR, 'en-card-prices.json');
const JA_EXISTING = existsSync(JA_OUT) ? JSON.parse(readFileSync(JA_OUT, 'utf8')) : {};
const EN_EXISTING = existsSync(EN_OUT) ? JSON.parse(readFileSync(EN_OUT, 'utf8')) : {};

// ── Japanese set-name → TCGdex ID mapping (derived from existing cache + known patterns) ──
const SET_NAME_TO_ID = {
  // Scarlet & Violet
  "Scarlet ex": "sv1a",
  "Violet ex": "sv1v",
  "Triplet Beat": "sv2",
  "Clay Burst": "sv2d",
  "Snow Hazard": "sv3",
  "Ruler of the Black Flame": "sv3",
  "Ancient Roar": "sv4",
  "Future Flash": "sv4",
  "Raging Surf": "sv4a",
  "Pokémon Card 151": "sv2a",
  "Cyber Judge": "sv5",
  "Wild Force": "sv5",
  "Crimson Haze": "sv6",
  "Mask of Change": "sv6",
  "Paradise Dragona": "sv7",
  "Stellar Miracle": "sv7",
  "Night Wanderer": "sv8",
  "Super Electric Breaker": "sv8",
  "Shiny Treasure ex": "sv4a",
  "Terastal Fest ex": "sv8a",
  "Transformation Mask": "sv9",
  "Battle Partners": "sv9",
  "Hot Air Arena": "sv10",
  "Glory of Team Rocket": "sv10",
  "Black Bolt": "sv12",
  "White Flare": "sv12",
  
  // Sword & Shield
  "Shield": "swsh1",
  "Sword": "swsh1",
  "Rebel Crush": "swsh1",
  "VMAX Rising": "swsh2",
  "Explosive Walker": "swsh3",
  "Infinity Zone": "swsh3",
  "Amazing Volt Tackle": "swsh4",
  "Jet-Black Spirit": "swsh5",
  "Single Strike Master": "swsh5",
  "Rapid Strike Master": "swsh6",
  "Peerless Fighters": "swsh6",
  "Silver Lance": "swsh6",
  "Blue Sky Stream": "swsh7",
  "Eevee Heroes": "swsh7",
  "Skyscraping Perfection": "swsh7",
  "Fusion Arts": "swsh8",
  "Star Birth": "swsh9",
  "Battle Region": "swsh10",
  "Time Gazer": "swsh10",
  "Space Juggler": "swsh10",
  "Dark Phantasma": "swsh10",
  "Lost Abyss": "swsh11",
  "Paradigm Trigger": "swsh12",
  "Incandescent Arcana": "swsh12",
  "VMAX Climax": "swsh8b",
  "Shiny Star V": "swsh4a",
  "Shiny Star V": "swsh4a",
  "25th Anniversary Collection": "swsh4a",
  "Matchless Fighters": "swsh5",
  "VSTAR Universe": "swsh12a",
  "Mugen Zone": "swsh5",
  "Legendary Heartbeat": "swsh5",
  "Pokémon GO": "pgo",
  
  // Sun & Moon
  "Alolan Moonlight": "sm1",
  "Collective Moon": "sm1",
  "Collective Sun": "sm1",
  "Islands Await You": "sm2",
  "Ultra Sun": "sm5",
  "Ultra Moon": "sm5",
  "Ultradimensional Beasts": "sm4",
  "Forbidden Light": "sm6",
  "Dragon Storm": "sm6",
  "Champion Road": "sm6",
  "Sky Legend": "sm6",
  "Fairy Rise": "sm6",
  "Full Metal Wall": "sm7",
  "Thunderclap Spark": "sm7a",
  "Super-Burst Impact": "sm8",
  "Dark Order": "sm8",
  "Sky-Splitting Charisma": "sm8",
  "Tag Bolt": "sm9",
  "Night Unison": "sm9",
  "Double Blaze": "sm10",
  "Remix Bout": "sm10",
  "Miracle Twin": "sm11",
  "Alter Genesis": "sm12",
  "Dream League": "sm12",
  "TAG TEAM GX: Tag All Stars": "sm12a",
  "GX Ultra Shiny": "sm8b",
  "GX Battle Boost": "sm8b",
  "Intense Fight in the Destroyed Sky": "sm8b",
  "Darkness that Consumes Light": "sm8b",
  "Awakened Heroes": "sm8b"
};

const SCRYDEX_API = 'https://api.scrydex.com/pokemon/v1/ja';
const TCGDEX_API = 'https://api.tcgdex.net/v2/en';

// ── Helpers ─────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractNumber(name) {
  const m = (name || '').match(/#(\d+)$/);
  return m ? m[1] : null;
}

// Normalize names for matching (remove special chars, lowercase)
const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

// ── PART 1: Japanese Prices ─────────────────────────────────────────────────
async function mergeJapanesePrices() {
  console.log('📀 Merging Japanese price charts...');
  const result = { ...JA_EXISTING };
  let added = 0;

  const eras = readdirSync(PRICE_CHARTS, { withFileTypes: true }).filter(d => d.isDirectory());

  for (const era of eras) {
    const eraPath = join(PRICE_CHARTS, era.name);
    const sets = readdirSync(eraPath, { withFileTypes: true }).filter(d => d.isDirectory());

    for (const set of sets) {
      const cardsJsonPath = join(eraPath, set.name, 'cards.json');
      if (!existsSync(cardsJsonPath)) continue;

      const data = JSON.parse(readFileSync(cardsJsonPath, 'utf8'));
      if (!data?.cards) continue;

      // Find the set ID from our mapping
      const setName = set.name.replace('Pokémon', 'POKEMON');
      let setId = null;
      
      // Check direct mapping
      for (const [key, val] of Object.entries(SET_NAME_TO_ID)) {
        if (normalize(key) === normalize(setName) || normalize(key) === normalize(set.name)) {
          setId = val;
          break;
        }
      }

      if (!setId) {
        // Try to find in existing cache keys
        for (const existingKey of Object.keys(JA_EXISTING)) {
          const [keySetId] = existingKey.split('-');
          if (existingKey.includes('_ja-') && keySetId) {
            setId = keySetId;
            break;
          }
        }
      }

      for (const card of data.cards) {
        const num = extractNumber(card.name);
        if (!num || !card.price_numeric) continue;

        if (setId) {
          const jaKey = `${setId}_ja-${num}`;
          if (!result[jaKey] || result[jaKey] !== card.price_numeric) {
            result[jaKey] = card.price_numeric;
            added++;
          }
          // Also add English-style key as fallback
          const enKey = `${setId}-${num}`;
          if (!result[enKey]) {
            result[enKey] = card.price_numeric;
          }
        }
      }
    }
  }

  writeFileSync(JA_OUT, JSON.stringify(result, null, 0));
  console.log(`✅ Japanese prices: ${Object.keys(result).length} total entries (${added} new)`);
}

// ── PART 2: English Prices from TCGdex ──────────────────────────────────────
async function fetchEnglishPrices() {
  console.log('\n📀 Fetching English prices from TCGdex API...');
  const result = { ...EN_EXISTING };
  let fetched = 0;

  try {
    // Get all English sets
    const setsRes = await fetch(`${TCGDEX_API}/sets`);
    if (!setsRes.ok) throw new Error(`Sets API: ${setsRes.status}`);
    const allSets = await setsRes.json();
    console.log(`  Found ${allSets.length} English sets`);

    // For each set, get cards with prices
    for (let i = 0; i < allSets.length; i++) {
      const set = allSets[i];
      const setId = set.id?.toLowerCase();
      if (!setId) continue;

      // Fetch the full set with card details
      await sleep(150); // rate limit
      const setRes = await fetch(`${TCGDEX_API}/sets/${setId}`);
      if (!setRes.ok) continue;
      const setData = await setRes.json();
      const cards = setData.cards || [];

      for (const card of cards) {
        const cardId = card.id?.toLowerCase();
        const localId = card.localId;
        if (!cardId || !localId) continue;

        // We need the full card data to get pricing
        await sleep(50);
        try {
          const cardRes = await fetch(`${TCGDEX_API}/cards/${cardId}`);
          if (!cardRes.ok) continue;
          const fullCard = await cardRes.json();
          
          // Extract tcgplayer price
          const tcg = fullCard?.pricing?.tcgplayer;
          let marketPrice = null;

          if (tcg) {
            // Try holo first, then normal, then reverse
            marketPrice = tcg.holofoil?.market ?? tcg.normal?.market ?? 
                          tcg.reverseHolofoil?.market ?? tcg.holofoil?.marketPrice ?? 
                          tcg.normal?.marketPrice ?? tcg.reverseHolofoil?.marketPrice;
          }

          if (marketPrice != null && marketPrice > 0) {
            const price = Number(marketPrice.toFixed(2));
            result[cardId] = price;
            result[`${setId}-${localId}`] = price;
            fetched++;
          }
        } catch {
          // Skip failed card fetches
        }
      }

      if ((i + 1) % 10 === 0) {
        console.log(`  Processed ${i + 1}/${allSets.length} sets (${Object.keys(result).length} prices)`);
      }
    }
  } catch (err) {
    console.error('  Error fetching English prices:', err.message);
  }

  writeFileSync(EN_OUT, JSON.stringify(result, null, 0));
  console.log(`✅ English prices: ${Object.keys(result).length} total entries (${fetched} new)`);
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('⚡ Pokemon TCG Price Data Generator\n');
  
  // Part 1: Japanese
  await mergeJapanesePrices();
  
  // Part 2: English (uncomment to run, requires API calls)
  console.log('\n⚠️  Skipping English fetch by default (requires ~5000+ API calls).');
  console.log('   Run: node generate-price-data.mjs --fetch-en to fetch English prices');
  
  if (process.argv.includes('--fetch-en')) {
    await fetchEnglishPrices();
  }
  
  console.log('\n✨ Done!');
}

main().catch(console.error);
