module.exports.up = async (db) => {
  try {
    await db.execute('ALTER TABLE lotes ADD COLUMN teste_id CHAR(36) NULL');
    console.log('  ✓ Coluna teste_id adicionada em lotes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Coluna teste_id ja existe em lotes');
    } else {
      console.log('  ⚠ Erro ao adicionar teste_id em lotes:', error.message);
    }
  }

  try {
    await db.execute(`
      UPDATE lotes l
      JOIN tipos_kit tk ON tk.id = l.tipo_kit_id
      JOIN testes t ON t.tipo_kit = tk.nome AND t.tipo_teste = l.tipo_teste
      SET l.teste_id = t.id
      WHERE l.teste_id IS NULL AND l.tipo_teste IS NOT NULL AND l.tipo_teste <> ''
    `);
    console.log('  ✓ teste_id preenchido a partir de tipo_teste');
  } catch (error) {
    console.log('  ⚠ Erro ao preencher teste_id (tipo_teste):', error.message);
  }

  try {
    await db.execute(`
      UPDATE lotes l
      JOIN tipos_kit tk ON tk.id = l.tipo_kit_id
      JOIN testes t ON t.tipo_kit = tk.nome AND t.nome = l.tipo_teste
      SET l.teste_id = t.id
      WHERE l.teste_id IS NULL AND l.tipo_teste IS NOT NULL AND l.tipo_teste <> ''
    `);
    console.log('  ✓ teste_id preenchido a partir do nome do teste');
  } catch (error) {
    console.log('  ⚠ Erro ao preencher teste_id (nome):', error.message);
  }

  try {
    await db.execute(
      'ALTER TABLE lotes ADD CONSTRAINT fk_lotes_teste FOREIGN KEY (teste_id) REFERENCES testes(id)'
    );
    console.log('  ✓ FK fk_lotes_teste criada em lotes -> testes');
  } catch (error) {
    if (error.code === 'ER_CANT_CREATE_TABLE' || error.code === 'ER_DUP_KEYNAME' || error.message?.includes('Duplicate')) {
      console.log('  ℹ FK fk_lotes_teste ja existe ou ignorada');
    } else {
      console.log('  ⚠ Erro ao criar FK fk_lotes_teste:', error.message);
    }
  }
};
