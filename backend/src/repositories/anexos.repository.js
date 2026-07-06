const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, paciente_id, processo_id, tipo, titulo, descricao, url, created_at
       FROM anexos
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findByPaciente = async (pacienteId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, paciente_id, processo_id, tipo, titulo, descricao, url, created_at
       FROM anexos
       WHERE paciente_id = ?
       ORDER BY created_at DESC`,
      [pacienteId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.findByProcesso = async (processoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, paciente_id, processo_id, tipo, titulo, descricao, url, created_at
       FROM anexos
       WHERE processo_id = ?
       ORDER BY created_at DESC`,
      [processoId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.execute(
      `INSERT INTO anexos (id, paciente_id, processo_id, tipo, titulo, descricao, url, utilizador_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.paciente_id || null,
        data.processo_id || null,
        data.tipo || 'Documento',
        data.titulo,
        data.descricao || null,
        data.url || null,
        data.utilizador_id || null,
      ]
    );
    return { id, ...data, created_at: new Date() };
  } finally {
    connection.release();
  }
};

exports.delete = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [res] = await connection.execute('DELETE FROM anexos WHERE id = ?', [id]);
    return res.affectedRows > 0;
  } finally {
    connection.release();
  }
};
