const pool = require('../config/database');

exports.listByPerfilId = async (perfilId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT perfil_id, submodulo, permitido
       FROM perfil_stock_submodulos
       WHERE perfil_id = ?`,
      [perfilId],
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.ensureDefaults = async (perfilId, permissions) => {
  const connection = await pool.getConnection();
  try {
    const values = Object.entries(permissions).map(([submodulo, permitido]) => [perfilId, submodulo, !!permitido]);

    for (const [targetPerfilId, submodulo, permitido] of values) {
      await connection.execute(
        `INSERT INTO perfil_stock_submodulos (perfil_id, submodulo, permitido)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE permitido = perfil_stock_submodulos.permitido`,
        [targetPerfilId, submodulo, permitido],
      );
    }
  } finally {
    connection.release();
  }
};

exports.replaceByPerfilId = async (perfilId, permissions) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM perfil_stock_submodulos WHERE perfil_id = ?', [perfilId]);

    const values = Object.entries(permissions).map(([submodulo, permitido]) => [perfilId, submodulo, !!permitido]);
    for (const [targetPerfilId, submodulo, permitido] of values) {
      await connection.execute(
        `INSERT INTO perfil_stock_submodulos (perfil_id, submodulo, permitido)
         VALUES (?, ?, ?)`,
        [targetPerfilId, submodulo, permitido],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
