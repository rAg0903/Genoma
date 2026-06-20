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

  // Os locais físicos (Postos / Laboratórios / Empresas) passam a ser
  // categorias com múltiplos registos geríveis nas Definições.

  // 1) Estender a tabela 'postos' (já existe: id, entidade_id, nome,
  //    codigo_posto, localizacao) com campos de morada/contacto/estado.
  const postosColumns = [
    ['morada', 'TEXT NULL'],
    ['codigo_postal', 'VARCHAR(20) NULL'],
    ['cidade', 'VARCHAR(120) NULL'],
    ['distrito', 'VARCHAR(120) NULL'],
    ['pais', 'VARCHAR(80) NULL'],
    ['contacto', 'VARCHAR(100) NULL'],
    ['email', 'VARCHAR(120) NULL'],
    ['ativo', 'BOOLEAN NOT NULL DEFAULT TRUE'],
    ['created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'],
  ];
  for (const [column, definition] of postosColumns) {
    await tryExec(
      `Coluna ${column} adicionada em postos`,
      `ALTER TABLE postos ADD COLUMN ${column} ${definition};`,
      ['ER_DUP_FIELDNAME']
    );
  }

  // 2) Nova tabela 'laboratorios' (equivalente a postos/empresas).
  await tryExec(
    'Tabela laboratorios criada',
    `
    CREATE TABLE IF NOT EXISTS laboratorios (
      id CHAR(36) PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      codigo VARCHAR(40) NULL,
      morada TEXT NULL,
      codigo_postal VARCHAR(20) NULL,
      cidade VARCHAR(120) NULL,
      distrito VARCHAR(120) NULL,
      pais VARCHAR(80) NULL,
      contacto VARCHAR(100) NULL,
      email VARCHAR(120) NULL,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_laboratorios_codigo (codigo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
