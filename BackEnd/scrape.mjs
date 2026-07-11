import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback market prices (USD) in case TCGPlayer API is unreachable or rate-limited
const FALLBACK_PRICES = {
  'Scarlet & Violet': 4.99,
  'Paldea Evolved': 6.49,
  'Obsidian Flames': 5.99,
  '151': 28.96,
  'Paradox Rift': 5.49,
  'Temporal Forces': 5.49,
  'Twilight Masquerade': 7.49,
  'Stellar Crown': 5.99,
  'Surging Sparks': 8.49,
  'Prismatic Evolutions': 15.99,
  'Journey Together': 6.99,
  'Destined Rivals': 7.49,
  'Mega Evolution': 5.99,
  'Phantasmal Flames': 11.11,
  'Ascended Heroes': 14.09,
  'Perfect Order': 5.92,
  'Chaos Rising': 6.39,
  'Sword & Shield': 10.99,
  'Rebel Clash': 13.49,
  'Darkness Ablaze': 10.99,
  'Vivid Voltage': 11.49,
  'Shining Fates': 7.99,
  'Battle Styles': 8.49,
  'Chilling Reign': 10.49,
  'Evolving Skies': 43.40,
  'Fusion Strike': 13.99,
  'Brilliant Stars': 11.99,
  'Astral Radiance': 8.99,
  'Lost Origin': 12.99,
  'Silver Tempest': 9.99,
  'Crown Zenith': 8.49
};

