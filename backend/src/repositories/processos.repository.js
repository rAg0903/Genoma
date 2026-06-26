const pool = require('../config/database');

const baseSelect = `
  SELECT pr.*,
         pr.status_id AS status,
         pr.observacoes AS notas_clinicas,
         p.nome AS paciente_nome,
         p.email AS paciente_email,
         p.telemovel AS paciente_telemovel,
         p.data_nascimento AS paciente_data_nascimento,
         u.nome AS medico_nome,
         u.email AS medico_email,
         t.nome AS sub_teste_nome,
         t.teste_pai_id,
         tp.nome AS teste_pai_nome,
         CASE
           WHEN tp.id IS NOT NULL THEN CONCAT(tp.nome, ' — ', t.nome)
           ELSE t.nome
         END AS teste_nome,
         t.tempo_resposta_dias,
         e.nome AS empresa_nome,
         k.codigo_barras AS kit_codigo
  FROM processos pr
  JOIN pacientes p ON pr.paciente_id = p.id
  JOIN medicos m ON pr.medico_id = m.utilizador_id
  JOIN utilizadores u ON m.utilizador_id = u.id
  LEFT JOIN testes t ON pr.teste_id = t.id
  LEFT JOIN testes tp ON t.teste_pai_id = tp.id
  LEFT JOIN empresas e ON pr.empresa_id = e.id
  LEFT JOIN kits k ON pr.kit_id = k.id
`;

exports.findAll = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      ${baseSelect}
      ORDER BY pr.data_entrada DESC
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      ${baseSelect}
      WHERE pr.id = ?
    `, [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findByPaciente = async (pacienteId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      ${baseSelect}
      WHERE pr.paciente_id = ?
      ORDER BY pr.data_entrada DESC
    `, [pacienteId]);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findByMedico = async (medicoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      ${baseSelect}
      WHERE pr.medico_id = ?
      ORDER BY pr.data_entrada DESC
    `, [medicoId]);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findByEmpresa = async (empresaId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      ${baseSelect}
      WHERE pr.empresa_id = ?
      ORDER BY pr.data_entrada DESC
    `, [empresaId]);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findByNumero = async (numero) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, numero_processo FROM processos WHERE numero_processo = ? LIMIT 1',
      [numero]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.generateNumeroProcesso = async () => {
  const connection = await pool.getConnection();
  try {
    const year = new Date().getFullYear();
    const prefix = `P-${year}-`;
    const [rows] = await connection.execute(
      `SELECT numero_processo FROM processos
       WHERE numero_processo LIKE ?
       ORDER BY numero_processo DESC
       LIMIT 1`,
      [`${prefix}%`]
    );

    let next = 1;
    if (rows[0]?.numero_processo) {
      const seq = parseInt(String(rows[0].numero_processo).slice(prefix.length), 10);
      if (!Number.isNaN(seq)) next = seq + 1;
    }

    return `${prefix}${String(next).padStart(5, '0')}`;
  } finally {
    connection.release();
  }
};

