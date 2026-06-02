-- Genoma v4 — cromossomas por teste + sem anomalias nos resultados
USE genoma_db;

ALTER TABLE testes ADD COLUMN IF NOT EXISTS cromossomas_analisados JSON NULL;
ALTER TABLE resultados_clinicos ADD COLUMN IF NOT EXISTS sem_anomalias TINYINT(1) NOT NULL DEFAULT 1;
