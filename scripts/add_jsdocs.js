const fs = require('fs');
const path = require('path');

const docs = {
  'PrePSARestorationStudio.tsx': '/**\n * Pre-PSA Restoration Studio Component\n * \n * Provides an interface for the user to perform restoration tasks on their card\n * before sending it to PSA for grading.\n */',
  'components/ThermalPressStation.tsx': '/**\n * Thermal Press Station\n * \n * Station 1 in the Restoration Studio. Allows users to apply heat and pressure\n * to fix card warping.\n */',
  'components/EdgeRepairStation.tsx': '/**\n * Edge Repair Station\n * \n * Station 2 in the Restoration Studio. Allows users to use a touch-up pen\n * to seal and repair edge whitening or dings.\n */',
  'components/RotaryBufferStation.tsx': '/**\n * Rotary Buffer Station\n * \n * Station 3 in the Restoration Studio. Allows users to polish holographic\n * scuffs using an electric buffer.\n */',
  'components/CardSaverStation.tsx': '/**\n * Card Saver Station\n * \n * Station 4 in the Restoration Studio. Guides the user through placing the card\n * in a penny sleeve and ultrasonic laser sealing it in a Card Saver 1.\n */',
};

const baseDir = path.join(__dirname, '../apps/frontend/src/app/components/psa');

for (const [file, jsdoc] of Object.entries(docs)) {
  const filePath = path.join(baseDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('/**')) {
      const match = content.match(/export default function/);
      if (match) {
        content = content.replace('export default function', jsdoc + '\nexport default function');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Added JSDoc to ' + file);
      }
    } else {
      console.log('JSDoc already exists in ' + file);
    }
  } else {
    console.log('File not found: ' + file);
  }
}
