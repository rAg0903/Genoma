/** Contexto dos motivos (contacto vs processo) e anulação de processos. */
module.exports.up = async (db) => {
  await db.execute(`
    ALTER TABLE motivos_anulacao
    ADD COLUMN contexto VARCHAR(20) NOT NULL DEFAULT 'contacto'
    COMMENT 'contacto | processo'
  `).catch((err) => {
    if (!String(err.message || '').includes('Duplicate column')) throw err;
  });

  await db.execute(`
    ALTER TABLE motivos_anulacao
    ADD COLUMN reabre_contacto BOOLEAN NOT NULL DEFAULT FALSE
    COMMENT 'Ao cancelar processo, repõe contacto para nova colheita'
  `).catch((err) => {
    if (!String(err.message || '').includes('Duplicate column')) throw err;
  });

  const motivos = [
    { nome: 'Desistência', contexto: 'contacto', reabre: 0 },
    { nome: 'Perda do bebé', contexto: 'contacto', reabre: 0 },
    { nome: 'Erro atribuição processo', contexto: 'processo', reabre: 0 },
    { nome: 'Repetição de colheita', contexto: 'processo', reabre: 1 },
  ];

  for (const m of motivos) {
    await db.execute(
      'UPDATE motivos_anulacao SET contexto = ?, reabre_contacto = ? WHERE nome = ?',
      [m.contexto, m.reabre, m.nome],
    );
  }

  for (const [name, def] of [
    ['motivo_anulacao_id', 'CHAR(36) NULL'],
    ['data_anulacao', 'DATE NULL'],
  ]) {
    await db.execute(`ALTER TABLE processos ADD COLUMN ${name} ${def}`).catch((err) => {
      if (!String(err.message || '').includes('Duplicate column')) throw err;
    });
  }

  await db.execute(`
    ALTER TABLE processos
    ADD CONSTRAINT fk_processos_motivo_anulacao
    FOREIGN KEY (motivo_anulacao_id) REFERENCES motivos_anulacao(id)
    ON DELETE SET NULL
  `).catch((err) => {
    const msg = String(err.message || '');
    if (!msg.includes('Duplicate') && !msg.includes('already exists')) throw err;
  });

  console.log('  ✓ Contexto de motivos de anulação e colunas em processos');
};

module.exports.down = async () => {};
