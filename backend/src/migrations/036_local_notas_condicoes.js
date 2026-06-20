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

  await tryExec('Coluna notas em postos', 'ALTER TABLE postos ADD COLUMN notas TEXT NULL;', ['ER_DUP_FIELDNAME']);
  await tryExec('Coluna notas em laboratorios', 'ALTER TABLE laboratorios ADD COLUMN notas TEXT NULL;', ['ER_DUP_FIELDNAME']);

  await tryExec(
    'Tabela posto_condicoes_testes criada',
    `
    CREATE TABLE IF NOT EXISTS posto_condicoes_testes (
      id CHAR(36) PRIMARY KEY,
      posto_id CHAR(36) NOT NULL,
      teste_id CHAR(36) NOT NULL,
      comissao DECIMAL(10,2) NULL,
      prazo_pagamento_dias INT NULL,
      UNIQUE KEY uq_posto_teste (posto_id, teste_id),
      KEY idx_posto_condicoes_posto (posto_id),
      CONSTRAINT fk_posto_condicoes_posto FOREIGN KEY (posto_id) REFERENCES postos(id) ON DELETE CASCADE,
      CONSTRAINT fk_posto_condicoes_teste FOREIGN KEY (teste_id) REFERENCES testes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );

  await tryExec(
    'Tabela laboratorio_condicoes_testes criada',
    `
    CREATE TABLE IF NOT EXISTS laboratorio_condicoes_testes (
      id CHAR(36) PRIMARY KEY,
      laboratorio_id CHAR(36) NOT NULL,
      teste_id CHAR(36) NOT NULL,
      comissao DECIMAL(10,2) NULL,
      prazo_pagamento_dias INT NULL,
      UNIQUE KEY uq_laboratorio_teste (laboratorio_id, teste_id),
      KEY idx_laboratorio_condicoes_lab (laboratorio_id),
      CONSTRAINT fk_laboratorio_condicoes_lab FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
      CONSTRAINT fk_laboratorio_condicoes_teste FOREIGN KEY (teste_id) REFERENCES testes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
