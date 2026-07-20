/** Configuração global da clínica / emitente (relatórios NIPT). */
const DEFAULT_ID = '00000000-0000-0000-0000-000000000001';

module.exports.up = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS configuracao_sistema (
      id CHAR(36) NOT NULL PRIMARY KEY,
      clinica_nome VARCHAR(120) NOT NULL DEFAULT 'GENOMA',
      clinica_morada VARCHAR(255) NULL,
      clinica_codigo_postal VARCHAR(32) NULL,
      clinica_telefone VARCHAR(40) NULL,
      clinica_email VARCHAR(120) NULL,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updated_by CHAR(36) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✓ Tabela configuracao_sistema criada');

  const [rows] = await db.execute('SELECT id FROM configuracao_sistema WHERE id = ? LIMIT 1', [DEFAULT_ID]);
  if (rows.length === 0) {
    await db.execute(
      `INSERT INTO configuracao_sistema (id, clinica_nome, clinica_morada, clinica_codigo_postal, clinica_telefone, clinica_email)
       VALUES (?, 'GENOMA', NULL, NULL, NULL, NULL)`,
      [DEFAULT_ID],
    );
    console.log('  ✓ Registo predefinido configuracao_sistema inserido');
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};

module.exports.DEFAULT_ID = DEFAULT_ID;
