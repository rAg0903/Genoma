module.exports.up = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS perfil_stock_submodulos (
      perfil_id CHAR(36) NOT NULL,
      submodulo VARCHAR(30) NOT NULL,
      permitido BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (perfil_id, submodulo),
      CONSTRAINT fk_stock_submodulos_perfil
        FOREIGN KEY (perfil_id) REFERENCES perfis(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('  ✓ Tabela perfil_stock_submodulos criada');
};
