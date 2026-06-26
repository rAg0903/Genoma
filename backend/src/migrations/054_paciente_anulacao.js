/** Cancelamento de contactos: estado + motivo de anulação. */
module.exports.up = async (db) => {
  const columns = [
    ['estado_contacto', "VARCHAR(20) NULL COMMENT 'Cancelado ou NULL'"],
    ['motivo_anulacao_id', 'CHAR(36) NULL'],
    ['data_anulacao', 'DATE NULL'],
  ];

  for (const [name, def] of columns) {
    await db.execute(`ALTER TABLE pacientes ADD COLUMN ${name} ${def}`).catch((err) => {
      if (!String(err.message || '').includes('Duplicate column')) throw err;
    });
  }

  await db.execute(`
    ALTER TABLE pacientes
    ADD CONSTRAINT fk_pacientes_motivo_anulacao
    FOREIGN KEY (motivo_anulacao_id) REFERENCES motivos_anulacao(id)
    ON DELETE SET NULL
  `).catch((err) => {
    const msg = String(err.message || '');
    if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
  });

  console.log('  ✓ Colunas de anulação adicionadas em pacientes');
};

module.exports.down = async () => {};
