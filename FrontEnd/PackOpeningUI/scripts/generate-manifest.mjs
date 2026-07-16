import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontEndPackArtsDir = path.resolve(__dirname, '../../packArts');
const publicPackArtsDir = path.resolve(__dirname, '../public/packArts');

console.log('Syncing Pack Arts...');
console.log('Source:', frontEndPackArtsDir);
console.log('Destination:', publicPackArtsDir);

// 1. Copy files from FrontEnd/packArts to public/packArts if source exists
if (fs.existsSync(frontEndPackArtsDir)) {
  if (fs.existsSync(publicPackArtsDir)) {
    fs.rmSync(publicPackArtsDir, { recursive: true, force: true });
  }
  fs.mkdirSync(publicPackArtsDir, { recursive: true });
  fs.cpSync(frontEndPackArtsDir, publicPackArtsDir, { recursive: true, force: true });
  console.log('Successfully synced exact current packArts to public/packArts');
} else {
  console.log('Source FrontEnd/packArts not found, checking public/packArts only.');
}

if (!fs.existsSync(publicPackArtsDir)) {
  console.error('No packArts directory found at public/packArts!');
  process.exit(1);
}

// 2. Mapping of folder basenames / aliases to set IDs and normalized terms
const SET_ALIASES = {
  // Mega Evolution
  'Mega-evolution': ['me01', 'me1', 'mega evolution', 'mega-evolution', 'megaevolution', 'me01'],
  'phantasmal-flames': ['me02', 'me2', 'phantasmal flames', 'phantasmal-flames', 'phantasmalflames', 'me02'],
  'Ascended-heroes': ['me02.5', 'me2.5', 'me02pt5', 'me2pt5', 'ascended heroes', 'ascended-heroes', 'ascendedheroes', 'me025'],
  'perfect-order': ['me03', 'me3', 'perfect order', 'perfect-order', 'perfectorder', 'me03'],
  'chaos-rising': ['me04', 'me4', 'chaos rising', 'chaos-rising', 'chaosrising', 'me04'],

  // Scarlet & Violet
  'scarlet-and-violet': ['sv01', 'sv1', 'scarlet & violet', 'scarlet&violet', 'sv', 'sv01'],
  'paldea-evolved': ['sv02', 'sv2', 'paldea evolved', 'paldea-evolved', 'sv02'],
  'obsidian-flames': ['sv03', 'sv3', 'obsidian flames', 'obsidian-flames', 'sv03'],
  '151': ['sv03.5', 'sv3pt5', 'sv3.5', '151', 'me4', 'meo', 'sve-151', 'sv035', 'sv35'],
  'paradox-rift': ['sv04', 'sv4', 'paradox rift', 'paradox-rift', 'sv04'],
  'paldean-fates': ['sv04.5', 'sv4pt5', 'sv4.5', 'paldean fates', 'paldean-fates', 'paf', 'sv045', 'sv45'],
  'temporal-forces': ['sv05', 'sv5', 'temporal forces', 'temporal-forces', 'sv05'],
  'twilight-masquared': ['sv06', 'sv6', 'twilight masquerade', 'twilight-masquared', 'twilight-masquerade', 'sv06'],
  'shrouded-fable': ['sv06.5', 'sv6pt5', 'sv6.5', 'shrouded fable', 'shrouded fables', 'shrouded-fable', 'shrouded-fables', 'sfa', 'sv065', 'sv65'],
  'stellar-crown': ['sv07', 'sv7', 'stellar crown', 'stellar-crown', 'sv07'],
  'surging-sparks': ['sv08', 'sv8', 'surging sparks', 'surging-sparks', 'sv08'],
  'prismatic-evolution': ['sv08.5', 'sv8pt5', 'sv8.5', 'prismatic evolutions', 'prismatic evolution', 'prismatic-evolution', 'prismatic-evolutions', 'sv085', 'sv85'],
  'journey-togather': ['sv09', 'sv9', 'journey together', 'journey togather', 'journey-together', 'journey-togather', 'sv09'],
  'destined-rivals': ['sv10', 'sv10a', 'destined rivals', 'destined-rivals', 'sv10'],
  'black-bolt': ['sv10a', 'sv10c', 'black bolt', 'black-bolt', 'blackbolt', 'black flare', 'black-flare', 'blackflare'],
  'black-flare': ['sv10a', 'sv10c', 'black bolt', 'black-bolt', 'blackbolt', 'black flare', 'black-flare', 'blackflare'],
  'white-flare': ['sv10b', 'white flare', 'white-flare', 'whiteflare'],

  // Sword & Shield
  'sword-and-shield': ['swsh1', 'sword & shield', 'sword&shield', 'swsh', 'swsh01', 's1w', 's1w_ja', 's1h', 's1h_ja', 's1a', 's1a_ja', 'sword', 'sword_ja', 'shield', 'shield_ja', 'vmax rising', 'vmax rising_ja'],
  'rebel-clash': ['swsh2', 'rebel clash', 'rebel-clash', 'swsh02', 's2', 's2_ja', 's2a', 's2a_ja', 'rebel crush', 'rebel crush_ja', 'explosive walker', 'explosive walker_ja'],
  'DarknessAblaze': ['swsh3', 'darkness ablaze', 'darknessablaze', 'darkness-ablaze', 'swsh03', 's3', 's3_ja', 'mugen zone', 'infinity zone', 'mugen zone_ja'],
  'champions-path': ['swsh3.5', 'swsh3pt5', 'swsh35', 'cpa', 'champions path', 'champions-path', 'champion\'s path', 'championspath'],
  'vivd-voltage': ['swsh4', 'vivid voltage', 'vivd voltage', 'vivid-voltage', 'vivd-voltage', 'swsh04', 's3a', 's3a_ja', 's4', 's4_ja', 'legendary heartbeat', 'legendary heartbeat_ja', 'amazing volt tackle', 'amazing volt tackle_ja'],
  'shiny-fates-shiny-vault': ['swsh4.5sv', 'swsh4pt5sv', 'shining fates shiny vault', 'shining fates: shiny vault', 'swsh4.5', 'swsh4pt5', 'shining fates', 'shiny fates', 'shining-fates', 'swsh45', 's4a', 's4a_ja', 'shiny star v', 'shiny star v_ja'],
  'battle-styles': ['swsh5', 'battle styles', 'battle-styles', 'swsh05', 's5i', 's5i_ja', 's5r', 's5r_ja', 'single strike master', 'single strike master_ja', 'rapid strike master', 'rapid strike master_ja'],
  'chilling-reign': ['swsh6', 'chilling reign', 'chilling-reign', 'swsh06', 's5a', 's5a_ja', 's6h', 's6h_ja', 's6k', 's6k_ja', 'matchless fighters', 'matchless fighters_ja', 'peerless fighters', 'silver lance', 'silver lance_ja', 'jet-black spirit', 'jet-black spirit_ja'],
  'evolving-skies': ['swsh7', 'evolving skies', 'evolving-skies', 'swsh07', 's6a', 's6a_ja', 's7d', 's7d_ja', 's7r', 's7r_ja', 'eevee heroes', 'eevee heroes_ja', 'skyscraping perfection', 'skyscraping perfection_ja', 'blue sky stream', 'blue sky stream_ja'],
  'celebrations': ['swsh7.5', 'swsh7pt5', 'swsh75', 'cel', 'celebrations', 'swsh25', 's8a', 's8a_ja', '25th anniversary collection', '25th anniversary collection_ja'],
  'fusion-strike': ['swsh8', 'fusion strike', 'fusion-strike', 'swsh08', 's8', 's8_ja', 's8b', 's8b_ja', 'fusion arts', 'fusion arts_ja', 'vmax climax', 'vmax climax_ja'],
  'brillinant-stars': ['swsh9', 'brilliant stars', 'brillinant stars', 'brilliant-stars', 'brillinant-stars', 'swsh9tg', 'swsh09', 's9', 's9_ja', 'star birth', 'star birth_ja'],
  'astral-radiance': ['swsh10', 'astral radiance', 'astral-radiance', 'swsh10tg', 's9a', 's9a_ja', 's10d', 's10d_ja', 's10p', 's10p_ja', 'battle region', 'battle region_ja', 'time gazer', 'time gazer_ja', 'space juggler', 'space juggler_ja'],
  'pokemon-go': ['swsh10.5', 'swsh10pt5', 'swsh105', 'pgo', 'pokemon go', 'pokemon-go', 'pokemongo', 's10b', 's10b_ja'],
  'lost-origin': ['swsh11', 'lost origin', 'lost-origin', 'swsh11tg', 's10a', 's10a_ja', 's11', 's11_ja', 'dark phantasma', 'dark phantasma_ja', 'lost abyss', 'lost abyss_ja'],
  'silver-tempest': ['swsh12', 'silver tempest', 'silver-tempest', 'swsh12tg', 's11a', 's11a_ja', 's12', 's12_ja', 'incandescent arcana', 'incandescent arcana_ja', 'paradigm trigger', 'paradigm trigger_ja'],
  'crown-zenith': ['swsh12.5', 'swsh12pt5', 'swsh12.5gg', 'crown zenith', 'crown-zenith', 'swsh125', 's12a', 's12a_ja', 'vstar universe', 'vstar universe_ja'],

  // Sun & Moon
  'sun-and-moon-baseset': ['sm1', 'sm01', 'sun & moon', 'sun & moon base set', 'sun&moon-baseset', 'sun and moon', 'sm', 'sm1s', 'sm1s_ja', 'sm1m', 'sm1m_ja', 'sm1+', 'sm1+_ja', 'sm1pt_ja', 'collection sun', 'collection sun_ja', 'collection moon', 'collection moon_ja'],
  'guardians-rising': ['sm2', 'sm02', 'guardians rising', 'guardians-rising', 'sm2k', 'sm2k_ja', 'sm2l', 'sm2l_ja', 'sm2+', 'sm2+_ja', 'sm2pt_ja', 'islands waiting for you', 'alolan moonlight', 'beyond the new trial'],
  'burning-shadow': ['sm3', 'sm03', 'burning shadows', 'burning-shadow', 'burning-shadows', 'sm3h', 'sm3h_ja', 'sm3n', 'sm3n_ja', 'did you see the fighting rainbow?', 'darkness that consumes light'],
  'shining-legends': ['sm3.5', 'sm3pt5', 'sm35', 'shining legends', 'shining-legends', 'slg', 'sm3+', 'sm3+_ja', 'sm3pt_ja'],
  'crimson-invasion': ['sm4', 'sm04', 'crimson invasion', 'crimson-invasion', 'sm4s', 'sm4s_ja', 'sm4a', 'sm4a_ja', 'sm4+', 'sm4+_ja', 'sm4pt_ja', 'awakening hero', 'ultradimensional beasts', 'gx battle boost', 'gx battle boost_ja'],
  'ultra-prism': ['sm5', 'sm05', 'ultra prism', 'ultra-prism', 'sm5s', 'sm5s_ja', 'sm5m', 'sm5m_ja', 'ultra sun', 'ultra sun_ja', 'ultra moon', 'ultra moon_ja'],
  'forbidden-light': ['sm6', 'sm06', 'forbidden light', 'forbidden-light', 'sm5+', 'sm5+_ja', 'sm5pt_ja', 'sm6_ja', 'sm6a', 'sm6a_ja', 'ultra force', 'ultra force_ja', 'dragon storm', 'dragon storm_ja'],
  'celesital-storm': ['sm7', 'sm07', 'celestial storm', 'celesital-storm', 'celestial-storm', 'sm6b', 'sm6b_ja', 'sm7_ja', 'champion road', 'champion road_ja', 'charisma of the sky', 'sky'],
  'dragon-majesty': ['sm7.5', 'sm7pt5', 'sm75', 'dragon majesty', 'dragon-majesty', 'drm', 'sm7a', 'sm7a_ja', 'lightning spark', 'thunderclap spark'],
  'lost-thunder': ['sm8', 'sm08', 'lost thunder', 'lost-thunder', 'sm7b', 'sm7b_ja', 'sm8_ja', 'sm8a', 'sm8a_ja', 'fairy rise', 'fairy rise_ja', 'super impact', 'super impact_ja', 'dark order', 'dark order_ja'],
  'team-up': ['sm9', 'sm09', 'team up', 'team-up', 'sm9_ja', 'sm9a', 'sm9a_ja', 'tag bolt', 'tag bolt_ja', 'night unison', 'night unison_ja'],
  'detective-pikachu': ['det1', 'sm9.5', 'detective pikachu', 'detective-pikachu', 'smp2', 'smp2_ja'],
  'unbroken-bonds': ['sm10', 'unbroken bonds', 'unbroken-bonds', 'sm9b', 'sm9b_ja', 'sm10_ja', 'sn10a', 'sn10a_ja', 'sm10a_ja', 'full metal wall', 'full metal wall_ja', 'double blaze', 'double blaze_ja', 'g-g end', 'gg end'],
  'unified-minds': ['sm11', 'unified minds', 'unified-minds', 'sm10b', 'sm10b_ja', 'sn11', 'sn11_ja', 'sm11_ja', 'sky legend', 'sky legend_ja', 'miracle twin', 'miracle twin_ja'],
  'hidden-fates-shiny-vault': ['sma', 'sm115sv', 'hidden fates shiny vault', 'hidden fates: shiny vault', 'sm115', 'sm11.5', 'sm11pt5', 'hidden fates', 'hidden-fates', 'hif', 'sm8b', 'sm8b_ja', 'gx ultra shiny', 'gx ultra shiny_ja'],
  'cosmic-eclipse': ['sm12', 'cosmic eclipse', 'cosmic-eclipse', 'sm11a', 'sm11a_ja', 'sm11b', 'sm11b_ja', 'sm12_ja', 'sm12a', 'sm12a_ja', 'remix bout', 'remix bout_ja', 'dream league', 'dream league_ja', 'alter genesis', 'alter genesis_ja', 'tag team gx tag all stars', 'tag team gx: tag all stars', 'tag all stars', 'tag all stars_ja', 'tag team gx tag all stars_ja'],

  // XY
  'XY-Baseset': ['xy1', 'xy01', 'xy base set', 'xy-baseset', 'xy'],
  'Flashfire': ['xy2', 'xy02', 'flashfire'],
  'Fusrious-fists': ['xy3', 'xy03', 'furious fists', 'fusrious-fists', 'furious-fists'],
  'phantom-forces': ['xy4', 'xy04', 'phantom forces', 'phantom-forces'],
  'primal-clash': ['xy5', 'xy05', 'primal clash', 'primal-clash'],
  'double-crisis': ['dc1', 'xy5.5', 'double crisis', 'double-crisis'],
  'roaring-skies': ['xy6', 'xy06', 'roaring skies', 'roaring-skies'],
  'ancient-origin': ['xy7', 'xy07', 'ancient origins', 'ancient-origin', 'ancient-origins'],
  'breakthrough': ['xy8', 'xy08', 'breakthrough'],
  'breakpoint': ['xy9', 'xy09', 'breakpoint'],
  'generation': ['g1', 'xy9.5', 'generations', 'generation'],
  'fates-collide': ['xy10', 'fates collide', 'fates-collide'],
  'XY-Evolutions': ['xy12', 'evolutions', 'xy-evolutions', 'xy evolutions'],

  // Base Generation (Wizards of the Coast)
  'base-set': ['base1', 'base', 'base set', 'base-set', 'baseset', 'bs1'],
  'jungle': ['base2', 'ju', 'jungle'],
  'fossill': ['base3', 'fo', 'fossil', 'fossill'],
  'base-set2': ['base4', 'base set 2', 'base-set2', 'baseset2', 'bs2'],
  'Team-Rocket': ['base5', 'tr', 'team rocket', 'team-rocket', 'teamrocket']
};

