import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jaSetsPath = path.join(rootDir, 'public', 'ja-sets.json');
const jaEnNamesPath = path.join(rootDir, 'public', 'ja-en-names.json');
const setLogosManifestPath = path.join(rootDir, 'public', 'setLogos', 'manifest.json');
const setPackPricesPath = path.join(rootDir, 'src', 'app', 'data', 'set_pack_prices.json');
const setLogosDir = path.join(rootDir, 'public', 'setLogos');

console.log('--- Updating Japanese Sets Metadata ---');

// 1. Load ja-sets.json
let jaSets = JSON.parse(fs.readFileSync(jaSetsPath, 'utf8'));

// Modifying ja-sets.json:
// - Move sn11 -> sm11
// - Move sn10a -> sm10a
// - Remove XY11a (explosive warrior)
// - Remove XY11b (ruthless rebel)
// - Remove XY5a (Gaia Volcano with 70 cards)
// - Remove XY1a (Collection X with 60 cards)
// - Remove XY1b (Collection Y with 60 cards)

jaSets = jaSets.map(s => {
  if (s.id === 'sn11') return { ...s, id: 'sm11' };
  if (s.id === 'sn10a') return { ...s, id: 'sm10a' };
  return s;
});

const idsToRemove = new Set(['XY11a', 'XY11b', 'XY5a', 'XY1a', 'XY1b']);
jaSets = jaSets.filter(s => !idsToRemove.has(s.id));

fs.writeFileSync(jaSetsPath, JSON.stringify(jaSets, null, 2), 'utf8');
console.log('Updated ja-sets.json! Count:', jaSets.length);

// 2. Load ja-en-names.json
let jaEnNames = JSON.parse(fs.readFileSync(jaEnNamesPath, 'utf8'));

// Updates to ja-en-names.json:
// Japanese Sword & Shield:
// - miracle twin -> SM11 / sm11
// - gg end -> SM10a / sm10a
// - matchless fighters -> Peerless Fighters
// - mugen zone -> Infinity Zone
// - rebel crush -> Rebellion Crash

// Japanese Sun & Moon:
// - hikaru legend -> Shining Legend
// - sun & moon -> Strength Expansion Pack Sun & Moon
// - beyond the new trial / beyond the new.. -> Facing a New Trail
// - detective pikachu -> Pikachu's New Friend

// Japanese XY:
// - remove ruthless rebel (XY11b, CP5)
// - remove explosive warrior (XY11a)

// Remove deleted IDs
delete jaEnNames['XY11a'];
delete jaEnNames['XY11b'];
delete jaEnNames['CP5'];
delete jaEnNames['XY5a'];
delete jaEnNames['XY1a'];
delete jaEnNames['XY1b'];

// Rename / update keys
delete jaEnNames['sn11'];
delete jaEnNames['sn10a'];

jaEnNames['sm11'] = 'Miracle Twin';
jaEnNames['SM11'] = 'Miracle Twin';
jaEnNames['sm10a'] = 'G-G End';
jaEnNames['SM10a'] = 'G-G End';

jaEnNames['S5a'] = 'Peerless Fighters';
jaEnNames['S3'] = 'Infinity Zone';
jaEnNames['S2'] = 'Rebellion Crash';

jaEnNames['SM3+'] = 'Shining Legend';
jaEnNames['SM1+'] = 'Strength Expansion Pack Sun & Moon';
jaEnNames['sm2+'] = 'Facing a New Trail';
jaEnNames['SM2+'] = 'Facing a New Trail';
jaEnNames['SMP2'] = "Pikachu's New Friend";

fs.writeFileSync(jaEnNamesPath, JSON.stringify(jaEnNames, null, 2), 'utf8');
console.log('Updated ja-en-names.json!');

// 3. Fix Set Logos: Ultra Force (SM5+), GX Battle Boost (SM4+), Blue Shock (XY8a)
const sm5Logo = path.join(setLogosDir, 'sm5.png');
const sm4Logo = path.join(setLogosDir, 'sm4.png');
const xy8Logo = path.join(setLogosDir, 'xy8.png');

if (fs.existsSync(sm5Logo)) {
  fs.copyFileSync(sm5Logo, path.join(setLogosDir, 'sm5+_ja.png'));
  fs.copyFileSync(sm5Logo, path.join(setLogosDir, 'sm5plus_ja.png'));
}

if (fs.existsSync(sm4Logo)) {
  fs.copyFileSync(sm4Logo, path.join(setLogosDir, 'sm4+_ja.png'));
  fs.copyFileSync(sm4Logo, path.join(setLogosDir, 'sm4plus_ja.png'));
}

if (fs.existsSync(xy8Logo)) {
  fs.copyFileSync(xy8Logo, path.join(setLogosDir, 'xy8a_ja.png'));
}

let setLogosManifest = JSON.parse(fs.readFileSync(setLogosManifestPath, 'utf8'));

setLogosManifest['sm5+_ja'] = '/setLogos/sm5.png';
setLogosManifest['SM5+_ja'] = '/setLogos/sm5.png';
setLogosManifest['sm5+'] = '/setLogos/sm5.png';

setLogosManifest['sm4+_ja'] = '/setLogos/sm4.png';
setLogosManifest['SM4+_ja'] = '/setLogos/sm4.png';
setLogosManifest['sm4+'] = '/setLogos/sm4.png';

setLogosManifest['xy8a_ja'] = '/setLogos/xy8.png';
setLogosManifest['XY8a_ja'] = '/setLogos/xy8.png';
setLogosManifest['XY8a'] = '/setLogos/xy8.png';

// Update sm11 and sm10a in manifest if present
if (setLogosManifest['sn11_ja']) {
  setLogosManifest['sm11_ja'] = setLogosManifest['sn11_ja'];
  setLogosManifest['SM11_ja'] = setLogosManifest['sn11_ja'];
}
if (setLogosManifest['sn10a_ja']) {
  setLogosManifest['sm10a_ja'] = setLogosManifest['sn10a_ja'];
  setLogosManifest['SM10a_ja'] = setLogosManifest['sn10a_ja'];
}

fs.writeFileSync(setLogosManifestPath, JSON.stringify(setLogosManifest, null, 2), 'utf8');
console.log('Updated setLogos/manifest.json!');

// 4. Update set_pack_prices.json for sm11 / sm10a
let packPrices = JSON.parse(fs.readFileSync(setPackPricesPath, 'utf8'));
packPrices['sm11'] = packPrices['sn11'] || 25;
packPrices['sm11_ja'] = packPrices['sn11_ja'] || 25;
packPrices['sm10a'] = packPrices['sn10a'] || 13.96;
packPrices['sm10a_ja'] = packPrices['sn10a_ja'] || 13.96;

fs.writeFileSync(setPackPricesPath, JSON.stringify(packPrices, null, 2), 'utf8');
console.log('Updated set_pack_prices.json!');

console.log('--- All Metadata Updates Complete Successfully ---');
