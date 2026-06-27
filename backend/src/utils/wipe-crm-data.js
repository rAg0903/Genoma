require('dotenv').config();
const pool = require('../config/database');

/** Tabelas a limpar (todas excepto metadados de migração). */
const SKIP_TABLES = new Set(['migrations']);

async function listTables(conn) {
  const dbName = process.env.DB_NAME || 'genoma';
  const [rows] = await conn.execute(
    `SELECT table_name AS name
     FROM information_schema.tables
     WHERE table_schema = ? AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [dbName],
  );
  return rows.map((r) => r.name).filter((t) => !SKIP_TABLES.has(t));
}

async function wipeCrmData() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('SET FOREIGN_KEY_CHECKS = 0');

    const tables = await listTables(conn);
    for (const table of tables) {
      await conn.execute(`DELETE FROM \`${table}\``);
      console.log(`  ✓ ${table}`);
    }

    await conn.execute('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    console.log(`\n✓ ${tables.length} tabela(s) limpas`);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    console.log('A limpar todos os dados do CRM...\n');
    await wipeCrmData();
  } catch (error) {
    console.error('Erro ao limpar dados:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { wipeCrmData };
