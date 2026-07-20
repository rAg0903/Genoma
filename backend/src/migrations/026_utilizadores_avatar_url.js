module.exports.up = async (db) => {
  try {
    await db.execute(`
      ALTER TABLE utilizadores
      ADD COLUMN avatar_url MEDIUMTEXT NULL;
    `);
    console.log('  ✓ Coluna avatar_url adicionada em utilizadores');
  } catch (error) {
    console.log('  ⚠ Erro ao adicionar avatar_url:', error.message);
  }
};
