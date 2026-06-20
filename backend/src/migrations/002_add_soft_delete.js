module.exports.up = async (db) => {
  try {
    // Adicionar campo ativo à tabela pacientes se não existir
    await db.execute(`
      ALTER TABLE pacientes ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela pacientes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em pacientes');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em pacientes:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela testes se não existir
    await db.execute(`
      ALTER TABLE testes ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela testes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em testes');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em testes:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela empresas se não existir
    await db.execute(`
      ALTER TABLE empresas ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela empresas');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em empresas');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em empresas:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela perfis se não existir
    await db.execute(`
      ALTER TABLE perfis ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela perfis');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em perfis');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em perfis:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela medicos se não existir
    await db.execute(`
      ALTER TABLE medicos ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela medicos');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em medicos');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em medicos:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela itens_pesquisa se não existir
    await db.execute(`
      ALTER TABLE itens_pesquisa ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela itens_pesquisa');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em itens_pesquisa');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em itens_pesquisa:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela pedidos_exames se não existir
    await db.execute(`
      ALTER TABLE pedidos_exames ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela pedidos_exames');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em pedidos_exames');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em pedidos_exames:', error.message);
    }
  }

  try {
    // Adicionar campo ativo à tabela resultados_detalhados se não existir
    await db.execute(`
      ALTER TABLE resultados_detalhados ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
    `);
    console.log('  ✓ Campo ativo adicionado à tabela resultados_detalhados');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo ativo já existe em resultados_detalhados');
    } else {
      console.log('  ⚠ Erro ao adicionar ativo em resultados_detalhados:', error.message);
    }
  }

  try {
    // Adicionar campo altura à tabela pacientes se não existir
    await db.execute(`
      ALTER TABLE pacientes ADD COLUMN altura DECIMAL(5,2);
    `);
    console.log('  ✓ Campo altura adicionado à tabela pacientes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo altura já existe em pacientes');
    } else {
      console.log('  ⚠ Erro ao adicionar altura em pacientes:', error.message);
    }
  }

  try {
    // Adicionar campo peso à tabela pacientes se não existir
    await db.execute(`
      ALTER TABLE pacientes ADD COLUMN peso DECIMAL(5,2);
    `);
    console.log('  ✓ Campo peso adicionado à tabela pacientes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Campo peso já existe em pacientes');
    } else {
      console.log('  ⚠ Erro ao adicionar peso em pacientes:', error.message);
    }
  }
};
