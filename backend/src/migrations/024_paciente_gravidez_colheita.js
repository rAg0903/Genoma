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

  const columns = [
    ['medico_id', 'CHAR(36) NULL'],
    ['teste_id', 'CHAR(36) NULL'],
    ['tipo_gravidez', "ENUM('singular', 'gemelar') NULL"],
    ['onde_seguida', 'VARCHAR(200) NULL'],
    ['posto_colheita_id', 'CHAR(36) NULL'],
    ['data_colheita_prevista', 'DATE NULL'],
    ['notas_internas', 'TEXT NULL'],
    ['estado_agendamento', "VARCHAR(30) NULL COMMENT 'Agendado ou Kit Reservado (pre-processo)'"],
  ];

  for (const [name, def] of columns) {
    await tryExec(
      `Coluna pacientes.${name}`,
      `ALTER TABLE pacientes ADD COLUMN ${name} ${def};`,
      ['ER_DUP_FIELDNAME']
    );
  }
};
