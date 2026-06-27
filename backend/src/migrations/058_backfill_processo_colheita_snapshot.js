/**
 * Restaura snapshot de colheita em processos a partir de colheitas e movimentos de kit.
 * Corrige processos cujos campos posto/data foram apagados por updates parciais.
 */
module.exports.up = async (db) => {
  try {
    const [fromColheitas] = await db.execute(`
      UPDATE processos pr
      INNER JOIN colheitas c ON c.processo_id = pr.id
      LEFT JOIN postos po ON po.id = c.posto_id
      SET pr.posto_id = COALESCE(pr.posto_id, c.posto_id),
          pr.posto = COALESCE(NULLIF(TRIM(pr.posto), ''), po.nome),
          pr.data_colheita_prevista = COALESCE(pr.data_colheita_prevista, c.data_prevista),
          pr.data_colheita = COALESCE(pr.data_colheita, c.data_efetiva)
      WHERE pr.posto_id IS NULL
         OR pr.posto IS NULL OR TRIM(pr.posto) = ''
         OR pr.data_colheita IS NULL
         OR pr.data_colheita_prevista IS NULL
    `);
    console.log(`  ✓ Colheita restaurada via tabela colheitas: ${fromColheitas.affectedRows || 0}`);

    const [fromMovimentos] = await db.execute(`
      UPDATE processos pr
      INNER JOIN (
        SELECT mk.kit_id,
               MIN(mk.data) AS data_colheita,
               SUBSTRING_INDEX(GROUP_CONCAT(mk.origem_posto_id ORDER BY mk.data), ',', 1) AS posto_id
        FROM movimentos_kits mk
        WHERE mk.motivo = 'ConsumoColheita' AND mk.kit_id IS NOT NULL
        GROUP BY mk.kit_id
      ) cc ON cc.kit_id = pr.kit_id
      LEFT JOIN postos po ON po.id = cc.posto_id
      SET pr.data_colheita = COALESCE(pr.data_colheita, cc.data_colheita),
          pr.posto_id = COALESCE(pr.posto_id, cc.posto_id),
          pr.posto = COALESCE(NULLIF(TRIM(pr.posto), ''), po.nome)
      WHERE pr.kit_id IS NOT NULL
        AND (
          pr.data_colheita IS NULL
          OR pr.posto_id IS NULL
          OR pr.posto IS NULL OR TRIM(pr.posto) = ''
        )
    `);
    console.log(`  ✓ Colheita restaurada via movimentos: ${fromMovimentos.affectedRows || 0}`);
  } catch (error) {
    console.log('  ⚠ Erro ao restaurar colheita em processos:', error.message);
  }
};

module.exports.down = async () => {
  // Sem reversão — apenas preenchimento de campos em falta.
};
