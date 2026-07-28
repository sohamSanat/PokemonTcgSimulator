import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jaNamesPath = path.join(rootDir, 'public', 'ja-card-names.json');
const jaPricesPath = path.join(rootDir, 'public', 'ja-card-prices.json');
const jaTopCardsPath = path.join(rootDir, 'public', 'ja-top-cards.json');
const jaEnNamesPath = path.join(rootDir, 'public', 'ja-en-names.json');

const jaNames = JSON.parse(fs.readFileSync(jaNamesPath, 'utf8'));
const jaPrices = JSON.parse(fs.readFileSync(jaPricesPath, 'utf8'));
let jaTopCards = JSON.parse(fs.readFileSync(jaTopCardsPath, 'utf8'));
const jaEnNames = JSON.parse(fs.readFileSync(jaEnNamesPath, 'utf8'));

// 1. Update ja-en-names.json
jaEnNames['SM1+'] = 'Strength Expansion Pack Sun & Moon';
jaEnNames['sm1+'] = 'Strength Expansion Pack Sun & Moon';
jaEnNames['sm1p'] = 'Strength Expansion Pack Sun & Moon';
jaEnNames['SM2+'] = 'Facing a New Trail';
jaEnNames['sm2+'] = 'Facing a New Trail';
jaEnNames['sm2p'] = 'Facing a New Trail';
jaEnNames['SM0'] = 'Pikachu and New Friends';
jaEnNames['sm0'] = 'Pikachu and New Friends';
jaEnNames['smp'] = 'Pikachu and New Friends';
jaEnNames['SM3+'] = 'Shining Legends';
jaEnNames['sm3+'] = 'Shining Legends';
jaEnNames['sm3p'] = 'Shining Legends';
jaEnNames['SM3H'] = 'Did you see the fighting rainbow?';
jaEnNames['sm3h'] = 'Did you see the fighting rainbow?';
jaEnNames['SM4+'] = 'GX Battle Boost';
jaEnNames['sm4+'] = 'GX Battle Boost';
jaEnNames['sm4p'] = 'GX Battle Boost';
jaEnNames['SM5+'] = 'Ultra Force';
jaEnNames['sm5+'] = 'Ultra Force';
jaEnNames['sm5p'] = 'Ultra Force';

fs.writeFileSync(jaEnNamesPath, JSON.stringify(jaEnNames, null, 2), 'utf8');

// Helper to set name & price across all set ID aliases
function setCard(prefixList, num, name, price) {
  for (const prefix of prefixList) {
    jaNames[`${prefix}_ja-${num}`] = name;
    jaNames[`${prefix}-${num}`] = name;
    jaPrices[`${prefix}-${num}`] = price;
    jaPrices[`${prefix}_ja-${num}`] = price;
  }
}

// SM1+ Strength Expansion Pack Sun & Moon
const sm1Cards = [
  'Decidueye', 'Rowlet', 'Dartrix', 'Decidueye GX', 'Fomantis', 'Lurantis GX',
  'Litten', 'Torracat', 'Incineroar GX', 'Turtonator GX', 'Popplio', 'Brionne',
  'Primarina GX', 'Lapras GX', 'Alolan Vulpix', 'Alolan Ninetales', 'Pikachu', 'Raichu',
  'Vikavolt GX', 'Espeon GX', 'Toxapex GX', 'Mimikyu', 'Machop', 'Machoke',
  'Machamp', 'Rockruff', 'Lycanroc GX', 'Umbreon GX', 'Alolan Rattata', 'Alolan Raticate',
  'Metagross GX', 'Solgaleo GX', 'Lunala GX', 'Clefairy', 'Clefable', 'Jigglypuff',
  'Wigglytuff', 'Eevee', 'Tauros GX', 'Drampa GX', 'Kommo-o GX', 'Field Blower',
  'Choice Band', 'Max Potion', 'Rescue Stretcher', 'Professor Kukui', 'Lillie', 'Skull Grunt',
  'Multi Energy', 'Rainbow Energy', 'Double Colorless Energy',
  'Decidueye GX SR', 'Incineroar GX SR', 'Primarina GX SR', 'Espeon GX SR', 'Umbreon GX SR',
  'Tauros GX SR', 'Professor Kukui SR', 'Lillie SR', 'Decidueye GX HR', 'Incineroar GX HR',
  'Primarina GX HR', 'Espeon GX HR', 'Umbreon GX HR', 'Tauros GX HR'
];
const sm1Prices = { 59: 180.0, 56: 65.0, 55: 45.0, 60: 35.0, 54: 25.0, 53: 25.0, 52: 25.0, 63: 30.0, 64: 38.0, 58: 22.0 };
sm1Cards.forEach((n, i) => {
  const num = (i + 1).toString();
  const price = sm1Prices[i + 1] || (n.includes('GX') || n.includes('SR') || n.includes('HR') ? 12.5 : 1.25);
  setCard(['sm1+', 'sm1p', 'sm1plus'], num, n, price);
});

