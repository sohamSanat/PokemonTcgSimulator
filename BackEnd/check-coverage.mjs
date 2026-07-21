import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, sep } from 'path';

const PRICE_CHARTS = join('..', 'FrontEnd', 'Japanese-PriceCharts');
const JA_PRICES = join('..', 'FrontEnd', 'PackOpeningUI', 'public', 'ja-card-prices.json');
const EN_PRICES = join('..', 'FrontEnd', 'PackOpeningUI', 'public', 'en-card-prices.json');

// Load existing caches
const jaCache = JSON.parse(readFileSync(JA_PRICES, 'utf8'));
const enCache = JSON.parse(readFileSync(EN_PRICES, 'utf8'));

const jaKeys = Object.keys(jaCache);
const enKeys = Object.keys(enCache);

console.log(`ja-card-prices.json: ${jaKeys.length} entries`);
console.log(`en-card-prices.json: ${enKeys.length} entries`);

// Count unique Japanese set IDs from ja-cache
const jaSetIds = new Set(jaKeys.map(k => k.replace(/_ja_ja.*$/, '').replace(/_ja.*$/, '').split('-')[0]));
console.log(`Unique set IDs in ja-cache: ${jaSetIds.size}`);

// Count unique English set IDs from en-cache
const enSetIds = new Set(enKeys.map(k => k.split('-')[0]));
console.log(`Unique set IDs in en-cache: ${enSetIds.size}`);

// Read all price chart files
const eras = readdirSync(PRICE_CHARTS, { withFileTypes: true }).filter(d => d.isDirectory());
let totalPriceChartCards = 0;
const allPriceChartNames = new Set();

for (const era of eras) {
  const eraPath = join(PRICE_CHARTS, era.name);
  const sets = readdirSync(eraPath, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const set of sets) {
    const cardsJsonPath = join(eraPath, set.name, 'cards.json');
    if (!existsSync(cardsJsonPath)) continue;
    const data = JSON.parse(readFileSync(cardsJsonPath, 'utf8'));
    if (!data.cards) continue;
    totalPriceChartCards += data.cards.length;
    for (const card of data.cards) {
      const num = (card.name || '').match(/#(\d+)$/);
      if (num) {
        allPriceChartNames.add(`${set.name}-${num[1]}`);
      }
    }
  }
}

console.log(`\nJapanese-PriceCharts: ${totalPriceChartCards} cards across ${sets ? sets.length : 0} sets`);
console.log(`Price chart unique set-card combos: ${allPriceChartNames.size}`);

// Check ja-cache for entries matching price chart patterns
const jaPriceKeys = jaKeys.filter(k => !k.includes('tag team') && !k.includes('ultra sun') && !k.includes('ultra moon') && !k.includes('thunderclap'));
console.log(`\nJapanese cache keys (excluding known alias patterns): ${jaPriceKeys.length}`);

// Check how many en-cache entries are from the theme pools
console.log(`\n--- English price data coverage ---`);
const themePoolKeyCount = enKeys.length;
console.log(`Theme-pool cards in en-cache: ${themePoolKeyCount}`);

// Sample the en-cache to see its structure
console.log(`\nSample en-cache keys:`);
enKeys.slice(0, 10).forEach(k => console.log(`  ${k}: ${enCache[k]}`));
