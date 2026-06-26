const pool = require('../config/database');

exports.findAll = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, nome, ativo, contexto, reabre_contacto FROM motivos_anulacao ORDER BY contexto ASC, nome ASC'
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
      'SELECT id, nome, ativo, contexto, reabre_contacto FROM motivos_anulacao WHERE id = ? LIMIT 1',
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
      'SELECT id, nome, ativo, contexto, reabre_contacto FROM motivos_anulacao WHERE nome = ? LIMIT 1',
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

    const contexto = data.contexto === 'processo' ? 'processo' : 'contacto';
    const reabreContacto = contexto === 'processo' && !!data.reabre_contacto;

    await connection.execute(
      'INSERT INTO motivos_anulacao (id, nome, ativo, contexto, reabre_contacto) VALUES (?, ?, ?, ?, ?)',
      [id, nome, ativo, contexto, reabreContacto]
    );

    return { id, nome, ativo, contexto, reabre_contacto: reabreContacto };
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
    if (data.ativo !== undefined) {
      updates.push('ativo = ?');
      values.push(!!data.ativo);
    }
    if (data.contexto !== undefined) {
      updates.push('contexto = ?');
      values.push(data.contexto === 'processo' ? 'processo' : 'contacto');
    }
    if (data.reabre_contacto !== undefined) {
      updates.push('reabre_contacto = ?');
      values.push(!!data.reabre_contacto);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await connection.execute(
      `UPDATE motivos_anulacao SET ${updates.join(', ')} WHERE id = ?`,
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
    const [result] = await connection.execute('DELETE FROM motivos_anulacao WHERE id = ?', [id]);
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};
