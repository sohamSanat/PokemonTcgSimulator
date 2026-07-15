import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priceChartsDir = path.resolve(__dirname, '../../Japanese-PriceCharts');
const publicDir = path.resolve(__dirname, '../public');

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
const allTopCards = [];
let totalSetsProcessed = 0;
let totalCardsCompiled = 0;

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

      // Filter and clean cards, ensuring they have numeric prices
      const validCards = cards
        .filter(c => c.price_numeric !== undefined && c.price_numeric !== null)
        .map(c => {
          let cardNum = '';
          const match = (c.name || '').match(/#(\d+)(?:\s|$|[^0-9])/);
          if (match && match[1]) {
            cardNum = match[1];
          } else {
            const endMatch = (c.name || '').match(/(\d+)$/);
            if (endMatch && endMatch[1]) {
              cardNum = endMatch[1];
            }
          }
          return {
            ...c,
            cardNum,
            price_numeric: Number(c.price_numeric)
          };
        })
        .filter(c => c.cardNum && !isNaN(c.price_numeric));

      // Sort by price descending
      validCards.sort((a, b) => b.price_numeric - a.price_numeric);

      // Take top 10 cards
      const top10 = validCards.slice(0, 10);

      for (const card of top10) {
        const nameParts = card.name.split('#');
        const cleanName = nameParts[0].trim();
        const displayName = cleanName.toLowerCase().startsWith('japanese') ? cleanName : `Japanese ${cleanName} (${setFolder})`;

        const cardId = `${setId}_ja-${card.cardNum}`;
        const cleanSet = setId.toLowerCase();
        
        // Image URL mapping: try Japanese card scan first
        let imgUrl = `https://images.scrydex.com/pokemon/${cleanSet}_ja-${card.cardNum}/large`;
        if (cleanSet.startsWith('base') || cleanSet.startsWith('neo') || cleanSet.startsWith('fo') || cleanSet.startsWith('ju') || cleanSet.startsWith('gc') || cleanSet.startsWith('gh')) {
          imgUrl = `https://images.pokemontcg.io/${cleanSet.replace(/1$|2$|3$|4$/, '')}/${card.cardNum}_hires.png`;
        }

        allTopCards.push({
          id: cardId,
          setId: `${setId}_ja`,
          num: card.cardNum,
          name: displayName,
          rawPrice: card.price_numeric,
          img: imgUrl
        });
        totalCardsCompiled++;
      }
    } catch (e) {
      console.error(`Error compiling set ${setFolder}:`, e.message);
    }
  }
}

// Sort all compiled top cards by rawPrice descending so our default pools have the absolute best chases first
allTopCards.sort((a, b) => b.rawPrice - a.rawPrice);

const outputPath = path.join(publicDir, 'ja-top-cards.json');
fs.writeFileSync(outputPath, JSON.stringify(allTopCards), 'utf8');

console.log(`Successfully compiled top 10 cards of each set for ${totalSetsProcessed} sets!`);
console.log(`Saved ${totalCardsCompiled} cards to ${outputPath}`);
