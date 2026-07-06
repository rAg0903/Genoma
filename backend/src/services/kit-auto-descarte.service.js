const pool = require('../config/database');
const stocksService = require('./stocks.service');
const laboratorioFinalService = require('./laboratorio-final.service');
const { normalizeCalendarDate } = require('../utils/dates');

const today = () => normalizeCalendarDate(new Date()) || new Date().toISOString().split('T')[0];

const PENDING_KITS_SQL = `
  SELECT
    k.id,
    k.codigo_barras,
    k.tracking,
    k.status,
    k.data_validade,
    k.localizacao,
    k.posto_id,
    k.empresa_id,
    k.fase_ciclo,
    p.nome AS posto_nome,
    e.nome AS empresa_nome,
    (
      SELECT MIN(mk.data)
      FROM movimentos_kits mk
      WHERE mk.kit_id = k.id AND mk.motivo = 'ConsumoColheita'
    ) AS data_colheita_mov
  FROM kits k
  LEFT JOIN postos p ON p.id = k.posto_id
  LEFT JOIN empresas e ON e.id = k.empresa_id
  WHERE k.localizacao IN ('Posto', 'Escritorio')
    AND (k.fase_ciclo IS NULL OR k.fase_ciclo NOT IN ('em_lab_final', 'em_transito_lab'))
    AND k.status NOT IN ('Em transito', 'Perdido', 'Invalido')
    AND (
      k.fase_ciclo = 'aguarda_envio_lab'
      OR k.status IN ('Utilizado', 'Expirado')
      OR (
        k.status IN ('Disponivel', 'Reservado')
        AND k.data_validade IS NOT NULL
        AND k.data_validade < CURDATE()
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM requisicao_kits_itens rki
      INNER JOIN requisicoes_kits rk ON rk.id = rki.requisicao_id
      INNER JOIN movimentos_kits mk ON mk.requisicao_id = rk.id AND mk.kit_id = k.id
      WHERE rki.kit_id = k.id AND mk.motivo = 'Descarte'
    )
  ORDER BY COALESCE(p.nome, e.nome), k.codigo_barras
`;

exports.findKitsPendingAutoDescarte = async (connection = null) => {
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

  const [rows] = await exec(PENDING_KITS_SQL);
  return rows;
};

/** Marca kits com validade ultrapassada como Expirado (antes do descarte). */
exports.markCalendarExpiredKits = async (connection = null) => {
  const sql = `
    UPDATE kits
    SET status = 'Expirado',
        fase_ciclo = CASE
          WHEN fase_ciclo = 'reservado_colheita' THEN 'em_posto_aguarda'
          ELSE fase_ciclo
        END
    WHERE status IN ('Disponivel', 'Reservado')
      AND data_validade IS NOT NULL
      AND data_validade < CURDATE()
      AND localizacao IN ('Escritorio', 'Posto')
      AND (fase_ciclo IS NULL OR fase_ciclo NOT IN ('em_lab_final', 'em_transito_lab'))
  `;

  if (connection) {
    const [result] = await connection.execute(sql);
    return result.affectedRows || 0;
  }

  const conn = await pool.getConnection();
  try {
    const [result] = await conn.execute(sql);
    return result.affectedRows || 0;
  } finally {
    conn.release();
  }
};

const resolveDescarteDate = (kit) => {
  const colheita = kit.data_colheita_mov ? normalizeCalendarDate(kit.data_colheita_mov) : null;
  if (colheita) return { data: colheita, skipPastDateCheck: true };

  const validade = kit.data_validade ? normalizeCalendarDate(kit.data_validade) : null;
  if (validade && kit.status === 'Expirado') return { data: validade, skipPastDateCheck: true };

  return { data: today(), skipPastDateCheck: false };
};

const resolveObservacoes = (kit) => {
  if (kit.fase_ciclo === 'aguarda_envio_lab' || kit.status === 'Utilizado') {
    return 'Descarte automático na colheita (backfill)';
  }
  if (kit.status === 'Expirado' || (kit.data_validade && normalizeCalendarDate(kit.data_validade) < today())) {
    return 'Descarte automático por expiração';
  }
  return 'Descarte automático';
};

/**
 * Processa descartes pendentes: colheitas sem envio e kits expirados.
 * Agrupa por origem + laboratório final.
 */
