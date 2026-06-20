const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const SELECT_BASE = `
  SELECT m.utilizador_id, m.num_ordem, m.especialidade, m.titulo, m.genero, m.pais,
         m.telefone_fixo, m.criterio_busca_postos, m.notas, m.ativo,
         u.nome, u.email, u.telefone AS telefone_movel
  FROM medicos m
  JOIN utilizadores u ON m.utilizador_id = u.id
`;

const mapRow = (row, contactos = [], locais = [], condicoes = []) => ({
  utilizador_id: row.utilizador_id,
  nome: row.nome,
  titulo: row.titulo || null,
  genero: row.genero || null,
  pais: row.pais || null,
  num_ordem: row.num_ordem || null,
  especialidade: row.especialidade || null,
  telefone_fixo: row.telefone_fixo || null,
  telefone_movel: row.telefone_movel || null,
  email: row.email,
  criterio_busca_postos: row.criterio_busca_postos || 'nome',
  notas: row.notas || null,
  ativo: row.ativo !== 0 && row.ativo !== false,
  contactos_secundarios: contactos,
  locais_trabalho: locais,
  condicoes_testes: condicoes,
});

exports.findContactosByMedico = async (medicoId, connection) => {
  const conn = connection || await pool.getConnection();
  const release = !connection;
  try {
    const [rows] = await conn.execute(
      `SELECT ordem, nome, funcao, email, telefone
       FROM medico_contactos_secundarios
       WHERE medico_id = ?
       ORDER BY ordem ASC`,
      [medicoId]
    );
    return rows.map((r) => ({
      nome: r.nome || '',
      funcao: r.funcao || '',
      email: r.email || '',
      telefone: r.telefone || '',
    }));
  } finally {
    if (release) conn.release();
  }
};

exports.findLocaisByMedico = async (medicoId, connection) => {
  const conn = connection || await pool.getConnection();
  const release = !connection;
  try {
    const [rows] = await conn.execute(
      `SELECT l.entidade_id, e.nome AS entidade_nome, e.cidade AS entidade_cidade
       FROM medico_locais_trabalho l
       JOIN entidades e ON e.id = l.entidade_id
       WHERE l.medico_id = ?
       ORDER BY e.nome ASC`,
      [medicoId]
    );
    return rows.map((r) => ({
      entidade_id: r.entidade_id,
      entidade_nome: r.entidade_nome,
      entidade_cidade: r.entidade_cidade || '',
    }));
  } finally {
    if (release) conn.release();
  }
};

exports.findCondicoesByMedico = async (medicoId, connection) => {
  const conn = connection || await pool.getConnection();
  const release = !connection;
  try {
    const [rows] = await conn.execute(
      `SELECT c.teste_id, t.nome AS teste_nome, c.comissao, c.prazo_pagamento_dias
       FROM medico_condicoes_testes c
       JOIN testes t ON t.id = c.teste_id
       WHERE c.medico_id = ?
       ORDER BY t.nome ASC`,
      [medicoId]
    );
    return rows.map((r) => ({
      teste_id: r.teste_id,
      teste_nome: r.teste_nome,
      comissao: r.comissao != null ? Number(r.comissao) : null,
      prazo_pagamento_dias: r.prazo_pagamento_dias != null ? Number(r.prazo_pagamento_dias) : null,
    }));
  } finally {
    if (release) conn.release();
  }
};

exports.findAll = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`${SELECT_BASE} ORDER BY u.nome ASC`);
    const result = [];
    for (const row of rows) {
      const contactos = await exports.findContactosByMedico(row.utilizador_id, connection);
      const locais = await exports.findLocaisByMedico(row.utilizador_id, connection);
      result.push(mapRow(row, contactos, locais, []));
    }
    return result;
  } finally {
    connection.release();
  }
};

exports.findById = async (utilizadorId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`${SELECT_BASE} WHERE m.utilizador_id = ?`, [utilizadorId]);
    if (!rows[0]) return null;
    const contactos = await exports.findContactosByMedico(utilizadorId, connection);
    const locais = await exports.findLocaisByMedico(utilizadorId, connection);
    const condicoes = await exports.findCondicoesByMedico(utilizadorId, connection);
    return mapRow(rows[0], contactos, locais, condicoes);
  } finally {
    connection.release();
  }
};

