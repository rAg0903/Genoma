module.exports.up = async (db) => {
  try {
    // Criar tabela perfis
    await db.execute(`
      CREATE TABLE IF NOT EXISTS perfis (
        id CHAR(36) PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE,
        ativo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela perfis criada');
  } catch (error) {
    console.log('  ℹ Tabela perfis já existe');
  }

  try {
    // Criar tabela empresas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS empresas (
        id CHAR(36) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        morada TEXT,
        codigo_postal VARCHAR(20),
        telefone VARCHAR(20),
        email VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela empresas criada');
  } catch (error) {
    console.log('  ℹ Tabela empresas já existe');
  }

  try {
    // Criar tabela utilizadores
    await db.execute(`
      CREATE TABLE IF NOT EXISTS utilizadores (
        id CHAR(36) PRIMARY KEY,
        perfil_id CHAR(36),
        empresa_id CHAR(36),
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        telefone VARCHAR(20),
        password_hash TEXT NOT NULL,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_perfil (perfil_id),
        KEY fk_empresa (empresa_id),
        CONSTRAINT fk_utilizadores_perfis FOREIGN KEY (perfil_id) REFERENCES perfis(id),
        CONSTRAINT fk_utilizadores_empresas FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela utilizadores criada');
  } catch (error) {
    console.log('  ℹ Tabela utilizadores já existe');
  }

  try {
    // Criar tabela medicos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS medicos (
        utilizador_id CHAR(36) PRIMARY KEY,
        num_ordem VARCHAR(20) UNIQUE NOT NULL,
        especialidade VARCHAR(100),
        ativo BOOLEAN DEFAULT TRUE,
        CONSTRAINT fk_medicos_utilizadores FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela medicos criada');
  } catch (error) {
    console.log('  ℹ Tabela medicos já existe');
  }

  try {
    // Criar tabela testes
    await db.execute(`
      CREATE TABLE IF NOT EXISTS testes (
        id CHAR(36) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        descricao TEXT,
        ativo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela testes criada');
  } catch (error) {
    console.log('  ℹ Tabela testes já existe');
  }

  try {
    // Criar tabela itens_pesquisa
    await db.execute(`
      CREATE TABLE IF NOT EXISTS itens_pesquisa (
        id CHAR(36) PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL UNIQUE,
        descricao VARCHAR(100) NOT NULL,
        ativo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela itens_pesquisa criada');
  } catch (error) {
    console.log('  ℹ Tabela itens_pesquisa já existe');
  }

  try {
    // Criar tabela teste_composicao
    await db.execute(`
      CREATE TABLE IF NOT EXISTS teste_composicao (
        teste_id CHAR(36),
        item_id CHAR(36),
        PRIMARY KEY (teste_id, item_id),
        CONSTRAINT fk_teste_composicao_testes FOREIGN KEY (teste_id) REFERENCES testes(id) ON DELETE CASCADE,
        CONSTRAINT fk_teste_composicao_itens FOREIGN KEY (item_id) REFERENCES itens_pesquisa(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela teste_composicao criada');
  } catch (error) {
    console.log('  ℹ Tabela teste_composicao já existe');
  }

  try {
    // Criar tabela pacientes
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id CHAR(36) PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        data_nascimento DATE NOT NULL,
        genero VARCHAR(20),
        nif VARCHAR(20) UNIQUE,
        telemovel VARCHAR(20),
        email VARCHAR(100),
        morada TEXT,
        altura DECIMAL(5, 2),
        peso DECIMAL(5, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela pacientes criada');
  } catch (error) {
    console.log('  ℹ Tabela pacientes já existe');
  }

  try {
    // Criar tabela pedidos_exames
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pedidos_exames (
        id CHAR(36) PRIMARY KEY,
        paciente_id CHAR(36) NOT NULL,
        medico_id CHAR(36) NOT NULL,
        teste_id CHAR(36) NOT NULL,
        empresa_id CHAR(36) NOT NULL,
        data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(30) DEFAULT 'Pendente',
        notas_clinicas TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        KEY fk_paciente (paciente_id),
        KEY fk_medico (medico_id),
        KEY fk_teste (teste_id),
        KEY fk_empresa (empresa_id),
        CONSTRAINT fk_pedidos_pacientes FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
        CONSTRAINT fk_pedidos_medicos FOREIGN KEY (medico_id) REFERENCES medicos(utilizador_id),
        CONSTRAINT fk_pedidos_testes FOREIGN KEY (teste_id) REFERENCES testes(id),
        CONSTRAINT fk_pedidos_empresas FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela pedidos_exames criada');
  } catch (error) {
    console.log('  ℹ Tabela pedidos_exames já existe');
  }

  try {
    // Criar tabela resultados_detalhados
    await db.execute(`
      CREATE TABLE IF NOT EXISTS resultados_detalhados (
        id CHAR(36) PRIMARY KEY,
        pedido_id CHAR(36) NOT NULL,
        item_id CHAR(36) NOT NULL,
        resultado VARCHAR(100),
        observacoes TEXT,
        data_resultado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE,
        KEY fk_pedido (pedido_id),
        KEY fk_item (item_id),
        CONSTRAINT fk_resultados_pedidos FOREIGN KEY (pedido_id) REFERENCES pedidos_exames(id) ON DELETE CASCADE,
        CONSTRAINT fk_resultados_itens FOREIGN KEY (item_id) REFERENCES itens_pesquisa(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela resultados_detalhados criada');
  } catch (error) {
    console.log('  ℹ Tabela resultados_detalhados já existe');
  }

  try {
    // Criar tabela postos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS postos (
        id CHAR(36) PRIMARY KEY,
        entidade_id CHAR(36),
        nome VARCHAR(100) NOT NULL,
        codigo_posto VARCHAR(20) UNIQUE,
        localizacao TEXT,
        KEY fk_entidade (entidade_id),
        CONSTRAINT fk_postos_empresas FOREIGN KEY (entidade_id) REFERENCES empresas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela postos criada');
  } catch (error) {
    console.log('  ℹ Tabela postos já existe');
  }

  try {
    // Criar tabela lotes
    await db.execute(`
      CREATE TABLE IF NOT EXISTS lotes (
        id CHAR(36) PRIMARY KEY,
        numero_lote VARCHAR(50) NOT NULL UNIQUE,
        tipo_kit_id CHAR(36),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        quantidade_inicial INT DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela lotes criada');
  } catch (error) {
    console.log('  ℹ Tabela lotes já existe');
  }

  try {
    // Criar tabela kits
    await db.execute(`
      CREATE TABLE IF NOT EXISTS kits (
        id CHAR(36) PRIMARY KEY,
        numero_kit VARCHAR(50),
        tracking VARCHAR(100),
        codigo_barras VARCHAR(50) NOT NULL UNIQUE,
        tipo_kit_id CHAR(36),
        lote_id CHAR(36),
        empresa_id CHAR(36),
        posto_id CHAR(36),
        status VARCHAR(30) DEFAULT 'Na Empresa',
        data_validade DATE,
        KEY fk_lote (lote_id),
        KEY fk_empresa_kit (empresa_id),
        KEY fk_posto_kit (posto_id),
        CONSTRAINT fk_kits_lotes FOREIGN KEY (lote_id) REFERENCES lotes(id),
        CONSTRAINT fk_kits_empresas FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        CONSTRAINT fk_kits_postos FOREIGN KEY (posto_id) REFERENCES postos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela kits criada');
  } catch (error) {
    console.log('  ℹ Tabela kits já existe');
  }

  try {
    // Criar tabela processos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS processos (
        id CHAR(36) PRIMARY KEY,
        numero_processo VARCHAR(20) NOT NULL UNIQUE,
        paciente_id CHAR(36),
        medico_id CHAR(36),
        posto_id CHAR(36),
        kit_id CHAR(36),
        status_id VARCHAR(30),
        data_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notas TEXT,
        KEY fk_processo_paciente (paciente_id),
        KEY fk_processo_medico (medico_id),
        KEY fk_processo_posto (posto_id),
        KEY fk_processo_kit (kit_id),
        CONSTRAINT fk_processos_pacientes FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
        CONSTRAINT fk_processos_medicos FOREIGN KEY (medico_id) REFERENCES medicos(utilizador_id),
        CONSTRAINT fk_processos_postos FOREIGN KEY (posto_id) REFERENCES postos(id),
        CONSTRAINT fk_processos_kits FOREIGN KEY (kit_id) REFERENCES kits(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela processos criada');
  } catch (error) {
    console.log('  ℹ Tabela processos já existe');
  }

  try {
    // Criar tabela resultados_geneticos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS resultados_geneticos (
        id CHAR(36) PRIMARY KEY,
        processo_id CHAR(36),
        cromossoma VARCHAR(10),
        resultado_valor VARCHAR(50),
        probabilidade VARCHAR(50),
        tipo_resultado VARCHAR(20),
        KEY fk_resultado_processo (processo_id),
        CONSTRAINT fk_resultados_geneticos_processos FOREIGN KEY (processo_id) REFERENCES processos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela resultados_geneticos criada');
  } catch (error) {
    console.log('  ℹ Tabela resultados_geneticos já existe');
  }

  try {
    // Criar tabela assets_resultados
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assets_resultados (
        id CHAR(36) PRIMARY KEY,
        processo_id CHAR(36),
        url_ficheiro TEXT NOT NULL,
        tipo_ficheiro VARCHAR(10) DEFAULT 'PDF',
        data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_assets_processo (processo_id),
        CONSTRAINT fk_assets_resultados_processos FOREIGN KEY (processo_id) REFERENCES processos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela assets_resultados criada');
  } catch (error) {
    console.log('  ℹ Tabela assets_resultados já existe');
  }

  try {
    // Criar tabela logs_auditoria
    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs_auditoria (
        id CHAR(36) PRIMARY KEY,
        empresa_id CHAR(36),
        utilizador_id CHAR(36),
        acao VARCHAR(100),
        tabela_afetada VARCHAR(100),
        registro_id CHAR(36),
        data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_log_empresa (empresa_id),
        KEY fk_log_utilizador (utilizador_id),
        CONSTRAINT fk_logs_empresas FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        CONSTRAINT fk_logs_utilizadores FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela logs_auditoria criada');
  } catch (error) {
    console.log('  ℹ Tabela logs_auditoria já existe');
  }

  try {
    // Criar tabela informacao_clinica
    await db.execute(`
      CREATE TABLE IF NOT EXISTS informacao_clinica (
        id CHAR(36) PRIMARY KEY,
        processo_id CHAR(36),
        semanas_gravidez INT,
        dias_gravidez INT,
        tipo_gravidez ENUM('singular', 'gemelar'),
        quer_saber_sexo BOOLEAN DEFAULT FALSE,
        motivo_prescricao TEXT,
        data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_info_processo (processo_id),
        CONSTRAINT fk_informacao_clinica_processos FOREIGN KEY (processo_id) REFERENCES processos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela informacao_clinica criada');
  } catch (error) {
    console.log('  ℹ Tabela informacao_clinica já existe');
  }

  try {
    // Criar tabela colheitas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS colheitas (
        id CHAR(36) PRIMARY KEY,
        processo_id CHAR(36),
        posto_id CHAR(36),
        data_prevista DATE,
        periodo ENUM('Manhã', 'Tarde', 'Noite'),
        data_efetiva DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_colheita_processo (processo_id),
        KEY fk_colheita_posto (posto_id),
        CONSTRAINT fk_colheitas_processos FOREIGN KEY (processo_id) REFERENCES processos(id),
        CONSTRAINT fk_colheitas_postos FOREIGN KEY (posto_id) REFERENCES postos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela colheitas criada');
  } catch (error) {
    console.log('  ℹ Tabela colheitas já existe');
  }

  try {
    // Criar tabela facturacao
    await db.execute(`
      CREATE TABLE IF NOT EXISTS facturacao (
        id CHAR(36) PRIMARY KEY,
        processo_id CHAR(36),
        preco_teste DECIMAL(10,2) DEFAULT 0.00,
        numero_fatura VARCHAR(50),
        data_fatura DATE,
        entidade_multibanco VARCHAR(20),
        referencia_multibanco VARCHAR(20),
        comissao BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY fk_facturacao_processo (processo_id),
        CONSTRAINT fk_facturacao_processos FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela facturacao criada');
  } catch (error) {
    console.log('  ℹ Tabela facturacao já existe');
  }
};
