const pool = require('../config/database');

exports.findAll = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, nome, descricao, ativo FROM tipos_kit ORDER BY nome ASC'
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
      'SELECT id, nome, descricao, ativo FROM tipos_kit WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findByNome = async (nome) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, nome, descricao, ativo FROM tipos_kit WHERE nome = ? LIMIT 1',
      [nome.trim()]
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
    const nome = String(data.nome || '').trim();
    const ativo = data.ativo === undefined || data.ativo === null ? true : !!data.ativo;
    const descricao = data.descricao !== undefined && data.descricao !== null
      ? String(data.descricao).trim() || null
      : null;

    await connection.execute(
      'INSERT INTO tipos_kit (id, nome, descricao, ativo) VALUES (?, ?, ?, ?)',
      [id, nome, descricao, ativo]
    );

    return { id, nome, descricao, ativo };
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    const updates = [];
    const values = [];

    if (data.nome !== undefined) {
      updates.push('nome = ?');
      values.push(String(data.nome).trim());
    }
    if (data.descricao !== undefined) {
      updates.push('descricao = ?');
      values.push(data.descricao === null || data.descricao === '' ? null : String(data.descricao).trim());
    }
    if (data.ativo !== undefined) {
      updates.push('ativo = ?');
      values.push(!!data.ativo);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await connection.execute(
      `UPDATE tipos_kit SET ${updates.join(', ')} WHERE id = ?`,
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
    const [result] = await connection.execute('DELETE FROM tipos_kit WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.countReferencias = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT
        (SELECT COUNT(*) FROM lotes WHERE tipo_kit_id = ?) +
        (SELECT COUNT(*) FROM kits WHERE tipo_kit_id = ?) AS total`,
      [id, id]
    );
    return Number(rows[0]?.total || 0);
  } finally {
    connection.release();
  }
};
