import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADDITIONAL_DICT = {
  // Trainers / Supporters
  'フトゥー博士のシナリオ': "Professor Turo's Scenario",
  'オーリム博士の気迫': "Professor Sada's Vitality",
  'ボタン': "Penny",
  'トウコ': "Hilda",
  'パラソルおねえさん': "Parasol Lady",
  'チェレンの気くばり': "Cheren's Care",
  'Nの筋書き': "N's Resolve",
  'ヒビキの冒険': "Ethan's Adventure",
  'Lanaのお世話': "Lana's Aid",
  'スイレンのお世話': "Lana's Aid",
  'ynthiaの覇気': "Cynthia's Ambition",
  'シロナの覇気': "Cynthia's Ambition",
  'クラベル': "Clavell",
  'ジニア': "Jacq",
  'オルティガ': "Ortega",
  'メロコ': "Mela",
  'ピーニャ': "Giacomo",
  'シュウメイ': "Atticus",
  'ビワ': "Eri",
  'グルーシャ': "Grusha",
  'リップ': "Tulip",
  'ライム': "Ryme",
  'コルサ': "Brassius",
  'カエデ': "Katy",
  'ハイダイ': "Kofu",
  'サザレ': "Perrin",
  'セイジ': "Salvatore",
  'タイム': "Tyme",
  'ハッサク': "Hassel",
  'レオル': "Raifort",

  // Stadiums & Items
  'ボウルタウン': "Artazon",
  'ゼロの大空洞': "Area Zero Underdepths",
  'タウンデパート': "Town Store",
  'ビーチコート': "Beach Court",
  '勇気のおまもり': "Bravery Charm",
  'カウンターキャッチャー': "Counter Catcher",
  'スーパーエネルギー回収': "Superior Energy Retrieval",
  'ポケギア3.0': "Pokegear 3.0",
  'ワザマシンエヴォリューション': "Technical Machine: Evolution",
  'ワザマシン エヴォリューション': "Technical Machine: Evolution",
  'ゴージャスマント': "Luxurious Cape",
  'テラスタルオーブ': "Terastal Orb",
  '大地の器': "Earthen Vessel",
  'ハイパーボール': "Ultra Ball",
  'ネストボール': "Nest Ball",
  'ヒスイのヘビーボール': "Hisuian Heavy Ball",

  // Energies
  'ジェットエネルギー': "Jet Energy",
  'ルミナスエネルギー': "Luminous Energy",
  'リバーサルエネルギー': "Reversal Energy",
  'ダブルターボエネルギー': "Double Turbo Energy",
  'ミストエネルギー': "Mist Energy",

  // Forms / Suffixes / Partial fixes
  'salnaアカツキ': "Ursaluna Bloodmoon",
  'ガチグマ アカツキ': "Ursaluna Bloodmoon",
  'ガチグマアカツキ': "Ursaluna Bloodmoon",
  'Ogeponみどりのめん': "Ogerpon Teal Mask",
  'オーガポンみどりのめん': "Ogerpon Teal Mask",
  'Ogeponかまどのめん': "Ogerpon Hearthflame Mask",
  'オーガポンかまどのめん': "Ogerpon Hearthflame Mask",
  'Ogeponいどのめん': "Ogerpon Wellspring Mask",
  'オーガポンいどのめん': "Ogerpon Wellspring Mask",
  'Ogeponいしずえのめん': "Ogerpon Cornerstone Mask",
  'オーガポンいしずえのめん': "Ogerpon Cornerstone Mask",
  'ikaーン': "Tinkaton",
  'デカヌチャン': "Tinkaton",
  'Magmン': "Magmortar",
  'ブーバーン': "Magmortar",
  'Boss\'sOdes（ゲーチス）': "Boss's Orders (Ghetsis)",
  'ボスの指令（ゲーチス）': "Boss's Orders (Ghetsis)"
};

async function run() {
  const namesPath = path.join(__dirname, '../public/ja-card-names.json');
  const cardNames = JSON.parse(fs.readFileSync(namesPath, 'utf8'));
  const pokeDictPath = path.join(__dirname, '../public/pokemon-ja-en-dict.json');
  const pokeDict = JSON.parse(fs.readFileSync(pokeDictPath, 'utf8'));

  // Merge dictionaries
  const dict = { ...pokeDict, ...ADDITIONAL_DICT };

  const jaRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/;
  let fixedCount = 0;

  for (const [k, v] of Object.entries(cardNames)) {
    if (jaRegex.test(v)) {
      let cleaned = v;

      // 1. Direct dictionary check
      if (dict[cleaned]) {
        cleaned = dict[cleaned];
      } else {
        // 2. Fix broken prefixes/forms or exact substring matches from ADDITIONAL_DICT
        for (const [subK, subV] of Object.entries(ADDITIONAL_DICT)) {
          if (cleaned.includes(subK)) {
            cleaned = cleaned.split(subK).join(subV);
          }
        }

        // 3. Fix "の" possessive patterns (e.g. "Ionoのハラバリー" -> "Iono's Bellibolt" or "シロナのガブリアス" -> "Cynthia's Garchomp")
        if (jaRegex.test(cleaned) && cleaned.includes('の')) {
          const parts = cleaned.split('の');
          if (parts.length === 2) {
            const ownerJa = parts[0].trim();
            const monJa = parts[1].trim();
            const ownerEn = dict[ownerJa] || ownerJa;
            const monEn = dict[monJa] || monJa;
            if (ownerEn && monEn) {
              cleaned = `${ownerEn}'s ${monEn}`;
            }
          }
        }

        // 4. Try matching any Japanese substring using pokeDict
        if (jaRegex.test(cleaned)) {
          for (const [pK, pV] of Object.entries(pokeDict)) {
            if (pK.length >= 2 && cleaned.includes(pK)) {
              cleaned = cleaned.split(pK).join(pV);
            }
          }
        }
      }

      if (cleaned !== v) {
        cardNames[k] = cleaned;
        fixedCount++;
      }
    }
  }

  // Count remaining
  let remaining = 0;
  for (const v of Object.values(cardNames)) {
    if (jaRegex.test(v)) remaining++;
  }

  fs.writeFileSync(namesPath, JSON.stringify(cardNames, null, 2), 'utf8');
  console.log(`Cleaned up ${fixedCount} remaining titles. Cards still containing Japanese characters: ${remaining}`);
}

run().catch(console.error);
