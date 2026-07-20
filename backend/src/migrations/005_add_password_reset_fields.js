module.exports.up = async (db) => {
  try {
    await db.execute(`
      ALTER TABLE utilizadores
      ADD COLUMN reset_token_hash VARCHAR(128) NULL,
      ADD COLUMN reset_token_expires_at DATETIME NULL;
    `);
    console.log('  ✓ Campos de recuperacao de password adicionados em utilizadores');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campos de recuperacao de password ja existem em utilizadores');
    } else {
      console.log('  ⚠ Erro ao adicionar campos de recuperacao de password:', error.message);
    }
  }
};