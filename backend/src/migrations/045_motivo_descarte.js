/**
 * Inclui motivo 'Descarte' em movimentos_kits (envio posto → lab final).
 */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE movimentos_kits
      MODIFY COLUMN motivo ENUM(
        'Envio', 'Consumo', 'Reposicao', 'Transferencia', 'SMS Colheita',
        'ReservaColheita', 'ConsumoColheita', 'EnvioLabFinal',
        'CancelamentoReserva', 'ConfirmacaoLab', 'Descarte'
      ) NOT NULL
  `);
  console.log('  ✓ ENUM motivo: valor Descarte adicionado');
};

module.exports.down = async () => {
  // Sem reversão — registos Descarte ficariam órfãos.
};
