import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const indexHtml = path.join(root, 'index.html');

const icoSource = path.join(root, 'src/assets/genoma-logo_high_quality.ico');
const pngSource = path.join(publicDir, 'genoma-logo.png');
const target = path.join(publicDir, 'favicon.ico');

const source = fs.existsSync(icoSource) ? icoSource : (fs.existsSync(pngSource) ? pngSource : null);

if (!source) {
  if (fs.existsSync(target)) {
    console.warn('generate-favicon: sem origem; mantém favicon.ico existente.');
    process.exit(0);
  }
  console.error('generate-favicon: coloque genoma-logo.png em public/ ou genoma-logo_high_quality.ico em src/assets/');
  process.exit(1);
}

fs.copyFileSync(source, target);

const version = String(Math.floor(fs.statSync(source).mtimeMs));
const html = fs.readFileSync(indexHtml, 'utf8');
const updated = html.replace(/\/favicon\.ico\?v=[^"']+/g, `/favicon.ico?v=${version}`);

if (updated !== html) {
  fs.writeFileSync(indexHtml, updated);
}

console.log(`favicon.ico atualizado em public/ (v=${version})`);
