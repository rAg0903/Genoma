/**
 * Gera backend/src/data/cp-lookup.json a partir dos dados abertos (CTT / dssg-pt).
 * Executar: node scripts/build-cp-lookup.js
 */
const fs = require('fs');
const path = require('path');

const CSV_URL =
  'https://raw.githubusercontent.com/dssg-pt/mp-mapeamento-cp7/main/output_data/cod_post_freg_matched.csv';
const OUT_FILE = path.join(__dirname, '../src/data/cp-lookup.json');

const toCp7 = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 7) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
};

async function main() {
  console.log('A descarregar CSV de códigos postais…');
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Falha ao descarregar CSV: ${res.status}`);
  const text = await res.text();

  const lookup = {};
  const cp4Fallback = {};
  const lines = text.split(/\r?\n/);

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const parts = line.split(',');
    const cp7 = toCp7(parts[0]);
    const distrito = String(parts[1] || '').trim();
    const concelho = String(parts[2] || '').trim();
    if (!cp7 || (!distrito && !concelho)) continue;

    lookup[cp7] = { d: distrito, c: concelho };
    const cp4 = cp7.slice(0, 4);
    if (!cp4Fallback[cp4]) cp4Fallback[cp4] = { d: distrito, c: concelho };
  }

  const payload = { cp7: lookup, cp4: cp4Fallback };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload));
  console.log(`Gerado ${OUT_FILE}`);
  console.log(`  CP7: ${Object.keys(lookup).length} entradas`);
  console.log(`  CP4: ${Object.keys(cp4Fallback).length} entradas`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
