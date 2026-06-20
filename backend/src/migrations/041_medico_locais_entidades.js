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

  await tryExec('Locais de trabalho de médicos limpos', 'DELETE FROM medico_locais_trabalho;', []);

  await tryExec(
    'FK medico_locais_trabalho -> postos removida',
    'ALTER TABLE medico_locais_trabalho DROP FOREIGN KEY fk_medico_locais_posto;',
    ['ER_CANT_DROP_FIELD_OR_KEY', 'ER_DROP_FK_FAIL']
  );

  await tryExec(
    'Coluna posto_id renomeada para entidade_id',
    `ALTER TABLE medico_locais_trabalho
      CHANGE COLUMN posto_id entidade_id CHAR(36) NOT NULL;`,
    ['ER_BAD_FIELD_ERROR', 'ER_DUP_FIELDNAME']
  );

  await tryExec(
    'Índice medico_locais entidade',
    'ALTER TABLE medico_locais_trabalho ADD KEY idx_medico_locais_entidade (entidade_id);',
    ['ER_DUP_KEYNAME']
  );

  await tryExec(
    'FK medico_locais_trabalho -> entidades',
    `ALTER TABLE medico_locais_trabalho
      ADD CONSTRAINT fk_medico_locais_entidade
      FOREIGN KEY (entidade_id) REFERENCES entidades(id) ON DELETE CASCADE;`,
    ['ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE', 'ER_FK_DUP_NAME']
  );
};
