const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

async function runMigrations() {
  let bootstrapConnection;
  let connection;

  const dbPassword = process.env.DB_PASSWORD || '';

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: dbPassword,
    database: process.env.DB_NAME || 'genoma',
    ssl: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    authSwitchHandler: (data, callback) => {
      if (data.pluginName === 'auth_gssapi_client') {
        callback(null, Buffer.from(`${dbPassword}\0`));
        return;
      }
      callback(new Error(`Plugin de autenticação não suportado: ${data.pluginName}`));
    }
  };

  try {
    // Conecta sem selecionar base para garantir que ela existe.
    bootstrapConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
      supportBigNumbers: dbConfig.supportBigNumbers,
      bigNumberStrings: dbConfig.bigNumberStrings
    });

    await bootstrapConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrapConnection.end();
    bootstrapConnection = null;

    connection = await mysql.createConnection(dbConfig);

    console.log('Conectado à base de dados MariaDB com sucesso');

    // Executar migrações
    const fs = require('fs');
    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js') && !f.startsWith('tables.js'))
      .sort();

    console.log(`\nExecutando ${files.length} migração(ões)...\n`);

    for (const file of files) {
      console.log(`→ Executando: ${file}`);
      try {
        const migration = require(path.join(migrationsDir, file));
        await migration.up(connection);
        console.log(`✓ ${file} executado com sucesso\n`);
      } catch (error) {
        console.error(`✗ Erro ao executar ${file}:`);
        console.error(`  ${error.message}\n`);
      }
    }

    console.log('✓ Processo de migrações finalizado');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar à base de dados:', error.message);
    process.exit(1);
  } finally {
    if (bootstrapConnection) {
      await bootstrapConnection.end();
    }
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
