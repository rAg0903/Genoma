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
    ['gestacao_semanas_registo', 'INT NULL COMMENT "Semanas de gestação na data de registo"'],
    ['gestacao_dias_registo', 'INT NULL COMMENT "Dias de gestação na data de registo (0-6)"'],
    ['gestacao_registada_em', 'DATE NULL COMMENT "Data em que a gestação foi registada"'],
  ];

  for (const [name, def] of columns) {
    await tryExec(
      `Coluna pacientes.${name}`,
      `ALTER TABLE pacientes ADD COLUMN ${name} ${def};`,
      ['ER_DUP_FIELDNAME']
    );
  }
};
