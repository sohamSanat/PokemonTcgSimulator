import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const setLogosDir = path.join(rootDir, 'public', 'setLogos');
const setLogosManifestPath = path.join(rootDir, 'public', 'setLogos', 'manifest.json');

console.log('--- Generating Authentic Japanese Sword & Shield Set Logos ---');

const swshJapaneseSets = [
  { id: 's1h', title: 'シールド', subtitle: 'ポケモンカードゲーム ソード＆シールド', c1: '#FF6B9D', c2: '#D00040', stroke: '#22000A', border: '#FF2A6D' },
  { id: 's1w', title: 'ソード', subtitle: 'ポケモンカードゲーム ソード＆シールド', c1: '#56CCF2', c2: '#2F80ED', stroke: '#051937', border: '#00C9FF' },
  { id: 's1a', title: 'VMAXライジング', subtitle: '強化拡張パック', c1: '#FFE000', c2: '#FF8800', stroke: '#2B1400', border: '#FFBB00' },
  { id: 's2', title: '反逆クラッシュ', subtitle: '拡張パック', c1: '#FF416C', c2: '#FF4B2B', stroke: '#3A0007', border: '#FF758C' },
  { id: 's2a', title: '爆炎ウォーカー', subtitle: '強化拡張パック', c1: '#FFA07A', c2: '#FF4500', stroke: '#4A0000', border: '#FF6347' },
  { id: 's3', title: 'ムゲンゾーン', subtitle: '拡張パック', c1: '#E0C3FC', c2: '#8EC5FC', stroke: '#20003B', border: '#B5179E' },
  { id: 's3a', title: '伝説の鼓動', subtitle: '強化拡張パック', c1: '#FEE140', c2: '#FA709A', stroke: '#380017', border: '#F6D365' },
  { id: 's4', title: '仰天のボルテッカー', subtitle: '拡張パック', c1: '#FFF800', c2: '#FF9100', stroke: '#3D2800', border: '#FFE600' },
  { id: 's4a', title: 'シャイニースターV', subtitle: 'ハイクラスパック', c1: '#FFFFFF', c2: '#B0C4DE', stroke: '#0B192C', border: '#E2E8F0' },
  { id: 's5i', title: '一撃マスター', subtitle: '拡張パック', c1: '#FF3333', c2: '#990000', stroke: '#1A0000', border: '#FF4D4D' },
  { id: 's5r', title: '連撃マスター', subtitle: '拡張パック', c1: '#00D2FF', c2: '#0066FF', stroke: '#001A33', border: '#33E0FF' },
  { id: 's5a', title: '双璧のファイター', subtitle: '強化拡張パック', c1: '#F39C12', c2: '#8E44AD', stroke: '#2C3E50', border: '#E67E22' },
  { id: 's6h', title: '白銀のランス', subtitle: '拡張パック', c1: '#E0EAFC', c2: '#CFDEF3', stroke: '#1C2D42', border: '#A1C4FD' },
  { id: 's6k', title: '漆黒のガイスト', subtitle: '拡張パック', c1: '#8A2387', c2: '#E94057', stroke: '#1F002B', border: '#A855F7' },
  { id: 's6a', title: 'イーブイヒーローズ', subtitle: '強化拡張パック', c1: '#FFF5C0', c2: '#FF9900', stroke: '#2B1700', border: '#FFD700' },
  { id: 's7d', title: '摩天パーフェクト', subtitle: '拡張パック', c1: '#E6DADA', c2: '#274046', stroke: '#0F171E', border: '#90A4AE' },
  { id: 's7r', title: '蒼空ストリーム', subtitle: '拡張パック', c1: '#00F2FE', c2: '#4FACFE', stroke: '#002244', border: '#00E5FF' },
  { id: 's8', title: 'フュージョンアーツ', subtitle: '拡張パック', c1: '#FF758C', c2: '#FF7EB3', stroke: '#4A0027', border: '#FF6584' },
  { id: 's8a', title: '25th アニバーサリー', subtitle: '拡張パック', c1: '#FFE259', c2: '#FFA751', stroke: '#3D2700', border: '#FFD700' },
  { id: 's8b', title: 'VMAXクライマックス', subtitle: 'ハイクラスパック', c1: '#F12711', c2: '#F5AF19', stroke: '#420000', border: '#FF5722' },
  { id: 's9', title: 'スターバース', subtitle: '拡張パック', c1: '#89F7FE', c2: '#66A6FF', stroke: '#0B1B3D', border: '#4FACFE' },
  { id: 's9a', title: 'バトルリージョン', subtitle: '強化拡張パック', c1: '#11998E', c2: '#38EF7D', stroke: '#06332B', border: '#20BF6B' },
  { id: 's10d', title: 'タイムゲイザー', subtitle: '拡張パック', c1: '#A8C0FF', c2: '#3F2B96', stroke: '#100938', border: '#6C5CE7' },
  { id: 's10p', title: 'スペースジャグラー', subtitle: '拡張パック', c1: '#FAD0C4', c2: '#FF9A9E', stroke: '#4A1525', border: '#FD79A8' },
  { id: 's10a', title: 'ダークファンタズマ', subtitle: '強化拡張パック', c1: '#B92B27', c2: '#1565C0', stroke: '#120626', border: '#8E44AD' },
  { id: 's10b', title: 'Pokémon GO', subtitle: '強化拡張パック', c1: '#38EF7D', c2: '#11998E', stroke: '#052B24', border: '#00B894' },
  { id: 's11', title: 'ロストアビス', subtitle: '拡張パック', c1: '#DA22FF', c2: '#9733EE', stroke: '#21004A', border: '#BE2ED6' },
  { id: 's11a', title: '白熱のアルカナ', subtitle: '強化拡張パック', c1: '#FFECEC', c2: '#F8A5C2', stroke: '#4A1C2C', border: '#F78FB3' },
  { id: 's12', title: 'パラダイムトリガー', subtitle: '拡張パック', c1: '#4E65FF', c2: '#92EFFD', stroke: '#0F1B4C', border: '#38ADA9' },
  { id: 's12a', title: 'VSTARユニバース', subtitle: 'ハイクラスパック', c1: '#F6D365', c2: '#FDA085', stroke: '#3B1C00', border: '#FFB800' }
];

