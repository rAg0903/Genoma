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

  await tryExec(
    'Coluna laboratorio_id em postos',
    `
    ALTER TABLE postos
      ADD COLUMN laboratorio_id CHAR(36) NULL,
      ADD KEY idx_postos_laboratorio (laboratorio_id),
      ADD CONSTRAINT fk_postos_laboratorio
        FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE SET NULL;
    `,
    ['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE', 'ER_FK_DUP_NAME']
  );

  const [labs] = await db.execute(
    "SELECT id FROM laboratorios WHERE LOWER(TRIM(nome)) = 'unilabs' LIMIT 1"
  );
  const unilabsId = labs[0]?.id;

  if (unilabsId) {
    const [res] = await db.execute(
      'UPDATE postos SET laboratorio_id = ? WHERE laboratorio_id IS NULL',
      [unilabsId]
    );
    console.log(`  ✓ ${res.affectedRows} posto(s) associado(s) ao laboratório Unilabs`);
  } else {
    console.log('  ⚠ Laboratório Unilabs não encontrado; postos existentes mantêm laboratorio_id NULL');
  }
};
