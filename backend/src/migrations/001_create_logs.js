module.exports.up = async (db) => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id CHAR(36) PRIMARY KEY,
        empresa_id CHAR(36),
        utilizador_id CHAR(36),
        acao VARCHAR(100),
        tabela_afetada VARCHAR(100),
        registro_id CHAR(36),
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_logs_empresas FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        CONSTRAINT fk_logs_utilizadores FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela logs_auditoria criada');
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('  ℹ Tabela logs_auditoria já existe');
    } else {
      console.error(`  ✗ Erro ao criar logs_auditoria: ${error.message}`);
    }
  }
};
