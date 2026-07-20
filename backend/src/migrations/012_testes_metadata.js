module.exports.up = async (db) => {
  const tryExec = async (label, sql, ignoreCodes = []) => {
    try {
      await db.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      if (ignoreCodes.includes(error.code)) {
        console.log(`  ℹ ${label} (ignorado)`);
        return;
      }
      console.log(`  ⚠ ${label}:`, error.message);
    }
  };

  // Metadados ricos da definição de testes (ADN fetal).
  const testesColumns = [
    ['preco_compra', 'DECIMAL(10,2) DEFAULT 0.00'],
    ['preco_venda', 'DECIMAL(10,2) DEFAULT 0.00'],
    ['tempo_resposta_dias', 'INT NULL'],
    ['gestacao_minima_semanas', 'INT NULL'],
    ['tipo_teste', 'VARCHAR(80) NULL'],
    ['empresa', 'VARCHAR(80) NULL'],
    ['tipo_kit', 'VARCHAR(80) NULL'],
    // Lista de cromossomas selecionados (1..23) em JSON/CSV.
    ['cromossomas', 'TEXT NULL'],
    ['delecoes_duplicacoes', 'BOOLEAN DEFAULT FALSE'],
    ['microdelecoes_microduplicacoes', 'BOOLEAN DEFAULT FALSE'],
    ['gemeos', 'BOOLEAN DEFAULT FALSE'],
    // Fração fetal presente por defeito (campo de escrita 0–100% nos resultados).
    ['incluir_fracao_fetal', 'BOOLEAN DEFAULT TRUE'],
  ];

  for (const [column, definition] of testesColumns) {
    await tryExec(
      `Coluna ${column} adicionada em testes`,
      `ALTER TABLE testes ADD COLUMN ${column} ${definition};`,
      ['ER_DUP_FIELDNAME']
    );
  }
};
