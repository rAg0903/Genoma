/** Campos de morada e notas internas em empresas (alinhado com entidades/postos). */
module.exports.up = async (db) => {
  const columns = [
    ['cidade', 'VARCHAR(100) NULL'],
    ['distrito', 'VARCHAR(100) NULL'],
    ['notas', 'TEXT NULL'],
  ];

  for (const [name, type] of columns) {
    try {
      await db.execute(`ALTER TABLE empresas ADD COLUMN ${name} ${type}`);
      console.log(`  ✓ Coluna empresas.${name} adicionada`);
    } catch (error) {
      if (String(error.message).includes('Duplicate column')) {
        console.log(`  ℹ Coluna empresas.${name} já existe`);
      } else {
        throw error;
      }
    }
  }
};

module.exports.down = async () => {
  // Sem reversão automática.
};
