import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JA_TO_EN_DICTIONARY = {
  // Gen 1 (151)
  'フシギダネ': 'Bulbasaur', 'フシギソウ': 'Ivysaur', 'フシギバナ': 'Venusaur',
  'ヒトカゲ': 'Charmander', 'リザード': 'Charmeleon', 'リザードン': 'Charizard',
  'ゼニガメ': 'Squirtle', 'カメール': 'Wartortle', 'カメックス': 'Blastoise',
  'キャタピー': 'Caterpie', 'トランセル': 'Metapod', 'バタフリー': 'Butterfree',
  'ビードル': 'Weedle', 'コクーン': 'Kakuna', 'スピアー': 'Beedrill',
  'ポッポ': 'Pidgey', 'ピジョン': 'Pidgeotto', 'ピジョット': 'Pidgeot',
  'コラッタ': 'Rattata', 'ラッタ': 'Raticate', 'オニスズメ': 'Spearow', 'オニドリル': 'Fearow',
  'アーボ': 'Ekans', 'アーボック': 'Arbok', 'ピカチュウ': 'Pikachu', 'ライチュウ': 'Raichu',
  'サンド': 'Sandshrew', 'サンドパン': 'Sandslash', 'ニドラン♀': 'Nidoran♀', 'ニドリーナ': 'Nidorina', 'ニドクイン': 'Nidoqueen',
  'ニドラン♂': 'Nidoran♂', 'ニドリーノ': 'Nidorino', 'ニドキング': 'Nidoking', 'ピッピ': 'Clefairy', 'ピクシー': 'Clefable',
  'ロコン': 'Vulpix', 'キュウコン': 'Ninetales', 'プリン': 'Jigglypuff', 'プクリン': 'Wigglytuff',
  'ズバット': 'Zubat', 'ゴルバット': 'Golbat', 'ナゾノクサ': 'Oddish', 'クサイハナ': 'Gloom', 'ラフレシア': 'Vileplume',
  'パラス': 'Paras', 'パラセクト': 'Parasect', 'コンパン': 'Venonat', 'モルフォン': 'Venomoth',
  'ディグダ': 'Diglett', 'ダグトリオ': 'Dugtrio', 'ニャース': 'Meowth', 'ペルシアン': 'Persian',
  'コダック': 'Psyduck', 'ゴルダック': 'Golduck', 'マンキー': 'Mankey', 'オコリザル': 'Primeape',
  'ガーディ': 'Growlithe', 'ウインディ': 'Arcanine', 'ニョロモ': 'Poliwag', 'ニョロゾ': 'Poliwhirl', 'ニョロボン': 'Poliwrath',
  'ケーシィ': 'Abra', 'ユンゲラー': 'Kadabra', 'フーディン': 'Alakazam', 'ワンリキー': 'Machop', 'ゴーリキー': 'Machoke', 'カイリキー': 'Machamp',
  'マダツボミ': 'Bellsprout', 'ウツドン': 'Weepinbell', 'ウツボット': 'Victreebel', 'メノクラゲ': 'Tentacool', 'ドククラゲ': 'Tentacruel',
  'イシツブテ': 'Geodude', 'ゴローン': 'Graveler', 'ゴローニャ': 'Golem', 'ポニータ': 'Ponyta', 'ギャロップ': 'Rapidash',
  'ヤドン': 'Slowpoke', 'ヤドラン': 'Slowbro', 'コイル': 'Magnemite', 'レアコイル': 'Magneton',
  'カモネギ': "Farfetch'd", 'ドードー': 'Doduo', 'ドードリオ': 'Dodrio', 'パウワウ': 'Seel', 'ジュゴン': 'Dewgong',
  'ベトベター': 'Grimer', 'ベトベトン': 'Muk', 'シェルダー': 'Shellder', 'パルシェン': 'Cloyster',
  'ゴース': 'Gastly', 'ゴースト': 'Haunter', 'ゲンガー': 'Gengar', 'イワーク': 'Onix',
  'スリープ': 'Drowzee', 'スリーパー': 'Hypno', 'クラブ': 'Krabby', 'キングラー': 'Kingler',
  'ビリリダマ': 'Voltorb', 'マルマイン': 'Electrode', 'タマタマ': 'Exeggcute', 'ナッシー': 'Exeggutor',
  'カラカラ': 'Cubone', 'ガラガラ': 'Marowak', 'サワムラー': 'Hitmonlee', 'エビワラー': 'Hitmonchan',
  'ベロリンガ': 'Lickitung', 'ドガース': 'Koffing', 'マタドガス': 'Weezing', 'サイホーン': 'Rhyhorn', 'サイドン': 'Rhydon',
  'ラッキー': 'Chansey', 'モンジャラ': 'Tangela', 'ガルーラ': 'Kangaskhan', 'タッツー': 'Horsea', 'シードラ': 'Seadra',
  'トサキント': 'Goldeen', 'アズマオウ': 'Seaking', 'ヒトデマン': 'Staryu', 'スターミー': 'Starmie',
  'バリヤード': 'Mr. Mime', 'ストライク': 'Scyther', 'ルージュラ': 'Jynx', 'エレブー': 'Electabuzz', 'ブーバー': 'Magmar',
  'カイロス': 'Pinsir', 'ケンタロス': 'Tauros', 'コイキング': 'Magikarp', 'ギャラドス': 'Gyarados',
  'ラプラス': 'Lapras', 'メタモン': 'Ditto', 'イーブイ': 'Eevee', 'シャワーズ': 'Vaporeon', 'サンダース': 'Jolteon', 'ブースター': 'Flareon',
  'ポリゴン': 'Porygon', 'オムナイト': 'Omanyte', 'オムスター': 'Omastar', 'カブト': 'Kabuto', 'カブトプス': 'Kabutops',
  'プテラ': 'Aerodactyl', 'カビゴン': 'Snorlax', 'フリーザー': 'Articuno', 'サンダー': 'Zapdos', 'ファイヤー': 'Moltres',
  'ミニリュウ': 'Dratini', 'ハクリュー': 'Dragonair', 'カイリュー': 'Dragonite', 'ミュウツー': 'Mewtwo', 'ミュウ': 'Mew',

  // Trainers / Items / Eeveelutions / Popular SV Gen 9
  'エリカの招待': "Erika's Invitation", 'サカキのカリスマ': "Giovanni's Charisma", 'ナナミの手助け': "Daisy's Help", 'マサキの転送': "Bill's Transfer", 'サイクリングロード': "Cycling Road", '安全ゴーグル': "Protective Goggles", '大きなふうせん': "Big Air Balloon", 'ガチガチバンド': "Rigid Band", 'たべのこし': "Leftovers", 'ポケモンいれかえ': "Switch", '基本超エネルギー': "Basic Psychic Energy",
  'ナンジャモ': "Iono", 'ミモザ': "Miriam", 'キハダ': "Dendra", 'チリ': "Rika", 'ポピー': "Poppy", 'オモダカ': "Geeta", 'ベル': "Bianca", 'ベルのまごころ': "Bianca's Devotion", 'ゼイユ': "Carmine", 'スグリ': "Kieran", 'タロ': "Lacey", 'カキツバタ': "Drayton", 'ブライア': "Briar", 'ボスの指令': "Boss's Orders", 'ネストボール': "Nest Ball", 'ハイパーボール': "Ultra Ball", 'ペパー': "Arven", 'ジャッジマン': "Judge", '博士の研究': "Professor's Research", 'すごいつりざお': "Super Rod", 'なかよしポフィン': "Buddy-Buddy Poffin", 'プライムキャッチャー': "Prime Catcher", 'マキシマムベルト': "Maximum Belt", 'ヒーローマント': "Hero's Cape",
  'ニャオハ': "Sprigatito", 'ニャローテ': "Floragato", 'マスカーニャ': "Meowscarada", 'ホゲータ': "Fuecoco", 'アチゲータ': "Crocalor", 'ラウドボーン': "Skeledirge", 'クワッス': "Quaxly", 'ウェルカモ': "Quaxwell", 'ウェーニバル': "Quaquaval", 'コライドン': "Koraidon", 'ミライドン': "Miraidon", 'テラパゴス': "Terapagos", 'オーガポン': "Ogerpon", 'ルカリオ': "Lucario", 'レックウザ': "Rayquaza", 'ブラッキー': "Umbreon", 'ニンフィア': "Sylveon", 'グレイシア': "Glaceon", 'リーフィア': "Leafeon", 'エーフィ': "Espeon"
};

