const pool = require('../config/database');

const DEFAULT_ID = '00000000-0000-0000-0000-000000000001';

exports.DEFAULT_ID = DEFAULT_ID;

exports.find = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, clinica_nome, clinica_morada, clinica_codigo_postal, clinica_telefone, clinica_email, updated_at, updated_by
       FROM configuracao_sistema
       WHERE id = ?
       LIMIT 1`,
      [DEFAULT_ID],
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.upsert = async (data) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `INSERT INTO configuracao_sistema
        (id, clinica_nome, clinica_morada, clinica_codigo_postal, clinica_telefone, clinica_email, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         clinica_nome = VALUES(clinica_nome),
         clinica_morada = VALUES(clinica_morada),
         clinica_codigo_postal = VALUES(clinica_codigo_postal),
         clinica_telefone = VALUES(clinica_telefone),
         clinica_email = VALUES(clinica_email),
         updated_by = VALUES(updated_by)`,
      [
        DEFAULT_ID,
        data.clinica_nome || 'GENOMA',
        data.clinica_morada || null,
        data.clinica_codigo_postal || null,
        data.clinica_telefone || null,
        data.clinica_email || null,
        data.updated_by || null,
      ],
    );
    return exports.find();
  } finally {
    connection.release();
  }
};
