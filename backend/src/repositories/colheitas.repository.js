const pool = require('../config/database');
const kitLifecycleService = require('../services/kit-lifecycle.service');
const { v4: uuidv4 } = require('uuid');

// DATE_FORMAT em data_prevista garante que o driver node-mysql2 devolve uma
// string e não um objecto Date (que sofreria conversão UTC, deslocando o dia).
const baseSelect = `
  SELECT
    c.id,
    c.processo_id,
    c.posto_id,
    DATE_FORMAT(c.data_prevista, '%Y-%m-%d') AS data_prevista,
    c.periodo,
    c.data_efetiva,
    c.facturado_entidade,
    c.repeticao,
    c.nao_notificar,
    c.semanas_gestacao_colheita,
    c.dias_gestacao_colheita,
    c.data_recepcao_amostra,
    c.created_at,
    pr.numero_processo,
    pr.status_id AS processo_status,
    pr.kit_id,
    k.codigo_barras AS kit_codigo,
    pa.nome AS paciente_nome,
    pa.telemovel AS paciente_telemovel,
    pr.paciente_id AS paciente_id,
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
    // --- Parte 1: colheitas registadas (com ou sem processo) ---
    // Apenas agendamentos pendentes: sem data efetiva e status pré-colheita.
    const where1 = [
      'c.data_efetiva IS NULL',
      "(pr.status_id IS NULL OR pr.status_id IN ('Agendado', 'Kit Reservado'))",
    ];
    const params1 = [];

    if (filters.from) {
      where1.push('DATE(c.data_prevista) >= ?');
      params1.push(filters.from);
    }
    if (filters.to) {
      where1.push('DATE(c.data_prevista) <= ?');
      params1.push(filters.to);
    }
    if (filters.posto_id) {
      where1.push('c.posto_id = ?');
      params1.push(filters.posto_id);
    }

    const whereSql1 = `WHERE ${where1.join(' AND ')}`;

    // --- Parte 2: contactos pré-processo com data de colheita prevista ---
    // Estes contactos ainda não têm processo criado (data_colheita_prevista
    // é limpa quando o processo é criado em processos.service.js).
    const where2 = ['p.ativo = TRUE', 'p.data_colheita_prevista IS NOT NULL'];
    const params2 = [];

    if (filters.from) {
      where2.push('DATE(p.data_colheita_prevista) >= ?');
      params2.push(filters.from);
    }
    if (filters.to) {
      where2.push('DATE(p.data_colheita_prevista) <= ?');
      params2.push(filters.to);
    }
    if (filters.posto_id) {
      where2.push('p.posto_colheita_id = ?');
      params2.push(filters.posto_id);
    }

    const whereSql2 = `WHERE ${where2.join(' AND ')}`;

    const sql = `
      ${baseSelect} ${whereSql1}
      UNION ALL
      SELECT
        CONCAT('pre-', p.id)                          AS id,
        NULL                                          AS processo_id,
        p.posto_colheita_id                           AS posto_id,
        DATE_FORMAT(p.data_colheita_prevista, '%Y-%m-%d') AS data_prevista,
        NULL                                          AS periodo,
        NULL                                          AS data_efetiva,
        0                                             AS facturado_entidade,
        0                                             AS repeticao,
        0                                             AS nao_notificar,
        NULL                                          AS semanas_gestacao_colheita,
        NULL                                          AS dias_gestacao_colheita,
        NULL                                          AS data_recepcao_amostra,
        p.created_at,
        NULL                                          AS numero_processo,
        'Agendado'                                    AS processo_status,
        NULL                                          AS kit_id,
        NULL                                          AS kit_codigo,
        p.nome                                        AS paciente_nome,
        p.telemovel                                   AS paciente_telemovel,
        p.id                                          AS paciente_id,
        po.nome                                       AS posto_nome
      FROM pacientes p
      LEFT JOIN postos po ON po.id = p.posto_colheita_id
      ${whereSql2}
      ORDER BY data_prevista ASC, periodo ASC
    `;

    const [rows] = await connection.execute(sql, [...params1, ...params2]);
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
  facturadoEntidade = false,
  repeticao = false,
  naoNotificar = false,
  semanasGestacaoColheita = null,
  diasGestacaoColheita = null,
  dataRecepcaoAmostra = null,
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
      `INSERT INTO colheitas (
         id, processo_id, posto_id, data_prevista, periodo, data_efetiva,
         facturado_entidade, repeticao, nao_notificar,
         semanas_gestacao_colheita, dias_gestacao_colheita, data_recepcao_amostra
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        colheitaId,
        processoId,
        postoId || null,
        dataPrevista || null,
        periodo || null,
        dataEfetiva || null,
        facturadoEntidade ? 1 : 0,
        repeticao ? 1 : 0,
        naoNotificar ? 1 : 0,
        semanasGestacaoColheita ?? null,
        diasGestacaoColheita ?? null,
        dataRecepcaoAmostra || null,
      ]
    );
    return { id: colheitaId };
  } finally {
    connection.release();
  }
};

