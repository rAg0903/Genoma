module.exports.up = async (db) => {
  try {
    await db.execute(`
      ALTER TABLE utilizadores
      MODIFY COLUMN password_hash TEXT NULL;
    `);
    console.log('  ✓ password_hash em utilizadores passou a aceitar NULL');
  } catch (error) {
    console.log('  ⚠ Erro ao tornar password_hash nullable:', error.message);
  }
};
