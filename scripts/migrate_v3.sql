-- Genoma v3 — alinhamento funcional sCRM
USE genoma_db;

-- Testes
ALTER TABLE testes ADD COLUMN IF NOT EXISTS tempo_resposta_dias INT NULL;
ALTER TABLE testes ADD COLUMN IF NOT EXISTS tempo_minimo_gestacao_semanas INT NULL;
ALTER TABLE testes ADD COLUMN IF NOT EXISTS preco_compra DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE testes ADD COLUMN IF NOT EXISTS tipo_teste VARCHAR(100) NULL;

-- Teste ↔ Empresa ↔ Kit
CREATE TABLE IF NOT EXISTS teste_empresas (
  id VARCHAR(36) PRIMARY KEY,
  teste_id VARCHAR(36) NOT NULL,
  empresa_id VARCHAR(36) NOT NULL,
  tipo_kit VARCHAR(100) NULL,
  analisa_cromossomas TINYINT(1) NOT NULL DEFAULT 0,
  analisa_gemeos TINYINT(1) NOT NULL DEFAULT 0,
  analisa_delecoes TINYINT(1) NOT NULL DEFAULT 0,
  analisa_microdelecoes TINYINT(1) NOT NULL DEFAULT 0,
  inclui_fraccao_fetal TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (teste_id) REFERENCES testes(id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- Pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS morada2 VARCHAR(500) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(20) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS localidade VARCHAR(100) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS pais VARCHAR(100) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS distrito VARCHAR(100) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS telefone_fixo VARCHAR(50) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS bi_cc VARCHAR(50) NULL;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sistema_saude VARCHAR(100) NULL;

-- Processos
ALTER TABLE processos ADD COLUMN IF NOT EXISTS anulado TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE processos ADD COLUMN IF NOT EXISTS motivo_anulacao VARCHAR(255) NULL;

-- Gravidez / info clínica
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS medico_nome VARCHAR(255) NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS onde_seguida VARCHAR(255) NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS semanas_actual INT NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS dias_actual INT NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS data_prevista_parto DATE NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS fertilizacao VARCHAR(100) NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS gravidez_singular TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS gravidez_gemelar TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS servico_expresso TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS motivo_idade_avancada TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS motivo_ansiedade TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS motivo_rastreio TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS motivo_anomalia_eco TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS motivo_gravidez_anterior TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS id_order VARCHAR(100) NULL;
ALTER TABLE informacao_clinica ADD COLUMN IF NOT EXISTS id_paciente_clinico VARCHAR(100) NULL;

-- Colheita
ALTER TABLE colheitas ADD COLUMN IF NOT EXISTS facturado_entidade TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE colheitas ADD COLUMN IF NOT EXISTS repeticao TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE colheitas ADD COLUMN IF NOT EXISTS nao_notificar TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE colheitas ADD COLUMN IF NOT EXISTS semanas_gestacao_colheita INT NULL;
ALTER TABLE colheitas ADD COLUMN IF NOT EXISTS dias_gestacao_colheita INT NULL;
ALTER TABLE colheitas ADD COLUMN IF NOT EXISTS data_recepcao_amostra DATETIME NULL;

-- Faturação
ALTER TABLE facturacao ADD COLUMN IF NOT EXISTS valor_factura DECIMAL(10,2) NULL;
ALTER TABLE facturacao ADD COLUMN IF NOT EXISTS pago TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE facturacao ADD COLUMN IF NOT EXISTS nao_gera_comissao TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE facturacao ADD COLUMN IF NOT EXISTS data_envio_email DATETIME NULL;
ALTER TABLE facturacao ADD COLUMN IF NOT EXISTS data_envio_sms DATETIME NULL;

-- Kit do processo
CREATE TABLE IF NOT EXISTS processo_kits (
  id VARCHAR(36) PRIMARY KEY,
  processo_id VARCHAR(36) NOT NULL UNIQUE,
  lote VARCHAR(50) NULL,
  data_expiracao VARCHAR(7) NULL,
  empresa_kit VARCHAR(255) NULL,
  localizacao_kit VARCHAR(255) NULL,
  numero_kit VARCHAR(100) NULL,
  tracking_number VARCHAR(100) NULL,
  FOREIGN KEY (processo_id) REFERENCES processos(id)
);

-- Resultados clínicos
CREATE TABLE IF NOT EXISTS resultados_clinicos (
  id VARCHAR(36) PRIMARY KEY,
  processo_id VARCHAR(36) NOT NULL UNIQUE,
  data_envio_laboratorio DATETIME NULL,
  data_recepcao_laboratorio DATETIME NULL,
  data_relatorio_laboratorio DATETIME NULL,
  id_amostra VARCHAR(100) NULL,
  resultado_cromossomas_sexuais VARCHAR(50) NULL,
  cromossomas_sexuais VARCHAR(50) NULL,
  fraccao_fetal DECIMAL(5,2) NULL,
  sugerir_repeticao TINYINT(1) NOT NULL DEFAULT 0,
  resultados_cromossomas JSON NULL,
  FOREIGN KEY (processo_id) REFERENCES processos(id)
);

-- Stocks — localização
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS localizacao VARCHAR(50) NOT NULL DEFAULT 'Armazem';
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS laboratorio_nome VARCHAR(255) NULL;
