const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const CONFIG = {
  posto: {
    table: 'posto_condicoes_testes',
    fk: 'posto_id',
  },
  laboratorio: {
    table: 'laboratorio_condicoes_testes',
    fk: 'laboratorio_id',
  },
  entidade: {
    table: 'entidade_condicoes_testes',
    fk: 'entidade_id',
  },
};

const mapRow = (row) => ({
  teste_id: row.teste_id,
  comissao: row.comissao != null ? Number(row.comissao) : null,
  prazo_pagamento_dias: row.prazo_pagamento_dias != null ? Number(row.prazo_pagamento_dias) : null,
});

exports.findCondicoesMap = async (kind, ids = []) => {
  const cfg = CONFIG[kind];
  if (!cfg || !ids.length) return new Map();

  const connection = await pool.getConnection();
  try {
    const placeholders = ids.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT ${cfg.fk} AS local_id, teste_id, comissao, prazo_pagamento_dias
       FROM ${cfg.table}
       WHERE ${cfg.fk} IN (${placeholders})
       ORDER BY ${cfg.fk} ASC`,
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

exports.replaceCondicoes = async (kind, localId, condicoes = []) => {
  const cfg = CONFIG[kind];
  if (!cfg || !localId) return;

  const connection = await pool.getConnection();
  try {
    await connection.execute(`DELETE FROM ${cfg.table} WHERE ${cfg.fk} = ?`, [localId]);
    for (const row of condicoes) {
      if (!row?.teste_id) continue;
      const comissao = row.comissao != null && row.comissao !== '' ? Number(row.comissao) : null;
      const prazo = row.prazo_pagamento_dias != null && row.prazo_pagamento_dias !== ''
        ? parseInt(row.prazo_pagamento_dias, 10)
        : null;
      if (comissao == null && (prazo == null || Number.isNaN(prazo))) continue;
      await connection.execute(
        `INSERT INTO ${cfg.table} (id, ${cfg.fk}, teste_id, comissao, prazo_pagamento_dias)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), localId, row.teste_id, comissao, Number.isNaN(prazo) ? null : prazo]
      );
    }
  } finally {
    connection.release();
  }
};
