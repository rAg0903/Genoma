import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'src/assets/genoma-logo_high_quality.ico');
const publicDir = path.join(root, 'public');
const indexHtml = path.join(root, 'index.html');
const target = path.join(publicDir, 'favicon.ico');

if (!fs.existsSync(source)) {
  console.error('Ficheiro não encontrado:', source);
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
