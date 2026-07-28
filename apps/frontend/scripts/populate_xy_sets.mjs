import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');

const jaCardNamesPath = path.join(publicDir, 'ja-card-names.json');
const jaCardPricesPath = path.join(publicDir, 'ja-card-prices.json');
const jaEnNamesPath = path.join(publicDir, 'ja-en-names.json');

const jaCardNames = JSON.parse(fs.readFileSync(jaCardNamesPath, 'utf8'));
const jaCardPrices = JSON.parse(fs.readFileSync(jaCardPricesPath, 'utf8'));
const jaEnNames = JSON.parse(fs.readFileSync(jaEnNamesPath, 'utf8'));

function setCardData(setAliases, cardNum, name, price) {
  for (const alias of setAliases) {
    const k1 = `${alias}_ja-${cardNum}`;
    const k2 = `${alias}-${cardNum}`;
    const k3 = `${alias.toLowerCase()}_ja-${cardNum}`;
    const k4 = `${alias.toLowerCase()}-${cardNum}`;
    
    jaCardNames[k1] = name;
    jaCardNames[k2] = name;
    jaCardNames[k3] = name;
    jaCardNames[k4] = name;

    jaCardPrices[k1] = price;
    jaCardPrices[k2] = price;
    jaCardPrices[k3] = price;
    jaCardPrices[k4] = price;
  }
}

// 1. Red Flash (XY8b / xy8r / xy8r_ja / xy8red) - 65 cards (59 main + 6 Secret Rares)
const xy8bCards = [
  { num: 1, name: 'Oddish', price: 1.2 },
  { num: 2, name: 'Gloom', price: 2.0 },
  { num: 3, name: 'Vileplume', price: 5.5 },
  { num: 4, name: 'Bellossom', price: 4.0 },
  { num: 5, name: 'Combee', price: 1.0 },
  { num: 6, name: 'Vespiquen', price: 7.5 },
  { num: 7, name: 'Phantump', price: 1.5 },
  { num: 8, name: 'Trevenant', price: 4.0 },
  { num: 9, name: 'Cyndaquil', price: 2.0 },
  { num: 10, name: 'Quilava', price: 3.0 },
  { num: 11, name: 'Typhlosion', price: 9.5 },
  { num: 12, name: 'Houndoom EX', price: 18.0 },
  { num: 13, name: 'M Houndoom EX', price: 45.0 },
  { num: 14, name: 'Fletchinder', price: 1.5 },
  { num: 15, name: 'Talonflame', price: 4.2 },
  { num: 16, name: 'Psyduck', price: 1.8 },
  { num: 17, name: 'Golduck BREAK', price: 12.0 },
  { num: 18, name: 'Staryu', price: 1.0 },
  { num: 19, name: 'Starmie', price: 2.5 },
  { num: 20, name: 'Pikachu', price: 8.0 },
  { num: 21, name: 'Raichu', price: 5.5 },
  { num: 22, name: 'Magnemite', price: 1.2 },
  { num: 23, name: 'Magneton', price: 2.2 },
  { num: 24, name: 'Mewtwo EX (Shatter Shot)', price: 32.0 },
  { num: 25, name: 'M Mewtwo EX (Psychic Infinity Y)', price: 140.0 },
  { num: 26, name: 'Gastly', price: 1.5 },
  { num: 27, name: 'Haunter', price: 2.5 },
  { num: 28, name: 'Gengar', price: 8.5 },
  { num: 29, name: 'Wobbuffet', price: 4.0 },
  { num: 30, name: 'Elgyem', price: 1.0 },
  { num: 31, name: 'Beheeyem', price: 2.2 },
  { num: 32, name: 'Sandshrew', price: 1.2 },
  { num: 33, name: 'Sandslash', price: 2.8 },
  { num: 34, name: 'Swinub', price: 1.0 },
  { num: 35, name: 'Piloswine', price: 2.0 },
  { num: 36, name: 'Mamoswine', price: 4.5 },
  { num: 37, name: 'Cranidos', price: 1.8 },
  { num: 38, name: 'Rampardos', price: 5.0 },
  { num: 39, name: 'Granbull', price: 2.5 },
  { num: 40, name: 'Snubbull', price: 1.5 },
  { num: 41, name: 'Cacturne', price: 2.2 },
  { num: 42, name: 'Yveltal', price: 6.5 },
  { num: 43, name: 'Pinsir', price: 1.8 },
  { num: 44, name: 'Doduo', price: 1.0 },
  { num: 45, name: 'Dodrio', price: 2.2 },
  { num: 46, name: 'Bouffalant', price: 2.5 },
  { num: 47, name: 'Reserved Ticket', price: 3.5 },
  { num: 48, name: 'Town Map', price: 5.0 },
  { num: 49, name: 'Parallel City', price: 8.0 },
  { num: 50, name: 'Judge', price: 7.0 },
  { num: 51, name: 'Fisherman', price: 4.5 },
  { num: 52, name: 'Brigette', price: 12.0 },
  { num: 53, name: 'Houndoom Spirit Link', price: 3.5 },
  { num: 54, name: 'Mewtwo Spirit Link', price: 4.0 },
  { num: 55, name: 'Burning Energy', price: 5.0 },
  { num: 56, name: 'Flash Energy', price: 4.5 },
  { num: 57, name: 'Rainbow Energy', price: 6.0 },
  { num: 58, name: 'Houndoom EX SR', price: 48.0 },
  { num: 59, name: 'M Houndoom EX SR', price: 78.0 },
  { num: 60, name: 'Mewtwo EX SR (Psychic Burst)', price: 110.0 },
  { num: 61, name: 'M Mewtwo EX SR (Psychic Infinity Red Y)', price: 240.0 },
  { num: 62, name: 'Judge SR', price: 125.0 },
  { num: 63, name: 'Brigette SR (Azusa Full Art)', price: 185.0 },
  { num: 64, name: 'Mewtwo EX Secret Gold FA', price: 320.0 },
  { num: 65, name: 'M Mewtwo EX Gold Secret Y', price: 480.0 }
];

