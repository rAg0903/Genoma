module.exports.up = async (db) => {
  try {
    await db.execute(`
      ALTER TABLE empresas
        ADD COLUMN tipo_empresa VARCHAR(50),
        ADD COLUMN nif VARCHAR(20),
        ADD COLUMN pais VARCHAR(50),
        ADD COLUMN contacto VARCHAR(100);
    `);
    console.log('  ✓ Colunas adicionais adicionadas em empresas');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Colunas adicionais ja existem em empresas');
    } else {
      console.log('  ⚠ Erro ao alterar empresas:', error.message);
    }
  }

  try {
    await db.execute(`
      ALTER TABLE testes
        ADD COLUMN codigo VARCHAR(20),
        ADD COLUMN categoria VARCHAR(80),
        ADD COLUMN laboratorio_id CHAR(36),
        ADD COLUMN tempo_estimado INT;
    `);
    console.log('  ✓ Colunas adicionais adicionadas em testes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Colunas adicionais ja existem em testes');
    } else {
      console.log('  ⚠ Erro ao alterar testes:', error.message);
    }
  }

  try {
    await db.execute(`
      ALTER TABLE testes
        ADD CONSTRAINT fk_testes_laboratorio FOREIGN KEY (laboratorio_id) REFERENCES empresas(id);
    `);
    console.log('  ✓ FK laboratorio_id criada em testes');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('  ℹ FK laboratorio_id ja existe em testes');
    } else {
      console.log('  ⚠ Erro ao criar FK laboratorio_id:', error.message);
    }
  }

  try {
    await db.execute(`
      ALTER TABLE lotes
        CHANGE COLUMN numero_lote codigo_lote VARCHAR(50) NOT NULL,
        CHANGE COLUMN data_criacao data_rececao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CHANGE COLUMN quantidade_inicial quantidade INT DEFAULT 0;
    `);
    console.log('  ✓ Colunas de lotes renomeadas');
  } catch (error) {
    console.log('  ℹ Colunas de lotes ja estao com o novo nome');
  }

  try {
    await db.execute(`
      ALTER TABLE lotes
        ADD COLUMN fornecedor_id CHAR(36),
        ADD COLUMN validade DATE,
        ADD COLUMN estado VARCHAR(30) DEFAULT 'Disponivel';
    `);
    console.log('  ✓ Colunas adicionais adicionadas em lotes');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Colunas adicionais ja existem em lotes');
    } else {
      console.log('  ⚠ Erro ao adicionar colunas em lotes:', error.message);
    }
  }

  try {
    await db.execute(`
      ALTER TABLE lotes
        ADD CONSTRAINT fk_lotes_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES empresas(id);
    `);
    console.log('  ✓ FK fornecedor_id criada em lotes');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('  ℹ FK fornecedor_id ja existe em lotes');
    } else {
      console.log('  ⚠ Erro ao criar FK fornecedor_id:', error.message);
    }
  }

  try {
    await db.execute(`
      ALTER TABLE lotes
        ADD CONSTRAINT fk_lotes_tipo_kit FOREIGN KEY (tipo_kit_id) REFERENCES testes(id);
    `);
    console.log('  ✓ FK tipo_kit_id criada em lotes');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('  ℹ FK tipo_kit_id ja existe em lotes');
    } else {
      console.log('  ⚠ Erro ao criar FK tipo_kit_id em lotes:', error.message);
    }
  }

  try {
    await db.execute(`
      UPDATE kits
        SET status = 'Disponivel'
        WHERE status IS NULL
          OR status IN ('Na Empresa', 'Disponível', 'Disponivel');
    `);
    await db.execute(`
      UPDATE kits
        SET status = 'Em transito'
        WHERE status IN ('Em trânsito', 'Em transito');
    `);
    await db.execute(`
      UPDATE kits
        SET status = 'Utilizado'
        WHERE status = 'Utilizado';
    `);
    await db.execute(`
      UPDATE kits
        SET status = 'Reservado'
        WHERE status = 'Reservado';
    `);
    await db.execute(`
      UPDATE kits
        SET status = 'Invalido'
        WHERE status IN ('Inválido', 'Invalido');
    `);
    await db.execute(`
      UPDATE kits
        SET status = 'Perdido'
        WHERE status = 'Perdido';
    `);
    console.log('  ✓ Status de kits normalizados');
  } catch (error) {
    console.log('  ℹ Status de kits ja normalizados');
  }

  try {
    await db.execute(`
      ALTER TABLE kits
        MODIFY COLUMN status ENUM(
          'Disponivel',
          'Reservado',
          'Em transito',
          'Utilizado',
          'Invalido',
          'Perdido'
        ) DEFAULT 'Disponivel';
    `);
    console.log('  ✓ Enum status atualizado em kits');
  } catch (error) {
    console.log('  ℹ Enum status de kits ja atualizado');
  }

  try {
    await db.execute(`
      UPDATE pedidos_exames
        SET status = 'Aguardando Colheita'
        WHERE status IS NULL
          OR status IN ('Pendente', 'Aguardando Colheita');
    `);
    await db.execute(`
      UPDATE pedidos_exames
        SET status = 'Em Laboratorio'
        WHERE status IN ('Colhido', 'Em Laboratório', 'Em Laboratorio');
    `);
    await db.execute(`
      UPDATE pedidos_exames
        SET status = 'Em Analise'
        WHERE status IN ('Em análise', 'Em Análise', 'Em Analise');
    `);
    await db.execute(`
      UPDATE pedidos_exames
        SET status = 'Concluido'
        WHERE status IN ('Concluído', 'Concluido');
    `);
    await db.execute(`
      UPDATE pedidos_exames
        SET status = 'Cancelado'
        WHERE status = 'Cancelado';
    `);
    console.log('  ✓ Status de pedidos_exames normalizados');
  } catch (error) {
    console.log('  ℹ Status de pedidos_exames ja normalizados');
  }

  try {
    await db.execute(`
      ALTER TABLE pedidos_exames
        MODIFY COLUMN status ENUM(
          'Aguardando Colheita',
          'Em Laboratorio',
          'Em Analise',
          'Concluido',
          'Cancelado'
        ) DEFAULT 'Aguardando Colheita';
    `);
    console.log('  ✓ Enum status atualizado em pedidos_exames');
  } catch (error) {
    console.log('  ℹ Enum status de pedidos_exames ja atualizado');
  }

  try {
    await db.execute(`
      ALTER TABLE kits
        ADD CONSTRAINT fk_kits_tipo_kit FOREIGN KEY (tipo_kit_id) REFERENCES testes(id);
    `);
    console.log('  ✓ FK tipo_kit_id criada em kits');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('  ℹ FK tipo_kit_id ja existe em kits');
    } else {
      console.log('  ⚠ Erro ao criar FK tipo_kit_id em kits:', error.message);
    }
  }
};
