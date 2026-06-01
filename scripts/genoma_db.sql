-- Genoma — schema inicial (MariaDB / MySQL)
-- Executar: mysql -u root -p < scripts/genoma_db.sql

CREATE DATABASE IF NOT EXISTS genoma_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE genoma_db;

CREATE TABLE IF NOT EXISTS empresas (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  morada VARCHAR(500) NULL,
  codigo_postal VARCHAR(20) NULL,
  telefone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS perfis (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS utilizadores (
  id VARCHAR(36) PRIMARY KEY,
  perfil_id VARCHAR(36) NULL,
  empresa_id VARCHAR(36) NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50) NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (perfil_id) REFERENCES perfis(id),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS postos (
  id VARCHAR(36) PRIMARY KEY,
  entidade_id VARCHAR(36) NULL,
  nome VARCHAR(255) NOT NULL,
  codigo_posto VARCHAR(50) NULL,
  localizacao VARCHAR(500) NULL,
  FOREIGN KEY (entidade_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS pacientes (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  genero VARCHAR(20) NULL,
  nif VARCHAR(20) NULL,
  telemovel VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  morada VARCHAR(500) NULL,
  altura DECIMAL(5,2) NULL,
  peso DECIMAL(5,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS testes (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  descricao TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS processos (
  id VARCHAR(36) PRIMARY KEY,
  numero_processo VARCHAR(50) NOT NULL,
  paciente_id VARCHAR(36) NULL,
  medico_id VARCHAR(36) NULL,
  posto_id VARCHAR(36) NULL,
  kit_id VARCHAR(36) NULL,
  teste_id VARCHAR(36) NULL,
  status_id VARCHAR(36) NULL,
  data_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notas TEXT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (posto_id) REFERENCES postos(id)
);

CREATE TABLE IF NOT EXISTS informacao_clinica (
  id VARCHAR(36) PRIMARY KEY,
  processo_id VARCHAR(36) NULL,
  semanas_gravidez INT NULL,
  dias_gravidez INT NULL,
  tipo_gravidez VARCHAR(50) NULL,
  quer_saber_sexo TINYINT(1) NOT NULL DEFAULT 0,
  motivo_prescricao TEXT NULL,
  data_registo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (processo_id) REFERENCES processos(id)
);

CREATE TABLE IF NOT EXISTS colheitas (
  id VARCHAR(36) PRIMARY KEY,
  processo_id VARCHAR(36) NULL,
  posto_id VARCHAR(36) NULL,
  data_prevista DATETIME NULL,
  periodo VARCHAR(50) NULL,
  data_efetiva DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (processo_id) REFERENCES processos(id),
  FOREIGN KEY (posto_id) REFERENCES postos(id)
);

CREATE TABLE IF NOT EXISTS facturacao (
  id VARCHAR(36) PRIMARY KEY,
  processo_id VARCHAR(36) NULL,
  preco_teste DECIMAL(10,2) NOT NULL DEFAULT 0,
  numero_fatura VARCHAR(50) NULL,
  data_fatura DATETIME NULL,
  entidade_multibanco VARCHAR(10) NULL,
  referencia_multibanco VARCHAR(20) NULL,
  comissao TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (processo_id) REFERENCES processos(id)
);

CREATE TABLE IF NOT EXISTS assets_resultados (
  id VARCHAR(36) PRIMARY KEY,
  processo_id VARCHAR(36) NULL,
  url_ficheiro VARCHAR(500) NOT NULL,
  tipo_ficheiro VARCHAR(20) NOT NULL DEFAULT 'PDF',
  data_upload DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (processo_id) REFERENCES processos(id)
);

CREATE TABLE IF NOT EXISTS stocks (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  quantidade INT NOT NULL DEFAULT 0,
  quantidade_minima INT NOT NULL DEFAULT 5,
  teste_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (teste_id) REFERENCES testes(id)
);

-- Dados de exemplo para testar Contactos
INSERT INTO pacientes (id, nome, data_nascimento, genero, nif, telemovel, email, created_at, ativo)
VALUES
  ('p001', 'Ana Silva', '1990-05-12', 'F', '123456789', '912345678', 'ana.silva@email.pt', NOW(), 1),
  ('p002', 'Maria Costa', '1985-11-03', 'F', '987654321', '923456789', 'maria.costa@email.pt', NOW(), 1),
  ('p003', 'Joana Ferreira', '1992-08-20', 'F', '456789123', '934567890', 'joana.f@email.pt', NOW(), 1)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
