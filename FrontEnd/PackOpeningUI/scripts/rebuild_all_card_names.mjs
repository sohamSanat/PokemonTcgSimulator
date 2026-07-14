import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Comprehensive Trainers, Items, Stadiums, Special Forms, and Keywords
const MASTER_TERMS = {
  // Special Forms / Rotoms / Ogerpons / Ursaluna
  'オーガポン みどりのめん': 'Ogerpon Teal Mask',
  'オーガポンみどりのめん': 'Ogerpon Teal Mask',
  'オーガポン かまどのめん': 'Ogerpon Hearthflame Mask',
  'オーガポンかまどのめん': 'Ogerpon Hearthflame Mask',
  'オーガポン いどのめん': 'Ogerpon Wellspring Mask',
  'オーガポンいどのめん': 'Ogerpon Wellspring Mask',
  'オーガポン いしずえのめん': 'Ogerpon Cornerstone Mask',
  'オーガポンいしずえのめん': 'Ogerpon Cornerstone Mask',
  'ガチグマ アカツキ': 'Ursaluna Bloodmoon',
  'ガチグマアカツキ': 'Ursaluna Bloodmoon',
  'カットロトム': 'Mow Rotom',
  'スピンロトム': 'Fan Rotom',
  'ヒートロトム': 'Heat Rotom',
  'ウォッシュロトム': 'Wash Rotom',
  'フロストロトム': 'Frost Rotom',
  'パルデア ケンタロス': 'Paldean Tauros',
  'パルデアケンタロス': 'Paldean Tauros',

  // Trainers / Supporters
  'スイレンのお世話': "Lana's Aid",
  'シロナの覇気': "Cynthia's Ambition",
  'チェレンの気くばり': "Cheren's Care",
  'オーリム博士の気迫': "Professor Sada's Vitality",
  'フトゥー博士のシナリオ': "Professor Turo's Scenario",
  'ボスの指令（ゲーチス）': "Boss's Orders (Ghetsis)",
  'ボスの指令（アカギ）': "Boss's Orders (Cyrus)",
  'ボスの指令': "Boss's Orders",
  '博士の研究（ナナカマド博士）': "Professor's Research (Rowan)",
  '博士の研究': "Professor's Research",
  'アクロマの実験': "Colress's Experiment",
  'ルチアのアピール': "Lisia's Appeal",
  'ハマナのバックアップ': "Cyllene",
  'ヒビキの冒険': "Ethan's Adventure",
  'Nの筋書き': "N's Resolve",
  'ナンジャモの魅力': "Iono's Appeal",
  'エリカの招待': "Erika's Invitation",
  'サカキのカリスマ': "Giovanni's Charisma",
  'ナナミの手助け': "Daisy's Help",
  'マサキの転送': "Bill's Transfer",
  'ベルのまごころ': "Bianca's Devotion",
  'ナンジャモ': "Iono", 'ミモザ': "Miriam", 'キハダ': "Dendra", 'チリ': "Rika", 'ポピー': "Poppy", 'オモダカ': "Geeta", 'ベル': "Bianca", 'ゼイユ': "Carmine", 'スグリ': "Kieran", 'タロ': "Lacey", 'カキツバタ': "Drayton", 'ブライア': "Briar", 'ペパー': "Arven", 'ジャッジマン': "Judge", 'アカマツ': "Crispin", 'サザレ': "Perrin", 'セイジ': "Salvatore", 'タイム': "Tyme", 'ハッサク': "Hassel", 'レオル': "Raifort", 'ジニア': "Jacq", 'クラベル': "Clavell", 'オルティガ': "Ortega", 'ピーニャ': "Giacomo", 'メロコ': "Mela", 'シュウメイ': "Atticus", 'ビワ': "Eri", 'グルーシャ': "Grusha", 'リップ': "Tulip", 'ライム': "Ryme", 'コルサ': "Brassius", 'カエデ': "Katy", 'ハイダイ': "Kofu", 'ボタン': "Penny", 'トウコ': "Hilda", 'パラソルおねえさん': "Parasol Lady", 'マリィ': "Marnie", 'ユウリ': "Gloria", 'ホップ': "Hop", 'ビート': "Bede", 'ソニア': "Sonia", 'ダンデ': "Leon", 'キバナ': "Raihan", 'ルリナ': "Nessa", 'サイトウ': "Bea", 'オニオン': "Allister", 'リーリエ': "Lillie", 'アセロラ': "Acerola", 'グラジオ': "Gladion", 'ルザミーネ': "Lusamine", 'グズマ': "Guzma", 'シロナ': "Cynthia", 'ヒカリ': "Dawn", 'サワロ': "Saguaro", 'ネリネ': "Amarys", 'シマボシ': "Cyllene", 'デンボク': "Kamado", 'さぎょういん': "Worker", 'ジンダイ': "Brandon", 'ハヤト': "Falkner", 'マコモ': "Fennel",

  // Stadiums & Items
  'ボウルタウン': "Artazon",
  'ゼロの大空洞': "Area Zero Underdepths",
  'タウンデパート': "Town Store",
  'ビーチコート': "Beach Court",
  'サイクリングロード': "Cycling Road",
  'レッスンスタジオ': "Practice Studio",
  'コトブキムラ': "Jubilife Village",
  'マグマの滝壺': "Magma Basin",
  'キャンプファイヤー': "Campfire",
  'テラスタルオーブ': "Terastal Orb",
  '大地の器': "Earthen Vessel",
  '勇気のおまもり': "Bravery Charm",
  'カウンターキャッチャー': "Counter Catcher",
  'スーパーエネルギー回収': "Superior Energy Retrieval",
  'ポケギア3.0': "Pokegear 3.0",
  'ワザマシン エヴォリューション': "Technical Machine: Evolution",
  'ワザマシンエヴォリューション': "Technical Machine: Evolution",
  'ワザマシン デヴォリューション': "Technical Machine: Devolution",
  'ワザマシンデヴォリューション': "Technical Machine: Devolution",
  'ゴージャスマント': "Luxurious Cape",
  'ハイパーボール': "Ultra Ball",
  'ネストボール': "Nest Ball",
  'ヒスイのヘビーボール': "Hisuian Heavy Ball",
  'ふしぎなアメ': "Rare Candy",
  'あなぬけのヒモ': "Escape Rope",
  'ともだちてちょう': "Pal Pad",
  'こだわりベルト': "Choice Belt",
  'レスキューキャリー': "Rescue Carrier",
  'トレッキングシューズ': "Trekking Shoes",
  'クロスシーバー': "Cross Switcher",
  'ダークパッチ': "Dark Patch",
  '霧の水晶': "Fog Crystal",
  'しんかのおこう': "Evolution Incense",
  'クイックボール': "Quick Ball",
  'レベルボール': "Level Ball",
  'あくまのつぼ': "Urn of Vitality",
  'うねりの扇': "Crushing Hammer",
  'エネルギー転送': "Energy Search",
  'むしとりセット': "Bug Catching Set",
  '緊急ボード': "Rescue Board",
  'きらめく結晶': "Sparkling Crystal",
  'テクノレーダー': "Techno Radar",
  'ブーストエナジー未来': "Future Booster Energy Capsule",
  'ブーストエナジー古代': "Ancient Booster Energy Capsule",

  // Energies
  'ジェットエネルギー': "Jet Energy",
  'ルミナスエネルギー': "Luminous Energy",
  'リバーサルエネルギー': "Reversal Energy",
  'ダブルターボエネルギー': "Double Turbo Energy",
  'ミストエネルギー': "Mist Energy",
  '基本草エネルギー': "Basic Grass Energy",
  '基本炎エネルギー': "Basic Fire Energy",
  '基本水エネルギー': "Basic Water Energy",
  '基本雷エネルギー': "Basic Lightning Energy",
  '基本超エネルギー': "Basic Psychic Energy",
  '基本闘エネルギー': "Basic Fighting Energy",
  '基本悪エネルギー': "Basic Darkness Energy",
  '基本鋼エネルギー': "Basic Metal Energy"
};

