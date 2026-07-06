#!/usr/bin/env node
/**
 * Importação de dados históricos do CRM legado Stemyca.
 *
 * Uso:
 *   node src/utils/import-historico.js --file <caminho.xlsx> [--dry-run] [--sheet <nome>]
 *
 * Formatos suportados: .xlsx, .csv (UTF-8)
 *
 * Colunas esperadas (case-insensitive, espaços tolerados):
 *   Para pacientes/contactos:
 *     nome, data_nascimento, genero, nif, telemovel, email, morada
 *   Para processos (opcional, na mesma linha ou folha separada):
 *     numero_processo, estado, data_entrada, teste, medico_nome
 *
 * Folhas reconhecidas (por nome, case-insensitive):
 *   pacientes | contactos | contacts
 *   processos | processes
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const ExcelJS = require('exceljs');
const { v4: uuidv4 } = require('uuid');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const filePath = getArg('--file');
const dryRun = hasFlag('--dry-run');
const sheetFilter = getArg('--sheet');

if (!filePath) {
  console.error('Uso: node import-historico.js --file <ficheiro.xlsx> [--dry-run] [--sheet <nome>]');
  process.exit(1);
}

// ── DB ────────────────────────────────────────────────────────────────────────

const pool = require('../config/database');

const exec = async (sql, params = []) => {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.execute(sql, params);
    return result;
  } finally {
    conn.release();
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalizeKey = (k) => String(k).toLowerCase().trim().replace(/\s+/g, '_');

const parseDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const dd_mm_yyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dd_mm_yyyy) return `${dd_mm_yyyy[3]}-${dd_mm_yyyy[2].padStart(2, '0')}-${dd_mm_yyyy[1].padStart(2, '0')}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
};

const normalize = (v) => (v === undefined || v === null || v === '') ? null : String(v).trim();
const normalizeGenero = (v) => {
  const s = normalize(v);
  if (!s) return null;
  const u = s.toUpperCase();
  if (u === 'M' || u === 'MASCULINO' || u === 'MALE') return 'M';
  if (u === 'F' || u === 'FEMININO' || u === 'FEMALE') return 'F';
  return 'Outro';
};

// ── Ler Excel / CSV ───────────────────────────────────────────────────────────

const readSheets = async (file) => {
  const wb = new ExcelJS.Workbook();
  const ext = path.extname(file).toLowerCase();
  if (ext === '.csv') {
    await wb.csv.readFile(file, { encoding: 'utf-8' });
  } else {
    await wb.xlsx.readFile(file);
  }
  return wb.worksheets;
};

const sheetToRows = (ws) => {
  const rows = [];
  let headers = null;
  ws.eachRow((row, rowNum) => {
    const values = row.values.slice(1); // exceljs padding na posicao 0
    if (rowNum === 1) {
      headers = values.map(normalizeKey);
      return;
    }
    if (!headers) return;
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? null; });
    // Ignora linhas completamente vazias
    if (Object.values(obj).every((v) => v === null || v === '')) return;
    rows.push(obj);
  });
  return rows;
};

// ── Importar Pacientes ────────────────────────────────────────────────────────

const STATE_MAP = {
  'agendado': 'Agendado',
  'kit reservado': 'Kit Reservado',
  'colheita realizada': 'Colheita Realizada',
  'enviado laboratorio': 'Enviado Laboratorio',
  'em analise': 'Em Analise',
  'resultado disponivel': 'Resultado Disponivel',
  'validado': 'Validado',
  'faturado': 'Faturado',
  'cancelado': 'Cancelado',
};

const importPacientes = async (rows) => {
  const erros = [];
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const nome = normalize(row.nome);
    if (!nome) { erros.push(`Linha sem nome: ${JSON.stringify(row)}`); continue; }

    try {
      // Verificar se já existe (por NIF ou nome+data_nascimento)
      const nif = normalize(row.nif);
      const dataNasc = parseDate(row.data_nascimento || row.data_nasc);
      let exists = false;

      if (nif) {
        const existing = await exec('SELECT id FROM pacientes WHERE nif = ? LIMIT 1', [nif]);
        if (existing.length) { skipped++; continue; }
      } else if (dataNasc) {
        const existing = await exec('SELECT id FROM pacientes WHERE nome = ? AND data_nascimento = ? LIMIT 1', [nome, dataNasc]);
        if (existing.length) { skipped++; continue; }
      }

      if (!dryRun) {
        const id = uuidv4();
        await exec(
          `INSERT INTO pacientes (id, nome, data_nascimento, genero, nif, telemovel, email, morada, ativo, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
          [
            id,
            nome,
            dataNasc,
            normalizeGenero(row.genero || row.sexo),
            nif,
            normalize(row.telemovel || row.telefone || row.phone),
            normalize(row.email),
            normalize(row.morada || row.address),
          ],
        );
      }
      inserted++;
    } catch (e) {
      erros.push(`${nome}: ${e.message}`);
    }
  }

  return { inserted, skipped, erros };
};

// ── Importar Processos ────────────────────────────────────────────────────────

const importProcessos = async (rows) => {
  const erros = [];
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const numero = normalize(row.numero_processo || row.numero || row.number);
    if (!numero) { erros.push(`Linha sem número de processo: ${JSON.stringify(row)}`); continue; }

    try {
      const existing = await exec('SELECT id FROM processos WHERE numero = ? LIMIT 1', [numero]);
      if (existing.length) { skipped++; continue; }

      const estadoRaw = normalize(row.estado || row.status || row.state) || 'cancelado';
      const estado = STATE_MAP[estadoRaw.toLowerCase()] || 'Cancelado';

      if (!dryRun) {
        const id = uuidv4();
        await exec(
          `INSERT INTO processos (id, numero, status_id, data_entrada, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [id, numero, estado, parseDate(row.data_entrada || row.data || row.date)],
        );
      }
      inserted++;
    } catch (e) {
      erros.push(`${numero}: ${e.message}`);
    }
  }

  return { inserted, skipped, erros };
};

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n🧬 Importação histórica Genoma${dryRun ? ' [DRY RUN]' : ''}`);
  console.log(`   Ficheiro: ${filePath}\n`);

  let sheets;
  try {
    sheets = await readSheets(filePath);
  } catch (e) {
    console.error(`❌ Erro ao ler ficheiro: ${e.message}`);
    process.exit(1);
  }

  const report = { pacientes: null, processos: null };

  for (const ws of sheets) {
    if (sheetFilter && ws.name.toLowerCase() !== sheetFilter.toLowerCase()) continue;
    const nameLc = ws.name.toLowerCase();
    const rows = sheetToRows(ws);

    if (['pacientes', 'contactos', 'contacts'].includes(nameLc)) {
      console.log(`📋 Folha "${ws.name}": ${rows.length} linhas (pacientes)`);
      report.pacientes = await importPacientes(rows);
    } else if (['processos', 'processes'].includes(nameLc)) {
      console.log(`📋 Folha "${ws.name}": ${rows.length} linhas (processos)`);
      report.processos = await importProcessos(rows);
    } else if (sheets.length === 1) {
      // Folha única → assumir pacientes
      console.log(`📋 Folha "${ws.name}": ${rows.length} linhas (assumindo pacientes)`);
      report.pacientes = await importPacientes(rows);
    } else {
      console.log(`⏭️  Folha "${ws.name}" ignorada (nome nao reconhecido)`);
    }
  }

  // ── Relatório ──────────────────────────────────────────────────────────────
  console.log('\n─── Resultado ───────────────────────────────────────────');
  if (report.pacientes) {
    const p = report.pacientes;
    console.log(`Pacientes: ${p.inserted} inseridos, ${p.skipped} já existiam`);
    if (p.erros.length) { console.warn(`  ⚠️  ${p.erros.length} erro(s):`); p.erros.forEach((e) => console.warn(`     - ${e}`)); }
  }
  if (report.processos) {
    const p = report.processos;
    console.log(`Processos: ${p.inserted} inseridos, ${p.skipped} já existiam`);
    if (p.erros.length) { console.warn(`  ⚠️  ${p.erros.length} erro(s):`); p.erros.forEach((e) => console.warn(`     - ${e}`)); }
  }
  if (dryRun) {
    console.log('\n⚠️  DRY RUN — nenhum dado foi persistido na base de dados.');
  }
  console.log('─────────────────────────────────────────────────────────\n');

  try { await pool.end(); } catch {}
  process.exit(0);
})();
