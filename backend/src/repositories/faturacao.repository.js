const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.findByProcesso = async (processoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, processo_id, preco_teste, numero_fatura, data_fatura,
              entidade_multibanco, referencia_multibanco, comissao, created_at, updated_at
       FROM facturacao
       WHERE processo_id = ?
       ORDER BY created_at DESC`,
      [processoId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

/**
 * Calcula o proximo numero sequencial de fatura para o ano (FAT-YYYY-####).
 */
exports.getNextSequence = async (ano) => {
  const connection = await pool.getConnection();
  try {
    const prefix = `FAT-${ano}-`;
    const [rows] = await connection.execute(
      `SELECT MAX(CAST(SUBSTRING_INDEX(numero_fatura, '-', -1) AS UNSIGNED)) AS max_seq
       FROM facturacao
       WHERE numero_fatura LIKE ?`,
      [`${prefix}%`]
    );
    return Number(rows[0]?.max_seq || 0) + 1;
  } finally {
    connection.release();
  }
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    await connection.execute(
      `INSERT INTO facturacao
        (id, processo_id, preco_teste, numero_fatura, data_fatura,
         entidade_multibanco, referencia_multibanco, comissao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.processo_id,
        data.preco_teste || 0,
        data.numero_fatura,
        data.data_fatura || null,
        data.entidade_multibanco || null,
        data.referencia_multibanco || null,
        data.comissao ? 1 : 0,
      ]
    );
    return { id, ...data };
  } finally {
    connection.release();
  }
};
