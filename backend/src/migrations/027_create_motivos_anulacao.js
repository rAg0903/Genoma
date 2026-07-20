const { v4: uuidv4 } = require('uuid');

const SEED_MOTIVOS = [
  'Desistência',
  'Erro atribuição processo',
  'Perda do bebé',
  'Repetição de colheita',
];

module.exports.up = async (db) => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS motivos_anulacao (
        id CHAR(36) NOT NULL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_motivos_anulacao_nome (nome)
      );
    `);
    console.log('  ✓ Tabela motivos_anulacao criada');

    for (const nome of SEED_MOTIVOS) {
      const [existing] = await db.execute(
        'SELECT id FROM motivos_anulacao WHERE nome = ? LIMIT 1',
        [nome]
      );
      if (existing.length === 0) {
        await db.execute(
          'INSERT INTO motivos_anulacao (id, nome, ativo) VALUES (?, ?, TRUE)',
          [uuidv4(), nome]
        );
      }
    }
    console.log('  ✓ Motivos de anulação base inseridos');
  } catch (error) {
    console.log('  ⚠ Erro ao criar motivos_anulacao:', error.message);
  }
};
