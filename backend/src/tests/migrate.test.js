/**
 * Testes do runner de migrações (schema_migrations).
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_TABLE = 'schema_migrations';

function loadMigrationFiles(migrationsDir) {
  return fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js') && !f.startsWith('tables.js'))
    .sort();
}

describe('migrate.js helpers', () => {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  test('existem ficheiros de migração ordenáveis', () => {
    const files = loadMigrationFiles(migrationsDir);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toMatch(/^\d{3}_/);
  });

  test('cada migração exporta up()', () => {
    const files = loadMigrationFiles(migrationsDir);
    for (const file of files) {
      const migration = require(path.join(migrationsDir, file));
      expect(typeof migration.up).toBe('function');
    }
  });
});

describe('schema_migrations (integração)', () => {
  let connection;

  beforeAll(async () => {
    if (!process.env.DB_HOST) return;
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  });

  afterAll(async () => {
    if (connection) await connection.end();
  });

  test('tabela schema_migrations existe após migrate', async () => {
    if (!connection) return;
    const [rows] = await connection.execute(
      `SELECT COUNT(*) AS cnt FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?`,
      [process.env.DB_NAME, MIGRATIONS_TABLE]
    );
    expect(Number(rows[0].cnt)).toBe(1);
  });

  test('migrações registadas coincidem com ficheiros', async () => {
    if (!connection) return;
    const files = loadMigrationFiles(path.join(__dirname, '..', 'migrations'));
    const [rows] = await connection.execute(
      `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY filename`
    );
    expect(rows.length).toBe(files.length);
  });
});
