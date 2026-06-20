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
    'Tabela posto_contactos_secundarios criada',
    `
    CREATE TABLE IF NOT EXISTS posto_contactos_secundarios (
      id CHAR(36) PRIMARY KEY,
      posto_id CHAR(36) NOT NULL,
      ordem TINYINT NOT NULL DEFAULT 1,
      nome VARCHAR(120) NULL,
      funcao VARCHAR(120) NULL,
      email VARCHAR(120) NULL,
      telefone VARCHAR(30) NULL,
      KEY idx_posto_contactos_posto (posto_id),
      CONSTRAINT fk_posto_contactos_posto FOREIGN KEY (posto_id) REFERENCES postos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );

  await tryExec(
    'Tabela laboratorio_contactos_secundarios criada',
    `
    CREATE TABLE IF NOT EXISTS laboratorio_contactos_secundarios (
      id CHAR(36) PRIMARY KEY,
      laboratorio_id CHAR(36) NOT NULL,
      ordem TINYINT NOT NULL DEFAULT 1,
      nome VARCHAR(120) NULL,
      funcao VARCHAR(120) NULL,
      email VARCHAR(120) NULL,
      telefone VARCHAR(30) NULL,
      KEY idx_laboratorio_contactos_lab (laboratorio_id),
      CONSTRAINT fk_laboratorio_contactos_lab FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
