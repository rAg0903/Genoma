/** Data em que a gestação foi registada (snapshot do contacto). */
module.exports.up = async (db) => {
  try {
    await db.execute(
      'ALTER TABLE informacao_clinica ADD COLUMN gestacao_registada_em DATE NULL COMMENT "Data registo gestação (snapshot contacto)"'
    );
    console.log('  ✓ Coluna gestacao_registada_em adicionada em informacao_clinica');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Coluna gestacao_registada_em já existe em informacao_clinica');
    } else {
      throw error;
    }
  }
};
