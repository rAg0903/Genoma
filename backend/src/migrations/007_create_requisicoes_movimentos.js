module.exports.up = async (db) => {
  try {
    await db.execute(`
      ALTER TABLE kits
        ADD COLUMN localizacao ENUM('Escritorio', 'Posto', 'Laboratorio') DEFAULT 'Escritorio';
    `);
    console.log('  ✓ Coluna localizacao adicionada em kits');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ Coluna localizacao ja existe em kits');
    } else {
      console.log('  ⚠ Erro ao adicionar localizacao em kits:', error.message);
    }
  }

  try {
    await db.execute(`
      UPDATE kits
        SET localizacao = 'Posto'
        WHERE posto_id IS NOT NULL;
    `);
    await db.execute(`
      UPDATE kits
        SET localizacao = 'Escritorio'
        WHERE localizacao IS NULL;
    `);
    console.log('  ✓ Localizacao inicial de kits preenchida');
  } catch (error) {
    console.log('  ℹ Localizacao inicial de kits ja preenchida');
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS requisicoes_kits (
        id CHAR(36) PRIMARY KEY,
        data DATE NOT NULL,
        origem ENUM('Escritorio', 'Posto', 'Laboratorio') NOT NULL,
        destino ENUM('Escritorio', 'Posto', 'Laboratorio') NOT NULL,
        quantidade INT NOT NULL,
        status ENUM('Pendente', 'Em transito', 'Entregue', 'Cancelada') DEFAULT 'Pendente',
        tracking_number VARCHAR(100),
        transportadora VARCHAR(100),
        lote_id CHAR(36),
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_requisicoes_lote (lote_id),
        CONSTRAINT fk_requisicoes_lote FOREIGN KEY (lote_id) REFERENCES lotes(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela requisicoes_kits criada');
  } catch (error) {
    console.log('  ℹ Tabela requisicoes_kits ja existe');
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS requisicao_kits_itens (
        id CHAR(36) PRIMARY KEY,
        requisicao_id CHAR(36) NOT NULL,
        kit_id CHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_requisicao_kit (requisicao_id, kit_id),
        KEY fk_requisicao (requisicao_id),
        KEY fk_kit (kit_id),
        CONSTRAINT fk_requisicao_itens_requisicao FOREIGN KEY (requisicao_id)
          REFERENCES requisicoes_kits(id) ON DELETE CASCADE,
        CONSTRAINT fk_requisicao_itens_kit FOREIGN KEY (kit_id)
          REFERENCES kits(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela requisicao_kits_itens criada');
  } catch (error) {
    console.log('  ℹ Tabela requisicao_kits_itens ja existe');
  }

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS movimentos_kits (
        id CHAR(36) PRIMARY KEY,
        data DATE NOT NULL,
        kit_id CHAR(36) NOT NULL,
        origem ENUM('Escritorio', 'Posto', 'Laboratorio') NOT NULL,
        destino ENUM('Escritorio', 'Posto', 'Laboratorio') NOT NULL,
        motivo ENUM('Envio', 'Consumo', 'Reposicao', 'Transferencia', 'SMS Colheita') NOT NULL,
        observacoes TEXT,
        requisicao_id CHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_movimentos_kit (kit_id),
        KEY fk_movimentos_requisicao (requisicao_id),
        CONSTRAINT fk_movimentos_kit FOREIGN KEY (kit_id)
          REFERENCES kits(id) ON DELETE CASCADE,
        CONSTRAINT fk_movimentos_requisicao FOREIGN KEY (requisicao_id)
          REFERENCES requisicoes_kits(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela movimentos_kits criada');
  } catch (error) {
    console.log('  ℹ Tabela movimentos_kits ja existe');
  }
};