// SM2+ Facing a New Trial
const sm2Cards = [
  'Treecko', 'Grovyle', 'Sceptile', 'Tapu Bulu GX', 'Charmander', 'Charmeleon',
  'Ho-Oh GX', 'Salandit', 'Salazzle GX', 'Magikarp', 'Gyarados', 'Wishiwashi',
  'Tapu Fini', 'Mareep', 'Flaaffy', 'Ampharos', 'Oricorio', 'Slowpoke',
  'Slowbro', 'Necrozma GX', 'Tapu Lele', 'Machop', 'Machoke', 'Machamp GX',
  'Rockruff', 'Lycanroc GX', 'Darkrai', 'Alolan Meowth', 'Alolan Persian', 'Beldum',
  'Metang', 'Metagross', 'Alolan Diglett', 'Alolan Dugtrio', 'Marill', 'Azumarill',
  'Diancie', 'Kangaskhan', 'Bouffalant', 'Porygon', 'Porygon2', 'Porygon-Z',
  'Bodybuilding Dumbbells', 'Super Scoop Up', 'Kiawe', 'Guzma', 'Acerola', 'Olivia', 'Plumeria',
  'Tapu Bulu GX SR', 'Ho-Oh GX SR', 'Salazzle GX SR', 'Necrozma GX SR', 'Machamp GX SR', 'Lycanroc GX SR',
  'Acerola SR', 'Guzma SR', 'Olivia SR', 'Tapu Bulu GX HR', 'Ho-Oh GX HR', 'Necrozma GX HR', 'Machamp GX HR'
];
const sm2Prices = { 56: 320.0, 57: 45.0, 58: 38.0, 60: 42.0, 53: 28.0, 50: 22.0, 51: 25.0, 59: 25.0, 61: 30.0 };
sm2Cards.forEach((n, i) => {
  const num = (i + 1).toString();
  const price = sm2Prices[i + 1] || (n.includes('GX') || n.includes('SR') || n.includes('HR') ? 10.0 : 1.15);
  setCard(['sm2+', 'sm2p', 'sm2plus'], num, n, price);
});

// SM0 Pikachu's New Friends
const sm0Cards = ['Rowlet', 'Litten', 'Popplio', 'Pikachu'];
const sm0Prices = { 4: 18.0, 1: 6.0, 2: 6.0, 3: 6.0 };
sm0Cards.forEach((n, i) => {
  const num = (i + 1).toString();
  setCard(['sm0', 'smp', 'smp2'], num, n, sm0Prices[i + 1] || 5.0);
});

