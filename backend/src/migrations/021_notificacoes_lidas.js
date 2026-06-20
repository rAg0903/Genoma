module.exports.up = async (db) => {
  const tryExec = async (label, sql, ignoreCodes = []) => {
    try {
      await db.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      if (ignoreCodes.includes(error.code)) {
        console.log(`  ℹ ${label} (ignorado)`);
        return;
      }
      console.log(`  ⚠ ${label}:`, error.message);
    }
  };

  await tryExec(
    'Tabela notificacoes_lidas criada',
    `
    CREATE TABLE IF NOT EXISTS notificacoes_lidas (
      utilizador_id CHAR(36) NOT NULL,
      notificacao_id VARCHAR(120) NOT NULL,
      lida_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (utilizador_id, notificacao_id),
      KEY idx_notificacoes_lidas_utilizador (utilizador_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
