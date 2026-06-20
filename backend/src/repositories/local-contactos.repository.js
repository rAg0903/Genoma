const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const CONFIG = {
  posto: {
    table: 'posto_contactos_secundarios',
    fk: 'posto_id',
  },
  laboratorio: {
    table: 'laboratorio_contactos_secundarios',
    fk: 'laboratorio_id',
  },
  entidade: {
    table: 'entidade_contactos_secundarios',
    fk: 'entidade_id',
  },
};

const mapRow = (row) => ({
  nome: row.nome || '',
  funcao: row.funcao || '',
  email: row.email || '',
  telefone: row.telefone || '',
});

exports.findContactosMap = async (kind, ids = []) => {
  const cfg = CONFIG[kind];
  if (!cfg || !ids.length) return new Map();

  const connection = await pool.getConnection();
  try {
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT ${cfg.fk} AS local_id, ordem, nome, funcao, email, telefone
       FROM ${cfg.table}
       WHERE ${cfg.fk} IN (${placeholders})
       ORDER BY ${cfg.fk} ASC, ordem ASC`,
      ids
    );

    const map = new Map();
    rows.forEach((row) => {
      const key = row.local_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(mapRow(row));
    });
    return map;
  } finally {
    connection.release();
  }
};

exports.replaceContactos = async (kind, localId, contactos = []) => {
  const cfg = CONFIG[kind];
  if (!cfg || !localId) return;

  const connection = await pool.getConnection();
  try {
    await connection.execute(`DELETE FROM ${cfg.table} WHERE ${cfg.fk} = ?`, [localId]);
    const items = (contactos || []).slice(0, 3);
    for (let i = 0; i < items.length; i += 1) {
      const c = items[i];
      const hasData = [c.nome, c.funcao, c.email, c.telefone].some((v) => String(v || '').trim());
      if (!hasData) continue;
      await connection.execute(
        `INSERT INTO ${cfg.table} (id, ${cfg.fk}, ordem, nome, funcao, email, telefone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          localId,
          i + 1,
          c.nome || null,
          c.funcao || null,
          c.email || null,
          c.telefone || null,
        ]
      );
    }
  } finally {
    connection.release();
  }
};
