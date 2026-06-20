const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.findByProcesso = async (processoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, processo_id, template, pdf_url, data_geracao, estado_envio, observacoes
       FROM processo_relatorios
       WHERE processo_id = ?
       ORDER BY data_geracao DESC`,
      [processoId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, processo_id, template, pdf_url, data_geracao, estado_envio, observacoes
       FROM processo_relatorios
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.create = async ({ processoId, template, pdfUrl, observacoes }) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.execute(
      `INSERT INTO processo_relatorios (id, processo_id, template, pdf_url, estado_envio, observacoes)
       VALUES (?, ?, ?, ?, 'Pendente', ?)`,
      [id, processoId, template || 'genoma-default', pdfUrl, observacoes || null]
    );
    return { id, processo_id: processoId, template, pdf_url: pdfUrl, estado_envio: 'Pendente' };
  } finally {
    connection.release();
  }
};

exports.updateEstadoEnvio = async (id, estadoEnvio, observacoes) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      `UPDATE processo_relatorios
         SET estado_envio = ?, observacoes = COALESCE(?, observacoes)
       WHERE id = ?`,
      [estadoEnvio, observacoes || null, id]
    );
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};
