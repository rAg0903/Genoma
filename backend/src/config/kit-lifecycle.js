/** Fases do ciclo de vida operacional de kits (stock). */
const FASE_CICLO = Object.freeze({
  EM_EMPRESA: 'em_empresa',
  EM_POSTO_AGUARDA: 'em_posto_aguarda',
  RESERVADO_COLHEITA: 'reservado_colheita',
  AGUARDA_ENVIO_LAB: 'aguarda_envio_lab',
  EM_TRANSITO_LAB: 'em_transito_lab',
  EM_LAB_FINAL: 'em_lab_final',
  ENCERRADO: 'encerrado',
});

const MOTIVOS_MOVIMENTO = Object.freeze({
  ENVIO: 'Envio',
  RESERVA_COLHEITA: 'ReservaColheita',
  CONSUMO_COLHEITA: 'ConsumoColheita',
  ENVIO_LAB_FINAL: 'EnvioLabFinal',
  DESCARTE: 'Descarte',
  CANCELAMENTO_RESERVA: 'CancelamentoReserva',
  TRANSFERENCIA: 'Transferencia',
  CONFIRMACAO_LAB: 'ConfirmacaoLab',
});

/** Deriva fase_ciclo a partir de localizacao + status (retrocompat). */
const deriveFaseCiclo = (row) => {
  if (row.fase_ciclo) return row.fase_ciclo;

  const status = String(row.status || '').toLowerCase();
  const loc = row.localizacao || '';

  if (status === 'utilizado') {
    if (loc === 'Posto') return FASE_CICLO.AGUARDA_ENVIO_LAB;
    if (loc === 'Laboratorio') return FASE_CICLO.EM_LAB_FINAL;
    return FASE_CICLO.ENCERRADO;
  }
  if (status === 'em transito') return FASE_CICLO.EM_TRANSITO_LAB;
  if (status === 'reservado') return FASE_CICLO.RESERVADO_COLHEITA;
  if (loc === 'Posto') return FASE_CICLO.EM_POSTO_AGUARDA;
  if (loc === 'Laboratorio') return FASE_CICLO.EM_LAB_FINAL;
  return FASE_CICLO.EM_EMPRESA;
};

const faseForShipmentDestination = (destinoLocalizacao, kitStatusDb) => {
  if (destinoLocalizacao === 'Posto') return FASE_CICLO.EM_POSTO_AGUARDA;
  if (destinoLocalizacao === 'Escritorio') return FASE_CICLO.EM_EMPRESA;
  if (destinoLocalizacao === 'Laboratorio') {
    if (kitStatusDb === 'Em transito') return FASE_CICLO.EM_TRANSITO_LAB;
    return FASE_CICLO.EM_LAB_FINAL;
  }
  return FASE_CICLO.EM_EMPRESA;
};

module.exports = {
  FASE_CICLO,
  MOTIVOS_MOVIMENTO,
  deriveFaseCiclo,
  faseForShipmentDestination,
};
