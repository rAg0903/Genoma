const { v4: uuidv4 } = require('uuid');

const upsertTipoKit = async (db, nome) => {
  const label = String(nome || '').trim();
  if (!label) return null;

  const [existing] = await db.execute('SELECT id FROM tipos_kit WHERE nome = ? LIMIT 1', [label]);
  if (existing[0]) return existing[0].id;

  const id = uuidv4();
  await db.execute('INSERT INTO tipos_kit (id, nome, ativo) VALUES (?, ?, TRUE)', [id, label]);
  return id;
};

module.exports.up = async (db) => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tipos_kit (
        id CHAR(36) PRIMARY KEY,
        nome VARCHAR(120) NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_tipos_kit_nome (nome)
      );
    `);
    console.log('  ✓ Tabela tipos_kit criada');
  } catch (error) {
    console.log('  ⚠ Erro ao criar tipos_kit:', error.message);
  }

  try {
    const [rows] = await db.execute(`
      SELECT DISTINCT TRIM(tipo_kit) AS nome
      FROM testes
      WHERE tipo_kit IS NOT NULL AND TRIM(tipo_kit) <> ''
    `);
    for (const row of rows) {
      await upsertTipoKit(db, row.nome);
    }
    console.log('  ✓ Tipos de kit importados de testes');
  } catch (error) {
    console.log('  ⚠ Erro ao importar tipos de kit de testes:', error.message);
  }

  console.log('  ℹ Referencias e FKs serao alinhadas na migracao 017');
};
