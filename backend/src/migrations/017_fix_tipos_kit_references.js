const { v4: uuidv4 } = require('uuid');

const upsertTipoKit = async (db, nome) => {
  const label = String(nome || '').trim();
  if (!label) return null;

  const [existing] = await db.execute('SELECT id FROM tipos_kit WHERE nome = ? LIMIT 1', [label]);
  if (existing[0]) return existing[0].id;

  const id = uuidv4();
  await db.execute('INSERT INTO tipos_kit (id, nome, ativo) VALUES (?, ?, TRUE)', [id, label]);
  return id;
};

const dropFkIfExists = async (db, table, constraint) => {
  try {
    await db.execute(`ALTER TABLE ${table} DROP FOREIGN KEY ${constraint}`);
    console.log(`  ✓ FK ${constraint} removida de ${table}`);
  } catch (error) {
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log(`  ℹ FK ${constraint} nao existe em ${table}`);
    } else {
      console.log(`  ⚠ Erro ao remover FK ${constraint}:`, error.message);
    }
  }
};

module.exports.up = async (db) => {
  await dropFkIfExists(db, 'lotes', 'fk_lotes_tipo_kit');
  await dropFkIfExists(db, 'kits', 'fk_kits_tipo_kit');

  try {
    const [refs] = await db.execute(`
      SELECT DISTINCT tipo_kit_id AS id
      FROM (
        SELECT tipo_kit_id FROM lotes WHERE tipo_kit_id IS NOT NULL
        UNION
        SELECT tipo_kit_id FROM kits WHERE tipo_kit_id IS NOT NULL
      ) refs
    `);

    for (const ref of refs) {
      const [testes] = await db.execute('SELECT nome, tipo_kit FROM testes WHERE id = ? LIMIT 1', [ref.id]);
      let nome = null;
      if (testes[0]) {
        nome = (testes[0].tipo_kit && String(testes[0].tipo_kit).trim()) || testes[0].nome;
      } else {
        const [tipos] = await db.execute('SELECT nome FROM tipos_kit WHERE id = ? LIMIT 1', [ref.id]);
        if (tipos[0]) continue;
      }

      const tipoKitId = nome ? await upsertTipoKit(db, nome) : null;
      if (!tipoKitId) {
        await db.execute('UPDATE lotes SET tipo_kit_id = NULL WHERE tipo_kit_id = ?', [ref.id]);
        await db.execute('UPDATE kits SET tipo_kit_id = NULL WHERE tipo_kit_id = ?', [ref.id]);
        continue;
      }

      await db.execute('UPDATE lotes SET tipo_kit_id = ? WHERE tipo_kit_id = ?', [tipoKitId, ref.id]);
      await db.execute('UPDATE kits SET tipo_kit_id = ? WHERE tipo_kit_id = ?', [tipoKitId, ref.id]);
    }
    console.log('  ✓ Referencias de lotes/kits alinhadas com tipos_kit');
  } catch (error) {
    console.log('  ⚠ Erro ao alinhar referencias:', error.message);
  }

  try {
    await db.execute(`
      ALTER TABLE lotes
        ADD CONSTRAINT fk_lotes_tipo_kit FOREIGN KEY (tipo_kit_id) REFERENCES tipos_kit(id);
    `);
    console.log('  ✓ FK fk_lotes_tipo_kit criada em lotes -> tipos_kit');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('  ℹ FK fk_lotes_tipo_kit ja existe em lotes');
    } else {
      console.log('  ⚠ Erro ao criar FK fk_lotes_tipo_kit:', error.message);
    }
  }

  try {
    await db.execute(`
      ALTER TABLE kits
        ADD CONSTRAINT fk_kits_tipo_kit FOREIGN KEY (tipo_kit_id) REFERENCES tipos_kit(id);
    `);
    console.log('  ✓ FK fk_kits_tipo_kit criada em kits -> tipos_kit');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_CANT_CREATE_TABLE') {
      console.log('  ℹ FK fk_kits_tipo_kit ja existe em kits');
    } else {
      console.log('  ⚠ Erro ao criar FK fk_kits_tipo_kit:', error.message);
    }
  }
};
