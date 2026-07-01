const pool = require('../config/database');

/**
 * Repositorio de apoio ao modulo Listagens (centro de reporting).
 * Apenas consultas de leitura agregada que nao existem nos repositorios de
 * dominio (pacientes/medicos com volume de processos). As restantes listagens
 * reutilizam os servicos/repositorios ja existentes.
 */

exports.pacientesComVolume = async (empresaId = null) => {
  const connection = await pool.getConnection();
  try {
    const where = empresaId
      ? 'WHERE p.ativo = TRUE AND EXISTS (SELECT 1 FROM processos pr WHERE pr.paciente_id = p.id AND pr.empresa_id = ?)'
      : 'WHERE p.ativo = TRUE';
    const params = empresaId ? [empresaId] : [];
    const [rows] = await connection.execute(
      `SELECT p.id, p.nome, p.nif, p.telemovel, p.email, p.genero, p.data_nascimento, p.created_at,
              (SELECT COUNT(*) FROM processos pr WHERE pr.paciente_id = p.id) AS processos_total
       FROM pacientes p
       ${where}
       ORDER BY p.nome ASC`,
      params
    );
    return rows;
  } finally {
    connection.release();
  }
};

/** Datas de movimentos de kit agregadas por processo (colheita, envio lab). */
exports.movimentoDatesByProcesso = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT pr.id AS processo_id, mk.motivo, MIN(mk.data) AS data
      FROM processos pr
      INNER JOIN movimentos_kits mk ON mk.processo_id = pr.id OR mk.kit_id = pr.kit_id
      WHERE mk.motivo IN ('ConsumoColheita', 'EnvioLabFinal', 'Descarte')
      GROUP BY pr.id, mk.motivo
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.medicosComVolume = async (empresaId = null) => {
  const connection = await pool.getConnection();
  try {
    const where = empresaId
      ? 'WHERE u.ativo = 1 AND (m.ativo IS NULL OR m.ativo = 1) AND EXISTS (SELECT 1 FROM processos pr WHERE pr.medico_id = m.utilizador_id AND pr.empresa_id = ?)'
      : 'WHERE u.ativo = 1 AND (m.ativo IS NULL OR m.ativo = 1)';
    const params = empresaId ? [empresaId] : [];
    const [rows] = await connection.execute(
      `SELECT m.utilizador_id AS id, m.num_ordem, m.especialidade, m.titulo,
              u.nome, u.email, u.telefone, u.ativo,
              (SELECT COUNT(*) FROM processos pr WHERE pr.medico_id = m.utilizador_id) AS processos_total
       FROM medicos m
       JOIN utilizadores u ON m.utilizador_id = u.id
       ${where}
       ORDER BY u.nome ASC`,
      params
    );
    return rows;
  } finally {
    connection.release();
  }
};

/** Todos os médicos activos — usado na pesquisa global (sem filtro por volume de processos). */
exports.medicosParaPesquisa = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT m.utilizador_id AS id, m.num_ordem, m.especialidade, m.titulo,
              u.nome, u.email, u.telefone, u.ativo,
              (SELECT COUNT(*) FROM processos pr WHERE pr.medico_id = m.utilizador_id) AS processos_total
       FROM medicos m
       JOIN utilizadores u ON m.utilizador_id = u.id
       WHERE u.ativo = 1 AND (m.ativo IS NULL OR m.ativo = 1)
       ORDER BY u.nome ASC`
    );
    return rows;
  } finally {
    connection.release();
  }
};
