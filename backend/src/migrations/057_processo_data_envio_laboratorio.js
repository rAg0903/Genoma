/** Data de envio da amostra ao laboratório (distinta da recepção no lab). */
module.exports.up = async (db) => {
  try {
    await db.execute(
      'ALTER TABLE processos ADD COLUMN data_envio_laboratorio DATE NULL COMMENT "Data envio amostra ao laboratório"'
    );
    console.log('  ✓ Coluna data_envio_laboratorio adicionada em processos');
  } catch (error) {
    if (String(error.message).includes('Duplicate column')) {
      console.log('  ℹ Coluna data_envio_laboratorio já existe em processos');
    } else {
      throw error;
    }
  }

  try {
    const [result] = await db.execute(`
      UPDATE processos pr
      LEFT JOIN (
        SELECT pr2.id AS processo_id, MIN(mk.data) AS data_envio
        FROM processos pr2
        INNER JOIN movimentos_kits mk ON mk.kit_id = pr2.kit_id OR mk.processo_id = pr2.id
        WHERE mk.motivo IN ('EnvioLabFinal', 'Descarte')
        GROUP BY pr2.id
      ) mv ON mv.processo_id = pr.id
      SET pr.data_envio_laboratorio = COALESCE(pr.data_envio_laboratorio, mv.data_envio)
      WHERE pr.data_envio_laboratorio IS NULL
        AND mv.data_envio IS NOT NULL
    `);
    console.log(`  ✓ Envio lab preenchido via movimentos: ${result.affectedRows || 0}`);

    const [legacy] = await db.execute(`
      UPDATE processos
      SET data_envio_laboratorio = data_chegada_laboratorio
      WHERE data_envio_laboratorio IS NULL
        AND data_chegada_laboratorio IS NOT NULL
        AND status_id IN ('Em Analise', 'Enviado Laboratorio', 'Resultado Disponivel', 'Validado', 'Faturado')
    `);
    console.log(`  ✓ Envio lab preenchido via recepção histórica: ${legacy.affectedRows || 0}`);
  } catch (error) {
    console.log('  ⚠ Erro ao preencher data_envio_laboratorio:', error.message);
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};