const SETS_TO_SCRAPE = [
  // Mega Evolution generation
  {
    name: 'Mega Evolution',
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon',
    aliases: ['me01', 'mega-evolution', 'mega evolution']
  },
  {
    name: 'Phantasmal Flames',
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon',
    aliases: ['me02', 'phantasmal-flames', 'phantasmal flames']
  },
  {
    name: 'Ascended Heroes',
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon',
    aliases: ['me02.5', 'me02pt5', 'ascended-heroes', 'ascended heroes']
  },
  {
    name: 'Perfect Order',
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon',
    aliases: ['me03', 'perfect-order', 'perfect order']
  },
  {
    name: 'Chaos Rising',
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon',
    aliases: ['me04', 'chaos-rising', 'chaos rising']
  },

  // Scarlet & Violet generation
  {
    name: 'Scarlet & Violet',
    url: 'https://www.tcgplayer.com/product/476451?page=1&Language=all',
    aliases: ['sv01', 'sv1', 'scarlet&violet', 'scarlet & violet base', 'scarlet & violet base set']
  },
  {
    name: 'Paldea Evolved',
    url: 'https://www.tcgplayer.com/product/493976?page=1&Language=all',
    aliases: ['sv02', 'sv2', 'paldea-evolved']
  },
  {
    name: 'Obsidian Flames',
    url: 'https://www.tcgplayer.com/product/501256?page=1&Language=all',
    aliases: ['sv03', 'sv3', 'obsidian-flames']
  },
  {
    name: '151',
    url: 'https://www.tcgplayer.com/product/504467?page=1&Language=all',
    aliases: ['sv03.5', 'sv03pt5', 'sv3pt5', 'me4', 'sve-151', 'sv035', 'sv35', 'meo']
  },
  {
    name: 'Paradox Rift',
    url: 'https://www.tcgplayer.com/product/512822?page=1&Language=all',
    aliases: ['sv04', 'sv4', 'paradox-rift']
  },
  {
    name: 'Temporal Forces',
    url: 'https://www.tcgplayer.com/product/532841?page=1&Language=all',
    aliases: ['sv05', 'sv5', 'temporal-forces']
  },
  {
    name: 'Twilight Masquerade',
    url: 'https://www.tcgplayer.com/product/543843?page=1&Language=all',
    aliases: ['sv06', 'sv6', 'twilight-masquared', 'twilight-masquerade']
  },
  {
    name: 'Stellar Crown',
    url: 'https://www.tcgplayer.com/product/557331?page=1&Language=all',
    aliases: ['sv07', 'sv7', 'stellar-crown']
  },
  {
    name: 'Surging Sparks',
    url: 'https://www.tcgplayer.com/product/565604?page=1&Language=all',
    aliases: ['sv08', 'sv8', 'surging-sparks']
  },
  {
    name: 'Prismatic Evolutions',
    url: 'https://www.tcgplayer.com/product/593294?page=1&Language=all',
    aliases: ['sv08.5', 'sv08pt5', 'sv8pt5', 'prismatic-evolution', 'prismatic evolution', 'prismatic-evolutions', 'sv085', 'sv85']
  },
  {
    name: 'Journey Together',
    url: 'https://www.tcgplayer.com/product/610935?page=1&Language=all',
    aliases: ['sv09', 'sv9', 'journey-togather', 'journey together', 'journey-together']
  },
  {
    name: 'Destined Rivals',
    url: 'https://www.tcgplayer.com/product/624683?page=1&Language=all',
    aliases: ['sv10', 'sv10a', 'destined-rivals']
  },

  // Sword & Shield generation
  {
    name: 'Sword & Shield',
    url: 'https://www.tcgplayer.com/product/206028?page=1&Language=all',
    aliases: ['swsh01', 'swsh1', 'sword&shield', 'sword & shield base', 'sword & shield base set', 'swsh']
  },
  {
    name: 'Rebel Clash',
    url: 'https://www.tcgplayer.com/product/210562?page=1&Language=all',
    aliases: ['swsh02', 'swsh2', 'rebel-clash']
  },
  {
    name: 'Darkness Ablaze',
    url: 'https://www.tcgplayer.com/product/216852?page=1&Language=all',
    aliases: ['swsh03', 'swsh3', 'darknessablaze', 'darkness-ablaze', 'DarknessAblaze']
  },
  {
    name: 'Vivid Voltage',
    url: 'https://www.tcgplayer.com/product/221312?page=1&Language=all',
    aliases: ['swsh04', 'swsh4', 'vivid-voltage', 'vivd-voltage']
  },
  {
    name: 'Shining Fates',
    url: 'https://www.tcgplayer.com/product/232636?page=1&Language=all',
    aliases: ['swsh04.5', 'swsh04pt5', 'swsh4.5', 'swsh4pt5', 'shining-fates', 'shiny-fates', 'shiny fates', 'swsh4.5sv', 'swsh45']
  },
  {
    name: 'Battle Styles',
    url: 'https://www.tcgplayer.com/product/229276?page=1&Language=all',
    aliases: ['swsh05', 'swsh5', 'battle-styles']
  },
  {
    name: 'Chilling Reign',
    url: 'https://www.tcgplayer.com/product/236257?page=1&Language=all',
    aliases: ['swsh06', 'swsh6', 'chilling-reign']
  },
  {
    name: 'Evolving Skies',
    url: 'https://www.tcgplayer.com/product/244337?page=1&Language=all',
    aliases: ['swsh07', 'swsh7', 'evolving-skies']
  },
  {
    name: 'Fusion Strike',
    url: 'https://www.tcgplayer.com/product/247646?page=1&Language=all',
    aliases: ['swsh08', 'swsh8', 'fusion-strike']
  },
  {
    name: 'Brilliant Stars',
    url: 'https://www.tcgplayer.com/product/256124?page=1&Language=all',
    aliases: ['swsh09', 'swsh9', 'brilliant-stars', 'brillinant-stars', 'swsh9tg']
  },
  {
    name: 'Astral Radiance',
    url: 'https://www.tcgplayer.com/product/265521?page=1&Language=all',
    aliases: ['swsh10', 'astral-radiance', 'swsh10tg']
  },
  {
    name: 'Lost Origin',
    url: 'https://www.tcgplayer.com/product/277325?page=1&Language=all',
    aliases: ['swsh11', 'lost-origin', 'swsh11tg']
  },
  {
    name: 'Silver Tempest',
    url: 'https://www.tcgplayer.com/product/283388?page=1&Language=all',
    aliases: ['swsh12', 'silver-tempest', 'swsh12tg']
  },
  {
    name: 'Crown Zenith',
    url: 'https://www.tcgplayer.com/product/453466?page=1&Language=all',
    aliases: ['swsh12.5', 'swsh12pt5', 'crown-zenith', 'swsh12.5gg', 'swsh125']
  }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPriceForSet(setObj) {
  const match = setObj.url.match(/product\/(\d+)/);
  if (!match) {
    console.warn(`[!] Could not extract product ID from URL for ${setObj.name}`);
    return FALLBACK_PRICES[setObj.name] || 10.99;
  }

  const productId = match[1];
  const apiUrl = `https://mpapi.tcgplayer.com/v2/product/${productId}/pricepoints`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': setObj.url
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP status ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      // Find Normal printing first, or just take first item
      const normalPoint = data.find(p => p.printingType === 'Normal' || p.printingType === 'Foil') || data[0];
      const price = normalPoint.marketPrice ?? normalPoint.listedMedianPrice;
      
      if (typeof price === 'number' && price > 0) {
        return Number(price.toFixed(2));
      }
    }
    
    throw new Error('No valid price found in response');
  } catch (err) {
    console.warn(`[!] Failed to scrape price for "${setObj.name}" (ID: ${productId}): ${err.message}. Using fallback price.`);
    return FALLBACK_PRICES[setObj.name] || 10.99;
  }
}

