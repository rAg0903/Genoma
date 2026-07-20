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

  const processosColumns = [
    // Fração fetal: campo de texto (0–100%) preenchido no resultado.
    ['fracao_fetal', 'VARCHAR(20) NULL'],
    // Estado de pagamento explícito (complementa pagamento_data/recibo_numero).
    ['pago', 'BOOLEAN DEFAULT FALSE'],
  ];

  for (const [column, definition] of processosColumns) {
    await tryExec(
      `Coluna ${column} adicionada em processos`,
      `ALTER TABLE processos ADD COLUMN ${column} ${definition};`,
      ['ER_DUP_FIELDNAME']
    );
  }

  // Marca como pago os processos que já têm data de pagamento registada.
  await tryExec(
    'Processos com pagamento_data marcados como pago',
    `UPDATE processos SET pago = TRUE WHERE pagamento_data IS NOT NULL AND (pago IS NULL OR pago = FALSE);`
  );
};
