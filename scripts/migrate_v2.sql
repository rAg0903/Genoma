-- Genoma v2 — testes nos processos, stocks e anexos
-- Executar: mysql -u root -proot genoma_db < scripts/migrate_v2.sql

USE genoma_db;

ALTER TABLE processos
  ADD COLUMN IF NOT EXISTS teste_id VARCHAR(36) NULL;

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
