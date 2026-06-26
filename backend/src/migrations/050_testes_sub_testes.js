/**
 * Hierarquia teste → sub-teste (teste_pai_id).
 * Agrupa os testes Maternity existentes sob um teste pai MT-001.
 */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE testes
      ADD COLUMN IF NOT EXISTS teste_pai_id CHAR(36) NULL
  `).catch(async () => {
    await db.execute(`ALTER TABLE testes ADD COLUMN teste_pai_id CHAR(36) NULL`);
  });

  await db.execute(`
    ALTER TABLE testes
      ADD CONSTRAINT fk_testes_pai
      FOREIGN KEY (teste_pai_id) REFERENCES testes(id) ON DELETE CASCADE
  `).catch(() => {});

  const [existingParent] = await db.execute(
    `SELECT id FROM testes WHERE codigo = 'MT-001' AND teste_pai_id IS NULL LIMIT 1`,
  );
  if (existingParent.length > 0) {
    console.log('  ℹ Teste pai Maternity (MT-001) já existe');
    return;
  }

  const subNomes = ['Maternity 21 Plus Core', 'Maternity Genome', 'Maternity Intermédio'];
  const subCodigos = ['MT-21-PC', 'MT-Genome', 'MT-INT'];
  const placeholders = subNomes.map(() => '?').join(', ');
  const [subs] = await db.execute(
    `SELECT * FROM testes
     WHERE teste_pai_id IS NULL
       AND (
         nome IN (${placeholders})
         OR codigo IN ('MT-21-PC', 'MT-Genome', 'MT-INT')
       )`,
    subNomes,
  );

  if (subs.length === 0) {
    console.log('  ℹ Sem testes Maternity para agrupar');
    return;
  }

  const template = subs[0];
  const { v4: uuidv4 } = require('uuid');
  const parentId = uuidv4();

  await db.execute(
    `INSERT INTO testes (
      id, nome, codigo, preco, preco_compra, preco_venda, descricao, ativo,
      tipo_teste, empresa, tipo_kit, laboratorio_processamento_id,
      tempo_resposta_dias, gestacao_minima_semanas
    ) VALUES (?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      parentId,
      'Maternity',
      'MT-001',
      template.descricao || null,
      template.ativo ?? 1,
      'Maternity',
      template.empresa || null,
      template.tipo_kit || 'Maternity',
      template.laboratorio_processamento_id || null,
      template.tempo_resposta_dias ?? null,
      template.gestacao_minima_semanas ?? null,
    ],
  );

  for (const sub of subs) {
    await db.execute(`UPDATE testes SET teste_pai_id = ? WHERE id = ?`, [parentId, sub.id]);
  }

  console.log(`  ✓ Teste pai Maternity (MT-001) criado com ${subs.length} sub-teste(s)`);
};

module.exports.down = async () => {};
