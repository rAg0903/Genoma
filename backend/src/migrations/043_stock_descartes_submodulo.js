/**
 * Garante permissão do submódulo "descartes" em perfil_stock_submodulos.
 */
module.exports.up = async (db) => {
  const [perfis] = await db.execute('SELECT id FROM perfis');
  for (const perfil of perfis) {
    const [existing] = await db.execute(
      `SELECT permitido FROM perfil_stock_submodulos
       WHERE perfil_id = ? AND submodulo = 'requisicoes' LIMIT 1`,
      [perfil.id],
    );
    const permitido = existing[0]?.permitido ?? 1;
    await db.execute(
      `INSERT INTO perfil_stock_submodulos (perfil_id, submodulo, permitido)
       VALUES (?, 'descartes', ?)
       ON DUPLICATE KEY UPDATE permitido = VALUES(permitido)`,
      [perfil.id, permitido ? 1 : 0],
    );
  }
  console.log('  ✓ Submódulo descartes adicionado aos perfis');
};

module.exports.down = async (db) => {
  await db.execute(`DELETE FROM perfil_stock_submodulos WHERE submodulo = 'descartes'`);
};
