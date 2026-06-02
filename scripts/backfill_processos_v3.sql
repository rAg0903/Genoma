-- Cria kit + resultados para processos antigos sem estes registos
USE genoma_db;

INSERT INTO processo_kits (id, processo_id, numero_kit, tracking_number, localizacao_kit)
SELECT UUID(), p.id, p.numero_processo, p.numero_processo, 'Armazém Genoma'
FROM processos p
LEFT JOIN processo_kits pk ON pk.processo_id = p.id
WHERE pk.id IS NULL AND p.ativo = 1;

INSERT INTO resultados_clinicos (id, processo_id, sem_anomalias)
SELECT UUID(), p.id, 1
FROM processos p
LEFT JOIN resultados_clinicos rc ON rc.processo_id = p.id
WHERE rc.id IS NULL AND p.ativo = 1;
