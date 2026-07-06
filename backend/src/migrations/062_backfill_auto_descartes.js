/**
 * Backfill: descarte automático para kits pendentes (colheita sem envio + expirados).
 */
module.exports.up = async () => {
  const kitAutoDescarte = require('../services/kit-auto-descarte.service');

  const marked = await kitAutoDescarte.markCalendarExpiredKits();
  console.log(`  ✓ Kits marcados como expirados: ${marked}`);

  const result = await kitAutoDescarte.processPendingAutoDescartes();
  console.log(`  ✓ Auto-descarte backfill: ${result.shipments} envio(s), ${result.kits} kit(s)`);
  if (result.errors.length) {
    result.errors.forEach((msg) => console.warn(`  ⚠ ${msg}`));
  }
};

module.exports.down = async () => {
  // Sem reversão.
};
