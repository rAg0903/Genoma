const pool = require('../config/database');
const kitLifecycleService = require('../services/kit-lifecycle.service');
const { v4: uuidv4 } = require('uuid');

const baseSelect = `
  SELECT
    c.id,
    c.processo_id,
    c.posto_id,
    c.data_prevista,
    c.periodo,
    c.data_efetiva,
    c.created_at,
    pr.numero_processo,
    pr.status_id AS processo_status,
    pr.kit_id,
    k.codigo_barras AS kit_codigo,
    pa.nome AS paciente_nome,
    COALESCE(po.nome, pr.posto) AS posto_nome
  FROM colheitas c
  LEFT JOIN processos pr ON pr.id = c.processo_id
  LEFT JOIN kits k ON k.id = pr.kit_id
  LEFT JOIN pacientes pa ON pa.id = pr.paciente_id
  LEFT JOIN postos po ON po.id = c.posto_id
`;

exports.findAll = async (filters = {}) => {
  const connection = await pool.getConnection();
  try {
    const where = [];
    const params = [];

    if (filters.from) {
      where.push('c.data_prevista >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('c.data_prevista <= ?');
      params.push(filters.to);
    }
    if (filters.posto_id) {
      where.push('c.posto_id = ?');
      params.push(filters.posto_id);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await connection.execute(
      `${baseSelect} ${whereSql} ORDER BY c.data_prevista ASC, c.periodo ASC`,
      params
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.findByProcessoId = async (processoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`${baseSelect} WHERE c.processo_id = ? LIMIT 1`, [processoId]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

/** Snapshots de colheita para enriquecer processos (evita N+1 em listagens). */
exports.findSnapshotsByProcessoIds = async (processoIds = []) => {
  const ids = [...new Set(processoIds.filter(Boolean))];
  if (!ids.length) return [];
  const connection = await pool.getConnection();
  try {
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `${baseSelect} WHERE c.processo_id IN (${placeholders})`,
      ids,
    );
    return rows;
  } finally {
    connection.release();
  }
};

/**
 * Cria registo em colheitas a partir de um processo (sem reserva de kit).
 * Ignora se o processo já tiver colheita associada.
 */
exports.insertSnapshotIfMissing = async ({
  processoId,
  postoId = null,
  dataPrevista = null,
  dataEfetiva = null,
  periodo = null,
}) => {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute(
      'SELECT id FROM colheitas WHERE processo_id = ? LIMIT 1',
      [processoId]
    );
    if (existing.length) return existing[0];

    const colheitaId = uuidv4();
    await connection.execute(
      `INSERT INTO colheitas (id, processo_id, posto_id, data_prevista, periodo, data_efetiva)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        colheitaId,
        processoId,
        postoId || null,
        dataPrevista || null,
        periodo || null,
        dataEfetiva || null,
      ]
    );
    return { id: colheitaId };
  } finally {
    connection.release();
  }
};

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`${baseSelect} WHERE c.id = ?`, [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findPostoById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, nome FROM postos WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.getCalendar = async ({ from, to }) => {
  const connection = await pool.getConnection();
  try {
    const where = [];
    const params = [];
    if (from) {
      where.push('c.data_prevista >= ?');
      params.push(from);
    }
    if (to) {
      where.push('c.data_prevista <= ?');
      params.push(to);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await connection.execute(
      `SELECT c.data_prevista AS dia, COUNT(*) AS total
       FROM colheitas c
       ${whereSql}
       GROUP BY c.data_prevista
       ORDER BY c.data_prevista ASC`,
      params
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.countColheitasNoDia = async (dia, postoId = null) => {
  const connection = await pool.getConnection();
  try {
    const params = [dia];
    let sql = 'SELECT COUNT(*) AS total FROM colheitas WHERE data_prevista = ?';
    if (postoId) {
      sql += ' AND posto_id = ?';
      params.push(postoId);
    }
    const [rows] = await connection.execute(sql, params);
    return Number(rows[0]?.total || 0);
  } finally {
    connection.release();
  }
};

exports.countKitsDisponiveis = async ({ tipoKitId = null } = {}) => {
  const connection = await pool.getConnection();
  try {
    const params = [];
    let sql = `
      SELECT COUNT(*) AS total
      FROM kits k
      LEFT JOIN lotes l ON l.id = k.lote_id
      WHERE k.status = 'Disponivel'
    `;
    if (tipoKitId) {
      sql += ' AND (k.tipo_kit_id = ? OR l.tipo_kit_id = ?)';
      params.push(tipoKitId, tipoKitId);
    }
    const [rows] = await connection.execute(sql, params);
    return Number(rows[0]?.total || 0);
  } finally {
    connection.release();
  }
};

exports.findAvailableKit = async ({ tipoKitId = null, postoId = null } = {}) => {
  const connection = await pool.getConnection();
  try {
    const params = [];
    let sql = `
      SELECT k.id, k.codigo_barras
      FROM kits k
      LEFT JOIN lotes l ON l.id = k.lote_id
      WHERE k.status = 'Disponivel'
    `;
    if (tipoKitId) {
      sql += ' AND (k.tipo_kit_id = ? OR l.tipo_kit_id = ?)';
      params.push(tipoKitId, tipoKitId);
    }
    // Prefere kits ja no posto da colheita, depois por validade mais proxima.
    sql += ` ORDER BY (k.posto_id = ?) DESC, k.data_validade IS NULL, k.data_validade ASC LIMIT 1`;
    params.push(postoId);

    const [rows] = await connection.execute(sql, params);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

/**
 * Reserva o kit (Disponivel -> Reservado), associa-o ao processo, atualiza o
 * estado do processo para "Kit Reservado" e cria a colheita agendada. Tudo
 * numa unica transacao para garantir consistencia stock<->processo.
 */
exports.reserveKitAndSchedule = async ({
  processoId,
  kitId,
  postoId,
  postoNome,
  dataPrevista,
  periodo,
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (kitId) {
      await kitLifecycleService.reserveForColheita(connection, {
        kitId,
        postoId,
        processoId,
        dataPrevista,
      });
    }

    await connection.execute(
      `UPDATE processos
         SET kit_id = ?, status_id = 'Kit Reservado', posto = ?, posto_id = ?, data_colheita = ?
       WHERE id = ?`,
      [kitId || null, postoNome || null, postoId || null, dataPrevista || null, processoId]
    );

    const colheitaId = uuidv4();
    await connection.execute(
      `INSERT INTO colheitas (id, processo_id, posto_id, data_prevista, periodo)
       VALUES (?, ?, ?, ?, ?)`,
      [colheitaId, processoId, postoId || null, dataPrevista || null, periodo || null]
    );

    await connection.commit();
    return { id: colheitaId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Regista a colheita efetiva: consome o kit (Reservado -> Utilizado), marca a
 * data efetiva e avanca o processo para "Colheita Realizada".
 */
exports.registarColheita = async ({
  colheitaId,
  processoId,
  kitId,
  dataEfetiva,
  postoId,
  laboratorioFinalId,
}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE colheitas SET data_efetiva = ? WHERE id = ?`,
      [dataEfetiva, colheitaId]
    );

    if (kitId) {
      await kitLifecycleService.consumeAtColheita(connection, {
        kitId,
        processoId,
        postoId,
        dataEfetiva,
        laboratorioFinalId,
      });
    } else {
      await connection.execute(
        `UPDATE processos SET status_id = 'Colheita Realizada', data_colheita = ? WHERE id = ?`,
        [String(dataEfetiva).split('T')[0], processoId]
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

/**
 * Cancela o agendamento: liberta o kit reservado (volta a Disponivel) e
 * coloca o processo em "Cancelado".
 */
exports.cancelAgendamento = async ({ colheitaId, processoId, kitId }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (kitId) {
      await kitLifecycleService.cancelReservation(connection, { kitId, processoId });
    }

    await connection.execute(
      `UPDATE processos SET status_id = 'Cancelado' WHERE id = ?`,
      [processoId]
    );

    await connection.execute(`DELETE FROM colheitas WHERE id = ?`, [colheitaId]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
