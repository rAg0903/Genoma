module.exports.up = async (db) => {
  try {
    const [result] = await db.execute(`
      UPDATE kits k
      INNER JOIN lotes l ON k.lote_id = l.id
      SET k.empresa_id = l.fornecedor_id
      WHERE k.empresa_id IS NULL
        AND l.fornecedor_id IS NOT NULL
    `);
    const updated = result?.affectedRows ?? 0;
    console.log(`  ✓ Kits atualizados com empresa do lote: ${updated}`);
  } catch (error) {
    console.log('  ⚠ Erro ao preencher empresa_id nos kits:', error.message);
  }
};
