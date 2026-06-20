const { v4: uuidv4 } = require('uuid');

const tryExec = async (db, label, sql) => {
  try {
    await db.execute(sql);
    console.log(`  ✓ ${label}`);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME' || error.code === 'ER_DUP_KEYNAME') {
      console.log(`  ℹ ${label} (já existe)`);
    } else {
      console.log(`  ⚠ ${label}:`, error.message);
    }
  }
};

module.exports.up = async (db) => {
  await tryExec(
    db,
    'Coluna fase_ciclo em kits',
    `ALTER TABLE kits ADD COLUMN fase_ciclo ENUM(
      'em_empresa',
      'em_posto_aguarda',
      'reservado_colheita',
      'em_transito_lab',
      'em_lab_final',
      'encerrado'
    ) NULL AFTER localizacao`,
  );

  await tryExec(
    db,
    'Coluna laboratorio_final_id em processos',
    `ALTER TABLE processos ADD COLUMN laboratorio_final_id CHAR(36) NULL,
     ADD KEY idx_processos_lab_final (laboratorio_final_id),
     ADD CONSTRAINT fk_processos_lab_final FOREIGN KEY (laboratorio_final_id)
       REFERENCES laboratorios(id) ON DELETE SET NULL`,
  );

  await tryExec(
    db,
    'Coluna laboratorio_processamento_id em testes',
    `ALTER TABLE testes ADD COLUMN laboratorio_processamento_id CHAR(36) NULL,
     ADD KEY idx_testes_lab_proc (laboratorio_processamento_id),
     ADD CONSTRAINT fk_testes_lab_proc FOREIGN KEY (laboratorio_processamento_id)
       REFERENCES laboratorios(id) ON DELETE SET NULL`,
  );

  const movCols = [
    ['origem_empresa_id', 'CHAR(36) NULL'],
    ['origem_posto_id', 'CHAR(36) NULL'],
    ['origem_laboratorio_id', 'CHAR(36) NULL'],
    ['destino_empresa_id', 'CHAR(36) NULL'],
    ['destino_posto_id', 'CHAR(36) NULL'],
    ['destino_laboratorio_id', 'CHAR(36) NULL'],
    ['processo_id', 'CHAR(36) NULL'],
  ];
  for (const [col, type] of movCols) {
    await tryExec(db, `Coluna movimentos_kits.${col}`, `ALTER TABLE movimentos_kits ADD COLUMN ${col} ${type}`);
  }

  try {
    await db.execute(`
      ALTER TABLE movimentos_kits
        MODIFY COLUMN motivo ENUM(
          'Envio', 'Consumo', 'Reposicao', 'Transferencia', 'SMS Colheita',
          'ReservaColheita', 'ConsumoColheita', 'EnvioLabFinal',
          'CancelamentoReserva', 'ConfirmacaoLab', 'Descarte'
        ) NOT NULL
    `);
    console.log('  ✓ ENUM motivo alargado em movimentos_kits');
  } catch (error) {
    console.log('  ℹ ENUM motivo movimentos_kits:', error.message);
  }

  // Backfill fase_ciclo
  try {
    await db.execute(`
      UPDATE kits SET fase_ciclo = 'em_lab_final'
      WHERE fase_ciclo IS NULL AND status = 'Utilizado' AND localizacao = 'Laboratorio'
    `);
    await db.execute(`
      UPDATE kits SET fase_ciclo = 'encerrado'
      WHERE fase_ciclo IS NULL AND status = 'Utilizado' AND localizacao != 'Laboratorio'
    `);
    await db.execute(`
      UPDATE kits SET fase_ciclo = 'em_transito_lab'
      WHERE fase_ciclo IS NULL AND status = 'Em transito'
    `);
    await db.execute(`
      UPDATE kits SET fase_ciclo = 'reservado_colheita'
      WHERE fase_ciclo IS NULL AND status = 'Reservado'
    `);
    await db.execute(`
      UPDATE kits SET fase_ciclo = 'em_posto_aguarda'
      WHERE fase_ciclo IS NULL AND localizacao = 'Posto' AND status = 'Disponivel'
    `);
    await db.execute(`
      UPDATE kits SET fase_ciclo = 'em_empresa'
      WHERE fase_ciclo IS NULL
    `);
    console.log('  ✓ Backfill fase_ciclo concluído');
  } catch (error) {
    console.log('  ⚠ Backfill fase_ciclo:', error.message);
  }

  // Seed FeatureHealth UK se não existir
  try {
    const [existing] = await db.execute(
      "SELECT id FROM laboratorios WHERE UPPER(TRIM(codigo)) = 'FEATUREHEALTH_UK' OR LOWER(TRIM(nome)) LIKE '%featurehealth%' LIMIT 1",
    );
    if (!existing.length) {
      const id = uuidv4();
      await db.execute(
        `INSERT INTO laboratorios (id, nome, codigo, pais, ativo)
         VALUES (?, 'FeatureHealth UK', 'FEATUREHEALTH_UK', 'UK', 1)`,
        [id],
      );
      console.log('  ✓ Laboratório FeatureHealth UK criado');
    } else {
      console.log('  ℹ Laboratório FeatureHealth UK já existe');
    }
  } catch (error) {
    console.log('  ⚠ Seed FeatureHealth UK:', error.message);
  }
};
