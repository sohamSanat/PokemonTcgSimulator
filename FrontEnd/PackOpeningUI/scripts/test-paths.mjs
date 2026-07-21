import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
// PackOpeningUI/../Japanese-PriceCharts
const PRICE_CHARTS_ROOT = path.resolve(ROOT, '..', 'Japanese-PriceCharts');

console.log('ROOT:', ROOT);
console.log('PRICE_CHARTS_ROOT:', PRICE_CHARTS_ROOT);
console.log('Test path exists:', fs.existsSync(path.join(PRICE_CHARTS_ROOT, 'XY', 'Collection X', 'cards.json')));
