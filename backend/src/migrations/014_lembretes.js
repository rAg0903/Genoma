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

  // Lembretes / tarefas — o módulo "Agendamentos" passa a funcionar como
  // um quadro de tarefas e notificações internas.
  await tryExec(
    'Tabela lembretes criada',
    `
    CREATE TABLE IF NOT EXISTS lembretes (
      id CHAR(36) PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descricao TEXT NULL,
      estado ENUM('Pendente', 'Concluido') NOT NULL DEFAULT 'Pendente',
      prioridade ENUM('Baixa', 'Normal', 'Alta') NOT NULL DEFAULT 'Normal',
      data_limite DATE NULL,
      paciente_id CHAR(36) NULL,
      processo_id CHAR(36) NULL,
      criado_por CHAR(36) NULL,
      atribuido_a CHAR(36) NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_lembretes_estado (estado),
      KEY idx_lembretes_paciente (paciente_id),
      KEY idx_lembretes_processo (processo_id),
      KEY idx_lembretes_data (data_limite)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );
};
