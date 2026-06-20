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
    'Tabela medico_condicoes_testes criada',
    `
    CREATE TABLE IF NOT EXISTS medico_condicoes_testes (
      id CHAR(36) PRIMARY KEY,
      medico_id CHAR(36) NOT NULL,
      teste_id CHAR(36) NOT NULL,
      comissao DECIMAL(10,2) NULL,
      prazo_pagamento_dias INT NULL,
      UNIQUE KEY uq_medico_teste (medico_id, teste_id),
      KEY idx_medico_condicoes_medico (medico_id),
      CONSTRAINT fk_medico_condicoes_medico FOREIGN KEY (medico_id) REFERENCES medicos(utilizador_id) ON DELETE CASCADE,
      CONSTRAINT fk_medico_condicoes_teste FOREIGN KEY (teste_id) REFERENCES testes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
