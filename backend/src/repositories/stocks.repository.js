const pool = require('../config/database');
const { faseForShipmentDestination } = require('../config/kit-lifecycle');

exports.findKits = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        k.id,
        k.codigo_barras,
        k.numero_kit,
        k.tracking,
        k.status,
        k.data_validade,
        k.localizacao,
        k.fase_ciclo,
        k.lote_id,
        k.empresa_id,
        k.posto_id,
        k.laboratorio_id,
        l.codigo_lote,
        l.tipo_kit_id,
        l.teste_id,
        tk.nome AS tipo_kit_nome,
        te.nome AS sub_teste_nome,
        tp.nome AS teste_pai_nome,
        CASE
          WHEN tp.id IS NOT NULL THEN CONCAT(tp.nome, ' — ', te.nome)
          ELSE te.nome
        END AS teste_nome
      FROM kits k
      LEFT JOIN lotes l ON k.lote_id = l.id
      LEFT JOIN tipos_kit tk ON tk.id = COALESCE(k.tipo_kit_id, l.tipo_kit_id)
      LEFT JOIN testes te ON te.id = COALESCE(
        (SELECT pr.teste_id FROM processos pr WHERE pr.kit_id = k.id ORDER BY pr.data_entrada DESC LIMIT 1),
        l.teste_id
      )
      LEFT JOIN testes tp ON te.teste_pai_id = tp.id
      ORDER BY k.codigo_barras ASC
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findLotes = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        l.id,
        l.codigo_lote,
        l.tipo_kit_id,
        l.tipo_teste,
        l.teste_id,
        l.data_rececao,
        l.quantidade,
        l.validade,
        l.estado,
        l.fornecedor_id,
        tk.nome AS tipo_kit_nome,
        te.nome AS sub_teste_nome,
        tp.nome AS teste_pai_nome,
        CASE
          WHEN tp.id IS NOT NULL THEN CONCAT(tp.nome, ' — ', te.nome)
          ELSE te.nome
        END AS teste_nome,
        f.nome AS fornecedor_nome,
        COUNT(k.id) AS kits_total,
        CASE
          WHEN COUNT(k.id) = 0 THEN l.quantidade
          ELSE SUM(CASE
            WHEN k.status = 'Disponivel' THEN 1
            ELSE 0
          END)
        END AS kits_disponiveis,
        MAX(k.data_validade) AS data_validade_max
      FROM lotes l
      LEFT JOIN tipos_kit tk ON tk.id = l.tipo_kit_id
      LEFT JOIN testes te ON te.id = l.teste_id
      LEFT JOIN testes tp ON te.teste_pai_id = tp.id
      LEFT JOIN empresas f ON f.id = l.fornecedor_id
      LEFT JOIN kits k ON k.lote_id = l.id
      GROUP BY l.id
      ORDER BY l.data_rececao DESC, l.codigo_lote ASC
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findLoteByCodigo = async (codigo) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT id, codigo_lote, fornecedor_id FROM lotes WHERE codigo_lote = ?',
      [codigo]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

const getMaxKitSequenceByPrefix = async (connection, prefix) => {
  const likePrefix = `KIT-${prefix}-%`;
  const [rows] = await connection.execute(
    `SELECT MAX(CAST(SUBSTRING_INDEX(codigo_barras, '-', -1) AS UNSIGNED)) AS max_seq
     FROM kits
     WHERE codigo_barras LIKE ?`,
    [likePrefix]
  );
  return Number(rows[0]?.max_seq || 0);
};

