/** Campo descricao em tipos_kit (alinhado com testes/empresas). */
module.exports.up = async (db) => {
  const [cols] = await db.execute('SHOW COLUMNS FROM tipos_kit LIKE ?', ['descricao']);
  if (cols.length > 0) {
    console.log('  ℹ Coluna tipos_kit.descricao já existe');
    return;
  }

  await db.execute('ALTER TABLE tipos_kit ADD COLUMN descricao TEXT NULL');
  console.log('  ✓ Coluna tipos_kit.descricao adicionada');
};

module.exports.down = async () => {
  // Sem reversão automática.
};
