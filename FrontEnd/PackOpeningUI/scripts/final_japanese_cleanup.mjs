import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Complete map of auto-translated English/Katakana anomalies found in older TCGDex Japanese sets
const KATAKANA_AND_ANOMALY_MAP = {
  '未知': 'Unown',
  '同上': 'Ditto',
  '猟犬': 'Houndour',
  'マグネトン': 'Magneton',
  'ガストリー': 'Gastly',
  'スキスター': 'Scyther',
  'ディグレット': 'Diglett',
  'ジェンガー': 'Gengar',
  'アンファロス': 'Ampharos',
  'マチャンプ': 'Machamp',
  'マグマー': 'Magmar',
  'ハンター': 'Haunter',
  'Kabtoップス': 'Kabutops',
  'うなり声': 'Growlithe',
  'マチョップ': 'Machop',
  'チャンジー': 'Chansey',
  '奇妙な': 'Oddish',
  'ピロスワイン': 'Piloswine',
  'ラントン': 'Lanturn',
  'マグナイト': 'Magnemite',
  'ドロージー': 'Drowzee',
  'キューボン': 'Cubone',
  '雑草': 'Weedle',
  'アルカニン': 'Arcanine',
  'スカルモリー': 'Skarmory',
  'ニネタール': 'Ninetales',
  'グリマー': 'Grimer',
  '馬': 'Horsea',
  'ヴェノナト': 'Venonat',
  'シール': 'Seel',
  '幼虫': 'Larvitar',
  'ホッピップ': 'Hoppip',
  '暗闇': 'Gloom',
  'チンチョウ': 'Chinchou',
  'フラフィー': 'Flaaffy',
  'スローキング': 'Slowking',
  'Bianaスプラウト': 'Bellsprout',
  '蝶': 'Butterfree',
  'Oliiaュ': 'Poliwag',
  'エカン': 'Ekans',
  'おしっこ': 'Pikachu',
  'モルトレス': 'Moltres',
  'クラビー': 'Krabby',
  'オマニテ': 'Omanyte',
  'テンタクルエル': 'Tentacruel',
  'クロイスター': 'Cloyster',
  'ザプドス': 'Zapdos',
  'スローブロ': 'Slowbro',
  '催眠': 'Hypno',
  'ミュー': 'Mew',
  'ジオドード': 'Geodude',
  'Sandshewスラッシュ': 'Sandslash',
  '砂利': 'Graveler',
  'ゴーレム': 'Golem',
  'アエロダクチル': 'Aerodactyl',
  'ドラゴナイト': 'Dragonite',
  'エネルギー検索': 'Energy Search',
  'ギャンブラー': 'Gambler',
  '神秘的な化石': 'Mysterious Fossil',
  'アリアドス': 'Ariados',
  'アズマリルの': 'Azumarill',
  'ブラッキー': 'Umbreon',
  'エーフィ': 'Espeon',
  'ハッサム': 'Scizor',
  'エアームド': 'Skarmory',
  'キングドラ': 'Kingdra',
  'ポリゴン2': 'Porygon2',
  'オドシシ': 'Stantler',
  'ドーブル': 'Smeargle',
  'バルキー': 'Tyrogue',
  'カポエラー': 'Hitmontop',
  'ムチュール': 'Smoochum',
  'エレキッド': 'Elekid',
  'ブビィ': 'Magby',
  'ミルタンク': 'Miltank',
  'ハピナス': 'Blissey',
  'ライコウ': 'Raikou',
  'エンテイ': 'Entei',
  'スイクン': 'Suicune',
  'ヨーギラス': 'Larvitar',
  'サナギラス': 'Pupitar',
  'バンギラス': 'Tyranitar',
  'ルギア': 'Lugia',
  'ホウオウ': 'Ho-Oh',
  'セレビィ': 'Celebi'
};

async function run() {
  const namesPath = path.join(__dirname, '../public/ja-card-names.json');
  const cardNames = JSON.parse(fs.readFileSync(namesPath, 'utf8'));
  const pokeDictPath = path.join(__dirname, '../public/pokemon-ja-en-dict.json');
  const pokeDict = JSON.parse(fs.readFileSync(pokeDictPath, 'utf8'));

  const fullDict = { ...pokeDict, ...KATAKANA_AND_ANOMALY_MAP };
  const jaRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/;
  let fixedCount = 0;

  for (const [k, v] of Object.entries(cardNames)) {
    if (jaRegex.test(v)) {
      let cleaned = v;

      // 1. Direct dict lookup
      if (fullDict[cleaned]) {
        cleaned = fullDict[cleaned];
      } else {
        // 2. Substring replacement from longest to shortest
        const keysSorted = Object.keys(fullDict).sort((a, b) => b.length - a.length);
        for (const key of keysSorted) {
          if (key.length >= 2 && cleaned.includes(key)) {
            cleaned = cleaned.split(key).join(fullDict[key]);
          }
        }
      }

      if (cleaned !== v) {
        cardNames[k] = cleaned;
        fixedCount++;
      }
    }
  }

  // Final check
  let remainingJa = 0;
  for (const v of Object.values(cardNames)) {
    if (jaRegex.test(v)) remainingJa++;
  }

  fs.writeFileSync(namesPath, JSON.stringify(cardNames, null, 2), 'utf8');
  console.log(`Cleaned up ${fixedCount} additional anomalies. Cards still containing Japanese characters across all 11,386 keys: ${remainingJa}`);
}

run().catch(console.error);