const JAPANESE_SET_ALIASES = {
  '151': ['sv2a_ja', 'sv2aja', 'sv2a', '151_ja', 'pokemon card 151_ja', 'pokemon card 151'],
  'Ancient-Roar': ['sv4k_ja', 'sv4kja', 'sv4k', 'ancient roar_ja', 'ancient-roar_ja', 'ancient roar'],
  'Battle-Partners': ['sv9_ja', 'sv9ja', 'sv09_ja', 'sv9', 'battle partners_ja', 'battle-partners_ja', 'battle partners'],
  'Black-bolt': ['sv11b_ja', 'sv11bja', 'sv11b', 'black bolt_ja', 'black-bolt_ja', 'black bolt'],
  'Clay-Burst': ['sv2d_ja', 'sv2dja', 'sv2d', 'clay burst_ja', 'clay-burst_ja', 'clay burst'],
  'Crimson-Haze': ['sv5a_ja', 'sv5aja', 'sv5a', 'crimson haze_ja', 'crimson-haze_ja', 'crimson haze'],
  'Future-Flash': ['sv4m_ja', 'sv4mja', 'sv4m', 'future flash_ja', 'future-flash_ja', 'future flash'],
  'Glory-Of-Team-Rocket': ['sv10_ja', 'sv10ja', 'sv10', 'glory of team rocket_ja', 'glory of team rocket', 'glory-of-team-rocket_ja'],
  'Hot-Wild-Arena': ['sv9a_ja', 'sv9aja', 'sv9a', 'hot wind arena_ja', 'hot wild arena_ja', 'hot wind arena', 'hot wild arena', 'hot-wild-arena_ja'],
  'Night-Wanderer': ['sv6a_ja', 'sv6aja', 'sv6a', 'night wanderer_ja', 'night-wanderer_ja', 'night wanderer'],
  'Paradise-Dragona': ['sv7a_ja', 'sv7aja', 'sv7a', 'paradise dragona_ja', 'paradise-dragona_ja', 'paradise dragona'],
  'Raging-Surf': ['sv3a_ja', 'sv3aja', 'sv3a', 'raging surf_ja', 'raging-surf_ja', 'raging surf'],
  'Ruler-Of-The-Blac-Flare': ['sv3_ja', 'sv3ja', 'sv03_ja', 'sv3', 'ruler of the black flame_ja', 'ruler of the blac flare_ja', 'ruler of the black flame', 'ruler of the blac flare'],
  'Scarlet-Ex': ['sv1s_ja', 'sv1sja', 'sv1s', 'scarlet ex_ja', 'scarlet-ex_ja', 'scarlet ex'],
  'Shiny-Treasure-Ex': ['sv4a_ja', 'sv4aja', 'sv4a', 'shiny treasure ex_ja', 'shiny-treasure-ex_ja', 'shiny treasure ex'],
  'Snow-Hazard': ['sv2p_ja', 'sv2pja', 'sv2p', 'snow hazard_ja', 'snow-hazard_ja', 'snow hazard'],
  'Stellar-Miracle': ['sv7_ja', 'sv7ja', 'sv07_ja', 'sv7', 'stellar miracle_ja', 'stellar-miracle_ja', 'stellar miracle'],
  'Super-Electric-Breaker': ['sv8_ja', 'sv8ja', 'sv08_ja', 'sv8', 'super electric breaker_ja', 'super-electric-breaker_ja', 'super electric breaker'],
  'Terastal-Fest-Ex': ['sv8a_ja', 'sv8aja', 'sv8a', 'terastal fest ex_ja', 'terastal-fest-ex_ja', 'terastal fest ex'],
  'Transformation-Mask': ['sv6_ja', 'sv6ja', 'sv06_ja', 'sv6', 'transformation mask_ja', 'transformation-mask_ja', 'transformation mask'],
  'Triplet-Beat': ['sv1a_ja', 'sv1aja', 'sv1a', 'triplet beat_ja', 'triplet-beat_ja', 'triplet beat'],
  'Violet-Ex': ['sv1v_ja', 'sv1vja', 'sv1v', 'violet ex_ja', 'violet-ex_ja', 'violet ex'],
  'White-Flare': ['sv11w_ja', 'sv11wja', 'sv11w', 'white flare_ja', 'white-flare_ja', 'white flare'],
  'Wild-Force': ['sv5k_ja', 'sv5kja', 'sv5k', 'wild force_ja', 'wild-force_ja', 'wild force'],
  'cyber-judge': ['sv5m_ja', 'sv5mja', 'sv5m', 'cyber judge_ja', 'cyber-judge_ja', 'cyber judge']
};