let manifest = {};
if (fs.existsSync(setLogosManifestPath)) {
  manifest = JSON.parse(fs.readFileSync(setLogosManifestPath, 'utf8'));
}

async function generateLogos() {
  let generatedCount = 0;

  for (const set of swshJapaneseSets) {
    const rawId = set.id;
    const jaFilename = `${rawId}_ja.png`;
    const outputPath = path.join(setLogosDir, jaFilename);

    // Compute text font sizes and positions based on title length
    const fontSize = set.title.length > 9 ? 42 : set.title.length > 6 ? 50 : 58;

    const svg = `
<svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad_${rawId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${set.c1}" />
      <stop offset="100%" stop-color="${set.c2}" />
    </linearGradient>
    <filter id="shadow_${rawId}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#000" flood-opacity="0.85"/>
    </filter>
  </defs>

  <g filter="url(#shadow_${rawId})">
    <!-- Subtitle badge -->
    <rect x="150" y="24" width="300" height="30" rx="15" fill="#0D0E15" stroke="${set.border}" stroke-width="2" />
    <text x="300" y="44" font-family="'Hiragino Sans', 'Meiryo', 'Yu Gothic', 'Noto Sans JP', sans-serif" font-weight="900" font-size="12" fill="${set.border}" text-anchor="middle" letter-spacing="2">
      ${set.subtitle}
    </text>

    <!-- Main Title Japanese Text -->
    <text x="300" y="132" font-family="'Hiragino Kaku Gothic Pro', 'Meiryo', 'Yu Gothic', 'Noto Sans JP', sans-serif" font-weight="900" font-size="${fontSize}" fill="url(#grad_${rawId})" text-anchor="middle" stroke="${set.stroke}" stroke-width="12" paint-order="stroke fill" letter-spacing="3">
      ${set.title}
    </text>
  </g>
</svg>
`;

    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(outputPath);

      const logoUrl = `/setLogos/${jaFilename}`;
      manifest[`${rawId}_ja`] = logoUrl;
      manifest[`${rawId.toUpperCase()}_ja`] = logoUrl;
      manifest[rawId] = logoUrl;
      manifest[rawId.toUpperCase()] = logoUrl;

      // Add mixed case mappings
      const mixedJaKey = rawId.replace(/([0-9]+)([a-z]+)/i, (_, n, s) => `${n}${s.toLowerCase()}_ja`);
      const mixedUpperJaKey = rawId.replace(/([0-9]+)([a-z]+)/i, (_, n, s) => `${n}${s.toUpperCase()}_ja`);
      manifest[mixedJaKey] = logoUrl;
      manifest[mixedUpperJaKey] = logoUrl;

      generatedCount++;
    } catch (err) {
      console.error(`Failed to generate logo for ${rawId}:`, err);
    }
  }

  fs.writeFileSync(setLogosManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✅ Generated ${generatedCount} Japanese set logo graphics & updated manifest!`);
}

generateLogos();
