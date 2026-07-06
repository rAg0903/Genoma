/**
 * Motivo de movimento para devolver kit do laboratório final à origem (correcção de descarte).
 */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE movimentos_kits
      MODIFY COLUMN motivo ENUM(
        'Envio', 'Consumo', 'Reposicao', 'Transferencia', 'SMS Colheita',
        'ReservaColheita', 'ConsumoColheita', 'EnvioLabFinal',
        'CancelamentoReserva', 'ConfirmacaoLab', 'Descarte', 'DevolucaoDescarte'
      ) NOT NULL
  `);
  console.log('  ✓ ENUM motivo: valor DevolucaoDescarte adicionado');
};

module.exports.down = async () => {
  // Sem reversão.
};
