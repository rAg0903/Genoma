const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const MIGRATIONS_TABLE = 'schema_migrations';

async function ensureMigrationsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getExecutedMigrations(connection) {
  const [rows] = await connection.execute(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY filename`
  );
  return new Set(rows.map((row) => row.filename));
}

async function recordMigration(connection, filename) {
  await connection.execute(
    `INSERT INTO ${MIGRATIONS_TABLE} (filename, executed_at) VALUES (?, NOW())`,
    [filename]
  );
}

/**
 * Bases já provisionadas antes do tracking: marca todas as migrações como aplicadas
 * sem reexecutar (evita ALTER duplicados).
 */
async function baselineExistingDatabase(connection, files, dbName) {
  const executed = await getExecutedMigrations(connection);
  if (executed.size > 0) return false;

  const [rows] = await connection.execute(
    `SELECT COUNT(*) AS cnt FROM information_schema.tables
     WHERE table_schema = ? AND table_name = 'processos'`,
    [dbName]
  );
  if (Number(rows[0].cnt) === 0) return false;

  console.log(`\n⚠ Base existente sem ${MIGRATIONS_TABLE} — baseline de ${files.length} migração(ões)...\n`);
  for (const file of files) {
    await recordMigration(connection, file);
    console.log(`  ↷ baseline: ${file}`);
  }
  console.log('');
  return true;
}

function loadMigrationFiles(migrationsDir) {
  return fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js') && !f.startsWith('tables.js'))
    .sort();
}

async function runMigrations() {
  let bootstrapConnection;
  let connection;

  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'genoma';

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: dbPassword,
    database: dbName,
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

  try {
    bootstrapConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
      supportBigNumbers: dbConfig.supportBigNumbers,
      bigNumberStrings: dbConfig.bigNumberStrings,
    });

    await bootstrapConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await bootstrapConnection.end();
    bootstrapConnection = null;

    connection = await mysql.createConnection(dbConfig);
    console.log('Conectado à base de dados MariaDB com sucesso');

    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const files = loadMigrationFiles(migrationsDir);

    await ensureMigrationsTable(connection);

    if (await baselineExistingDatabase(connection, files, dbName)) {
      console.log('✓ Baseline concluído — base já provisionada, sem migrações a executar');
      process.exit(0);
      return;
    }

    const executed = await getExecutedMigrations(connection);
    const pending = files.filter((file) => !executed.has(file));

    if (pending.length === 0) {
      console.log('✓ Nenhuma migração pendente');
      process.exit(0);
      return;
    }

    console.log(`\n${pending.length} migração(ões) pendente(s) de ${files.length} total...\n`);

    for (const file of pending) {
      console.log(`→ Executando: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      delete require.cache[require.resolve(migrationPath)];
      const migration = require(migrationPath);

      if (typeof migration.up !== 'function') {
        console.error(`✗ ${file} não exporta função up()`);
        process.exit(1);
        return;
      }

      try {
        await migration.up(connection);
        await recordMigration(connection, file);
        console.log(`✓ ${file} executado com sucesso\n`);
      } catch (error) {
        console.error(`✗ Erro ao executar ${file}:`);
        console.error(`  ${error.message}\n`);
        process.exit(1);
        return;
      }
    }

    console.log('✓ Processo de migrações finalizado');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migrações:', error.message);
    process.exit(1);
  } finally {
    if (bootstrapConnection) await bootstrapConnection.end();
    if (connection) await connection.end();
  }
}

runMigrations();
