module.exports.up = async (db) => {
  try {
    await db.execute('ALTER TABLE kits ADD COLUMN laboratorio_id CHAR(36) NULL');
    console.log('  ✓ Coluna laboratorio_id adicionada em kits');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Coluna laboratorio_id ja existe em kits');
    } else {
      console.log('  ⚠ Erro ao adicionar laboratorio_id em kits:', error.message);
    }
  }

  try {
    await db.execute(
      'ALTER TABLE kits ADD CONSTRAINT fk_kits_laboratorio FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id)'
    );
    console.log('  ✓ FK fk_kits_laboratorio criada em kits');
  } catch (error) {
    console.log('  ℹ FK fk_kits_laboratorio ignorada:', error.message);
  }

  const requisicaoCols = [
    ['origem_empresa_id', 'CHAR(36) NULL'],
    ['origem_posto_id', 'CHAR(36) NULL'],
    ['origem_laboratorio_id', 'CHAR(36) NULL'],
    ['destino_empresa_id', 'CHAR(36) NULL'],
    ['destino_posto_id', 'CHAR(36) NULL'],
    ['destino_laboratorio_id', 'CHAR(36) NULL'],
    ['origem_nome', 'VARCHAR(120) NULL'],
    ['destino_nome', 'VARCHAR(120) NULL'],
  ];

  for (const [col, type] of requisicaoCols) {
    try {
      await db.execute(`ALTER TABLE requisicoes_kits ADD COLUMN ${col} ${type}`);
      console.log(`  ✓ Coluna ${col} adicionada em requisicoes_kits`);
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log(`  ℹ Coluna ${col} ja existe em requisicoes_kits`);
      } else {
        console.log(`  ⚠ Erro ao adicionar ${col}:`, error.message);
      }
    }
  }
};
