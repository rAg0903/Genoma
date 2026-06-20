module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE testes
      ADD COLUMN IF NOT EXISTS determinacao_sexo_fetal TINYINT(1) NOT NULL DEFAULT 0
  `).catch(async () => {
    await db.execute(`
      ALTER TABLE testes ADD COLUMN determinacao_sexo_fetal TINYINT(1) NOT NULL DEFAULT 0
    `);
  });
  console.log('  ✓ Coluna testes.determinacao_sexo_fetal');
};

module.exports.down = async () => {};