exports.createLoteWithKits = async (loteData, kits) => {
  const connection = await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    await connection.beginTransaction();

    const loteId = uuidv4();
    await connection.execute(
      `INSERT INTO lotes
        (id, codigo_lote, tipo_kit_id, data_rececao, quantidade, validade, fornecedor_id, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loteId,
        loteData.codigo_lote,
        loteData.tipo_kit_id || null,
        loteData.data_rececao || null,
        loteData.quantidade || 0,
        loteData.validade || null,
        loteData.fornecedor_id || null,
        loteData.estado || 'Disponivel',
      ]
    );

    if (kits.length > 0) {
      const values = kits.map((kit) => [
        uuidv4(),
        kit.numero_kit || null,
        kit.tracking || null,
        kit.codigo_barras,
        kit.tipo_kit_id || null,
        loteId,
        kit.empresa_id || null,
        kit.posto_id || null,
        kit.status || 'Disponivel',
        kit.localizacao || 'Escritorio',
        kit.data_validade || null,
      ]);

      await connection.query(
        `INSERT INTO kits
          (id, numero_kit, tracking, codigo_barras, tipo_kit_id, lote_id, empresa_id, posto_id, status, localizacao, data_validade)
          VALUES ?`,
        [values]
      );
    }

    await connection.commit();

    return {
      id: loteId,
      ...loteData,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getMaxKitSequenceByPrefix = async (prefix) => {
  const connection = await pool.getConnection();
  try {
    return await getMaxKitSequenceByPrefix(connection, prefix);
  } finally {
    connection.release();
  }
};

exports.createLote = async (data) => {
  const connection = await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    await connection.execute(
      `INSERT INTO lotes
        (id, codigo_lote, tipo_kit_id, tipo_teste, teste_id, data_rececao, quantidade, validade, fornecedor_id, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        id,
        data.codigo_lote,
        data.tipo_kit_id || null,
        data.tipo_teste || null,
        data.teste_id || null,
        data.data_rececao || null,
        data.quantidade || 0,
        data.validade || null,
        data.fornecedor_id || null,
        data.estado || 'Disponivel',
      ]
    );

    return {
      id,
      codigo_lote: data.codigo_lote,
      tipo_kit_id: data.tipo_kit_id || null,
      data_rececao: data.data_rececao || null,
      quantidade: data.quantidade || 0,
      validade: data.validade || null,
      fornecedor_id: data.fornecedor_id || null,
      estado: data.estado || 'Disponivel',
    };
  } finally {
    connection.release();
  }
};

exports.generateNumeroEnvio = async (externalConnection = null) => {
  const ownsConnection = !externalConnection;
  const connection = externalConnection || await pool.getConnection();
  try {
    const year = new Date().getFullYear();
    const prefix = `ENV-${year}-`;
    const [rows] = await connection.execute(
      `SELECT numero_envio FROM requisicoes_kits
       WHERE numero_envio LIKE ?
       ORDER BY numero_envio DESC
       LIMIT 1`,
      [`${prefix}%`],
    );

    let next = 1;
    if (rows[0]?.numero_envio) {
      const seq = parseInt(String(rows[0].numero_envio).slice(prefix.length), 10);
      if (!Number.isNaN(seq)) next = seq + 1;
    }

    return `${prefix}${String(next).padStart(5, '0')}`;
  } finally {
    if (ownsConnection) connection.release();
  }
};

exports.findRequisicoes = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        r.id,
        r.numero_envio,
        r.data,
        r.origem,
        r.destino,
        r.quantidade,
        r.status,
        r.tracking_number,
        r.transportadora,
        r.observacoes,
        r.lote_id,
        r.utilizador_id,
        MAX(u.nome) AS utilizador_nome,
        r.origem_empresa_id,
        r.origem_posto_id,
        r.origem_laboratorio_id,
        r.destino_empresa_id,
        r.destino_posto_id,
        r.destino_laboratorio_id,
        r.origem_nome,
        r.destino_nome,
        l.codigo_lote,
        COUNT(ri.id) AS itens_count,
        GROUP_CONCAT(DISTINCT ri.kit_id ORDER BY k.codigo_barras SEPARATOR ',') AS kit_ids_concat,
        GROUP_CONCAT(DISTINCT NULLIF(k.tracking, '') ORDER BY k.codigo_barras SEPARATOR ', ') AS kits_tracking
      FROM requisicoes_kits r
      LEFT JOIN utilizadores u ON u.id = r.utilizador_id
      LEFT JOIN lotes l ON l.id = r.lote_id
      LEFT JOIN requisicao_kits_itens ri ON ri.requisicao_id = r.id
      LEFT JOIN kits k ON k.id = ri.kit_id
      GROUP BY r.id
      ORDER BY r.numero_envio DESC, r.created_at DESC
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findMovimentos = async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT
        m.id,
        m.data,
        m.origem,
        m.destino,
        m.motivo,
        m.observacoes,
        k.codigo_barras
      FROM movimentos_kits m
      INNER JOIN kits k ON k.id = m.kit_id
      ORDER BY m.data DESC, m.created_at DESC
    `);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findMovimentosByKitId = async (kitId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, data, origem, destino, motivo, observacoes, processo_id
       FROM movimentos_kits WHERE kit_id = ? ORDER BY data DESC, created_at DESC`,
      [kitId],
    );
    return rows;
  } finally {
    connection.release();
  }
};

