const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.findByProcesso = async (processoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, processo_id, cromossoma, resultado_valor, probabilidade, tipo_resultado
       FROM resultados_geneticos
       WHERE processo_id = ?
       ORDER BY tipo_resultado ASC, cromossoma ASC`,
      [processoId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

/**
 * Substitui os resultados geneticos de um processo. No modelo "tudo OK por
 * defeito", apenas as anomalias detetadas sao persistidas; quando nao ha
 * anomalias, a tabela fica vazia para o processo.
 */
exports.replaceForProcesso = async (processoId, anomalias = []) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'DELETE FROM resultados_geneticos WHERE processo_id = ?',
      [processoId]
    );

    if (anomalias.length > 0) {
      const values = anomalias.map((a) => [
        uuidv4(),
        processoId,
        a.cromossoma || null,
        a.resultado_valor || null,
        a.probabilidade || null,
        a.tipo_resultado || 'Cromossoma',
      ]);
      await connection.query(
        `INSERT INTO resultados_geneticos
          (id, processo_id, cromossoma, resultado_valor, probabilidade, tipo_resultado)
         VALUES ?`,
        [values]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