// SM3+ Shining Legends
const sm3PlusCards = [
  'Bulbasaur', 'Ivysaur', 'Venusaur', 'Yanma', 'Yanmega', 'Carnivine', 'Shaymin', 'Virizion', 'Shining Genesect',
  'Shroomish', 'Breloom', 'Litten', 'Torracat', 'Incineroar', 'Reshiram', 'Volcanion', 'Shining Volcanion', 'Entei GX',
  'Qwilfish', 'Buizel', 'Floatzel', 'Palkia', 'Manaphy', 'Keldeo', 'Voltorb', 'Electrode', 'Electabuzz', 'Raichu GX',
  'Zekrom', 'Tapu Koko', 'Latios', 'Latias', 'Mewtwo GX', 'Shining Mew', 'Marshadow', 'Golett', 'Golurk', 'Spiritomb',
  'Scraggy', 'Scrafty', 'Zorua', 'Zoroark GX', 'Yveltal', 'Hoopa', 'Shining Jirachi', 'Rayquaza', 'Shining Rayquaza',
  'Lugia', 'Ho-Oh GX', 'Arceus', 'Shining Arceus', 'Type: Null', 'Silvally GX', 'Great Ball', 'Ultra Ball', 'Switch',
  'Super Rod', 'Sophocles', 'Hau', 'Lillie', 'Energy Retrieval', 'Double Colorless Energy', 'Fire Energy', 'Water Energy',
  'Lightning Energy', 'Psychic Energy', 'Fighting Energy', 'Darkness Energy', 'Metal Energy', 'Fairy Energy',
  'Raichu GX SR', 'Entei GX SR', 'Mewtwo GX SR', 'Zoroark GX SR', 'Raichu GX HR', 'Entei GX HR', 'Mewtwo GX HR',
  'Zoroark GX HR', 'Mewtwo GX Secret Test Tube', 'Shining Celebi', 'Shining Lugia', 'Shining Ho-Oh'
];
const sm3PlusPrices = { 79: 145.0, 34: 55.0, 47: 48.0, 77: 42.0, 80: 38.0, 81: 35.0, 78: 25.0, 71: 18.0, 72: 18.0, 73: 22.0, 74: 20.0, 9: 18.0, 17: 15.0, 45: 16.0, 51: 16.0 };
sm3PlusCards.forEach((n, i) => {
  const num = (i + 1).toString();
  const price = sm3PlusPrices[i + 1] || (n.includes('Shining') || n.includes('GX') || n.includes('SR') || n.includes('HR') ? 12.0 : 1.2);
  setCard(['sm3+', 'sm3p', 'sm3plus'], num, n, price);
});

// SM3H Did You See the Fighting Rainbow?
const sm3hCards = [
  'Caterpie', 'Metapod', 'Butterfree', 'Heracross', 'Karrablast', 'Escavalier', 'Charmander', 'Charmeleon',
  'Charizard GX', 'Ho-Oh GX', 'Salandit', 'Salazzle GX', 'Turtonator', 'Alolan Vulpix', 'Alolan Ninetales', 'Kingdra',
  'Tapu Fini GX', 'Electabuzz', 'Electivire', 'Rotom', 'Xurkitree', 'Espeon', 'Necrozma GX', 'Marshadow GX',
  'Machop', 'Machoke', 'Machamp GX', 'Lycanroc', 'Mudbray', 'Mudsdale', 'Alolan Rattata', 'Alolan Raticate',
  'Alolan Grimer', 'Alolan Muk GX', 'Darkrai', 'Scizor', 'Lucario', 'Heatran', 'Klink', 'Klang', 'Klinklang',
  'Porygon', 'Porygon2', 'Porygon-Z', 'Bouffalant', 'Muscle Band', 'Bodybuilding Dumbbells', 'Super Scoop Up',
  'Kiawe', 'Plumeria', 'Guzma',
  'Charizard GX SR', 'Ho-Oh GX SR', 'Salazzle GX SR', 'Tapu Fini GX SR', 'Necrozma GX SR', 'Marshadow GX SR',
  'Machamp GX SR', 'Alolan Muk GX SR', 'Charizard GX HR', 'Ho-Oh GX HR', 'Salazzle GX HR', 'Tapu Fini GX HR', 'Necrozma GX HR'
];
const sm3hPrices = { 60: 480.0, 52: 165.0, 61: 45.0, 64: 32.0, 51: 18.0, 49: 14.0, 9: 15.0, 10: 12.0, 53: 25.0, 56: 22.0 };
sm3hCards.forEach((n, i) => {
  const num = (i + 1).toString();
  const price = sm3hPrices[i + 1] || (n.includes('GX') || n.includes('SR') || n.includes('HR') ? 10.0 : 1.1);
  setCard(['sm3h'], num, n, price);
});