function translateJaName(jaName) {
  if (!jaName) return jaName;
  if (JA_TO_EN_DICTIONARY[jaName]) return JA_TO_EN_DICTIONARY[jaName];

  const suffixMatch = jaName.match(/^(.*?)(ex|VMAX|VSTAR|V|GX|STAR|SAR|SR|UR|AR)$/i);
  if (suffixMatch) {
    const baseJa = suffixMatch[1].trim();
    const suffix = suffixMatch[2];
    if (JA_TO_EN_DICTIONARY[baseJa]) {
      return `${JA_TO_EN_DICTIONARY[baseJa]} ${suffix}`;
    }
  }

  for (const [jaKey, enVal] of Object.entries(JA_TO_EN_DICTIONARY)) {
    if (jaName.startsWith(jaKey)) {
      const rest = jaName.slice(jaKey.length).trim();
      return rest ? `${enVal} ${rest}` : enVal;
    }
  }
  return jaName;
}

const EN_ALIAS_MAP = {
  'sv2a': 'sv03.5', 'sv1s': 'sv01', 'sv1v': 'sv01', 'sv2d': 'sv02', 'sv2p': 'sv02',
  'sv3': 'sv03', 'sv4a': 'sv04.5', 'sv4k': 'sv04', 'sv4m': 'sv04', 'sv5a': 'sv05',
  'sv5k': 'sv05', 'sv5m': 'sv05', 'sv6': 'sv06', 'sv6a': 'sv06.5', 'sv7': 'sv07',
  'sv8': 'sv08', 'sv8a': 'sv08.5'
};

