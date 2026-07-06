/** Origem da conceção e preferência de sexo fetal no contacto (paciente) e snapshot clínico. */
module.exports.up = async (db) => {
  const tryExec = async (label, sql) => {
    try {
      await db.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ℹ ${label} (ignorado)`);
        return;
      }
      throw error;
    }
  };

  const origemEnum = "ENUM('natural', 'fiv_ovulos_proprios', 'fiv_doacao_ovulos') NULL";

  await tryExec(
    'Coluna pacientes.origem_conceicao',
    `ALTER TABLE pacientes ADD COLUMN origem_conceicao ${origemEnum}`,
  );
  await tryExec(
    'Coluna pacientes.quer_saber_sexo',
    'ALTER TABLE pacientes ADD COLUMN quer_saber_sexo TINYINT(1) NOT NULL DEFAULT 0',
  );
  await tryExec(
    'Coluna informacao_clinica.origem_conceicao',
    `ALTER TABLE informacao_clinica ADD COLUMN origem_conceicao ${origemEnum}`,
  );
};

module.exports.down = async () => {};
