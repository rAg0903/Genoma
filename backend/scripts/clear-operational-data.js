/**
 * Remove dados operacionais de Contactos, Processos e Stocks.
 * Mantém dados de referência (utilizadores, empresas, testes, médicos, etc.).
 */
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const TABLES = [
  'movimentos_kits',
  'requisicao_kits_itens',
  'requisicoes_kits',
  'processo_relatorios',
  'resultados_geneticos',
  'assets_resultados',
  'informacao_clinica',
  'colheitas',
  'facturacao',
  'anexos',
  'lembretes',
  'processos',
  'kits',
  'lotes',
  'resultados_detalhados',
  'pedidos_exames',
  'pacientes',
];

const LOG_TABLES = [
  'pacientes',
  'processos',
  'kits',
  'lotes',
  'requisicoes_kits',
  'movimentos_kits',
  'anexos',
  'lembretes',
  'colheitas',
  'facturacao',
];

async function countRows(connection, table) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS total FROM \`${table}\``,
  );
  return Number(rows[0].total);
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    `SHOW TABLES LIKE '${table.replace(/'/g, "''")}'`,
  );
  return rows.length > 0;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'genoma',
    ssl: false,
  });

  console.log('A limpar dados operacionais (Contactos, Processos, Stocks)...\n');

  const before = {};
  for (const table of TABLES) {
    if (await tableExists(connection, table)) {
      before[table] = await countRows(connection, table);
    }
  }

  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

  for (const table of TABLES) {
    if (!(await tableExists(connection, table))) continue;
    await connection.execute(`DELETE FROM \`${table}\``);
    const remaining = await countRows(connection, table);
    console.log(`  ${table}: ${before[table]} -> ${remaining}`);
  }

  if (await tableExists(connection, 'logs_auditoria')) {
    const placeholders = LOG_TABLES.map(() => '?').join(', ');
    const [result] = await connection.execute(
      `DELETE FROM logs_auditoria WHERE tabela_afetada IN (${placeholders})`,
      LOG_TABLES,
    );
    console.log(`  logs_auditoria (operacionais): ${result.affectedRows} removidos`);
  }

  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
  await connection.end();

  console.log('\nLimpeza concluída.');
}

main().catch((error) => {
  console.error('Erro ao limpar dados:', error.message);
  process.exit(1);
});