async function generateCardNames() {
  const jaSetsPath = path.join(__dirname, '../public/ja-sets.json');
  const jaSets = JSON.parse(fs.readFileSync(jaSetsPath, 'utf8'));

  const result = {};

  console.log(`Processing ${jaSets.length} Japanese sets...`);

  // Target Scarlet & Violet + Sword & Shield + Sun & Moon sets
  const targetSets = jaSets.filter(s => {
    const id = s.id.toLowerCase();
    return id.startsWith('sv') || id.startsWith('s') || id.startsWith('sm') || id.startsWith('xy');
  });

  for (const set of targetSets) {
    const rawId = set.id;
    const prefixLow = rawId.toLowerCase();
    console.log(`Fetching ${rawId}...`);

    let setNamesMap = new Map();

    // 1. Fetch Japanese set from TCGDex
    try {
      const resJa = await fetch(`https://api.tcgdex.net/v2/ja/sets/${rawId}`);
      if (resJa.ok) {
        const dataJa = await resJa.json();
        if (Array.isArray(dataJa?.cards)) {
          for (const c of dataJa.cards) {
            if (c.localId && c.name) {
              const numKey = parseInt(c.localId, 10).toString();
              setNamesMap.set(numKey, translateJaName(c.name));
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // 2. Fetch English alias set if available
    const enAlias = EN_ALIAS_MAP[prefixLow] || prefixLow;
    try {
      const resEn = await fetch(`https://api.tcgdex.net/v2/en/sets/${enAlias}`);
      if (resEn.ok) {
        const dataEn = await resEn.json();
        if (Array.isArray(dataEn?.cards)) {
          for (const c of dataEn.cards) {
            if (c.localId && c.name) {
              setNamesMap.set(parseInt(c.localId, 10).toString(), c.name);
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }

    const totalCards = set.cardCount?.total || set.cardCount?.official || 200;
    for (let i = 1; i <= totalCards; i++) {
      const numKey = i.toString();
      if (setNamesMap.has(numKey)) {
        result[`${prefixLow}_ja-${numKey}`] = setNamesMap.get(numKey);
      }
    }
  }

  const outPath = path.join(__dirname, '../public/ja-card-names.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved ${Object.keys(result).length} Japanese card names to public/ja-card-names.json!`);
}

generateCardNames().catch(console.error);