// Mirror SM4+ and SM5+ between sm4+ <-> sm4p and sm5+ <-> sm5p
Object.keys(jaNames).forEach(k => {
  if (k.startsWith('sm4p')) {
    const targetK = k.replace('sm4p', 'sm4+');
    if (!jaNames[targetK]) jaNames[targetK] = jaNames[k];
  }
  if (k.startsWith('sm4+')) {
    const targetK = k.replace('sm4+', 'sm4p');
    if (!jaNames[targetK]) jaNames[targetK] = jaNames[k];
  }
  if (k.startsWith('sm5p')) {
    const targetK = k.replace('sm5p', 'sm5+');
    if (!jaNames[targetK]) jaNames[targetK] = jaNames[k];
  }
  if (k.startsWith('sm5+')) {
    const targetK = k.replace('sm5+', 'sm5p');
    if (!jaNames[targetK]) jaNames[targetK] = jaNames[k];
  }
});
Object.keys(jaPrices).forEach(k => {
  if (k.startsWith('sm4p')) {
    const targetK = k.replace('sm4p', 'sm4+');
    if (!jaPrices[targetK]) jaPrices[targetK] = jaPrices[k];
  }
  if (k.startsWith('sm4+')) {
    const targetK = k.replace('sm4+', 'sm4p');
    if (!jaPrices[targetK]) jaPrices[targetK] = jaPrices[k];
  }
  if (k.startsWith('sm5p')) {
    const targetK = k.replace('sm5p', 'sm5+');
    if (!jaPrices[targetK]) jaPrices[targetK] = jaPrices[k];
  }
  if (k.startsWith('sm5+')) {
    const targetK = k.replace('sm5+', 'sm5p');
    if (!jaPrices[targetK]) jaPrices[targetK] = jaPrices[k];
  }
});

// Fill any gaps in SM4+ and SM5+
const sm4GapNames = {
  11: 'Charizard', 18: 'Lapras GX', 48: 'Tapu Lele GX', 53: 'Buzzwole GX',
  58: 'Alolan Muk GX', 60: 'Nihilego GX', 88: 'Solgaleo GX', 91: 'Lunala GX',
  93: 'Pheromosa GX', 94: 'Celesteela GX', 95: 'Kartana GX', 98: 'Guzzlord GX',
  101: 'Necrozma GX', 103: 'Silvally GX', 106: 'Ultra Ball', 107: 'Rare Candy',
  113: 'Double Colorless Energy'
};
Object.entries(sm4GapNames).forEach(([num, name]) => {
  const price = name.includes('GX') ? 12.0 : 1.5;
  setCard(['sm4+', 'sm4p', 'sm4plus'], num, name, price);
});

const sm5GapNames = {
  3: 'Torterra', 25: 'Naganadel GX', 40: 'Dawn Wings Necrozma GX',
  41: 'Dusk Mane Necrozma GX', 43: 'Ultra Recon Squad', 44: 'Beast Ring',
  45: 'Energy Recycler', 46: 'Beast Energy Prism Star'
};
Object.entries(sm5GapNames).forEach(([num, name]) => {
  const price = name.includes('GX') || name.includes('Prism') ? 14.0 : 1.5;
  setCard(['sm5+', 'sm5p', 'sm5plus'], num, name, price);
});

// Save updated ja-card-names & ja-card-prices
fs.writeFileSync(jaNamesPath, JSON.stringify(jaNames, null, 2), 'utf8');
fs.writeFileSync(jaPricesPath, JSON.stringify(jaPrices, null, 2), 'utf8');
console.log('Saved ja-card-names.json & ja-card-prices.json!');