exports.findByKitCodigo = async (kitCodigo) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT pr.id, k.codigo_barras AS kit_codigo, pr.status_id
       FROM processos pr
       JOIN kits k ON pr.kit_id = k.id
       WHERE k.codigo_barras = ?
       LIMIT 1`,
      [kitCodigo]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    await connection.execute(
      `INSERT INTO processos (
        id, numero_processo, paciente_id, medico_id, teste_id, empresa_id,
        posto, posto_id, kit_id, status_id, data_entrada, observacoes,
        data_colheita, data_colheita_prevista, data_chegada_laboratorio, data_resultado, data_validacao, data_envio_relatorio,
        responsavel_fluxo, relatorio_validado, relatorio_enviado_para,
        resultado_tudo_ok, resultado_anomalias, fracao_fetal,
        fatura_emitida, fatura_numero, fatura_data_emissao, valor_base, desconto_percentual, valor_final,
        pagamento_data, recibo_numero, pago
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        id,
        data.numero_processo || null,
        data.paciente_id,
        data.medico_id,
        data.teste_id || null,
        data.empresa_id || null,
        data.posto || null,
        data.posto_id || null,
        data.kit_id || null,
        data.status_id || 'Agendado',
        data.data_entrada || new Date(),
        data.observacoes || null,
        data.data_colheita || null,
        data.data_colheita_prevista || null,
        data.data_chegada_laboratorio || null,
        data.data_resultado || null,
        data.data_validacao || null,
        data.data_envio_relatorio || null,
        data.responsavel_fluxo || null,
        data.relatorio_validado ? 1 : 0,
        data.relatorio_enviado_para || 'Nenhum',
        data.resultado_tudo_ok === false ? 0 : 1,
        data.resultado_anomalias || null,
        data.fracao_fetal || null,
        data.fatura_emitida ? 1 : 0,
        data.fatura_numero || null,
        data.fatura_data_emissao || null,
        data.valor_base || 0,
        data.desconto_percentual || 0,
        data.valor_final || 0,
        data.pagamento_data || null,
        data.recibo_numero || null,
        data.pago ? 1 : 0,
      ]
    );

    return { id, ...data };
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    const updates = [];
    const values = [];

    const setIfDefined = (column, value) => {
      if (value !== undefined) {
        updates.push(`${column} = ?`);
        values.push(value);
      }
    };

    setIfDefined('status_id', data.status_id);
    setIfDefined('medico_id', data.medico_id);
    setIfDefined('teste_id', data.teste_id);
    setIfDefined('data_entrada', data.data_entrada || null);
    setIfDefined('observacoes', data.observacoes);
    if (data.numero_processo !== undefined && data.numero_processo != null && String(data.numero_processo).trim() !== '') {
      setIfDefined('numero_processo', String(data.numero_processo).trim());
    }
    setIfDefined('posto', data.posto || null);
    setIfDefined('posto_id', data.posto_id || null);
    setIfDefined('kit_id', data.kit_id || null);
    setIfDefined('data_colheita', data.data_colheita || null);
    setIfDefined('data_colheita_prevista', data.data_colheita_prevista || null);
    setIfDefined('data_chegada_laboratorio', data.data_chegada_laboratorio || null);
    setIfDefined('data_resultado', data.data_resultado || null);
    setIfDefined('data_validacao', data.data_validacao || null);
    setIfDefined('data_envio_relatorio', data.data_envio_relatorio || null);
    setIfDefined('responsavel_fluxo', data.responsavel_fluxo || null);
    if (data.relatorio_validado !== undefined) setIfDefined('relatorio_validado', data.relatorio_validado ? 1 : 0);
    if (data.relatorio_enviado_para !== undefined) setIfDefined('relatorio_enviado_para', data.relatorio_enviado_para || 'Nenhum');
    if (data.resultado_tudo_ok !== undefined) setIfDefined('resultado_tudo_ok', data.resultado_tudo_ok ? 1 : 0);
    if (data.resultado_anomalias !== undefined) setIfDefined('resultado_anomalias', data.resultado_anomalias || null);
    if (data.fracao_fetal !== undefined) setIfDefined('fracao_fetal', data.fracao_fetal || null);
    if (data.fatura_emitida !== undefined) setIfDefined('fatura_emitida', data.fatura_emitida ? 1 : 0);
    if (data.fatura_numero !== undefined) setIfDefined('fatura_numero', data.fatura_numero || null);
    if (data.fatura_data_emissao !== undefined) setIfDefined('fatura_data_emissao', data.fatura_data_emissao || null);
    if (data.valor_base !== undefined) setIfDefined('valor_base', data.valor_base || 0);
    if (data.desconto_percentual !== undefined) setIfDefined('desconto_percentual', data.desconto_percentual || 0);
    if (data.valor_final !== undefined) setIfDefined('valor_final', data.valor_final || 0);
    if (data.pagamento_data !== undefined) setIfDefined('pagamento_data', data.pagamento_data || null);
    if (data.recibo_numero !== undefined) setIfDefined('recibo_numero', data.recibo_numero || null);
    if (data.pago !== undefined) setIfDefined('pago', data.pago ? 1 : 0);
    if (data.entidade_multibanco !== undefined) setIfDefined('entidade_multibanco', data.entidade_multibanco || null);
    if (data.referencia_multibanco !== undefined) setIfDefined('referencia_multibanco', data.referencia_multibanco || null);
    if (data.nao_gera_comissao !== undefined) setIfDefined('nao_gera_comissao', data.nao_gera_comissao ? 1 : 0);
    if (data.fatura_envio_email !== undefined) setIfDefined('fatura_envio_email', data.fatura_envio_email || null);
    if (data.fatura_envio_sms !== undefined) setIfDefined('fatura_envio_sms', data.fatura_envio_sms || null);

    if (updates.length === 0) return false;

    values.push(id);
    const query = `UPDATE processos SET ${updates.join(', ')} WHERE id = ?`;
    const result = await connection.execute(query, values);

    return result[0].affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.delete = async (id) => {
  const connection = await pool.getConnection();
  try {
    const result = await connection.execute('DELETE FROM processos WHERE id = ?', [id]);
    return result[0].affectedRows > 0;
  } finally {
    connection.release();
  }
};
