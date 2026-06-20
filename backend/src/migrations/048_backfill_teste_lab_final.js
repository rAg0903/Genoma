/**
 * Associa testes sem laboratório final ao primeiro lab tipo 'final' (ex. FeatureHealth UK).
 */
module.exports.up = async (db) => {
  const [labs] = await db.execute(
    `SELECT id FROM laboratorios WHERE ativo = 1 AND tipo = 'final' ORDER BY nome ASC LIMIT 1`,
  );
  const labId = labs[0]?.id;
  if (!labId) {
    console.log('  ℹ Sem laboratório final para backfill de testes');
    return;
  }
  const [result] = await db.execute(
    `UPDATE testes SET laboratorio_processamento_id = ?
     WHERE laboratorio_processamento_id IS NULL`,
    [labId],
  );
  console.log(`  ✓ Testes com laboratório final preenchido: ${result.affectedRows || 0}`);
};

module.exports.down = async () => {};
