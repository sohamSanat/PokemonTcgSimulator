import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const TRAINERS_ITEMS_DICT = {
  // Trainers / Supporters
  'エリカの招待': "Erika's Invitation", 'サカキのカリスマ': "Giovanni's Charisma", 'ナナミの手助け': "Daisy's Help", 'マサキの転送': "Bill's Transfer", 'サイクリングロード': "Cycling Road", '安全ゴーグル': "Protective Goggles", '大きなふうせん': "Big Air Balloon", 'ガチガチバンド': "Rigid Band", 'たべのこし': "Leftovers", 'ポケモンいれかえ': "Switch", '基本超エネルギー': "Basic Psychic Energy",
  'ナンジャモ': "Iono", 'ミモザ': "Miriam", 'キハダ': "Dendra", 'チリ': "Rika", 'ポピー': "Poppy", 'オモダカ': "Geeta", 'ベル': "Bianca", 'ベルのまごころ': "Bianca's Devotion", 'ゼイユ': "Carmine", 'スグリ': "Kieran", 'タロ': "Lacey", 'カキツバタ': "Drayton", 'ブライア': "Briar", 'ボスの指令': "Boss's Orders", 'ネストボール': "Nest Ball", 'ハイパーボール': "Ultra Ball", 'ペパー': "Arven", 'ジャッジマン': "Judge", '博士の研究': "Professor's Research", 'すごいつりざお': "Super Rod", 'なかよしポフィン': "Buddy-Buddy Poffin", 'プライムキャッチャー': "Prime Catcher", 'マキシマムベルト': "Maximum Belt", 'ヒーローマント': "Hero's Cape",
  'アカマツ': "Crispin", 'タロ': "Lacey", 'ゼイユ': "Carmine", 'スグリ': "Kieran", 'ブライア': "Briar", 'カキツバタ': "Drayton", 'サザレ': "Perrin", 'セイジ': "Salvatore", 'タイム': "Tyme", 'ハッサク': "Hassel", 'レオル': "Raifort", 'ジニア': "Jacq", 'クラベル': "Clavell", 'オルティガ': "Ortega", 'ピーニャ': "Giacomo", 'メロコ': "Mela", 'シュウメイ': "Atticus", 'ビワ': "Eri", 'グルーシャ': "Grusha", 'リップ': "Tulip", 'ライム': "Ryme", 'コルサ': "Brassius", 'カエデ': "Katy", 'ハイダイ': "Kofu", 'ナンジャモの魅力': "Iono's Appeal",
  'マリィ': "Marnie", 'ユウリ': "Gloria", 'ホップ': "Hop", 'ビート': "Bede", 'ソニア': "Sonia", 'ダンデ': "Leon", 'キバナ': "Raihan", 'ルリナ': "Nessa", 'サイトウ': "Bea", 'オニオン': "Allister", 'マクワ': "Gordie", 'メロン': "Melony", 'ポプラ': "Opal", 'ネズ': "Piers", 'ヤロー': "Milo", 'カブ': "Kabu", 'クララ': "Klara", 'セイボリー': "Avery", 'マスタード': "Mustard", 'シャクヤ': "Peony",
  'リーリエ': "Lillie", 'アセロラ': "Acerola", 'グラジオ': "Gladion", 'ルザミーネ': "Lusamine", 'グズマ': "Guzma", 'プルメリ': "Plumeria", 'スイレン': "Lana", 'マオ': "Mallow", 'カキ': "Kiawe", 'マーマネ': "Sophocles", 'クチナシ': "Nanu", 'ハプウ': "Hapu", 'ライチ': "Olivia", 'ハラ': "Hala", 'ハウ': "Hau",
  'シロナ': "Cynthia", 'ヒカリ': "Dawn", 'コウキ': "Lucas", 'ナタネ': "Gardenia", 'スモモ': "Maylene", 'マキシ': "Crasher Wake", 'メリッサ': "Fantina", 'スズナ': "Candice", 'デンジ': "Volkner", 'オーバ': "Flint", 'ゴヨウ': "Lucian", 'キクノ': "Bertha", 'リョウ': "Aaron",
  'ハルカ': "May", 'ユウキ': "Brendan", 'ツツジ': "Roxanne", 'トウキ': "Brawly", 'テッセン': "Wattson", 'アスナ': "Flannery", 'センリ': "Norman", 'ナギ': "Winona", 'フウとラン': "Tate & Liza", 'ミクリ': "Wallace", 'ダイゴ': "Steven",
  'カスミ': "Misty", 'タケシ': "Brock", 'マチス': "Lt. Surge", 'エリカ': "Erika", 'キョウ': "Koga", 'ナツメ': "Sabrina", 'カツラ': "Blaine", 'サカキ': "Giovanni", 'カンナ': "Lorelei", 'シバ': "Bruno", 'キクコ': "Agatha", 'ワタル': "Lance", 'グリーン': "Blue", 'レッド': "Red",
  // Common Items & Stadiums
  'ふしぎなアメ': "Rare Candy", 'あなぬけのヒモ': "Escape Rope", 'ともだちてちょう': "Pal Pad", 'こだわりベルト': "Choice Belt", 'レスキューキャリー': "Rescue Carrier", 'トレッキングシューズ': "Trekking Shoes", 'クロスシーバー': "Cross Switcher", 'ヒスイのヘビーボール': "Hisuian Heavy Ball", 'ダークパッチ': "Dark Patch", '霧の水晶': "Fog Crystal", 'しんかのおこう': "Evolution Incense", 'クイックボール': "Quick Ball", 'レベルボール': "Level Ball", 'あくまのつぼ': "Urn of Vitality", 'うねりの扇': "Crushing Hammer", 'エネルギー転送': "Energy Search"
};