const REGIONAL_PREFIXES = [
  { ja: 'パルデアの', en: 'Paldean ' },
  { ja: 'パルデア', en: 'Paldean ' },
  { ja: 'ヒスイの', en: 'Hisuian ' },
  { ja: 'ヒスイ', en: 'Hisuian ' },
  { ja: 'アローラの', en: 'Alolan ' },
  { ja: 'アローラ', en: 'Alolan ' },
  { ja: 'ガラルの', en: 'Galarian ' },
  { ja: 'ガラル', en: 'Galarian ' },
  { ja: 'かがくのチカラ', en: 'Power of Science ' },
  { ja: 'かがやく', en: 'Radiant ' }
];

async function run() {
  const pokeDictPath = path.join(__dirname, '../public/pokemon-ja-en-dict.json');
  const pokeDict = JSON.parse(fs.readFileSync(pokeDictPath, 'utf8'));

  const fullDict = { ...pokeDict, ...MASTER_TERMS };

  const jaSetsPath = path.join(__dirname, '../public/ja-sets.json');
  const jaSets = JSON.parse(fs.readFileSync(jaSetsPath, 'utf8'));

  console.log(`Re-fetching original Japanese card titles across ${jaSets.length} sets and cleanly translating...`);

  const cardNames = {};
  const batchSize = 12;

  for (let i = 0; i < jaSets.length; i += batchSize) {
    const batch = jaSets.slice(i, i + batchSize);
    await Promise.all(batch.map(async (set) => {
      const prefixLow = set.id.toLowerCase();
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/ja/sets/${set.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data?.cards)) return;

        for (const c of data.cards) {
          if (!c.localId || !c.name) continue;
          const numStr = parseInt(c.localId, 10).toString();
          const key1 = `${prefixLow}_ja-${numStr}`;
          const key2 = `${prefixLow}_ja-${c.localId}`;

          // Translate cleanly from original Japanese
          let translated = translateClean(c.name, fullDict);
          cardNames[key1] = translated;
          if (c.localId !== numStr) {
            cardNames[key2] = translated;
          }
        }
      } catch (e) {
        // ignore
      }
    }));
    process.stdout.write(`Processed ${Math.min(i + batchSize, jaSets.length)}/${jaSets.length} sets...\r`);
  }

  console.log(`\nRebuilding complete. Total card keys written: ${Object.keys(cardNames).length}`);

  const namesPath = path.join(__dirname, '../public/ja-card-names.json');
  fs.writeFileSync(namesPath, JSON.stringify(cardNames, null, 2), 'utf8');

  // Verify how many still have Japanese characters
  const jaRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/;
  let jaCount = 0;
  for (const v of Object.values(cardNames)) {
    if (jaRegex.test(v)) jaCount++;
  }
  console.log(`Final count of cards with Japanese characters across all sets: ${jaCount}`);
}

