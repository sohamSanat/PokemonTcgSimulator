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

console.log('--- Updating Japanese BW & HGSS / Legend Metadata ---');

// 1. Update ja-sets.json
let jaSets = JSON.parse(fs.readFileSync(jaSetsPath, 'utf8'));

// Check if Shiny Collection (SC) is present, if not add it
if (!jaSets.some(s => s.id === 'SC')) {
  // Insert SC into BW section (after EBB or before BW1)
  const scSet = {
    id: 'SC',
    name: 'コンセプトパック シャイニーコレクション',
    cardCount: {
      total: 25,
      official: 20
    }
  };
  
  // Find index of EBB or BW9
  const ebbIdx = jaSets.findIndex(s => s.id === 'EBB' || s.id === 'BW9');
  if (ebbIdx !== -1) {
    jaSets.splice(ebbIdx + 1, 0, scSet);
  } else {
    jaSets.push(scSet);
  }
}

fs.writeFileSync(jaSetsPath, JSON.stringify(jaSets, null, 2), 'utf8');
console.log('Updated ja-sets.json!');

// 2. Update ja-en-names.json
let jaEnNames = JSON.parse(fs.readFileSync(jaEnNamesPath, 'utf8'));

jaEnNames['SC'] = 'Shiny Collection';
jaEnNames['sc'] = 'Shiny Collection';
jaEnNames['LL'] = 'Lost Link';
jaEnNames['ll'] = 'Lost Link';

fs.writeFileSync(jaEnNamesPath, JSON.stringify(jaEnNames, null, 2), 'utf8');
console.log('Updated ja-en-names.json!');

// 3. Fix Set Logo Image Files & Manifest Mappings
const baseLogos = {
  bw1: path.join(setLogosDir, 'bw1.png'),
  bw3: path.join(setLogosDir, 'bw3.png'),
  bw5: path.join(setLogosDir, 'bw5.png'),
  bw8: path.join(setLogosDir, 'bw8.png'),
  bw9: path.join(setLogosDir, 'bw9.png'),
  hgss1: path.join(setLogosDir, 'hgss1.png')
};

// Copy logo files to missing ja logos
if (fs.existsSync(baseLogos.bw9)) fs.copyFileSync(baseLogos.bw9, path.join(setLogosDir, 'ebb_ja.png'));
if (fs.existsSync(baseLogos.bw9)) fs.copyFileSync(baseLogos.bw9, path.join(setLogosDir, 'sc_ja.png'));
if (fs.existsSync(baseLogos.bw8)) fs.copyFileSync(baseLogos.bw8, path.join(setLogosDir, 'bw8v_ja.png'));
if (fs.existsSync(baseLogos.bw8)) fs.copyFileSync(baseLogos.bw8, path.join(setLogosDir, 'bw8m_ja.png'));
if (fs.existsSync(baseLogos.bw5)) fs.copyFileSync(baseLogos.bw5, path.join(setLogosDir, 'bw5g_ja.png'));
if (fs.existsSync(baseLogos.bw5)) fs.copyFileSync(baseLogos.bw5, path.join(setLogosDir, 'bw5z_ja.png'));
if (fs.existsSync(baseLogos.bw3)) fs.copyFileSync(baseLogos.bw3, path.join(setLogosDir, 'bw3d_ja.png'));
if (fs.existsSync(baseLogos.bw3)) fs.copyFileSync(baseLogos.bw3, path.join(setLogosDir, 'bw3h_ja.png'));
if (fs.existsSync(baseLogos.hgss1)) fs.copyFileSync(baseLogos.hgss1, path.join(setLogosDir, 'l1a_ja.png'));
if (fs.existsSync(baseLogos.hgss1)) fs.copyFileSync(baseLogos.hgss1, path.join(setLogosDir, 'l1b_ja.png'));

let setLogosManifest = JSON.parse(fs.readFileSync(setLogosManifestPath, 'utf8'));

const logoMappings = {
  'ebb_ja': '/setLogos/bw9.png',
  'EBB_ja': '/setLogos/bw9.png',
  'EBB': '/setLogos/bw9.png',
  'sc_ja': '/setLogos/bw9.png',
  'SC_ja': '/setLogos/bw9.png',
  'SC': '/setLogos/bw9.png',
  'bw8v_ja': '/setLogos/bw8.png',
  'BW8v_ja': '/setLogos/bw8.png',
  'bw8m_ja': '/setLogos/bw8.png',
  'BW8m_ja': '/setLogos/bw8.png',
  'bw5g_ja': '/setLogos/bw5.png',
  'BW5g_ja': '/setLogos/bw5.png',
  'bw5z_ja': '/setLogos/bw5.png',
  'BW5z_ja': '/setLogos/bw5.png',
  'bw3d_ja': '/setLogos/bw3.png',
  'BW3d_ja': '/setLogos/bw3.png',
  'bw3h_ja': '/setLogos/bw3.png',
  'BW3h_ja': '/setLogos/bw3.png',
  'l1a_ja': '/setLogos/hgss1.png',
  'L1a_ja': '/setLogos/hgss1.png',
  'l1b_ja': '/setLogos/hgss1.png',
  'L1b_ja': '/setLogos/hgss1.png'
};

Object.assign(setLogosManifest, logoMappings);

fs.writeFileSync(setLogosManifestPath, JSON.stringify(setLogosManifest, null, 2), 'utf8');
console.log('Updated setLogos/manifest.json!');

// 4. Update set_pack_prices.json
let packPrices = JSON.parse(fs.readFileSync(setPackPricesPath, 'utf8'));
packPrices['sc'] = 18.5;
packPrices['sc_ja'] = 18.5;
packPrices['SC'] = 18.5;
packPrices['SC_ja'] = 18.5;

fs.writeFileSync(setPackPricesPath, JSON.stringify(packPrices, null, 2), 'utf8');
console.log('Updated set_pack_prices.json!');

console.log('--- BW & Legend Metadata Updates Complete ---');