exports.findKitById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT k.id, k.codigo_barras, k.numero_kit, k.tracking, k.status, k.localizacao, k.fase_ciclo, k.data_validade,
              k.tipo_kit_id, k.lote_id, k.empresa_id, k.posto_id, k.laboratorio_id,
              l.codigo_lote, tk.nome AS tipo_kit_nome
       FROM kits k
       LEFT JOIN lotes l ON l.id = k.lote_id
       LEFT JOIN tipos_kit tk ON tk.id = COALESCE(k.tipo_kit_id, l.tipo_kit_id)
       WHERE k.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.createKit = async (data) => {
  const connection = await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    await connection.execute(
      `INSERT INTO kits
        (id, numero_kit, tracking, codigo_barras, tipo_kit_id, lote_id, empresa_id, posto_id, status, localizacao, data_validade)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.numero_kit || null,
        data.tracking || null,
        data.codigo_barras,
        data.tipo_kit_id || null,
        data.lote_id || null,
        data.empresa_id || null,
        data.posto_id || null,
        data.status || 'Disponivel',
        data.localizacao || 'Escritorio',
        data.data_validade || null,
      ]
    );
    return { id };
  } finally {
    connection.release();
  }
};

exports.updateKit = async (id, fields) => {
  const connection = await pool.getConnection();
  try {
    const allowed = ['codigo_barras', 'tracking', 'tipo_kit_id', 'lote_id', 'empresa_id', 'posto_id', 'laboratorio_id', 'status', 'localizacao', 'data_validade'];
    const sets = [];
    const params = [];
    allowed.forEach((key) => {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(fields[key]);
      }
    });
    if (sets.length === 0) return;
    params.push(id);
    await connection.execute(`UPDATE kits SET ${sets.join(', ')} WHERE id = ?`, params);
  } finally {
    connection.release();
  }
};

exports.deleteKit = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM kits WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
};

exports.updateLote = async (id, fields) => {
  const connection = await pool.getConnection();
  try {
    const allowed = ['codigo_lote', 'tipo_kit_id', 'tipo_teste', 'teste_id', 'data_rececao', 'quantidade', 'validade', 'fornecedor_id', 'estado'];
    const sets = [];
    const params = [];
    allowed.forEach((key) => {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        params.push(fields[key]);
      }
    });
    if (sets.length === 0) return;
    params.push(id);
    await connection.execute(`UPDATE lotes SET ${sets.join(', ')} WHERE id = ?`, params);
  } finally {
    connection.release();
  }
};

exports.findLoteById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT id, codigo_lote FROM lotes WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.deleteMovimento = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [res] = await connection.execute('DELETE FROM movimentos_kits WHERE id = ?', [id]);
    return res.affectedRows > 0;
  } finally {
    connection.release();
  }
};

exports.findKitByCodigo = async (codigoBarras) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT k.id, k.codigo_barras, k.status,
              p.numero_processo,
              pac.nome AS paciente_nome
       FROM kits k
       LEFT JOIN processos p ON p.kit_id = k.id
       LEFT JOIN pacientes pac ON pac.id = p.paciente_id
       WHERE k.codigo_barras = ? LIMIT 1`,
      [codigoBarras]
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findKitsByIdsForShipment = async ({
  kitIds,
  origem,
  loteId,
  origemEmpresaId = null,
  origemPostoId = null,
  origemLaboratorioId = null,
}) => {
  if (!kitIds?.length) return [];
  const connection = await pool.getConnection();
  try {
    const placeholders = kitIds.map(() => '?').join(',');
    const params = [...kitIds, origem];
    let sql = `
      SELECT k.id, k.codigo_barras, k.tracking
      FROM kits k
      WHERE k.id IN (${placeholders})
        AND k.status = 'Disponivel'
        AND k.localizacao = ?
    `;
    if (origem === 'Escritorio' && origemEmpresaId) {
      sql += ' AND (k.empresa_id = ? OR k.empresa_id IS NULL)';
      params.push(origemEmpresaId);
    }
    if (origem === 'Posto' && origemPostoId) {
      sql += ' AND k.posto_id = ?';
      params.push(origemPostoId);
    }
    if (origem === 'Laboratorio' && origemLaboratorioId) {
      sql += ' AND k.laboratorio_id = ?';
      params.push(origemLaboratorioId);
    }
    sql += ` AND (k.fase_ciclo IS NULL OR k.fase_ciclo IN ('em_empresa', 'em_posto_aguarda'))
      AND k.laboratorio_id IS NULL`;
    if (loteId) {
      sql += ' AND k.lote_id = ?';
      params.push(loteId);
    }
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findKitsByIdsForDescarte = async ({
  kitIds,
  origem,
  origemEmpresaId = null,
  origemPostoId = null,
}) => {
  if (!kitIds?.length) return [];
  const connection = await pool.getConnection();
  try {
    const placeholders = kitIds.map(() => '?').join(',');
    const params = [...kitIds, origem];
    let sql = `
      SELECT k.id, k.codigo_barras, k.tracking, k.status, k.data_validade
      FROM kits k
      WHERE k.id IN (${placeholders})
        AND k.localizacao = ?
        AND (k.fase_ciclo IS NULL OR k.fase_ciclo NOT IN ('em_lab_final', 'em_transito_lab'))
        AND (
          k.fase_ciclo = 'aguarda_envio_lab'
          OR k.status IN ('Utilizado', 'Expirado')
          OR (k.status = 'Disponivel' AND k.data_validade IS NOT NULL AND k.data_validade < CURDATE())
        )
    `;
    if (origem === 'Escritorio' && origemEmpresaId) {
      sql += ' AND (k.empresa_id = ? OR k.empresa_id IS NULL)';
      params.push(origemEmpresaId);
    }
    if (origem === 'Posto' && origemPostoId) {
      sql += ' AND k.posto_id = ?';
      params.push(origemPostoId);
    }
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

exports.findAvailableKits = async ({ origem, loteId, quantidade }) => {
  const connection = await pool.getConnection();
  try {
    const params = [origem];
    let sql = `
      SELECT k.id, k.codigo_barras, k.tracking
      FROM kits k
      WHERE k.status = 'Disponivel'
        AND k.localizacao = ?
    `;

    if (loteId) {
      sql += ' AND k.lote_id = ?';
      params.push(loteId);
    }

    sql += ' ORDER BY k.codigo_barras ASC LIMIT ?';
    params.push(Number(quantidade));

    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

exports.createRequisicaoWithKits = async ({ requisicao, kits, movimentos, destinoRef = {}, connection: externalConnection = null }) => {
  const ownsConnection = !externalConnection;
  const connection = externalConnection || await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    if (ownsConnection) await connection.beginTransaction();

    const requisicaoId = uuidv4();
    await connection.execute(
      `INSERT INTO requisicoes_kits
        (id, numero_envio, utilizador_id, data, origem, destino, quantidade, status, tracking_number, transportadora, lote_id, observacoes,
         origem_empresa_id, origem_posto_id, origem_laboratorio_id,
         destino_empresa_id, destino_posto_id, destino_laboratorio_id,
         origem_nome, destino_nome)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        requisicaoId,
        requisicao.numero_envio || null,
        requisicao.utilizador_id || null,
        requisicao.data,
        requisicao.origem,
        requisicao.destino,
        requisicao.quantidade,
        requisicao.status,
        requisicao.tracking_number || null,
        requisicao.transportadora || null,
        requisicao.lote_id || null,
        requisicao.observacoes || null,
        requisicao.origem_empresa_id || null,
        requisicao.origem_posto_id || null,
        requisicao.origem_laboratorio_id || null,
        requisicao.destino_empresa_id || null,
        requisicao.destino_posto_id || null,
        requisicao.destino_laboratorio_id || null,
        requisicao.origem_nome || null,
        requisicao.destino_nome || null,
      ]
    );

    if (kits.length > 0) {
      const itemValues = kits.map((kit) => [uuidv4(), requisicaoId, kit.id]);
      await connection.query(
        `INSERT INTO requisicao_kits_itens
          (id, requisicao_id, kit_id)
          VALUES ?`,
        [itemValues]
      );

      const kitIds = kits.map((kit) => kit.id);
      const placeholders = kitIds.map(() => '?').join(',');
      const kitStatus = requisicao.kit_status || 'Disponivel';
      const faseCiclo = faseForShipmentDestination(requisicao.destino, kitStatus);
      await connection.execute(
        `UPDATE kits
          SET status = ?, localizacao = ?, empresa_id = ?, posto_id = ?, laboratorio_id = ?, fase_ciclo = ?
          WHERE id IN (${placeholders})`,
        [
          kitStatus,
          requisicao.destino,
          destinoRef.empresa_id || null,
          destinoRef.posto_id || null,
          destinoRef.laboratorio_id || null,
          faseCiclo,
          ...kitIds,
        ]
      );
    }

    if (movimentos.length > 0) {
      const movValues = movimentos.map((mov) => [
        require('uuid').v4(),
        mov.data,
        mov.kit_id,
        mov.origem,
        mov.destino,
        mov.motivo,
        mov.observacoes || null,
        requisicaoId,
        mov.processo_id || null,
        mov.origem_empresa_id || requisicao.origem_empresa_id || null,
        mov.origem_posto_id || requisicao.origem_posto_id || null,
        mov.origem_laboratorio_id || requisicao.origem_laboratorio_id || null,
        mov.destino_empresa_id || requisicao.destino_empresa_id || null,
        mov.destino_posto_id || requisicao.destino_posto_id || null,
        mov.destino_laboratorio_id || requisicao.destino_laboratorio_id || null,
      ]);

      await connection.query(
        `INSERT INTO movimentos_kits
          (id, data, kit_id, origem, destino, motivo, observacoes, requisicao_id, processo_id,
           origem_empresa_id, origem_posto_id, origem_laboratorio_id,
           destino_empresa_id, destino_posto_id, destino_laboratorio_id)
          VALUES ?`,
        [movValues]
      );
    }

    if (ownsConnection) await connection.commit();
    return { id: requisicaoId, ...requisicao };
  } catch (error) {
    if (ownsConnection) await connection.rollback();
    throw error;
  } finally {
    if (ownsConnection) connection.release();
  }
};

exports.findRequisicaoById = async (id) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT r.*, l.codigo_lote, u.nome AS utilizador_nome
       FROM requisicoes_kits r
       LEFT JOIN lotes l ON l.id = r.lote_id
       LEFT JOIN utilizadores u ON u.id = r.utilizador_id
       WHERE r.id = ?
       LIMIT 1`,
      [id],
    );
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

exports.findKitIdsByRequisicaoId = async (requisicaoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT kit_id FROM requisicao_kits_itens WHERE requisicao_id = ? ORDER BY kit_id',
      [requisicaoId],
    );
    return rows.map((row) => row.kit_id);
  } finally {
    connection.release();
  }
};

exports.updateRequisicao = async (id, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `UPDATE requisicoes_kits
        SET data = ?, origem = ?, destino = ?, quantidade = ?, status = ?, tracking_number = ?, transportadora = ?, observacoes = ?,
            origem_empresa_id = ?, origem_posto_id = ?, origem_laboratorio_id = ?,
            destino_empresa_id = ?, destino_posto_id = ?, destino_laboratorio_id = ?,
            origem_nome = ?, destino_nome = ?
        WHERE id = ?`,
      [
        data.data,
        data.origem,
        data.destino,
        data.quantidade,
        data.status,
        data.tracking_number || null,
        data.transportadora || null,
        data.observacoes || null,
        data.origem_empresa_id || null,
        data.origem_posto_id || null,
        data.origem_laboratorio_id || null,
        data.destino_empresa_id || null,
        data.destino_posto_id || null,
        data.destino_laboratorio_id || null,
        data.origem_nome || null,
        data.destino_nome || null,
        id,
      ],
    );
  } finally {
    connection.release();
  }
};

exports.updateRequisicaoWithKits = async (id, { requisicao, destinoRef, kitIds }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE requisicoes_kits
        SET data = ?, origem = ?, destino = ?, quantidade = ?, status = ?, tracking_number = ?, transportadora = ?, observacoes = ?,
            origem_empresa_id = ?, origem_posto_id = ?, origem_laboratorio_id = ?,
            destino_empresa_id = ?, destino_posto_id = ?, destino_laboratorio_id = ?,
            origem_nome = ?, destino_nome = ?
        WHERE id = ?`,
      [
        requisicao.data,
        requisicao.origem,
        requisicao.destino,
        requisicao.quantidade,
        requisicao.status,
        requisicao.tracking_number || null,
        requisicao.transportadora || null,
        requisicao.observacoes || null,
        requisicao.origem_empresa_id || null,
        requisicao.origem_posto_id || null,
        requisicao.origem_laboratorio_id || null,
        requisicao.destino_empresa_id || null,
        requisicao.destino_posto_id || null,
        requisicao.destino_laboratorio_id || null,
        requisicao.origem_nome || null,
        requisicao.destino_nome || null,
        id,
      ],
    );

    if (kitIds.length > 0) {
      const placeholders = kitIds.map(() => '?').join(',');
      const kitStatus = requisicao.kit_status || 'Disponivel';
      const faseCiclo = faseForShipmentDestination(requisicao.destino, kitStatus);
      await connection.execute(
        `UPDATE kits
          SET status = ?, localizacao = ?, empresa_id = ?, posto_id = ?, laboratorio_id = ?, fase_ciclo = ?
          WHERE id IN (${placeholders})`,
        [
          kitStatus,
          requisicao.destino,
          destinoRef.empresa_id || null,
          destinoRef.posto_id || null,
          destinoRef.laboratorio_id || null,
          faseCiclo,
          ...kitIds,
        ],
      );

      await connection.execute(
        'UPDATE movimentos_kits SET destino = ? WHERE requisicao_id = ?',
        [requisicao.destino, id],
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.deleteRequisicao = async (id) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute('DELETE FROM requisicoes_kits WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
};

exports.createMovimento = async (data) => {
  const connection = await pool.getConnection();
  try {
    const { v4: uuidv4 } = require('uuid');
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE kits
        SET status = ?, localizacao = ?, posto_id = ?
        WHERE id = ?`,
      [
        data.kit_status,
        data.destino,
        data.destino_posto_id || null,
        data.kit_id,
      ]
    );

    const movId = uuidv4();
    await connection.execute(
      `INSERT INTO movimentos_kits
        (id, data, kit_id, origem, destino, motivo, observacoes, requisicao_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        movId,
        data.data,
        data.kit_id,
        data.origem,
        data.destino,
        data.motivo,
        data.observacoes || null,
        data.requisicao_id || null,
      ]
    );

    await connection.commit();
    return movId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
