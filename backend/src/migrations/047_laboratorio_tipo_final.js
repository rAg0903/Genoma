/**
 * Distingue laboratórios operacionais (com postos) de laboratórios finais (processamento/descarte).
 */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE laboratorios
      ADD COLUMN IF NOT EXISTS tipo ENUM('operacional', 'final') NOT NULL DEFAULT 'operacional'
  `).catch(async () => {
    await db.execute(`
      ALTER TABLE laboratorios
        ADD COLUMN tipo ENUM('operacional', 'final') NOT NULL DEFAULT 'operacional'
    `);
  });

  await db.execute(`
    UPDATE laboratorios
    SET tipo = 'final'
    WHERE UPPER(TRIM(codigo)) = 'FEATUREHEALTH_UK'
       OR LOWER(TRIM(nome)) LIKE '%featurehealth%'
  `);

  console.log('  ✓ Coluna laboratorios.tipo (operacional | final)');
};

module.exports.down = async () => {
  // Sem reversão.
};
