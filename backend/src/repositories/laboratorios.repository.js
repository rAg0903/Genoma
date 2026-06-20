const pool = require('../config/database');

const COLUMNS = [
  'nome', 'codigo', 'morada', 'codigo_postal', 'cidade',
  'distrito', 'pais', 'contacto', 'email', 'notas', 'ativo', 'tipo',
];

exports.findAll = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM laboratorios ORDER BY nome ASC');
    return rows;
  } finally {
    connection.release();
  }
};

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM laboratorios WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findByCodigo = async (codigo) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM laboratorios WHERE codigo = ? LIMIT 1', [codigo]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.countTestesComLabFinal = async (labId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM testes WHERE laboratorio_processamento_id = ?',
      [labId],
    );
    return rows[0]?.count || 0;
  } finally {
    connection.release();
  }
};

exports.countPostosAssociados = async (labId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) AS count FROM postos WHERE laboratorio_id = ?',
      [labId],
    );
    return rows[0]?.count || 0;
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
      `INSERT INTO laboratorios
        (id, nome, codigo, morada, codigo_postal, cidade, distrito, pais, contacto, email, notas, ativo, tipo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.nome,
        data.codigo || null,
        data.morada || null,
        data.codigo_postal || null,
        data.cidade || null,
        data.distrito || null,
        data.pais || null,
        data.contacto || null,
        data.email || null,
        data.notas || null,
        data.ativo === undefined ? true : !!data.ativo,
        data.tipo === 'final' ? 'final' : 'operacional',
      ]
    );
    return { id };
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    const sets = [];
    const params = [];
    COLUMNS.forEach((key) => {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    if (sets.length === 0) return false;
    params.push(id);
    const [res] = await connection.execute(`UPDATE laboratorios SET ${sets.join(', ')} WHERE id = ?`, params);
    return res.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.delete = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [res] = await connection.execute('DELETE FROM laboratorios WHERE id = ?', [id]);
    return res.affectedRows > 0;
  } finally {
    connection.release();
  }
};