async function fetchPokeApiSpecies() {
  console.log('Fetching all 1,025 species from PokeAPI...');
  const dict = { ...TRAINERS_ITEMS_DICT };

  const batchSize = 50;
  for (let start = 1; start <= 1025; start += batchSize) {
    const end = Math.min(1025, start + batchSize - 1);
    const promises = [];
    for (let i = start; i <= end; i++) {
      promises.push(
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${i}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      );
    }
    const results = await Promise.all(promises);
    for (const d of results) {
      if (d && d.names) {
        const jaHrkt = d.names.find(n => n.language.name === 'ja-Hrkt')?.name;
        const ja = d.names.find(n => n.language.name === 'ja')?.name;
        const en = d.names.find(n => n.language.name === 'en')?.name;
        if (en) {
          if (jaHrkt) dict[jaHrkt] = en;
          if (ja) dict[ja] = en;
        }
      }
    }
    process.stdout.write(`Fetched species ${start}-${end}\r`);
  }
  console.log('\nSpecies dictionary built with', Object.keys(dict).length, 'keys.');
  return dict;
}

function translateNameWithDict(jaName, dict) {
  if (!jaName) return jaName;
  if (dict[jaName]) return dict[jaName];

  // Check regional prefixes
  let prefixEn = '';
  let restJa = jaName;
  for (const reg of REGIONAL_PREFIXES) {
    if (restJa.startsWith(reg.ja)) {
      prefixEn = reg.en;
      restJa = restJa.slice(reg.ja.length).trim();
      break;
    }
  }

  // Check suffixes (ex, VMAX, VSTAR, V, GX, SAR, SR, UR, AR, etc.)
  const suffixMatch = restJa.match(/^(.*?)(ex|VMAX|VSTAR|V|GX|STAR|SAR|SR|UR|AR|RRR|RR|R|U|C)$/i);
  let baseJa = restJa;
  let suffixEn = '';
  if (suffixMatch) {
    baseJa = suffixMatch[1].trim();
    suffixEn = ' ' + suffixMatch[2];
  }

  // Try exact match on baseJa
  if (dict[baseJa]) {
    return `${prefixEn}${dict[baseJa]}${suffixEn}`.trim();
  }

  // Try matching any dictionary key as prefix of baseJa
  for (const [k, v] of Object.entries(dict)) {
    if (baseJa.startsWith(k) && k.length >= 2) {
      const leftover = baseJa.slice(k.length).trim();
      if (leftover) {
        // e.g. if key matches species and leftover is trainer title or vice versa
        return `${prefixEn}${v} ${leftover}${suffixEn}`.trim();
      } else {
        return `${prefixEn}${v}${suffixEn}`.trim();
      }
    }
  }

  // If we found a regional prefix but couldn't match the base, return prefix + restJa
  if (prefixEn) {
    return `${prefixEn}${restJa}`.trim();
  }

  return jaName;
}

async function run() {
  const dict = await fetchPokeApiSpecies();

  // Save the full pokemon dictionary
  const dictPath = path.join(__dirname, '../public/pokemon-ja-en-dict.json');
  fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2), 'utf8');
  console.log('Saved public/pokemon-ja-en-dict.json');

  // Load existing public/ja-card-names.json
  const namesPath = path.join(__dirname, '../public/ja-card-names.json');
  const cardNames = JSON.parse(fs.readFileSync(namesPath, 'utf8'));

  const jaRegex = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/;
  let translatedCount = 0;
  let remainingJa = 0;

  for (const [k, v] of Object.entries(cardNames)) {
    if (jaRegex.test(v)) {
      const translated = translateNameWithDict(v, dict);
      if (!jaRegex.test(translated) || translated !== v) {
        cardNames[k] = translated;
        translatedCount++;
      }
      if (jaRegex.test(cardNames[k])) {
        remainingJa++;
      }
    }
  }

  fs.writeFileSync(namesPath, JSON.stringify(cardNames, null, 2), 'utf8');
  console.log(`Updated ja-card-names.json! Upgraded ${translatedCount} cards using PokéAPI dictionary. Remaining cards with Japanese characters: ${remainingJa}`);
}

run().catch(console.error);
