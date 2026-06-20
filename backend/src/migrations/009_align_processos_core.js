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

  await tryExec('Tabela processo_status criada', `
    CREATE TABLE IF NOT EXISTS processo_status (
      nome VARCHAR(40) PRIMARY KEY,
      ordem INT NOT NULL,
      ativo BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await tryExec('Status de processo base inseridos', `
    INSERT IGNORE INTO processo_status (nome, ordem) VALUES
      ('Agendado', 1),
      ('Kit Reservado', 2),
      ('Colheita Realizada', 3),
      ('Enviado Laboratorio', 4),
      ('Em Analise', 5),
      ('Resultado Disponivel', 6),
      ('Validado', 7),
      ('Faturado', 8),
      ('Cancelado', 9);
  `);

  const processoColumns = [
    ['numero_processo', 'VARCHAR(50) NULL'],
    ['teste_id', 'CHAR(36) NULL'],
    ['empresa_id', 'CHAR(36) NULL'],
    ['posto', 'VARCHAR(120) NULL'],
    ['status_id', "VARCHAR(40) DEFAULT 'Agendado'"],
    ['data_colheita', 'DATE NULL'],
    ['data_chegada_laboratorio', 'DATE NULL'],
    ['data_resultado', 'DATE NULL'],
    ['data_validacao', 'DATE NULL'],
    ['data_envio_relatorio', 'DATE NULL'],
    ['responsavel_fluxo', 'VARCHAR(120) NULL'],
    ['relatorio_validado', 'BOOLEAN DEFAULT FALSE'],
    ["relatorio_enviado_para", "VARCHAR(20) DEFAULT 'Nenhum'"],
    ['resultado_tudo_ok', 'BOOLEAN DEFAULT TRUE'],
    ['resultado_anomalias', 'TEXT NULL'],
    ['fatura_emitida', 'BOOLEAN DEFAULT FALSE'],
    ['fatura_numero', 'VARCHAR(50) NULL'],
    ['fatura_data_emissao', 'DATE NULL'],
    ['valor_base', 'DECIMAL(10,2) DEFAULT 0.00'],
    ['desconto_percentual', 'DECIMAL(5,2) DEFAULT 0.00'],
    ['valor_final', 'DECIMAL(10,2) DEFAULT 0.00'],
    ['pagamento_data', 'DATE NULL'],
    ['recibo_numero', 'VARCHAR(50) NULL'],
    ['observacoes', 'TEXT NULL']
  ];

  for (const [column, definition] of processoColumns) {
    await tryExec(
      `Coluna ${column} adicionada em processos`,
      `ALTER TABLE processos ADD COLUMN ${column} ${definition};`,
      ['ER_DUP_FIELDNAME']
    );
  }

  await tryExec(
    'Indice unico numero_processo criado',
    'ALTER TABLE processos ADD UNIQUE KEY uk_processos_numero (numero_processo);',
    ['ER_DUP_KEYNAME']
  );

  await tryExec(
    'FK processos_testes criada',
    'ALTER TABLE processos ADD CONSTRAINT fk_processos_testes FOREIGN KEY (teste_id) REFERENCES testes(id);',
    ['ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE']
  );

  await tryExec(
    'FK processos_empresas criada',
    'ALTER TABLE processos ADD CONSTRAINT fk_processos_empresas FOREIGN KEY (empresa_id) REFERENCES empresas(id);',
    ['ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE']
  );

  await tryExec(
    'FK processos_status criada',
    'ALTER TABLE processos ADD CONSTRAINT fk_processos_status FOREIGN KEY (status_id) REFERENCES processo_status(nome);',
    ['ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE']
  );

  await tryExec(
    'Tabela processo_relatorios criada',
    `
    CREATE TABLE IF NOT EXISTS processo_relatorios (
      id CHAR(36) PRIMARY KEY,
      processo_id CHAR(36) NOT NULL,
      template VARCHAR(120) NULL,
      pdf_url TEXT NOT NULL,
      data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      estado_envio ENUM('Pendente', 'Enviado', 'Falha') DEFAULT 'Pendente',
      observacoes TEXT,
      KEY fk_relatorio_processo (processo_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  );

  await tryExec(
    'FK processo_relatorios_processos criada',
    `
    ALTER TABLE processo_relatorios
      ADD CONSTRAINT fk_relatorio_processos
      FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE;
    `,
    ['ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE']
  );

  await tryExec(
    'Enum de status dos kits atualizado (inclui Expirado)',
    `
    ALTER TABLE kits
      MODIFY COLUMN status ENUM(
        'Disponivel',
        'Reservado',
        'Em transito',
        'Utilizado',
        'Invalido',
        'Perdido',
        'Expirado'
      ) DEFAULT 'Disponivel';
    `,
    ['ER_TRUNCATED_WRONG_VALUE_FOR_FIELD']
  );

  try {
    const [columnsRows] = await db.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos_exames';`
    );
    const columns = new Set(columnsRows.map((row) => row.COLUMN_NAME));
    const has = (column) => columns.has(column);

    const col = (column, fallback = 'NULL') => (has(column) ? `pe.${column}` : fallback);

    const statusExpr = has('status')
      ? `CASE
          WHEN pe.status IN ('Aguardando Colheita', 'Pendente', 'Agendado') THEN 'Agendado'
          WHEN pe.status IN ('Kit Reservado') THEN 'Kit Reservado'
          WHEN pe.status IN ('Colheita Realizada') THEN 'Colheita Realizada'
          WHEN pe.status IN ('Em Laboratorio', 'Em Laboratório', 'Enviado Laboratorio') THEN 'Enviado Laboratorio'
          WHEN pe.status IN ('Em Analise', 'Em Análise') THEN 'Em Analise'
          WHEN pe.status IN ('Concluido', 'Concluído', 'Resultado Disponivel', 'Resultado Disponível') THEN 'Resultado Disponivel'
          WHEN pe.status IN ('Validado') THEN 'Validado'
          WHEN pe.status IN ('Faturado') THEN 'Faturado'
          WHEN pe.status = 'Cancelado' THEN 'Cancelado'
          ELSE 'Agendado'
        END`
      : `'Agendado'`;

    const selectSql = `
      INSERT INTO processos (
        id,
        numero_processo,
        paciente_id,
        medico_id,
        teste_id,
        empresa_id,
        posto,
        posto_id,
        kit_id,
        status_id,
        data_entrada,
        observacoes,
        data_colheita,
        data_chegada_laboratorio,
        data_resultado,
        data_validacao,
        data_envio_relatorio,
        responsavel_fluxo,
        relatorio_validado,
        relatorio_enviado_para,
        resultado_tudo_ok,
        resultado_anomalias,
        fatura_emitida,
        fatura_numero,
        fatura_data_emissao,
        valor_base,
        desconto_percentual,
        valor_final,
        pagamento_data,
        recibo_numero
      )
      SELECT
        pe.id,
        ${col('numero_processo')},
        pe.paciente_id,
        pe.medico_id,
        ${col('teste_id')},
        ${col('empresa_id')},
        ${col('posto')},
        (SELECT p.id FROM postos p WHERE p.nome = ${col('posto')} LIMIT 1),
        (SELECT k.id FROM kits k WHERE k.codigo_barras = ${col('kit_codigo')} LIMIT 1),
        ${statusExpr},
        ${col('data_pedido', 'CURRENT_TIMESTAMP')},
        ${col('notas_clinicas')},
        ${col('data_colheita')},
        ${col('data_chegada_laboratorio')},
        ${col('data_resultado')},
        ${col('data_validacao')},
        ${col('data_envio_relatorio')},
        ${col('responsavel_fluxo')},
        ${col('relatorio_validado', '0')},
        ${col('relatorio_enviado_para', "'Nenhum'")},
        ${col('resultado_tudo_ok', '1')},
        ${col('resultado_anomalias')},
        ${col('fatura_emitida', '0')},
        ${col('fatura_numero')},
        ${col('fatura_data_emissao')},
        ${col('valor_base', '0')},
        ${col('desconto_percentual', '0')},
        ${col('valor_final', '0')},
        ${col('pagamento_data')},
        ${col('recibo_numero')}
      FROM pedidos_exames pe
      LEFT JOIN processos pr ON pr.id = pe.id
      WHERE pr.id IS NULL;
    `;

    await tryExec('Migracao de pedidos_exames para processos', selectSql);
  } catch (error) {
    console.log('  ⚠ Migracao de pedidos_exames para processos:', error.message);
  }

  await tryExec(
    'Status de processos atualizados quando vazio',
    `
    UPDATE processos
      SET status_id = 'Agendado'
      WHERE status_id IS NULL OR status_id = '';
    `
  );
};