for (const c of xy8bCards) {
  setCardData(['XY8b', 'xy8b', 'XY8r', 'xy8r', 'XY8red', 'xy8red', 'red flash'], c.num, c.name, c.price);
}

// 2. Blue Shock (XY8a / xy8a_ja / xy8blue) - 65 cards
const xy8aCards = [
  { num: 1, name: 'Pinsir', price: 1.5 },
  { num: 2, name: 'Paras', price: 1.0 },
  { num: 3, name: 'Parasect', price: 2.0 },
  { num: 4, name: 'Cacnea', price: 1.0 },
  { num: 5, name: 'Cacturne', price: 2.5 },
  { num: 6, name: 'Snivy', price: 1.2 },
  { num: 7, name: 'Servine', price: 2.0 },
  { num: 8, name: 'Serperior', price: 4.5 },
  { num: 9, name: 'Chesnaught BREAK', price: 8.0 },
  { num: 10, name: 'Pansear', price: 1.0 },
  { num: 11, name: 'Simisear', price: 2.2 },
  { num: 12, name: 'Remoraid', price: 1.5 },
  { num: 13, name: 'Octillery', price: 9.5 },
  { num: 14, name: 'Panpour', price: 1.0 },
  { num: 15, name: 'Simipour', price: 2.2 },
  { num: 16, name: 'Glalie EX', price: 12.0 },
  { num: 17, name: 'M Glalie EX', price: 24.0 },
  { num: 18, name: 'Froakie', price: 1.5 },
  { num: 19, name: 'Frogadier', price: 3.0 },
  { num: 20, name: 'Greninja', price: 15.0 },
  { num: 21, name: 'Pikachu', price: 7.5 },
  { num: 22, name: 'Raichu BREAK', price: 14.0 },
  { num: 23, name: 'Magnemite', price: 1.0 },
  { num: 24, name: 'Magneton', price: 2.0 },
  { num: 25, name: 'Magnezone', price: 6.0 },
  { num: 26, name: 'Stunfisk', price: 1.2 },
  { num: 27, name: 'Mewtwo EX (Photon Wave)', price: 28.0 },
  { num: 28, name: 'M Mewtwo EX (Vanishing Strike X)', price: 85.0 },
  { num: 29, name: 'Cresselia', price: 5.5 },
  { num: 30, name: 'Woobat', price: 1.0 },
  { num: 31, name: 'Swoobat', price: 2.2 },
  { num: 32, name: 'Cubone', price: 1.5 },
  { num: 33, name: 'Marowak BREAK', price: 10.0 },
  { num: 34, name: 'Swinub', price: 1.0 },
  { num: 35, name: 'Piloswine', price: 2.0 },
  { num: 36, name: 'Mamoswine', price: 4.8 },
  { num: 37, name: 'Hippopotas', price: 1.2 },
  { num: 38, name: 'Hippowdon', price: 3.2 },
  { num: 39, name: 'Gallade', price: 6.5 },
  { num: 40, name: 'Hawlucha', price: 2.0 },
  { num: 41, name: 'Zorua', price: 2.5 },
  { num: 42, name: 'Zoroark', price: 8.0 },
  { num: 43, name: 'Zoroark BREAK', price: 18.0 },
  { num: 44, name: 'Yveltal', price: 7.0 },
  { num: 45, name: 'Inkay', price: 1.0 },
  { num: 46, name: 'Malamar', price: 2.8 },
  { num: 47, name: 'Skarmory', price: 2.2 },
  { num: 48, name: 'Ralts', price: 1.5 },
  { num: 49, name: 'Kirlia', price: 2.5 },
  { num: 50, name: 'Gardevoir', price: 7.5 },
  { num: 51, name: 'Meowth', price: 1.8 },
  { num: 52, name: 'Persian', price: 3.0 },
  { num: 53, name: 'Doduo', price: 1.0 },
  { num: 54, name: 'Dodrio', price: 2.2 },
  { num: 55, name: 'Snorlax', price: 6.0 },
  { num: 56, name: 'Smeargle', price: 5.5 },
  { num: 57, name: 'Giovanni\'s Scheme', price: 16.0 },
  { num: 58, name: 'Buddy-Buddy Rescue', price: 3.5 },
  { num: 59, name: 'Float Stone', price: 12.0 },
  { num: 60, name: 'Glalie EX SR', price: 35.0 },
  { num: 61, name: 'M Glalie EX SR', price: 55.0 },
  { num: 62, name: 'Mewtwo EX SR (Blue X)', price: 95.0 },
  { num: 63, name: 'M Mewtwo EX SR (Blue X)', price: 190.0 },
  { num: 64, name: 'Giovanni\'s Scheme SR', price: 135.0 },
  { num: 65, name: 'Mewtwo EX Gold Secret X', price: 310.0 }
];

for (const c of xy8aCards) {
  setCardData(['XY8a', 'xy8a', 'XY8blue', 'xy8blue', 'blue shock'], c.num, c.name, c.price);
}

// Write updated JSON files
fs.writeFileSync(jaCardNamesPath, JSON.stringify(jaCardNames, null, 2), 'utf8');
fs.writeFileSync(jaCardPricesPath, JSON.stringify(jaCardPrices, null, 2), 'utf8');

console.log('Successfully fixed Red Flash and Blue Shock card names and prices!');