const manifest = {};
const validExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

// Recursively scan directories inside public/packArts
function scanDir(dir, relativePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  // Check if current directory contains image files
  const images = entries
    .filter(e => e.isFile() && validExts.has(path.extname(e.name).toLowerCase()))
    .map(e => path.posix.join('/packArts', relativePath, e.name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (images.length > 0) {
    const folderName = path.basename(dir);
    console.log(`Found ${images.length} arts in folder: ${folderName} (${relativePath})`);
    
    const isJapaneseFolder = relativePath.toLowerCase().includes('japanese') || relativePath.toLowerCase().includes('_ja');

    if (isJapaneseFolder && folderName.toLowerCase() === '151') {
      // Specifically map Japanese 151 without overwriting English 151
      const ja151Aliases = JAPANESE_SET_ALIASES['151'];
      for (const alias of ja151Aliases) {
        manifest[alias] = images;
        manifest[alias.toLowerCase()] = images;
        manifest[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = images;
      }
    } else {
      // Add exact folder name and normalized folder name
      manifest[folderName] = images;
      manifest[folderName.toLowerCase()] = images;
      const normalizedName = folderName.toLowerCase().replace(/[^a-z0-9]/g, '');
      manifest[normalizedName] = images;

      // Check English aliases if not Japanese folder
      if (!isJapaneseFolder) {
        for (const [key, aliases] of Object.entries(SET_ALIASES)) {
          if (key.toLowerCase() === folderName.toLowerCase() || aliases.includes(folderName.toLowerCase())) {
            for (const alias of aliases) {
              manifest[alias] = images;
              manifest[alias.toLowerCase()] = images;
              manifest[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = images;
            }
          }
        }
      }

      // Check Japanese aliases
      for (const [key, aliases] of Object.entries(JAPANESE_SET_ALIASES)) {
        if (key.toLowerCase() === folderName.toLowerCase() || aliases.includes(folderName.toLowerCase())) {
          for (const alias of aliases) {
            manifest[alias] = images;
            manifest[alias.toLowerCase()] = images;
            manifest[alias.toLowerCase().replace(/[^a-z0-9]/g, '')] = images;
          }
        }
      }
    }
  }

  // Scan subdirectories
  for (const entry of entries) {
    if (entry.isDirectory()) {
      scanDir(path.join(dir, entry.name), path.posix.join(relativePath, entry.name));
    }
  }
}

scanDir(publicPackArtsDir);

const manifestPath = path.join(publicPackArtsDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest generated at ${manifestPath} with ${Object.keys(manifest).length} keys.`);
