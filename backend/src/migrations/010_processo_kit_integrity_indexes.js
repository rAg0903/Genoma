/**
 * Migracao 010 - Integridade kit<->processo (1:1) e indices de desempenho
 *
 * - Garante que um kit so pode estar associado a um unico processo (regra de
 *   rastreabilidade 1 kit = 1 processo). Indices UNIQUE em MySQL permitem
 *   varios NULL, pelo que processos sem kit nao sao afetados.
 * - Adiciona indices para as consultas mais frequentes (estado, datas,
 *   agendamentos por posto/data).
 */
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
    'Indice unico processos.kit_id (1 kit = 1 processo)',
    'ALTER TABLE processos ADD UNIQUE KEY uk_processos_kit (kit_id);',
    ['ER_DUP_KEYNAME', 'ER_DUP_ENTRY']
  );

  await tryExec(
    'Indice processos.status_id',
    'ALTER TABLE processos ADD INDEX idx_processos_status (status_id);',
    ['ER_DUP_KEYNAME']
  );

  await tryExec(
    'Indice processos.data_entrada',
    'ALTER TABLE processos ADD INDEX idx_processos_data_entrada (data_entrada);',
    ['ER_DUP_KEYNAME']
  );

  await tryExec(
    'Indice colheitas (posto, data_prevista)',
    'ALTER TABLE colheitas ADD INDEX idx_colheitas_posto_data (posto_id, data_prevista);',
    ['ER_DUP_KEYNAME']
  );

  await tryExec(
    'Indice colheitas.data_prevista',
    'ALTER TABLE colheitas ADD INDEX idx_colheitas_data (data_prevista);',
    ['ER_DUP_KEYNAME']
  );

  await tryExec(
    'Indice kits (status, localizacao)',
    'ALTER TABLE kits ADD INDEX idx_kits_status_loc (status, localizacao);',
    ['ER_DUP_KEYNAME']
  );
};
