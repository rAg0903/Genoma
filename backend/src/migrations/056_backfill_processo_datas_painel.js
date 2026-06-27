/**
 * Preenche data_colheita, data_entrada em processos a partir de colheitas
 * e movimentos de kit (ConsumoColheita), para o Painel de Bordo e detalhe.
 */
module.exports.up = async (db) => {
  try {
    const [colheitaResult] = await db.execute(`
      UPDATE processos pr
      INNER JOIN (
        SELECT processo_id,
               MIN(data_efetiva) AS data_efetiva,
               MIN(DATE(created_at)) AS data_registo
        FROM colheitas
        WHERE data_efetiva IS NOT NULL OR created_at IS NOT NULL
        GROUP BY processo_id
      ) c ON c.processo_id = pr.id
      SET pr.data_colheita = COALESCE(pr.data_colheita, c.data_efetiva),
          pr.data_entrada = COALESCE(pr.data_entrada, c.data_registo, c.data_efetiva)
      WHERE pr.data_colheita IS NULL OR pr.data_entrada IS NULL
    `);
    console.log(`  ✓ Processos enriquecidos via colheitas: ${colheitaResult.affectedRows || 0}`);

    const [movResult] = await db.execute(`
      UPDATE processos pr
      INNER JOIN (
        SELECT pr2.id AS processo_id, MIN(mk.data) AS data_colheita
        FROM processos pr2
        INNER JOIN movimentos_kits mk ON mk.kit_id = pr2.kit_id OR mk.processo_id = pr2.id
        WHERE mk.motivo = 'ConsumoColheita'
        GROUP BY pr2.id
      ) cc ON cc.processo_id = pr.id
      SET pr.data_colheita = COALESCE(pr.data_colheita, cc.data_colheita),
          pr.data_entrada = COALESCE(pr.data_entrada, cc.data_colheita)
      WHERE pr.data_colheita IS NULL OR pr.data_entrada IS NULL
    `);
    console.log(`  ✓ Processos enriquecidos via movimentos: ${movResult.affectedRows || 0}`);
  } catch (error) {
    console.log('  ⚠ Erro ao preencher datas de processos:', error.message);
  }
};

module.exports.down = async () => {
  // Sem reversão — apenas preenchimento de campos NULL.
};
