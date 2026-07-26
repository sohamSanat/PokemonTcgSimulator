import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Compiling Japanese card names directly from Japanese-PriceCharts...');
execSync(`node "${path.join(__dirname, 'compile_japanese_prices.mjs')}"`, { stdio: 'inherit' });

