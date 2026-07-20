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

  const columns = [
    ['titulo', "VARCHAR(30) NULL"],
    ['genero', "VARCHAR(20) NULL"],
    ['pais', "VARCHAR(80) NULL DEFAULT 'Portugal'"],
    ['telefone_fixo', 'VARCHAR(30) NULL'],
    ['criterio_busca_postos', "VARCHAR(40) NULL DEFAULT 'nome'"],
    ['notas', 'TEXT NULL'],
  ];

  for (const [name, def] of columns) {
    await tryExec(`Coluna medicos.${name}`, `ALTER TABLE medicos ADD COLUMN ${name} ${def};`, ['ER_DUP_FIELDNAME']);
  }

  await tryExec(
    'num_ordem nullable em medicos',
    'ALTER TABLE medicos MODIFY num_ordem VARCHAR(30) NULL;',
    []
  );

  await tryExec(
    'Tabela medico_contactos_secundarios criada',
    `
    CREATE TABLE IF NOT EXISTS medico_contactos_secundarios (
      id CHAR(36) PRIMARY KEY,
      medico_id CHAR(36) NOT NULL,
      ordem TINYINT NOT NULL DEFAULT 1,
      nome VARCHAR(120) NULL,
      funcao VARCHAR(120) NULL,
      email VARCHAR(120) NULL,
      telefone VARCHAR(30) NULL,
      KEY idx_medico_contactos_medico (medico_id),
      CONSTRAINT fk_medico_contactos_medico FOREIGN KEY (medico_id) REFERENCES medicos(utilizador_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );

  await tryExec(
    'Tabela medico_locais_trabalho criada',
    `
    CREATE TABLE IF NOT EXISTS medico_locais_trabalho (
      id CHAR(36) PRIMARY KEY,
      medico_id CHAR(36) NOT NULL,
      posto_id CHAR(36) NOT NULL,
      KEY idx_medico_locais_medico (medico_id),
      KEY idx_medico_locais_posto (posto_id),
      CONSTRAINT fk_medico_locais_medico FOREIGN KEY (medico_id) REFERENCES medicos(utilizador_id) ON DELETE CASCADE,
      CONSTRAINT fk_medico_locais_posto FOREIGN KEY (posto_id) REFERENCES postos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
