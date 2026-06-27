const pool = require('../config/database');
const kitLifecycleService = require('../services/kit-lifecycle.service');

/** Kits físicos são iguais por tipo_kit; sub-teste só afecta preço/resultados. */
const SQL_KIT_MATCHES_TESTE = `
  EXISTS (
    SELECT 1
    FROM testes t_sel
    LEFT JOIN testes t_pai ON t_pai.id = t_sel.teste_pai_id
    INNER JOIN tipos_kit tkt ON TRIM(tkt.nome) = TRIM(COALESCE(t_pai.tipo_kit, t_sel.tipo_kit))
    WHERE t_sel.id = ?
      AND (k.tipo_kit_id = tkt.id OR l.tipo_kit_id = tkt.id)
  )
`;

const COLUMNS = [
  'nome', 'codigo_posto', 'entidade_id', 'laboratorio_id', 'morada', 'codigo_postal',
  'cidade', 'distrito', 'pais', 'contacto', 'email', 'notas', 'ativo',
];

exports.findAll = async (laboratorioId = null) => {
  const connection = await pool.getConnection();
  try {
    if (laboratorioId) {
      const [rows] = await connection.execute(
        'SELECT * FROM postos WHERE laboratorio_id = ? ORDER BY nome ASC',
        [laboratorioId]
      );
      return rows;
    }
    const [rows] = await connection.execute('SELECT * FROM postos ORDER BY nome ASC');
    return rows;
  } finally {
    connection.release();
  }
};

exports.findById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM postos WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findByCodigo = async (codigo) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM postos WHERE codigo_posto = ? LIMIT 1', [codigo]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    await connection.execute(
      `INSERT INTO postos
        (id, nome, codigo_posto, entidade_id, laboratorio_id, morada, codigo_postal, cidade, distrito, pais, contacto, email, notas, ativo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.nome,
        data.codigo_posto || null,
        data.entidade_id || null,
        data.laboratorio_id || null,
        data.morada || null,
        data.codigo_postal || null,
        data.cidade || null,
        data.distrito || null,
        data.pais || null,
        data.contacto || null,
        data.email || null,
        data.notas || null,
        data.ativo === undefined ? true : !!data.ativo,
      ]
    );
    return { id };
  } finally {
    connection.release();
  }
};

exports.update = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    const sets = [];
    const params = [];
    COLUMNS.forEach((key) => {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(data[key]);
      }
    });
    if (sets.length === 0) return false;
    params.push(id);
    const [res] = await connection.execute(`UPDATE postos SET ${sets.join(', ')} WHERE id = ?`, params);
    return res.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.delete = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [res] = await connection.execute('DELETE FROM postos WHERE id = ?', [id]);
    return res.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.countKits = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT COUNT(*) AS count FROM kits WHERE posto_id = ?', [id]);
    return Number(rows[0]?.count || 0);
  } finally {
    connection.release();
  }
};

exports.countKitsDisponiveis = async (id, testeId = null) => {
  const connection = await pool.getConnection();
  try {
    let sql = `SELECT COUNT(*) AS count FROM kits k
       LEFT JOIN lotes l ON l.id = k.lote_id
       WHERE k.posto_id = ? AND k.status = 'Disponivel' AND k.localizacao = 'Posto'`;
    const params = [id];
    if (testeId) {
      sql += ` AND ${SQL_KIT_MATCHES_TESTE}`;
      params.push(testeId);
    }
    const [rows] = await connection.execute(sql, params);
    return Number(rows[0]?.count || 0);
  } finally {
    connection.release();
  }
};

// Marca um kit como Utilizado e regista o movimento interno (auditoria).
exports.usarKit = async (kitId, { processoId = null, postoId = null, laboratorioFinalId = null } = {}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      'SELECT id, posto_id FROM kits WHERE id = ? LIMIT 1',
      [kitId],
    );
    if (!rows[0]) {
      await connection.rollback();
      return false;
    }

    await kitLifecycleService.consumeAtColheita(connection, {
      kitId,
      processoId,
      postoId: postoId || rows[0].posto_id,
      dataEfetiva: new Date().toISOString(),
      laboratorioFinalId,
    });

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.findKitsDisponiveis = async (id, testeId = null) => {
  const connection = await pool.getConnection();
  try {
    let sql = `SELECT k.id, k.codigo_barras, k.tracking, k.data_validade, tk.nome AS tipo_kit_nome, te.nome AS teste_nome, l.teste_id
       FROM kits k
       LEFT JOIN tipos_kit tk ON tk.id = k.tipo_kit_id
       LEFT JOIN lotes l ON l.id = k.lote_id
       LEFT JOIN testes te ON te.id = l.teste_id
       WHERE k.posto_id = ? AND k.status = 'Disponivel' AND k.localizacao = 'Posto'`;
    const params = [id];
    if (testeId) {
      sql += ` AND ${SQL_KIT_MATCHES_TESTE}`;
      params.push(testeId);
    }
    sql += ' ORDER BY k.data_validade ASC, k.codigo_barras ASC';
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};