exports.findByNumOrdem = async (numOrdem) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`${SELECT_BASE} WHERE m.num_ordem = ?`, [numOrdem]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `INSERT INTO medicos
        (utilizador_id, num_ordem, especialidade, titulo, genero, pais, telefone_fixo, criterio_busca_postos, notas, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.utilizador_id,
        data.num_ordem || null,
        data.especialidade || null,
        data.titulo || null,
        data.genero || null,
        data.pais || 'Portugal',
        data.telefone_fixo || null,
        data.criterio_busca_postos || 'nome',
        data.notas || null,
        data.ativo !== false,
      ]
    );
    return exports.findById(data.utilizador_id);
  } finally {
    connection.release();
  }
};

exports.update = async (utilizadorId, data) => {
  const connection = await pool.getConnection();
  try {
    const updates = [];
    const values = [];
    const fields = [
      'num_ordem', 'especialidade', 'titulo', 'genero', 'pais',
      'telefone_fixo', 'criterio_busca_postos', 'notas', 'ativo',
    ];
    for (const field of fields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    if (updates.length > 0) {
      values.push(utilizadorId);
      await connection.execute(`UPDATE medicos SET ${updates.join(', ')} WHERE utilizador_id = ?`, values);
    }
    return true;
  } finally {
    connection.release();
  }
};

exports.replaceContactos = async (medicoId, contactos = []) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM medico_contactos_secundarios WHERE medico_id = ?', [medicoId]);
    const items = (contactos || []).slice(0, 3);
    for (let i = 0; i < items.length; i += 1) {
      const c = items[i];
      const hasData = [c.nome, c.funcao, c.email, c.telefone].some((v) => String(v || '').trim());
      if (!hasData) continue;
      await connection.execute(
        `INSERT INTO medico_contactos_secundarios (id, medico_id, ordem, nome, funcao, email, telefone)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), medicoId, i + 1, c.nome || null, c.funcao || null, c.email || null, c.telefone || null]
      );
    }
  } finally {
    connection.release();
  }
};

exports.replaceCondicoesTestes = async (medicoId, condicoes = []) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM medico_condicoes_testes WHERE medico_id = ?', [medicoId]);
    for (const row of condicoes) {
      if (!row.teste_id) continue;
      const comissao = row.comissao != null && row.comissao !== '' ? Number(row.comissao) : null;
      const prazo = row.prazo_pagamento_dias != null && row.prazo_pagamento_dias !== ''
        ? parseInt(row.prazo_pagamento_dias, 10)
        : null;
      if (comissao == null && (prazo == null || Number.isNaN(prazo))) continue;
      await connection.execute(
        `INSERT INTO medico_condicoes_testes (id, medico_id, teste_id, comissao, prazo_pagamento_dias)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), medicoId, row.teste_id, comissao, Number.isNaN(prazo) ? null : prazo]
      );
    }
  } finally {
    connection.release();
  }
};

exports.replaceLocaisTrabalho = async (medicoId, locais = []) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM medico_locais_trabalho WHERE medico_id = ?', [medicoId]);
    const ids = [...new Set((locais || []).map((l) => l.entidade_id).filter(Boolean))];
    for (const entidadeId of ids) {
      await connection.execute(
        'INSERT INTO medico_locais_trabalho (id, medico_id, entidade_id) VALUES (?, ?, ?)',
        [uuidv4(), medicoId, entidadeId]
      );
    }
  } finally {
    connection.release();
  }
};

exports.delete = async (utilizadorId) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute('DELETE FROM medicos WHERE utilizador_id = ?', [utilizadorId]);
    return result.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.existeNumOrdem = async (numOrdem, excluirUtilizadorId = null) => {
  if (!numOrdem) return false;
  const connection = await pool.getConnection();
  try {
    let query = 'SELECT COUNT(*) as count FROM medicos WHERE num_ordem = ?';
    const params = [numOrdem];
    if (excluirUtilizadorId) {
      query += ' AND utilizador_id != ?';
      params.push(excluirUtilizadorId);
    }
    const [rows] = await connection.execute(query, params);
    return rows[0].count > 0;
  } finally {
    connection.release();
  }
};

exports.countPedidosAssociados = async (utilizadorId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM pedidos_exames WHERE medico_id = ?', [utilizadorId]);
    return rows[0].count;
  } finally {
    connection.release();
  }
};

exports.countProcessosAssociados = async (utilizadorId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM processos WHERE medico_id = ?', [utilizadorId]);
    return rows[0].count;
  } finally {
    connection.release();
  }
};