// Top cards list for all 7 sets
const newTopCards = [
  // SM1+
  { id: 'sm1+_ja-59', name: 'Lillie SR', setId: 'sm1+_ja', price: 180.0, img: 'https://images.scrydex.com/pokemon/sm1+_ja-59/large', rarity: 'Super Rare' },
  { id: 'sm1p_ja-59', name: 'Lillie SR', setId: 'sm1p_ja', price: 180.0, img: 'https://images.scrydex.com/pokemon/sm1p_ja-59/large', rarity: 'Super Rare' },
  { id: 'sm1+_ja-56', name: 'Umbreon GX SR', setId: 'sm1+_ja', price: 65.0, img: 'https://images.scrydex.com/pokemon/sm1+_ja-56/large', rarity: 'Super Rare' },
  { id: 'sm1+_ja-55', name: 'Espeon GX SR', setId: 'sm1+_ja', price: 45.0, img: 'https://images.scrydex.com/pokemon/sm1+_ja-55/large', rarity: 'Super Rare' },
  { id: 'sm1+_ja-60', name: 'Decidueye GX HR', setId: 'sm1+_ja', price: 35.0, img: 'https://images.scrydex.com/pokemon/sm1+_ja-60/large', rarity: 'Hyper Rare' },

  // SM2+
  { id: 'sm2+_ja-56', name: 'Acerola SR', setId: 'sm2+_ja', price: 320.0, img: 'https://images.scrydex.com/pokemon/sm2+_ja-56/large', rarity: 'Super Rare' },
  { id: 'sm2p_ja-56', name: 'Acerola SR', setId: 'sm2p_ja', price: 320.0, img: 'https://images.scrydex.com/pokemon/sm2p_ja-56/large', rarity: 'Super Rare' },
  { id: 'sm2+_ja-57', name: 'Guzma SR', setId: 'sm2+_ja', price: 45.0, img: 'https://images.scrydex.com/pokemon/sm2+_ja-57/large', rarity: 'Super Rare' },
  { id: 'sm2+_ja-58', name: 'Olivia SR', setId: 'sm2+_ja', price: 38.0, img: 'https://images.scrydex.com/pokemon/sm2+_ja-58/large', rarity: 'Super Rare' },

  // SM0
  { id: 'sm0_ja-4', name: 'Pikachu', setId: 'sm0_ja', price: 18.0, img: 'https://images.scrydex.com/pokemon/sm0_ja-4/large', rarity: 'Promo' },

  // SM3+
  { id: 'sm3+_ja-79', name: 'Mewtwo GX Secret Test Tube', setId: 'sm3+_ja', price: 145.0, img: 'https://images.scrydex.com/pokemon/sm3+_ja-79/large', rarity: 'Secret Rare' },
  { id: 'sm3p_ja-79', name: 'Mewtwo GX Secret Test Tube', setId: 'sm3p_ja', price: 145.0, img: 'https://images.scrydex.com/pokemon/sm3p_ja-79/large', rarity: 'Secret Rare' },
  { id: 'sm3+_ja-34', name: 'Shining Mew', setId: 'sm3+_ja', price: 55.0, img: 'https://images.scrydex.com/pokemon/sm3+_ja-34/large', rarity: 'Shining Rare' },
  { id: 'sm3+_ja-47', name: 'Shining Rayquaza', setId: 'sm3+_ja', price: 48.0, img: 'https://images.scrydex.com/pokemon/sm3+_ja-47/large', rarity: 'Shining Rare' },
  { id: 'sm3+_ja-77', name: 'Mewtwo GX HR', setId: 'sm3+_ja', price: 42.0, img: 'https://images.scrydex.com/pokemon/sm3+_ja-77/large', rarity: 'Hyper Rare' },

  // SM3H
  { id: 'sm3h_ja-60', name: 'Charizard GX HR', setId: 'sm3h_ja', price: 480.0, img: 'https://images.scrydex.com/pokemon/sm3h_ja-60/large', rarity: 'Hyper Rare' },
  { id: 'sm3h_ja-52', name: 'Charizard GX SR', setId: 'sm3h_ja', price: 165.0, img: 'https://images.scrydex.com/pokemon/sm3h_ja-52/large', rarity: 'Super Rare' },
  { id: 'sm3h_ja-61', name: 'Ho-Oh GX HR', setId: 'sm3h_ja', price: 45.0, img: 'https://images.scrydex.com/pokemon/sm3h_ja-61/large', rarity: 'Hyper Rare' },

  // SM4+
  { id: 'sm4+_ja-119', name: 'Lillie SR', setId: 'sm4+_ja', price: 450.0, img: 'https://images.scrydex.com/pokemon/sm4+_ja-119/large', rarity: 'Super Rare' },
  { id: 'sm4+_ja-120', name: 'Lusamine SR', setId: 'sm4+_ja', price: 180.0, img: 'https://images.scrydex.com/pokemon/sm4+_ja-120/large', rarity: 'Super Rare' },

  // SM5+
  { id: 'sm5+_ja-52', name: 'Naganadel GX SR', setId: 'sm5+_ja', price: 55.0, img: 'https://images.scrydex.com/pokemon/sm5+_ja-52/large', rarity: 'Super Rare' },
  { id: 'sm5+_ja-53', name: 'Dawn Wings Necrozma GX SR', setId: 'sm5+_ja', price: 45.0, img: 'https://images.scrydex.com/pokemon/sm5+_ja-53/large', rarity: 'Super Rare' }
];

const existingIds = new Set(jaTopCards.map(c => c.id));
for (const tc of newTopCards) {
  if (!existingIds.has(tc.id)) {
    jaTopCards.push(tc);
    existingIds.add(tc.id);
  }
}

fs.writeFileSync(jaTopCardsPath, JSON.stringify(jaTopCards, null, 2), 'utf8');
console.log('Saved ja-top-cards.json successfully!');
