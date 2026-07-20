/** Campos alinhados com o CRM MAUI (Colheita em ProcessoEditor). */
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

  const colheitasCols = [
    ['facturado_entidade', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['repeticao', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['nao_notificar', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['semanas_gestacao_colheita', 'INT NULL'],
    ['dias_gestacao_colheita', 'INT NULL'],
    ['data_recepcao_amostra', 'DATETIME NULL'],
  ];

  for (const [name, def] of colheitasCols) {
    await tryExec(
      `Coluna colheitas.${name}`,
      `ALTER TABLE colheitas ADD COLUMN ${name} ${def};`,
      ['ER_DUP_FIELDNAME'],
    );
  }

  const pacientesCols = [
    ['colheita_periodo', "VARCHAR(50) NULL COMMENT 'Manhã, Tarde ou Noite'"],
    ['colheita_facturado_entidade', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['colheita_repeticao', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['colheita_nao_notificar', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['colheita_semanas_gestacao', 'INT NULL'],
    ['colheita_dias_gestacao', 'INT NULL'],
    ['colheita_data_recepcao_amostra', 'DATE NULL'],
    ['colheita_data_efetiva', 'DATE NULL'],
  ];

  for (const [name, def] of pacientesCols) {
    await tryExec(
      `Coluna pacientes.${name}`,
      `ALTER TABLE pacientes ADD COLUMN ${name} ${def};`,
      ['ER_DUP_FIELDNAME'],
    );
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};
