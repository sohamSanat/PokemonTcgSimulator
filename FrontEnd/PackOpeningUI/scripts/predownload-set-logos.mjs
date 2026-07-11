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
  console.log('Fetching all series & sets from TCGdex...');
  try {
    const setsRes = await fetch(`${API_BASE}/sets`);
    if (!setsRes.ok) {
      throw new Error(`Failed to fetch sets: ${setsRes.status}`);
    }
    const sets = await setsRes.json();
    console.log(`Found ${sets.length} total sets across all generations! Predownloading logos...`);

    const manifest = {};
    let downloadedCount = 0;
    let cachedCount = 0;
    let failedCount = 0;

    // We process in batches of 10 to be fast and not overload TCGdex CDN
    const batchSize = 15;
    for (let i = 0; i < sets.length; i += batchSize) {
      const batch = sets.slice(i, i + batchSize);
      await Promise.all(batch.map(async (set) => {
        if (!set.logo) {
          return;
        }

        const safeId = set.id.replace(/[^a-z0-9.-]/gi, '_');
        const pngPath = path.join(publicSetLogosDir, `${safeId}.png`);
        const webpPath = path.join(publicSetLogosDir, `${safeId}.webp`);

        // Check if already downloaded
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

        // Try downloading .png from set.logo + '.png'
        const pngUrl = `${set.logo}.png`;
        let success = await downloadLogo(pngUrl, pngPath);
        if (success) {
          manifest[set.id] = `/setLogos/${safeId}.png`;
          manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.png`;
          downloadedCount++;
        } else {
          // Try .webp if .png fails
          const webpUrl = `${set.logo}.webp`;
          success = await downloadLogo(webpUrl, webpPath);
          if (success) {
            manifest[set.id] = `/setLogos/${safeId}.webp`;
            manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.webp`;
            downloadedCount++;
          } else {
            // Also try fetching without extension or with .jpg
            const jpgPath = path.join(publicSetLogosDir, `${safeId}.jpg`);
            success = await downloadLogo(`${set.logo}.jpg`, jpgPath);
            if (success) {
              manifest[set.id] = `/setLogos/${safeId}.jpg`;
              manifest[set.id.toLowerCase()] = `/setLogos/${safeId}.jpg`;
              downloadedCount++;
            } else {
              failedCount++;
            }
          }
        }
      }));
      console.log(`Progress: ${Math.min(i + batchSize, sets.length)} / ${sets.length} sets processed...`);
    }

    const manifestPath = path.join(publicSetLogosDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n✅ Predownload Complete!`);
    console.log(`New downloaded: ${downloadedCount}`);
    console.log(`Already cached: ${cachedCount}`);
    console.log(`No logo / failed: ${failedCount}`);
    console.log(`Manifest saved with ${Object.keys(manifest).length} entries at: ${manifestPath}`);
  } catch (err) {
    console.error('Error in predownload script:', err);
    process.exit(1);
  }
}

run();