async function runScraper() {
  console.log('======================================================');
  console.log('  TCGPlayer Booster Pack Price Scraper');
  console.log('======================================================\n');
  console.log(`Scraping real-time pack prices for ${SETS_TO_SCRAPE.length} sets...\n`);

  const results = {};
  
  for (const setObj of SETS_TO_SCRAPE) {
    process.stdout.write(`Fetching price for "${setObj.name}"... `);
    const price = await fetchPriceForSet(setObj);
    console.log(`$${price.toFixed(2)}`);
    
    // Store under primary set name
    results[setObj.name] = price;
    
    // Store under lowercase name
    results[setObj.name.toLowerCase()] = price;
    
    // Store under normalized alphanumeric name
    const normName = setObj.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    results[normName] = price;

    // Store under all aliases
    if (setObj.aliases) {
      for (const alias of setObj.aliases) {
        results[alias] = price;
        results[alias.toLowerCase()] = price;
        results[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = price;
      }
    }

    // Be polite to TCGPlayer servers
    await sleep(250);
  }

  console.log('\n======================================================');
  console.log('  Saving Scraped Prices');
  console.log('======================================================\n');

  const jsonContent = JSON.stringify(results, null, 2);

  // 1. Save in BackEnd directory
  const backendFilePath = path.join(__dirname, 'set_pack_prices.json');
  fs.writeFileSync(backendFilePath, jsonContent, 'utf-8');
  console.log(`[✓] Saved to BackEnd/set_pack_prices.json`);

  // 2. Save in FrontEnd directory so UI can import it directly
  const frontendDataDir = path.resolve(__dirname, '../FrontEnd/PackOpeningUI/src/app/data');
  if (!fs.existsSync(frontendDataDir)) {
    fs.mkdirSync(frontendDataDir, { recursive: true });
  }
  const frontendFilePath = path.join(frontendDataDir, 'set_pack_prices.json');
  fs.writeFileSync(frontendFilePath, jsonContent, 'utf-8');
  console.log(`[✓] Saved to FrontEnd/PackOpeningUI/src/app/data/set_pack_prices.json`);

  console.log('\n[✓] Scraper completed successfully!');
}

runScraper().catch(err => {
  console.error('Fatal error during scraping:', err);
  process.exit(1);
});