function translateClean(jaName, dict) {
  if (!jaName) return jaName;
  let cleaned = jaName.trim();

  // 1. Exact match
  if (dict[cleaned]) return dict[cleaned];

  // 2. Check suffix (ex, VMAX, VSTAR, V, GX, SAR, SR, UR, AR, etc.)
  const suffixMatch = cleaned.match(/^(.*?)(ex|VMAX|VSTAR|V|GX|STAR|SAR|SR|UR|AR|RRR|RR|R|U|C)$/i);
  let baseJa = cleaned;
  let suffixEn = '';
  if (suffixMatch) {
    baseJa = suffixMatch[1].trim();
    suffixEn = ' ' + suffixMatch[2];
    if (dict[baseJa]) return `${dict[baseJa]}${suffixEn}`.trim();
  }

  // 3. Check possessives with "の" (e.g., "ナンジャモのハラバリー" -> "Iono's Bellibolt")
  if (baseJa.includes('の')) {
    const parts = baseJa.split('の');
    if (parts.length === 2) {
      const p1 = parts[0].trim();
      const p2 = parts[1].trim();
      const en1 = dict[p1] || p1;
      const en2 = dict[p2] || p2;
      if (dict[p1] && dict[p2]) {
        return `${en1}'s ${en2}${suffixEn}`.trim();
      }
    }
  }

  // 4. Check regional prefixes
  let prefixEn = '';
  for (const reg of REGIONAL_PREFIXES) {
    if (baseJa.startsWith(reg.ja)) {
      prefixEn = reg.en;
      baseJa = baseJa.slice(reg.ja.length).trim();
      break;
    }
  }

  if (dict[baseJa]) {
    return `${prefixEn}${dict[baseJa]}${suffixEn}`.trim();
  }

  // 5. Check if baseJa contains any dictionary key (substring replacement from longest key to shortest)
  const keysSorted = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const k of keysSorted) {
    if (k.length >= 2 && baseJa.includes(k)) {
      baseJa = baseJa.split(k).join(dict[k]);
    }
  }

  return `${prefixEn}${baseJa}${suffixEn}`.trim();
}

run().catch(console.error);
