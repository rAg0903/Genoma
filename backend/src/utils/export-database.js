/**
 * Exporta a base de dados MariaDB/MySQL actual para um ficheiro .sql
 * (schema + dados), reutilizável noutro ambiente.
 *
 * Uso: npm run export:database
 * Saída: ../../database/genoma_export.sql (relativo a backend/)
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const DB_NAME = process.env.DB_NAME || 'genoma';
const OUTPUT_DIR = path.join(__dirname, '../../../database');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'genoma_export.sql');

function escapeSqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) {
    return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
  }
  if (Buffer.isBuffer(value)) {
    return `X'${value.toString('hex')}'`;
  }
  const str = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/'/g, "\\'");
  return `'${str}'`;
}

function buildInsert(tableName, columns, rows) {
  if (!rows.length) return '';
  const colList = columns.map((c) => `\`${c}\``).join(', ');
  const values = rows
    .map((row) => {
      const vals = columns.map((col) => escapeSqlValue(row[col]));
      return `(${vals.join(', ')})`;
    })
    .join(',\n');
  return `INSERT INTO \`${tableName}\` (${colList}) VALUES\n${values};\n`;
}

async function exportDatabase() {
  const dbPassword = process.env.DB_PASSWORD || '';
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: dbPassword,
    database: DB_NAME,
    ssl: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    authSwitchHandler: (data, callback) => {
      if (data.pluginName === 'auth_gssapi_client') {
        callback(null, Buffer.from(`${dbPassword}\0`));
        return;
      }
      callback(new Error(`Plugin de autenticação não suportado: ${data.pluginName}`));
    },
  };

  let connection;
  const lines = [];

  try {
    connection = await mysql.createConnection(config);

    const [[{ db_version: serverVersion }]] = await connection.query('SELECT VERSION() AS db_version');
    const exportedAt = new Date().toISOString();

    lines.push('-- ============================================================');
    lines.push('-- CRM Genoma — exportação completa da base de dados');
    lines.push(`-- Base de dados: ${DB_NAME}`);
    lines.push(`-- Servidor: ${serverVersion}`);
    lines.push(`-- Exportado em: ${exportedAt}`);
    lines.push('-- Gerado por: backend/src/utils/export-database.js');
    lines.push('-- ============================================================');
    lines.push('');
    lines.push('SET NAMES utf8mb4;');
    lines.push('SET FOREIGN_KEY_CHECKS = 0;');
    lines.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
    lines.push('SET time_zone = "+00:00";');
    lines.push('');
    lines.push(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    lines.push(`USE \`${DB_NAME}\`;`);
    lines.push('');

    const [tables] = await connection.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
    const tableNames = tables.map((row) => Object.values(row)[0]);

    for (const tableName of tableNames) {
      const [[createRow]] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSql = createRow['Create Table'];

      lines.push(`-- ------------------------------------------------------------`);
      lines.push(`-- Estrutura: ${tableName}`);
      lines.push(`-- ------------------------------------------------------------`);
      lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      lines.push(`${createSql};`);
      lines.push('');
    }

    for (const tableName of tableNames) {
      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      if (!rows.length) continue;

      const columns = Object.keys(rows[0]);
      lines.push(`-- Dados: ${tableName} (${rows.length} registos)`);
      lines.push(buildInsert(tableName, columns, rows));
      lines.push('');
    }

    lines.push('SET FOREIGN_KEY_CHECKS = 1;');
    lines.push('-- Fim da exportação');

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');

    const sizeKb = Math.round(fs.statSync(OUTPUT_FILE).size / 1024);
    console.log(`Exportação concluída: ${OUTPUT_FILE}`);
    console.log(`Tabelas: ${tableNames.length} | Tamanho: ~${sizeKb} KB`);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  exportDatabase().catch((err) => {
    console.error('Erro ao exportar base de dados:', err.message);
    process.exit(1);
  });
}

module.exports = { exportDatabase };
