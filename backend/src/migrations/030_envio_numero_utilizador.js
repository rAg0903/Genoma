module.exports.up = async (db) => {
  const tryExec = async (label, sql, ignoreCodes = []) => {
    try {
      await db.execute(sql);
      console.log(`  ✓ ${label}`);
    } catch (error) {
      if (ignoreCodes.includes(error.code)) {
        console.log(`  ℹ ${label} (ignorado)`);
        return;
      }
      console.log(`  ⚠ ${label}:`, error.message);
    }
  };

  await tryExec(
    'Coluna numero_envio em requisicoes_kits',
    `ALTER TABLE requisicoes_kits ADD COLUMN numero_envio VARCHAR(50) NULL AFTER id;`,
    ['ER_DUP_FIELDNAME'],
  );

  await tryExec(
    'Coluna utilizador_id em requisicoes_kits',
    `ALTER TABLE requisicoes_kits ADD COLUMN utilizador_id CHAR(36) NULL AFTER numero_envio;`,
    ['ER_DUP_FIELDNAME'],
  );

  await tryExec(
    'Indice unico numero_envio',
    'ALTER TABLE requisicoes_kits ADD UNIQUE KEY uk_requisicoes_numero_envio (numero_envio);',
    ['ER_DUP_KEYNAME'],
  );

  try {
    const [rows] = await db.execute(
      'SELECT id, data FROM requisicoes_kits WHERE numero_envio IS NULL ORDER BY created_at ASC',
    );
    const counters = {};
    for (const row of rows) {
      const year = row.data ? new Date(row.data).getFullYear() : new Date().getFullYear();
      counters[year] = (counters[year] || 0) + 1;
      const numero = `ENV-${year}-${String(counters[year]).padStart(5, '0')}`;
      await db.execute('UPDATE requisicoes_kits SET numero_envio = ? WHERE id = ?', [numero, row.id]);
    }
    if (rows.length) {
      console.log(`  ✓ Numeros de envio atribuidos a ${rows.length} registo(s) existente(s)`);
    }
  } catch (error) {
    console.log('  ⚠ Erro ao preencher numero_envio:', error.message);
  }
};
