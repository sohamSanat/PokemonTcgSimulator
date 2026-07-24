import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicSetLogosDir = path.resolve(__dirname, '../public/setLogos');
if (!fs.existsSync(publicSetLogosDir)) {
  fs.mkdirSync(publicSetLogosDir, { recursive: true });
}

const API_BASE = 'https://api.tcgdex.net/v2/en';

async function downloadLogo(url, filepath) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 100) return false; // ignore invalid small files
    fs.writeFileSync(filepath, buffer);
    return true;
  } catch (err) {
    return false;
  }
}

async function run() {
  console.log('Fetching English series & sets from TCGdex...');
  const manifestPath = path.join(publicSetLogosDir, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {}
  }

  let downloadedCount = 0;
  let cachedCount = 0;
  let failedCount = 0;

  try {
    const setsRes = await fetch(`${API_BASE}/sets`);
    if (setsRes.ok) {
      const sets = await setsRes.json();
      console.log(`Found ${sets.length} total English sets! Predownloading logos...`);

      const batchSize = 15;
      for (let i = 0; i < sets.length; i += batchSize) {
        const batch = sets.slice(i, i + batchSize);
        await Promise.all(batch.map(async (set) => {
          if (!set.logo) return;

          const safeId = set.id.replace(/[^a-z0-9.-]/gi, '_');
          const pngPath = path.join(publicSetLogosDir, `${safeId}.png`);
          const webpPath = path.join(publicSetLogosDir, `${safeId}.webp`);

          if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 100) {
            manifest[set.id] = `/setLogos/${safeId}.png`;
            manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.png`;
            cachedCount++;
            return;
          }
          if (fs.existsSync(webpPath) && fs.statSync(webpPath).size > 100) {
            manifest[set.id] = `/setLogos/${safeId}.webp`;
            manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.webp`;
            cachedCount++;
            return;
          }

          const pngUrl = `${set.logo}.png`;
          let success = await downloadLogo(pngUrl, pngPath);
          if (success) {
            manifest[set.id] = `/setLogos/${safeId}.png`;
            manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.png`;
            downloadedCount++;
          } else {
            const webpUrl = `${set.logo}.webp`;
            success = await downloadLogo(webpUrl, webpPath);
            if (success) {
              manifest[set.id] = `/setLogos/${safeId}.webp`;
              manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.webp`;
              downloadedCount++;
            } else {
              failedCount++;
            }
          }
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching English sets:', err);
  }

  // Next, download Japanese set logos from Scrydex using ja-sets.json
  const jaSetsPath = path.resolve(__dirname, '../public/ja-sets.json');
  if (fs.existsSync(jaSetsPath)) {
    try {
      const jaSets = JSON.parse(fs.readFileSync(jaSetsPath, 'utf8'));
      console.log(`Found ${jaSets.length} Japanese sets! Predownloading logos...`);
      const batchSize = 15;
      for (let i = 0; i < jaSets.length; i += batchSize) {
        const batch = jaSets.slice(i, i + batchSize);
        await Promise.all(batch.map(async (set) => {
          const rawId = set.id.toLowerCase();
          const jaId = `${rawId}_ja`;
          const pngPath = path.join(publicSetLogosDir, `${rawId}_ja.png`);

          if (fs.existsSync(pngPath) && fs.statSync(pngPath).size > 100) {
            manifest[jaId] = `/setLogos/${rawId}_ja.png`;
            manifest[`${set.id}_ja`] = `/setLogos/${rawId}_ja.png`;
            cachedCount++;
            return;
          }

          const url = `https://images.scrydex.com/pokemon/${rawId}_ja-logo/logo`;
          const success = await downloadLogo(url, pngPath);
          if (success) {
            manifest[jaId] = `/setLogos/${rawId}_ja.png`;
            manifest[`${set.id}_ja`] = `/setLogos/${rawId}_ja.png`;
            downloadedCount++;
          } else {
            failedCount++;
          }
        }));
      }
    } catch (err) {
      console.error('Error processing Japanese set logos:', err);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Predownload Complete!`);
  console.log(`New downloaded: ${downloadedCount}`);
  console.log(`Already cached: ${cachedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Manifest saved with ${Object.keys(manifest).length} entries at: ${manifestPath}`);
}

run();
