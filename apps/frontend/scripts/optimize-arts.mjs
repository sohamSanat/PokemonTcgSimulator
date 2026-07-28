import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontEndPackArtsDir = path.resolve(__dirname, '../../packArts');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        const outPath = fullPath.substring(0, fullPath.lastIndexOf('.')) + '.webp';
        
        console.log(`Optimizing: ${entry.name}`);
        try {
          await sharp(fullPath)
            .resize({ width: 600, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outPath);
            
          // If successful, delete the original to save space and ensure only webp exists
          fs.unlinkSync(fullPath);
          console.log(`✅ Saved ${path.basename(outPath)} and deleted original.`);
        } catch (err) {
          console.error(`❌ Failed to process ${fullPath}:`, err);
        }
      }
    }
  }
}

async function run() {
  console.log('Starting pack arts optimization...');
  if (!fs.existsSync(frontEndPackArtsDir)) {
    console.error(`Directory not found: ${frontEndPackArtsDir}`);
    process.exit(1);
  }
  
  await processDirectory(frontEndPackArtsDir);
  console.log('Finished optimizing all pack arts!');
}

run();
