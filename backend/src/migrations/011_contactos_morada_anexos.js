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

  // Morada granular nos contactos (pacientes), conforme especificação.
  const pacientesColumns = [
    ['codigo_postal', 'VARCHAR(20) NULL'],
    ['pais', 'VARCHAR(80) NULL'],
    ['distrito', 'VARCHAR(80) NULL'],
    ['cidade', 'VARCHAR(120) NULL'],
    ['altura', 'DECIMAL(5,2) NULL'],
    ['peso', 'DECIMAL(5,2) NULL'],
  ];

  for (const [column, definition] of pacientesColumns) {
    await tryExec(
      `Coluna ${column} adicionada em pacientes`,
      `ALTER TABLE pacientes ADD COLUMN ${column} ${definition};`,
      ['ER_DUP_FIELDNAME']
    );
  }

  // Anexos do contacto/processo (documentos e registo de e-mails).
  await tryExec(
    'Tabela anexos criada',
    `
    CREATE TABLE IF NOT EXISTS anexos (
      id CHAR(36) PRIMARY KEY,
      paciente_id CHAR(36) NULL,
      processo_id CHAR(36) NULL,
      tipo ENUM('Documento', 'Email', 'Outro') DEFAULT 'Documento',
      titulo VARCHAR(200) NOT NULL,
      descricao TEXT NULL,
      url TEXT NULL,
      utilizador_id CHAR(36) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_anexos_paciente (paciente_id),
      KEY idx_anexos_processo (processo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
