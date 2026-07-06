/**
 * Backup automático da base de dados com retenção configurável.
 *
 * Uso:
 *   npm run backup:database
 *   BACKUP_DIR=/backups BACKUP_RETENTION_DAYS=30 npm run backup:database
 *
 * Preferência: mysqldump (rápido). Fallback: export Node (export-database).
 */
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const execFileAsync = promisify(execFile);

const DB_NAME = process.env.DB_NAME || 'genoma';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../../database/backups');
const RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30);

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function tryMysqldump(outputFile) {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  const args = [
    `-h${host}`,
    `-P${port}`,
    `-u${user}`,
    '--single-transaction',
    '--routines',
    '--triggers',
    DB_NAME,
  ];

  const { stdout } = await execFileAsync('mysqldump', args, {
    env: { ...process.env, MYSQL_PWD: password },
    maxBuffer: 64 * 1024 * 1024,
  });

  fs.writeFileSync(outputFile, stdout, 'utf8');
}

function purgeOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return 0;

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const name of fs.readdirSync(BACKUP_DIR)) {
    if (!name.startsWith('genoma_') || !name.endsWith('.sql')) continue;
    const full = path.join(BACKUP_DIR, name);
    const stat = fs.statSync(full);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(full);
      removed += 1;
    }
  }

  return removed;
}

async function backupDatabase() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const outputFile = path.join(BACKUP_DIR, `genoma_${stamp()}.sql`);

  try {
    await tryMysqldump(outputFile);
    console.log(`✓ Backup mysqldump: ${outputFile}`);
  } catch {
    console.log('mysqldump indisponível — a usar export Node...');
    process.env.BACKUP_OUTPUT_FILE = outputFile;
    // eslint-disable-next-line global-require
    await require('./export-database').exportDatabase(outputFile);
    console.log(`✓ Backup Node export: ${outputFile}`);
  }

  const removed = purgeOldBackups();
  if (removed > 0) {
    console.log(`✓ Retenção: ${removed} backup(s) com mais de ${RETENTION_DAYS} dias removido(s)`);
  }
}

if (require.main === module) {
  backupDatabase().catch((error) => {
    console.error('✗ Falha no backup:', error.message);
    process.exit(1);
  });
}

module.exports = { backupDatabase, purgeOldBackups };
