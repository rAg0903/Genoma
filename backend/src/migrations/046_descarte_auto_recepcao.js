/**
 * Descartes passam a concluir recepção no lab final automaticamente.
 * Corrige kits já enviados via descarte que ficaram em em_transito_lab.
 */
module.exports.up = async (db) => {
  const [result] = await db.execute(`
    UPDATE kits k
    INNER JOIN requisicao_kits_itens rki ON rki.kit_id = k.id
    INNER JOIN requisicoes_kits rk ON rk.id = rki.requisicao_id
    INNER JOIN movimentos_kits mk ON mk.requisicao_id = rk.id AND mk.kit_id = k.id AND mk.motivo = 'Descarte'
    SET k.fase_ciclo = 'em_lab_final', k.status = 'Utilizado'
    WHERE k.fase_ciclo = 'em_transito_lab'
  `);
  console.log(`  ✓ Kits descarte em lab final: ${result.affectedRows || 0}`);

  const [procResult] = await db.execute(`
    UPDATE processos p
    INNER JOIN kits k ON k.id = p.kit_id
    INNER JOIN requisicao_kits_itens rki ON rki.kit_id = k.id
    INNER JOIN requisicoes_kits rk ON rk.id = rki.requisicao_id
    INNER JOIN movimentos_kits mk ON mk.requisicao_id = rk.id AND mk.kit_id = k.id AND mk.motivo = 'Descarte'
    SET p.status_id = 'Enviado Laboratorio',
        p.data_chegada_laboratorio = COALESCE(p.data_chegada_laboratorio, rk.data)
    WHERE p.data_chegada_laboratorio IS NULL
  `);
  console.log(`  ✓ Processos com data chegada lab: ${procResult.affectedRows || 0}`);
};

module.exports.down = async () => {
  // Sem reversão.
};
