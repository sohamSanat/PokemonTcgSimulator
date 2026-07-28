import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const setLogosManifestPath = path.join(rootDir, 'public', 'setLogos', 'manifest.json');
const setLogosDir = path.join(rootDir, 'public', 'setLogos');

console.log('--- Updating Japanese Sword & Shield Set Logos & Metadata ---');

const swshLogoMapping = {
  's1h': 'swsh1.png',
  's1w': 'swsh1.png',
  's1a': 'swsh1.png',
  's2': 'swsh2.png',
  's2a': 'swsh2.png',
  's3': 'swsh3.png',
  's3a': 'swsh3.5.png',
  's4': 'swsh4.png',
  's4a': 'swsh4.5.png',
  's5i': 'swsh5.png',
  's5r': 'swsh5.png',
  's5a': 'swsh6.png',
  's6h': 'swsh6.png',
  's6k': 'swsh6.png',
  's6a': 'swsh7.png',
  's7d': 'swsh7.png',
  's7r': 'swsh7.png',
  's8': 'swsh8.png',
  's8a': 'cel25.png',
  's8b': 'swsh9.png',
  's9': 'swsh9.png',
  's9a': 'swsh10.png',
  's10d': 'swsh10.png',
  's10p': 'swsh10.png',
  's10a': 'swsh11.png',
  's10b': 'swsh10.5.png',
  's11': 'swsh11.png',
  's11a': 'swsh12.png',
  's12': 'swsh12.png',
  's12a': 'swsh12.5.png'
};

let manifest = {};
if (fs.existsSync(setLogosManifestPath)) {
  manifest = JSON.parse(fs.readFileSync(setLogosManifestPath, 'utf8'));
}

let updatedCount = 0;

for (const [rawId, sourceImage] of Object.entries(swshLogoMapping)) {
  const sourcePath = path.join(setLogosDir, sourceImage);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`Warning: Source image ${sourceImage} not found for ${rawId}`);
    continue;
  }

  // Copy image to s*_ja.png
  const destJaPath = path.join(setLogosDir, `${rawId}_ja.png`);
  fs.copyFileSync(sourcePath, destJaPath);

  // Update manifest entries for all casing variations
  const logoUrl = `/setLogos/${sourceImage}`;
  manifest[`${rawId}_ja`] = logoUrl;
  manifest[`${rawId.toUpperCase()}_ja`] = logoUrl;
  manifest[`${rawId}`] = logoUrl;
  manifest[`${rawId.toUpperCase()}`] = logoUrl;

  // Add camel/mixed case keys if applicable
  const mixedJaKey = rawId.replace(/([0-9]+)([a-z]+)/i, (_, n, s) => `${n}${s.toLowerCase()}_ja`);
  const mixedUpperJaKey = rawId.replace(/([0-9]+)([a-z]+)/i, (_, n, s) => `${n}${s.toUpperCase()}_ja`);
  manifest[mixedJaKey] = logoUrl;
  manifest[mixedUpperJaKey] = logoUrl;

  updatedCount++;
}

// Write back updated manifest
fs.writeFileSync(setLogosManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

console.log(`✅ Successfully updated ${updatedCount} Japanese Sword & Shield logos and manifest entries!`);
