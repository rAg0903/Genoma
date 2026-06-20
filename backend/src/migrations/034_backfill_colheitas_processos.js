const { v4: uuidv4 } = require('uuid');

/** Processos com colheita mas sem registo na tabela colheitas (conversão contacto → processo). */
module.exports.up = async (db) => {
  try {
    const [rows] = await db.execute(
      `SELECT pr.id, pr.posto_id, pr.data_colheita_prevista, pr.data_colheita, pr.status_id
       FROM processos pr
       LEFT JOIN colheitas c ON c.processo_id = pr.id
       WHERE c.id IS NULL
         AND pr.status_id != 'Cancelado'
         AND (
           pr.data_colheita IS NOT NULL
           OR pr.data_colheita_prevista IS NOT NULL
           OR pr.status_id IN ('Agendado', 'Kit Reservado', 'Colheita Realizada')
         )`
    );

    if (!rows.length) {
      console.log('  ℹ Nenhum processo sem registo em colheitas para preencher');
      return;
    }

    for (const row of rows) {
      await db.execute(
        `INSERT INTO colheitas (id, processo_id, posto_id, data_prevista, data_efetiva)
         VALUES (?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          row.id,
          row.posto_id || null,
          row.data_colheita_prevista || row.data_colheita || null,
          row.data_colheita || null,
        ]
      );
    }

    console.log(`  ✓ ${rows.length} registo(s) de colheita criado(s) a partir de processos existentes`);
  } catch (error) {
    console.log('  ⚠ Erro ao preencher colheitas a partir de processos:', error.message);
  }
};
