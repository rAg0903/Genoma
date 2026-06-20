const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'genoma',
    ssl: false,
  });

  const [lotes] = await connection.execute("SHOW TABLES LIKE 'lotes'");
  const [kits] = await connection.execute("SHOW TABLES LIKE 'kits'");
  const [requisicoes] = await connection.execute("SHOW TABLES LIKE 'requisicoes_kits'");
  const [itens] = await connection.execute("SHOW TABLES LIKE 'requisicao_kits_itens'");
  const [movimentos] = await connection.execute("SHOW TABLES LIKE 'movimentos_kits'");

  console.log({ lotes, kits, requisicoes, itens, movimentos });

  if (lotes.length) {
    const [lotesDef] = await connection.execute('SHOW CREATE TABLE lotes');
    console.log(lotesDef[0]);
  }
  if (kits.length) {
    const [kitsDef] = await connection.execute('SHOW CREATE TABLE kits');
    console.log(kitsDef[0]);
  }

  await connection.end();
}

main().catch((error) => {
  console.error('Erro ao consultar tabelas:', error.message);
  process.exit(1);
});
