const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function dropTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'genoma',
      ssl: false,
      supportBigNumbers: true,
      bigNumberStrings: true
    });

    console.log('Conectado à base de dados');

    const tables = [
      'logs_auditoria',
      'resultados_detalhados',
      'pedidos_exames',
      'teste_composicao',
      'medicos',
      'itens_pesquisa',
      'testes',
      'pacientes',
      'utilizadores',
      'empresas',
      'perfis'
    ];

    for (const table of tables) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✓ Tabela ${table} removida`);
      } catch (error) {
        console.log(`ℹ Tabela ${table} não existe`);
      }
    }

    console.log('\n✓ Base de dados limpa');
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

dropTables();
