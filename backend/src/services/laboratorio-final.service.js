const pool = require('../config/database');

const DEFAULT_LAB_CODIGO = process.env.LABORATORIO_DEFAULT_CODIGO || 'FEATUREHEALTH_UK';

let cachedDefaultLabId = null;

const findLabById = async (connection, id, { requireFinal = false } = {}) => {
  if (!id) return null;
  const sql = requireFinal
    ? 'SELECT id, nome, codigo, tipo FROM laboratorios WHERE id = ? AND ativo = 1 AND tipo = \'final\' LIMIT 1'
    : 'SELECT id, nome, codigo, tipo FROM laboratorios WHERE id = ? AND ativo = 1 LIMIT 1';
  const [rows] = await connection.execute(sql, [id]);
  return rows[0] || null;
};

exports.clearDefaultLabCache = () => {
  cachedDefaultLabId = null;
};

exports.getDefaultLaboratorioId = async (connection = null) => {
  if (cachedDefaultLabId) return cachedDefaultLabId;

  const exec = connection
    ? (sql, params) => connection.execute(sql, params)
    : async (sql, params) => {
      const conn = await pool.getConnection();
      try {
        return await conn.execute(sql, params);
      } finally {
        conn.release();
      }
    };

  const [rows] = await exec(
    `SELECT id FROM laboratorios
     WHERE ativo = 1 AND tipo = 'final'
     ORDER BY CASE
       WHEN UPPER(TRIM(codigo)) = ? THEN 0
       WHEN LOWER(TRIM(nome)) LIKE '%featurehealth%' THEN 1
       ELSE 2
     END, nome ASC
     LIMIT 1`,
    [DEFAULT_LAB_CODIGO.toUpperCase()],
  );
  cachedDefaultLabId = rows[0]?.id || null;
  return cachedDefaultLabId;
};

/**
 * Cascata: override → processo.laboratorio_final_id → teste.laboratorio_processamento_id → default final.
 */
exports.resolveLaboratorioFinal = async ({
  connection,
  processoId = null,
  postoId = null,
  testeId = null,
  overrideLaboratorioId = null,
}) => {
  const exec = connection
    ? (sql, params) => connection.execute(sql, params)
    : async (sql, params) => {
      const conn = await pool.getConnection();
      try {
        return await conn.execute(sql, params);
      } finally {
        conn.release();
      }
    };

  const connLike = connection || { execute: exec };

  if (overrideLaboratorioId) {
    const lab = await findLabById(connLike, overrideLaboratorioId, { requireFinal: true });
    if (lab) return lab.id;
  }

  if (processoId) {
    const [procRows] = await exec(
      `SELECT p.laboratorio_final_id, p.teste_id
       FROM processos p
       WHERE p.id = ?
       LIMIT 1`,
      [processoId],
    );
    const proc = procRows[0];
    if (proc?.laboratorio_final_id) {
      const lab = await findLabById(connLike, proc.laboratorio_final_id, { requireFinal: true });
      if (lab) return lab.id;
    }
    if (!testeId && proc?.teste_id) {
      testeId = proc.teste_id;
    }
  }

  if (testeId) {
    const [testeRows] = await exec(
      'SELECT laboratorio_processamento_id FROM testes WHERE id = ? LIMIT 1',
      [testeId],
    );
    const testeLabId = testeRows[0]?.laboratorio_processamento_id;
    if (testeLabId) {
      const lab = await findLabById(connLike, testeLabId, { requireFinal: true });
      if (lab) return lab.id;
    }
  }

  return exports.getDefaultLaboratorioId(connection);
};

exports.resolveLaboratorioFinalForKit = async ({ connection, kitId }) => {
  if (!kitId) return null;

  const exec = connection
    ? (sql, params) => connection.execute(sql, params)
    : async (sql, params) => {
      const conn = await pool.getConnection();
      try {
        return await conn.execute(sql, params);
      } finally {
        conn.release();
      }
    };

  const [rows] = await exec(
    `SELECT p.id AS processo_id, p.teste_id AS processo_teste_id, l.teste_id AS lote_teste_id
     FROM kits k
     LEFT JOIN processos p ON p.kit_id = k.id
     LEFT JOIN lotes l ON l.id = k.lote_id
     WHERE k.id = ?
     LIMIT 1`,
    [kitId],
  );
  const row = rows[0];
  if (!row) return null;

  return exports.resolveLaboratorioFinal({
    connection,
    processoId: row.processo_id || null,
    testeId: row.processo_teste_id || row.lote_teste_id || null,
  });
};

exports.previewLaboratorioFinal = async ({ processoId, postoId, overrideLaboratorioId, testeId }) => {
  const labId = await exports.resolveLaboratorioFinal({
    processoId,
    postoId,
    testeId,
    overrideLaboratorioId,
  });
  if (!labId) return null;

  const conn = await pool.getConnection();
  try {
    const lab = await findLabById(conn, labId);
    return lab ? { id: lab.id, nome: lab.nome, codigo: lab.codigo } : null;
  } finally {
    conn.release();
  }
};

exports.validateFinalLaboratorioId = async (labId) => {
  if (!labId) return null;
  const conn = await pool.getConnection();
  try {
    const lab = await findLabById(conn, labId, { requireFinal: true });
    if (!lab) throw new Error('Selecione um laboratório final válido (tipo final em Administração > Laboratórios)');
    return lab.id;
  } finally {
    conn.release();
  }
};
