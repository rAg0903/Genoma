module.exports.up = async (db) => {
  try {
    await db.execute('ALTER TABLE lotes ADD COLUMN tipo_teste VARCHAR(80) NULL');
    console.log('  ✓ Coluna tipo_teste adicionada em lotes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Coluna tipo_teste ja existe em lotes');
    } else {
      console.log('  ⚠ Erro ao adicionar tipo_teste em lotes:', error.message);
    }
  }
};
