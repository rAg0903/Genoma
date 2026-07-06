const { v4: uuidv4 } = require('uuid');
const { FASE_CICLO, MOTIVOS_MOVIMENTO, faseForShipmentDestination } = require('../config/kit-lifecycle');
const laboratorioFinalService = require('./laboratorio-final.service');

const today = () => new Date().toISOString().split('T')[0];

const getKitRow = async (connection, kitId, forUpdate = false) => {
  const lock = forUpdate ? ' FOR UPDATE' : '';
  const [rows] = await connection.execute(
    `SELECT id, status, localizacao, fase_ciclo, empresa_id, posto_id, laboratorio_id, codigo_barras
     FROM kits WHERE id = ? LIMIT 1${lock}`,
    [kitId],
  );
  return rows[0] || null;
};

const insertMovimento = async (connection, {
  data,
  kitId,
  origem,
  destino,
  motivo,
  observacoes,
  requisicaoId = null,
  processoId = null,
  origemRef = {},
  destinoRef = {},
}) => {
  await connection.execute(
    `INSERT INTO movimentos_kits (
      id, data, kit_id, origem, destino, motivo, observacoes, requisicao_id, processo_id,
      origem_empresa_id, origem_posto_id, origem_laboratorio_id,
      destino_empresa_id, destino_posto_id, destino_laboratorio_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      data || today(),
      kitId,
      origem,
      destino,
      motivo,
      observacoes || null,
      requisicaoId,
      processoId,
      origemRef.empresa_id || null,
      origemRef.posto_id || null,
      origemRef.laboratorio_id || null,
      destinoRef.empresa_id || null,
      destinoRef.posto_id || null,
      destinoRef.laboratorio_id || null,
    ],
  );
};

/** Calcula fase + FKs para envio (chamado por stocks.repository). */
exports.buildShipmentKitUpdate = ({
  destinoLocalizacao,
  kitStatusDb,
  destinoRef,
}) => ({
  fase_ciclo: faseForShipmentDestination(destinoLocalizacao, kitStatusDb),
  status: kitStatusDb,
  localizacao: destinoLocalizacao,
  empresa_id: destinoRef.empresa_id || null,
  posto_id: destinoRef.posto_id || null,
  laboratorio_id: destinoRef.laboratorio_id || null,
});

exports.buildShipmentMovimento = ({
  kitId,
  data,
  origem,
  destino,
  observacoes,
  requisicaoId,
  origemRef = {},
  destinoRef = {},
}) => {
  const motivo = destino === 'Laboratorio' ? MOTIVOS_MOVIMENTO.ENVIO_LAB_FINAL : MOTIVOS_MOVIMENTO.ENVIO;
  return {
    data,
    kit_id: kitId,
    origem,
    destino,
    motivo,
    observacoes,
    requisicao_id: requisicaoId,
    origemRef,
    destinoRef,
  };
};

exports.shipToPosto = async (connection, {
  kitId,
  destinoPostoId,
  data,
  requisicaoId,
  origemRef = {},
  observacoes,
}) => {
  const kit = await getKitRow(connection, kitId, true);
  if (!kit) throw new Error('Kit não encontrado');

  await connection.execute(
    `UPDATE kits SET status = 'Disponivel', localizacao = 'Posto',
      posto_id = ?, empresa_id = NULL, laboratorio_id = NULL, fase_ciclo = ?
     WHERE id = ?`,
    [destinoPostoId, FASE_CICLO.EM_POSTO_AGUARDA, kitId],
  );

  await insertMovimento(connection, {
    data,
    kitId,
    origem: origemRef.localizacao || 'Escritorio',
    destino: 'Posto',
    motivo: MOTIVOS_MOVIMENTO.ENVIO,
    observacoes,
    requisicaoId,
    origemRef,
    destinoRef: { posto_id: destinoPostoId },
  });
};

exports.reserveForColheita = async (connection, {
  kitId,
  postoId,
  processoId,
  dataPrevista,
}) => {
  const kit = await getKitRow(connection, kitId, true);
  if (!kit) throw new Error('Kit não encontrado');
  if (kit.status !== 'Disponivel') {
    throw new Error('Kit já não está disponível para reserva.');
  }

  const origemLoc = kit.localizacao || 'Escritorio';
  const origemRef = {
    empresa_id: kit.empresa_id,
    posto_id: kit.posto_id,
    laboratorio_id: kit.laboratorio_id,
  };

  const [result] = await connection.execute(
    `UPDATE kits SET status = 'Reservado', localizacao = 'Posto',
      posto_id = ?, fase_ciclo = ?
     WHERE id = ? AND status = 'Disponivel'`,
    [postoId || null, FASE_CICLO.RESERVADO_COLHEITA, kitId],
  );
  if (result.affectedRows === 0) {
    throw new Error('Kit já não está disponível para reserva.');
  }

  await insertMovimento(connection, {
    data: dataPrevista || today(),
    kitId,
    origem: origemLoc,
    destino: 'Posto',
    motivo: MOTIVOS_MOVIMENTO.RESERVA_COLHEITA,
    observacoes: 'Reserva para agendamento de colheita',
    processoId,
    origemRef,
    destinoRef: { posto_id: postoId || null },
  });
};

exports.cancelReservation = async (connection, { kitId, processoId }) => {
  const kit = await getKitRow(connection, kitId, true);
  if (!kit || kit.status !== 'Reservado') return;

  await connection.execute(
    `UPDATE kits SET status = 'Disponivel', fase_ciclo = ?
     WHERE id = ? AND status = 'Reservado'`,
    [FASE_CICLO.EM_POSTO_AGUARDA, kitId],
  );

  await insertMovimento(connection, {
    kitId,
    origem: 'Posto',
    destino: 'Posto',
    motivo: MOTIVOS_MOVIMENTO.CANCELAMENTO_RESERVA,
    observacoes: 'Cancelamento de agendamento de colheita',
    processoId,
    origemRef: { posto_id: kit.posto_id },
    destinoRef: { posto_id: kit.posto_id },
  });
};

exports.consumeAtColheita = async (connection, {
  kitId,
  processoId,
  postoId,
  dataEfetiva,
  laboratorioFinalId,
  utilizadorId = null,
}) => {
  const labId = await laboratorioFinalService.resolveLaboratorioFinal({
    connection,
    processoId,
    postoId,
    overrideLaboratorioId: laboratorioFinalId,
  });
  if (!labId) {
    throw new Error('Não foi possível determinar o laboratório final para este kit.');
  }

  const kit = kitId ? await getKitRow(connection, kitId, true) : null;
  const effectivePostoId = postoId || kit?.posto_id || null;
  const origemRef = kit
    ? { posto_id: kit.posto_id, empresa_id: kit.empresa_id, laboratorio_id: kit.laboratorio_id }
    : { posto_id: effectivePostoId };

  if (kitId) {
    await connection.execute(
      `UPDATE kits SET status = 'Utilizado', localizacao = 'Posto',
        posto_id = ?, empresa_id = NULL, laboratorio_id = NULL, fase_ciclo = ?
       WHERE id = ?`,
      [effectivePostoId, FASE_CICLO.AGUARDA_ENVIO_LAB, kitId],
    );

    await insertMovimento(connection, {
      data: String(dataEfetiva).split('T')[0],
      kitId,
      origem: 'Posto',
      destino: 'Posto',
      motivo: MOTIVOS_MOVIMENTO.CONSUMO_COLHEITA,
      observacoes: 'Kit consumido na colheita',
      processoId,
      origemRef,
      destinoRef: { posto_id: effectivePostoId },
    });
  }

  if (processoId) {
    const dataColheita = String(dataEfetiva).split('T')[0];
    await connection.execute(
      `UPDATE processos SET
        status_id = 'Colheita Realizada',
        data_colheita = ?,
        laboratorio_final_id = ?,
        data_chegada_laboratorio = NULL
       WHERE id = ?`,
      [dataColheita, labId, processoId],
    );
  }

  if (kitId) {
    let postoNome = '';
    if (effectivePostoId) {
      const [postoRows] = await connection.execute(
        'SELECT nome FROM postos WHERE id = ? LIMIT 1',
        [effectivePostoId],
      );
      postoNome = postoRows[0]?.nome || '';
    }

    let labNome = '';
    const [labRows] = await connection.execute(
      'SELECT nome FROM laboratorios WHERE id = ? AND tipo = \'final\' LIMIT 1',
      [labId],
    );
    labNome = labRows[0]?.nome || '';
    if (!labNome) {
      throw new Error('Laboratório final não encontrado ou inválido');
    }

    const stocksService = require('./stocks.service');
    await stocksService.registerDescarteForKits({
      connection,
      kitIds: [kitId],
      origem: 'Posto',
      origemRef: { posto_id: effectivePostoId, nome: postoNome },
      data: String(dataEfetiva).split('T')[0],
      labId,
      labNome,
      utilizadorId,
      observacoes: 'Descarte automático na colheita',
      skipPastDateCheck: true,
    });
  }

  return { laboratorio_final_id: labId };
};

/** Fase 3: envio Posto → Lab com estado em trânsito. */
exports.shipToLab = async (connection, {
  kitId,
  destinoLabId,
  data,
  requisicaoId,
  origemRef = {},
  observacoes,
}) => {
  const kit = await getKitRow(connection, kitId, true);
  if (!kit) throw new Error('Kit não encontrado');

  await connection.execute(
    `UPDATE kits SET status = 'Em transito', localizacao = 'Laboratorio',
      laboratorio_id = ?, posto_id = NULL, empresa_id = NULL, fase_ciclo = ?
     WHERE id = ?`,
    [destinoLabId, FASE_CICLO.EM_TRANSITO_LAB, kitId],
  );

  await insertMovimento(connection, {
    data,
    kitId,
    origem: origemRef.localizacao || 'Posto',
    destino: 'Laboratorio',
    motivo: MOTIVOS_MOVIMENTO.ENVIO_LAB_FINAL,
    observacoes,
    requisicaoId,
    origemRef,
    destinoRef: { laboratorio_id: destinoLabId },
  });
};

/** Fase 3: confirma recepção no laboratório. */
exports.confirmLabArrival = async (connection, { kitId, processoId, dataChegada }) => {
  const kit = await getKitRow(connection, kitId, true);
  if (!kit) throw new Error('Kit não encontrado');

  const chegada = dataChegada || today();
  let resolvedProcessoId = processoId;

  if (!resolvedProcessoId) {
    const [procRows] = await connection.execute(
      'SELECT id FROM processos WHERE kit_id = ? ORDER BY data_colheita DESC LIMIT 1',
      [kitId],
    );
    resolvedProcessoId = procRows[0]?.id || null;
  }

  await connection.execute(
    `UPDATE kits SET status = 'Utilizado', fase_ciclo = ? WHERE id = ?`,
    [FASE_CICLO.EM_LAB_FINAL, kitId],
  );

  await insertMovimento(connection, {
    data: chegada,
    kitId,
    origem: 'Laboratorio',
    destino: 'Laboratorio',
    motivo: MOTIVOS_MOVIMENTO.CONFIRMACAO_LAB,
    observacoes: 'Confirmação de recepção no laboratório final',
    processoId: resolvedProcessoId,
    destinoRef: { laboratorio_id: kit.laboratorio_id },
  });

  if (resolvedProcessoId) {
    await connection.execute(
      `UPDATE processos SET data_chegada_laboratorio = ?, status_id = 'Enviado Laboratorio',
        data_envio_laboratorio = COALESCE(data_envio_laboratorio, ?)
       WHERE id = ?`,
      [chegada, chegada, resolvedProcessoId],
    );
  }
};

/**
 * Devolve kit do laboratório final para a origem do descarte (posto ou empresa).
 * Usado quando o kit foi enviado por erro e não foi utilizado.
 */
exports.revertDescarteToOrigin = async (connection, {
  kitId,
  observacoes = null,
  reverterProcesso = true,
}) => {
  const kit = await getKitRow(connection, kitId, true);
  if (!kit) throw new Error('Kit não encontrado');
  if (kit.fase_ciclo !== FASE_CICLO.EM_LAB_FINAL || kit.localizacao !== 'Laboratorio') {
    throw new Error('O kit não se encontra no laboratório final para devolver.');
  }

  const [descarteRows] = await connection.execute(
    `SELECT
        rk.id AS requisicao_id,
        rk.origem,
        rk.origem_empresa_id,
        rk.origem_posto_id,
        rk.origem_nome,
        rk.destino_laboratorio_id,
        mk.data AS descarte_data
      FROM movimentos_kits mk
      INNER JOIN requisicoes_kits rk ON rk.id = mk.requisicao_id
      WHERE mk.kit_id = ?
        AND mk.motivo = ?
        AND rk.destino = 'Laboratorio'
        AND rk.status = 'Entregue'
        AND NOT EXISTS (
          SELECT 1 FROM movimentos_kits rev
          WHERE rev.kit_id = mk.kit_id
            AND rev.motivo = ?
            AND rev.data >= mk.data
        )
      ORDER BY mk.data DESC
      LIMIT 1
      FOR UPDATE`,
    [kitId, MOTIVOS_MOVIMENTO.DESCARTE, MOTIVOS_MOVIMENTO.DEVOLUCAO_DESCARTE],
  );

  const ctx = descarteRows[0];
  if (!ctx) {
    throw new Error('Não existe descarte activo para reverter neste kit.');
  }

  const origem = ctx.origem === 'Posto' ? 'Posto' : 'Escritorio';
  if (origem === 'Posto' && !ctx.origem_posto_id) {
    throw new Error('Origem do descarte (posto) não encontrada.');
  }
  if (origem === 'Escritorio' && !ctx.origem_empresa_id) {
    throw new Error('Origem do descarte (empresa) não encontrada.');
  }

  const faseCiclo = origem === 'Posto' ? FASE_CICLO.EM_POSTO_AGUARDA : FASE_CICLO.EM_EMPRESA;
  const destinoRef = origem === 'Posto'
    ? { posto_id: ctx.origem_posto_id, empresa_id: null, laboratorio_id: null }
    : { empresa_id: ctx.origem_empresa_id, posto_id: null, laboratorio_id: null };

  await connection.execute(
    `UPDATE kits SET status = 'Disponivel', localizacao = ?,
      posto_id = ?, empresa_id = ?, laboratorio_id = NULL, fase_ciclo = ?
     WHERE id = ?`,
    [
      origem,
      destinoRef.posto_id,
      destinoRef.empresa_id,
      faseCiclo,
      kitId,
    ],
  );

  let processoId = null;
  if (reverterProcesso) {
    const [procRows] = await connection.execute(
      `SELECT id FROM processos
       WHERE kit_id = ?
         AND status_id IN ('Colheita Realizada', 'Enviado Laboratorio', 'Kit Reservado', 'Em Analise')
       LIMIT 1`,
      [kitId],
    );
    processoId = procRows[0]?.id || null;

    if (processoId) {
      await connection.execute(
        `UPDATE processos SET
          kit_id = NULL,
          status_id = 'Cancelado',
          data_colheita = NULL,
          data_envio_laboratorio = NULL,
          data_chegada_laboratorio = NULL,
          laboratorio_final_id = NULL
         WHERE id = ?`,
        [processoId],
      );
    }
  }

  await insertMovimento(connection, {
    data: today(),
    kitId,
    origem: 'Laboratorio',
    destino: origem,
    motivo: MOTIVOS_MOVIMENTO.DEVOLUCAO_DESCARTE,
    observacoes: observacoes || 'Devolução — kit enviado para descarte por erro',
    requisicaoId: ctx.requisicao_id,
    processoId,
    origemRef: { laboratorio_id: ctx.destino_laboratorio_id },
    destinoRef,
  });

  const [remainingRows] = await connection.execute(
    `SELECT COUNT(*) AS total
     FROM requisicao_kits_itens rki
     INNER JOIN kits k ON k.id = rki.kit_id
     WHERE rki.requisicao_id = ?
       AND k.fase_ciclo = ?`,
    [ctx.requisicao_id, FASE_CICLO.EM_LAB_FINAL],
  );
  const remaining = Number(remainingRows[0]?.total || 0);

  if (remaining === 0) {
    await connection.execute(
      `UPDATE requisicoes_kits SET status = 'Cancelada' WHERE id = ?`,
      [ctx.requisicao_id],
    );
  } else {
    await connection.execute(
      `UPDATE requisicoes_kits SET quantidade = ? WHERE id = ?`,
      [remaining, ctx.requisicao_id],
    );
  }

  return {
    kit_id: kitId,
    requisicao_id: ctx.requisicao_id,
    origem,
    origem_nome: ctx.origem_nome || '',
    processo_revertido: Boolean(processoId),
  };
};

exports.usarKitAtPosto = async (connection, {
  kitId,
  processoId,
  postoId,
  laboratorioFinalId,
}) => {
  return exports.consumeAtColheita(connection, {
    kitId,
    processoId,
    postoId,
    dataEfetiva: today(),
    laboratorioFinalId,
  });
};