exports.processPendingAutoDescartes = async () => {
  await exports.markCalendarExpiredKits();

  const kits = await exports.findKitsPendingAutoDescarte();
  if (!kits.length) {
    return { shipments: 0, kits: 0, errors: [] };
  }

  const groups = new Map();
  const errors = [];

  for (const kit of kits) {
    try {
      const labId = await laboratorioFinalService.resolveLaboratorioFinalForKit({ kitId: kit.id });
      if (!labId) {
        errors.push(`Kit ${kit.codigo_barras || kit.id}: laboratório final não configurado no teste`);
        continue;
      }

      const origem = kit.localizacao === 'Posto' ? 'Posto' : 'Escritorio';
      const origemKey = origem === 'Posto' ? kit.posto_id : kit.empresa_id;
      if (!origemKey) {
        errors.push(`Kit ${kit.codigo_barras || kit.id}: origem (${origem}) não identificada`);
        continue;
      }

      const groupKey = `${origem}:${origemKey}:${labId}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          origem,
          origemRef: {
            posto_id: origem === 'Posto' ? kit.posto_id : null,
            empresa_id: origem === 'Escritorio' ? kit.empresa_id : null,
            nome: origem === 'Posto' ? (kit.posto_nome || '') : (kit.empresa_nome || ''),
          },
          labId,
          kits: [],
        });
      }
      groups.get(groupKey).kits.push(kit);
    } catch (err) {
      errors.push(`Kit ${kit.codigo_barras || kit.id}: ${err.message}`);
    }
  }

  let shipmentCount = 0;
  let kitCount = 0;

  for (const group of groups.values()) {
    const labRows = await pool.getConnection().then(async (conn) => {
      try {
        const [rows] = await conn.execute(
          'SELECT nome FROM laboratorios WHERE id = ? AND tipo = \'final\' LIMIT 1',
          [group.labId],
        );
        return rows;
      } finally {
        conn.release();
      }
    });

    const labNome = labRows[0]?.nome;
    if (!labNome) {
      errors.push(`Laboratório final ${group.labId} inválido (${group.kits.length} kit(s))`);
      continue;
    }

    const byDate = new Map();
    for (const kit of group.kits) {
      const { data, skipPastDateCheck } = resolveDescarteDate(kit);
      const obs = resolveObservacoes(kit);
      const batchKey = `${data}:${skipPastDateCheck}:${obs}`;
      if (!byDate.has(batchKey)) {
        byDate.set(batchKey, { data, skipPastDateCheck, observacoes: obs, kitIds: [] });
      }
      byDate.get(batchKey).kitIds.push(kit.id);
    }

    for (const batch of byDate.values()) {
      try {
        await stocksService.registerDescarteForKits({
          kitIds: batch.kitIds,
          origem: group.origem,
          origemRef: group.origemRef,
          data: batch.data,
          labId: group.labId,
          labNome,
          observacoes: batch.observacoes,
          skipPastDateCheck: batch.skipPastDateCheck,
        });
        shipmentCount += 1;
        kitCount += batch.kitIds.length;
      } catch (err) {
        errors.push(
          `${group.origemRef.nome || group.origem} → ${labNome} (${batch.kitIds.length} kit(s)): ${err.message}`,
        );
      }
    }
  }

  return { shipments: shipmentCount, kits: kitCount, errors };
};

exports.scheduleAutoDescartes = () => {
  if (process.env.KIT_AUTO_DESCARTE_ENABLED === 'false') return;

  const MS_DAY = 24 * 60 * 60 * 1000;
  const run = async () => {
    try {
      const result = await exports.processPendingAutoDescartes();
      if (result.kits > 0) {
        console.log(`♻️  Auto-descarte: ${result.shipments} envio(s), ${result.kits} kit(s)`);
      }
      if (result.errors.length) {
        console.warn(`⚠️  Auto-descarte: ${result.errors.length} aviso(s)`);
        result.errors.slice(0, 5).forEach((msg) => console.warn(`   - ${msg}`));
      }
    } catch (err) {
      console.warn('⚠️  Auto-descarte falhou:', err.message);
    }
  };

  const startupDelay = Number(process.env.KIT_AUTO_DESCARTE_STARTUP_MS || 30_000);
  setTimeout(run, startupDelay);
  setInterval(run, MS_DAY);
};
