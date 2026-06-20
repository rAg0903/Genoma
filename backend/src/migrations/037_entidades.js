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
    'Tabela entidades criada',
    `
    CREATE TABLE IF NOT EXISTS entidades (
      id CHAR(36) PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      codigo VARCHAR(40) NULL,
      morada VARCHAR(255) NULL,
      codigo_postal VARCHAR(20) NULL,
      cidade VARCHAR(80) NULL,
      distrito VARCHAR(80) NULL,
      pais VARCHAR(80) NULL,
      contacto VARCHAR(30) NULL,
      email VARCHAR(120) NULL,
      notas TEXT NULL,
      ativo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_entidades_codigo (codigo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );

  await tryExec(
    'Tabela entidade_contactos_secundarios criada',
    `
    CREATE TABLE IF NOT EXISTS entidade_contactos_secundarios (
      id CHAR(36) PRIMARY KEY,
      entidade_id CHAR(36) NOT NULL,
      ordem TINYINT NOT NULL DEFAULT 1,
      nome VARCHAR(120) NULL,
      funcao VARCHAR(120) NULL,
      email VARCHAR(120) NULL,
      telefone VARCHAR(30) NULL,
      KEY idx_entidade_contactos_entidade (entidade_id),
      CONSTRAINT fk_entidade_contactos_entidade FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );

  await tryExec(
    'Tabela entidade_condicoes_testes criada',
    `
    CREATE TABLE IF NOT EXISTS entidade_condicoes_testes (
      id CHAR(36) PRIMARY KEY,
      entidade_id CHAR(36) NOT NULL,
      teste_id CHAR(36) NOT NULL,
      comissao DECIMAL(10,2) NULL,
      prazo_pagamento_dias INT NULL,
      UNIQUE KEY uq_entidade_teste (entidade_id, teste_id),
      KEY idx_entidade_condicoes_entidade (entidade_id),
      CONSTRAINT fk_entidade_condicoes_entidade FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE,
      CONSTRAINT fk_entidade_condicoes_teste FOREIGN KEY (teste_id) REFERENCES testes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
