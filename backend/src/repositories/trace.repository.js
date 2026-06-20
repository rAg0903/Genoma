const pool = require('../config/database');

exports.kitById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT k.id, k.codigo_barras, k.status, k.lote_id, l.codigo_lote
       FROM kits k LEFT JOIN lotes l ON l.id = k.lote_id
       WHERE k.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.loteById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT id, codigo_lote FROM lotes WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.kitsByLote = async (loteId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, codigo_barras, status FROM kits WHERE lote_id = ? ORDER BY codigo_barras ASC',
      [loteId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.processoByKitId = async (kitId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, numero_processo, status_id, kit_id, data_colheita, data_resultado, data_validacao
       FROM processos WHERE kit_id = ? LIMIT 1`,
      [kitId]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.processoById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, numero_processo, status_id, kit_id, data_colheita, data_resultado, data_validacao
       FROM processos WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.movimentosByKit = async (kitId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT data, motivo, origem, destino FROM movimentos_kits WHERE kit_id = ? ORDER BY data ASC',
      [kitId]
    );
    return rows;
  } finally {
    connection.release();
  }
};
