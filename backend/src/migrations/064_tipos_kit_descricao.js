/** Campo descricao em tipos_kit (alinhado com testes/empresas). */
module.exports.up = async (db) => {
  try {
    await db.execute('ALTER TABLE tipos_kit ADD COLUMN descricao TEXT NULL');
    console.log('  ✓ Coluna tipos_kit.descricao adicionada');
  } catch (error) {
    if (String(error.message).includes('Duplicate column')) {
      console.log('  ℹ Coluna tipos_kit.descricao já existe');
    } else {
      throw error;
    }
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};
