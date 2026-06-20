const pool = require('../config/database');

exports.findLidasByUtilizador = async (utilizadorId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT notificacao_id FROM notificacoes_lidas WHERE utilizador_id = ?',
      [utilizadorId]
    );
    return new Set(rows.map((r) => r.notificacao_id));
  } finally {
    connection.release();
  }
};

exports.markRead = async (utilizadorId, notificacaoId) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `INSERT IGNORE INTO notificacoes_lidas (utilizador_id, notificacao_id) VALUES (?, ?)`,
      [utilizadorId, notificacaoId]
    );
    return true;
  } finally {
    connection.release();
  }
};

exports.markAllRead = async (utilizadorId, notificacaoIds) => {
  if (!notificacaoIds.length) return 0;
  const connection = await pool.getConnection();
  try {
    const placeholders = notificacaoIds.map(() => '(?, ?)').join(', ');
    const values = notificacaoIds.flatMap((id) => [utilizadorId, id]);
    const [result] = await connection.execute(
      `INSERT IGNORE INTO notificacoes_lidas (utilizador_id, notificacao_id) VALUES ${placeholders}`,
      values
    );
    return result.affectedRows || 0;
  } finally {
    connection.release();
  }
};

exports.findLembretesPendentes = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT l.id, l.titulo, l.descricao, l.prioridade, l.data_limite, l.created_at,
             pr.numero_processo AS processo_numero
      FROM lembretes l
      LEFT JOIN processos pr ON pr.id = l.processo_id
      WHERE l.estado = 'Pendente'
      ORDER BY FIELD(l.prioridade, 'Alta', 'Normal', 'Baixa'),
               (l.data_limite IS NULL) ASC, l.data_limite ASC,
               l.created_at DESC
      LIMIT 30
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findProcessosComResultado = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT pr.id, pr.numero_processo, pr.status_id AS status, pr.data_entrada,
             p.nome AS paciente_nome
      FROM processos pr
      JOIN pacientes p ON p.id = pr.paciente_id
      WHERE pr.status_id IN ('Resultado Disponivel', 'Validado')
      ORDER BY pr.data_entrada DESC
      LIMIT 25
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findKitsExpirados = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT k.id, k.codigo_barras, k.data_validade, k.localizacao
      FROM kits k
      WHERE k.status NOT IN ('Utilizado', 'Perdido')
        AND (
          k.status = 'Expirado'
          OR (k.data_validade IS NOT NULL AND k.data_validade < CURDATE())
        )
      ORDER BY k.data_validade ASC
      LIMIT 20
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findStockBaixo = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT k.localizacao, COUNT(*) AS total
      FROM kits k
      WHERE k.status = 'Disponivel'
      GROUP BY k.localizacao
      HAVING total < 5
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findLotesAExpirar = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT l.id, l.codigo_lote, MAX(k.data_validade) AS data_validade
      FROM lotes l
      LEFT JOIN kits k ON k.lote_id = l.id
      GROUP BY l.id, l.codigo_lote
      HAVING data_validade IS NOT NULL
         AND data_validade >= CURDATE()
         AND data_validade <= DATE_ADD(CURDATE(), INTERVAL 45 DAY)
      ORDER BY data_validade ASC
      LIMIT 15
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findRequisicoesPendentes = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT r.id, r.data, r.origem, r.destino, r.status,
             COALESCE(r.origem_nome, emp_o.nome, po_o.nome, lab_o.nome) AS origem_nome,
             COALESCE(r.destino_nome, emp_d.nome, po_d.nome, lab_d.nome) AS destino_nome
      FROM requisicoes_kits r
      LEFT JOIN empresas emp_o ON emp_o.id = r.origem_empresa_id
      LEFT JOIN postos po_o ON po_o.id = r.origem_posto_id
      LEFT JOIN laboratorios lab_o ON lab_o.id = r.origem_laboratorio_id
      LEFT JOIN empresas emp_d ON emp_d.id = r.destino_empresa_id
      LEFT JOIN postos po_d ON po_d.id = r.destino_posto_id
      LEFT JOIN laboratorios lab_d ON lab_d.id = r.destino_laboratorio_id
      WHERE r.status IN ('Pendente', 'Em transito')
      ORDER BY r.data ASC
      LIMIT 15
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findAtividadeRecente = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        l.id,
        l.acao,
        l.tabela_afetada,
        l.registro_id,
        l.data,
        u.nome AS utilizador_nome,
        COALESCE(pr.numero_processo, pr_col.numero_processo) AS numero_processo,
        COALESCE(pr.id, pr_col.id) AS processo_id,
        COALESCE(pa_from_processo.nome, pa_direct.nome, pa_col.nome) AS paciente_nome,
        k.codigo_barras AS kit_codigo,
        po.nome AS posto_nome,
        lt.codigo_lote AS lote_codigo,
        rq.origem AS requisicao_origem,
        rq.destino AS requisicao_destino,
        rq.quantidade AS requisicao_quantidade,
        COALESCE(rq.origem_nome, emp_o.nome, po_o.nome, lab_o.nome) AS requisicao_origem_nome,
        COALESCE(rq.destino_nome, emp_d.nome, po_d.nome, lab_d.nome) AS requisicao_destino_nome
      FROM logs_auditoria l
      LEFT JOIN utilizadores u ON u.id = l.utilizador_id
      LEFT JOIN processos pr ON l.tabela_afetada = 'processos' AND pr.id = l.registro_id
      LEFT JOIN pacientes pa_from_processo ON pa_from_processo.id = pr.paciente_id
      LEFT JOIN pacientes pa_direct ON l.tabela_afetada = 'pacientes' AND pa_direct.id = l.registro_id
      LEFT JOIN colheitas c ON l.tabela_afetada = 'colheitas' AND c.id = l.registro_id
      LEFT JOIN processos pr_col ON pr_col.id = c.processo_id
      LEFT JOIN pacientes pa_col ON pa_col.id = pr_col.paciente_id
      LEFT JOIN kits k ON k.id = l.registro_id
        AND l.tabela_afetada IN ('kits', 'postos', 'movimentos_kits')
      LEFT JOIN postos po ON l.tabela_afetada = 'postos'
        AND po.id = l.registro_id
        AND l.acao NOT LIKE '%Kit utilizado%'
      LEFT JOIN lotes lt ON l.tabela_afetada = 'lotes' AND lt.id = l.registro_id
      LEFT JOIN requisicoes_kits rq ON l.tabela_afetada = 'requisicoes_kits' AND rq.id = l.registro_id
      LEFT JOIN empresas emp_o ON emp_o.id = rq.origem_empresa_id
      LEFT JOIN postos po_o ON po_o.id = rq.origem_posto_id
      LEFT JOIN laboratorios lab_o ON lab_o.id = rq.origem_laboratorio_id
      LEFT JOIN empresas emp_d ON emp_d.id = rq.destino_empresa_id
      LEFT JOIN postos po_d ON po_d.id = rq.destino_posto_id
      LEFT JOIN laboratorios lab_d ON lab_d.id = rq.destino_laboratorio_id
      WHERE l.data >= DATE_SUB(NOW(), INTERVAL 14 DAY)
      ORDER BY l.data DESC
      LIMIT 25
    `);
    return rows;
  } finally {
    connection.release();
  }
};