exports.upsertForProcesso = async ({
  processoId,
  postoId = null,
  dataPrevista = null,
  dataEfetiva = null,
  periodo = null,
  facturadoEntidade = false,
  repeticao = false,
  naoNotificar = false,
  semanasGestacaoColheita = null,
  diasGestacaoColheita = null,
  dataRecepcaoAmostra = null,
}) => {
  const connection = await pool.getConnection();
  try {
    const [existing] = await connection.execute(
      'SELECT id FROM colheitas WHERE processo_id = ? LIMIT 1',
      [processoId]
    );
    if (existing.length) {
      await connection.execute(
        `UPDATE colheitas SET
           posto_id = COALESCE(?, posto_id),
           data_prevista = COALESCE(?, data_prevista),
           periodo = ?,
           data_efetiva = COALESCE(?, data_efetiva),
           facturado_entidade = ?,
           repeticao = ?,
           nao_notificar = ?,
           semanas_gestacao_colheita = ?,
           dias_gestacao_colheita = ?,
           data_recepcao_amostra = ?
         WHERE processo_id = ?`,
        [
          postoId || null,
          dataPrevista || null,
          periodo || null,
          dataEfetiva || null,
          facturadoEntidade ? 1 : 0,
          repeticao ? 1 : 0,
          naoNotificar ? 1 : 0,
          semanasGestacaoColheita ?? null,
          diasGestacaoColheita ?? null,
          dataRecepcaoAmostra || null,
          processoId,
        ]
      );
      return { id: existing[0].id };
    }

    const colheitaId = uuidv4();
    await connection.execute(
      `INSERT INTO colheitas (
         id, processo_id, posto_id, data_prevista, periodo, data_efetiva,
         facturado_entidade, repeticao, nao_notificar,
         semanas_gestacao_colheita, dias_gestacao_colheita, data_recepcao_amostra
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        colheitaId,
        processoId,
        postoId || null,
        dataPrevista || null,
        periodo || null,
        dataEfetiva || null,
        facturadoEntidade ? 1 : 0,
        repeticao ? 1 : 0,
        naoNotificar ? 1 : 0,
        semanasGestacaoColheita ?? null,
        diasGestacaoColheita ?? null,
        dataRecepcaoAmostra || null,
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
    // Parte 1: colheitas registadas — apenas pendentes (sem efetiva, status pré-colheita)
    const where1 = [
      'c.data_efetiva IS NULL',
      "(pr.status_id IS NULL OR pr.status_id IN ('Agendado', 'Kit Reservado'))",
    ];
    const params1 = [];
    if (from) {
      where1.push('DATE(c.data_prevista) >= ?');
      params1.push(from);
    }
    if (to) {
      where1.push('DATE(c.data_prevista) <= ?');
      params1.push(to);
    }
    const whereSql1 = `WHERE ${where1.join(' AND ')}`;

    // Parte 2: contactos pré-processo com data de colheita prevista
    const where2 = ['p.ativo = TRUE', 'p.data_colheita_prevista IS NOT NULL'];
    const params2 = [];
    if (from) {
      where2.push('DATE(p.data_colheita_prevista) >= ?');
      params2.push(from);
    }
    if (to) {
      where2.push('DATE(p.data_colheita_prevista) <= ?');
      params2.push(to);
    }
    const whereSql2 = `WHERE ${where2.join(' AND ')}`;

    // DATE_FORMAT retorna VARCHAR — evita que o driver node-mysql2 converta o
    // valor para um objecto Date JavaScript e aplique o offset UTC, que
    // deslocaria o dia para trás em fusos horários positivos (ex: UTC+1).
    const sql = `
      SELECT dia, SUM(total) AS total FROM (
        SELECT DATE_FORMAT(c.data_prevista, '%Y-%m-%d') AS dia, COUNT(*) AS total
        FROM colheitas c
        LEFT JOIN processos pr ON pr.id = c.processo_id
        ${whereSql1}
        GROUP BY DATE_FORMAT(c.data_prevista, '%Y-%m-%d')
        UNION ALL
        SELECT DATE_FORMAT(p.data_colheita_prevista, '%Y-%m-%d') AS dia, COUNT(*) AS total
        FROM pacientes p
        ${whereSql2}
        GROUP BY DATE_FORMAT(p.data_colheita_prevista, '%Y-%m-%d')
      ) combined
      GROUP BY dia
      ORDER BY dia ASC
    `;

    const [rows] = await connection.execute(sql, [...params1, ...params2]);
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
  utilizadorId = null,
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
        utilizadorId,
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
