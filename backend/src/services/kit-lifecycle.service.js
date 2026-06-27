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
      observacoes: 'Kit consumido na colheita — aguarda envio para laboratório final',
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
