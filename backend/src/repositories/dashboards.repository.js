const pool = require('../config/database');

const queryAll = async (sql, params = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

const queryOne = async (sql, params = []) => {
  const rows = await queryAll(sql, params);
  return rows[0] || {};
};

// ---------- Operacional ----------
exports.processosPorEstado = () =>
  queryAll(`SELECT status_id AS estado, COUNT(*) AS total FROM processos GROUP BY status_id`);

exports.contadoresOperacionais = () =>
  queryOne(`
    SELECT
      (SELECT COUNT(*) FROM processos WHERE status_id NOT IN ('Faturado','Cancelado')) AS processos_ativos,
      (SELECT COUNT(*) FROM colheitas WHERE data_prevista = CURDATE()) AS colheitas_hoje,
      (SELECT COUNT(*) FROM colheitas WHERE data_prevista BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS colheitas_semana,
      (SELECT COUNT(*) FROM kits WHERE status = 'Disponivel') AS kits_disponiveis,
      (SELECT COUNT(*) FROM processos WHERE status_id = 'Resultado Disponivel') AS por_validar,
      (SELECT COUNT(*) FROM processos WHERE status_id = 'Resultado Disponivel') AS resultados_pendentes,
      (SELECT COUNT(*) FROM lotes WHERE estado = 'Disponivel') AS lotes_ativos,
      (SELECT COALESCE(SUM(valor_final),0) FROM processos
        WHERE fatura_emitida = 1 AND YEAR(fatura_data_emissao) = YEAR(CURDATE()) AND MONTH(fatura_data_emissao) = MONTH(CURDATE())) AS faturacao_mes
  `);

exports.processosParados = (dias = 7) =>
  queryOne(
    `SELECT COUNT(*) AS total
     FROM processos
     WHERE status_id NOT IN ('Faturado','Cancelado','Validado')
       AND data_entrada < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [dias]
  );

exports.requisicoesPendentes = () =>
  queryOne(`SELECT COUNT(*) AS total FROM requisicoes_kits WHERE status = 'Pendente'`);

// Resultados em atraso (SLA): processos no laboratório/análise cujo prazo de
// resposta do teste (tempo_resposta_dias, fallback 15 dias) já foi ultrapassado
// desde a chegada ao laboratório e ainda sem resultado.
exports.resultadosEmAtraso = (slaDefault = 15) =>
  queryOne(
    `SELECT COUNT(*) AS total
     FROM processos pr
     LEFT JOIN testes t ON t.id = pr.teste_id
     WHERE pr.status_id IN ('Enviado Laboratorio','Em Analise')
       AND pr.data_resultado IS NULL
       AND pr.data_chegada_laboratorio IS NOT NULL
       AND DATEDIFF(CURDATE(), pr.data_chegada_laboratorio) > COALESCE(t.tempo_resposta_dias, ?)`,
    [slaDefault]
  );

// Faturas em falta: validadas mas ainda não emitidas, e emitidas mas não pagas.
exports.faturasEmFalta = () =>
  queryOne(`
    SELECT
      (SELECT COUNT(*) FROM processos WHERE status_id = 'Validado' AND (fatura_emitida = 0 OR fatura_emitida IS NULL)) AS nao_emitidas,
      (SELECT COUNT(*) FROM processos WHERE fatura_emitida = 1 AND (pago = 0 OR pago IS NULL) AND pagamento_data IS NULL) AS nao_pagas
  `);

exports.totalContactos = () =>
  queryOne(`SELECT COUNT(*) AS total FROM pacientes WHERE ativo = TRUE`);

// ---------- Financeiro ----------
exports.contadoresFinanceiros = () =>
  queryOne(`
    SELECT
      (SELECT COALESCE(SUM(valor_final),0) FROM processos
        WHERE fatura_emitida = 1 AND YEAR(fatura_data_emissao) = YEAR(CURDATE()) AND MONTH(fatura_data_emissao) = MONTH(CURDATE())) AS faturacao_mes,
      (SELECT COALESCE(SUM(valor_final),0) FROM processos
        WHERE fatura_emitida = 1 AND pagamento_data IS NULL) AS pendente_recebimento,
      (SELECT COALESCE(SUM(valor_final),0) FROM processos
        WHERE fatura_emitida = 1 AND pagamento_data IS NOT NULL) AS recebido_total,
      (SELECT COALESCE(AVG(valor_final),0) FROM processos WHERE fatura_emitida = 1) AS ticket_medio,
      (SELECT COUNT(*) FROM processos WHERE fatura_emitida = 1 AND pagamento_data IS NULL) AS faturas_por_pagar
  `);

exports.receitaPorMes = (meses = 6) =>
  queryAll(
    `SELECT DATE_FORMAT(fatura_data_emissao, '%Y-%m') AS mes,
            COALESCE(SUM(valor_final),0) AS total
     FROM processos
     WHERE fatura_emitida = 1
       AND fatura_data_emissao >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
     GROUP BY mes
     ORDER BY mes ASC`,
    [meses]
  );

exports.receitaPorMedico = (limite = 5) =>
  queryAll(
    `SELECT u.nome AS medico, COALESCE(SUM(pr.valor_final),0) AS total, COUNT(*) AS processos
     FROM processos pr
     JOIN medicos m ON pr.medico_id = m.utilizador_id
     JOIN utilizadores u ON u.id = m.utilizador_id
     WHERE pr.fatura_emitida = 1
     GROUP BY pr.medico_id, u.nome
     ORDER BY total DESC
     LIMIT ?`,
    [limite]
  );

// ---------- Laboratorial ----------
exports.contadoresLaboratoriais = () =>
  queryOne(`
    SELECT
      (SELECT COUNT(*) FROM processos WHERE status_id IN ('Enviado Laboratorio','Em Analise')) AS em_laboratorio,
      (SELECT COUNT(*) FROM processos WHERE status_id = 'Resultado Disponivel') AS resultados_por_validar,
      (SELECT COALESCE(AVG(DATEDIFF(data_resultado, data_colheita)),0)
        FROM processos WHERE data_resultado IS NOT NULL AND data_colheita IS NOT NULL) AS tat_medio_dias,
      (SELECT COUNT(*) FROM processos WHERE data_resultado IS NOT NULL) AS total_com_resultado,
      (SELECT COUNT(*) FROM processos WHERE data_resultado IS NOT NULL AND resultado_tudo_ok = 0) AS com_anomalias
  `);

exports.kitsAExpirar = (dias = 30) =>
  queryOne(
    `SELECT
       (SELECT COUNT(*) FROM kits WHERE status = 'Expirado') AS expirados,
       (SELECT COUNT(*) FROM kits
         WHERE status = 'Disponivel' AND data_validade IS NOT NULL
           AND data_validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)) AS a_expirar`,
    [dias]
  );

exports.anomaliasPorCromossoma = () =>
  queryAll(
    `SELECT cromossoma, COUNT(*) AS total
     FROM resultados_geneticos
     GROUP BY cromossoma
     ORDER BY total DESC`
  );

// ---------- Executivo ----------
exports.contadoresExecutivos = () =>
  queryOne(`
    SELECT
      (SELECT COUNT(*) FROM processos) AS total_processos,
      (SELECT COUNT(*) FROM processos WHERE MONTH(data_entrada) = MONTH(CURDATE()) AND YEAR(data_entrada) = YEAR(CURDATE())) AS processos_mes,
      (SELECT COUNT(DISTINCT medico_id) FROM processos WHERE data_entrada >= DATE_SUB(NOW(), INTERVAL 90 DAY)) AS medicos_ativos,
      (SELECT COALESCE(SUM(valor_final),0) FROM processos WHERE fatura_emitida = 1) AS receita_total
  `);

exports.mixDeServicos = () =>
  queryAll(
    `SELECT t.nome AS teste, COUNT(*) AS total
     FROM processos pr
     JOIN testes t ON t.id = pr.teste_id
     GROUP BY pr.teste_id, t.nome
     ORDER BY total DESC`
  );

exports.processosPorMes = (meses = 12) =>
  queryAll(
    `SELECT DATE_FORMAT(data_entrada, '%Y-%m') AS mes, COUNT(*) AS total
     FROM processos
     WHERE data_entrada >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ? MONTH)
     GROUP BY mes
     ORDER BY mes ASC`,
    [meses]
  );
