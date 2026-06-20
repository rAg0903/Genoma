const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const SELECT_BASE = `
  SELECT l.id, l.titulo, l.descricao, l.estado, l.prioridade, l.data_limite,
         l.paciente_id, l.processo_id, l.criado_por, l.atribuido_a,
         l.completed_at, l.created_at,
         p.nome AS paciente_nome,
         pr.numero_processo AS processo_numero
  FROM lembretes l
  LEFT JOIN pacientes p ON p.id = l.paciente_id
  LEFT JOIN processos pr ON pr.id = l.processo_id
`;

exports.findAll = async ({ estado } = {}) => {
  const connection = await pool.getConnection();
  try {
    const where = [];
    const params = [];
    if (estado) {
      where.push('l.estado = ?');
      params.push(estado);
    }
    const sql = `${SELECT_BASE}
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY (l.estado = 'Concluido') ASC,
               FIELD(l.prioridade, 'Alta', 'Normal', 'Baixa'),
               (l.data_limite IS NULL) ASC, l.data_limite ASC,
               l.created_at DESC`;
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`${SELECT_BASE} WHERE l.id = ?`, [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.execute(
      `INSERT INTO lembretes
        (id, titulo, descricao, estado, prioridade, data_limite, paciente_id, processo_id, criado_por, atribuido_a)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.titulo,
        data.descricao || null,
        data.estado || 'Pendente',
        data.prioridade || 'Normal',
        data.data_limite || null,
        data.paciente_id || null,
        data.processo_id || null,
        data.criado_por || null,
        data.atribuido_a || null,
      ]
    );
    return exports.findById(id);
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    const updates = [];
    const values = [];
    const fields = ['titulo', 'descricao', 'estado', 'prioridade', 'data_limite', 'paciente_id', 'processo_id', 'atribuido_a', 'completed_at'];
    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (updates.length === 0) return false;
    values.push(id);
    const [result] = await connection.execute(
      `UPDATE lembretes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.delete = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute('DELETE FROM lembretes WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};
