/**
 * Colheita deixa kit no posto (aguarda_envio_lab) até descarte para lab final.
 * Corrige kits já movidos para lab na colheita sem registo de descarte.
 */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE kits MODIFY COLUMN fase_ciclo ENUM(
      'em_empresa',
      'em_posto_aguarda',
      'reservado_colheita',
      'aguarda_envio_lab',
      'em_transito_lab',
      'em_lab_final',
      'encerrado'
    ) NULL
  `);
  console.log('  ✓ ENUM fase_ciclo: aguarda_envio_lab');

  const [result] = await db.execute(`
    UPDATE kits k
    INNER JOIN (
      SELECT m.kit_id, p.posto_id
      FROM movimentos_kits m
      INNER JOIN processos p ON p.id = m.processo_id
      WHERE m.motivo = 'ConsumoColheita' AND p.posto_id IS NOT NULL
    ) src ON src.kit_id = k.id
    LEFT JOIN movimentos_kits md ON md.kit_id = k.id AND md.motivo = 'Descarte'
    SET k.localizacao = 'Posto',
        k.posto_id = src.posto_id,
        k.laboratorio_id = NULL,
        k.empresa_id = NULL,
        k.status = 'Utilizado',
        k.fase_ciclo = 'aguarda_envio_lab'
    WHERE md.id IS NULL
      AND (k.fase_ciclo = 'em_lab_final' OR k.localizacao = 'Laboratorio')
  `);
  console.log(`  ✓ Kits colheita repostos no posto: ${result.affectedRows || 0}`);

  await db.execute(`
    UPDATE processos p
    INNER JOIN movimentos_kits m ON m.processo_id = p.id AND m.motivo = 'ConsumoColheita'
    INNER JOIN kits k ON k.id = m.kit_id AND k.fase_ciclo = 'aguarda_envio_lab'
    LEFT JOIN movimentos_kits md ON md.kit_id = k.id AND md.motivo = 'Descarte'
    SET p.data_chegada_laboratorio = NULL,
        p.status_id = 'Colheita Realizada'
    WHERE md.id IS NULL
      AND p.data_chegada_laboratorio IS NOT NULL
  `);
  console.log('  ✓ Processos: data_chegada_laboratorio limpa até descarte');
};

module.exports.down = async () => {
  // Sem reversão automática — dados operacionais.
};
