const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.findByProcesso = async (processoId) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT id, processo_id, semanas_gravidez, dias_gravidez, tipo_gravidez,
              quer_saber_sexo, motivo_prescricao, gestacao_registada_em, data_registo
       FROM informacao_clinica
       WHERE processo_id = ?
       ORDER BY data_registo DESC`,
      [processoId]
    );
    return rows;
  } finally {
    connection.release();
  }
};

const normalizeTipoGravidez = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'gemelar') return 'gemelar';
  if (normalized === 'singular') return 'singular';
  return null;
};

exports.create = async (data) => {
  const connection = await pool.getConnection();
  try {
    const id = uuidv4();
    const tipoGravidez = normalizeTipoGravidez(data.tipo_gravidez);
    await connection.execute(
      `INSERT INTO informacao_clinica
        (id, processo_id, semanas_gravidez, dias_gravidez, tipo_gravidez, quer_saber_sexo, motivo_prescricao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.processo_id,
        data.semanas_gravidez || null,
        data.dias_gravidez || null,
        tipoGravidez,
        data.quer_saber_sexo ? 1 : 0,
        data.motivo_prescricao || null,
      ]
    );
    return { id, ...data };
  } finally {
    connection.release();
  }
};

exports.upsertForProcesso = async (processoId, data = {}) => {
  const connection = await pool.getConnection();
  try {
    const tipoGravidez = normalizeTipoGravidez(data.tipo_gravidez);
    const motivo = data.motivo_prescricao || data.onde_seguida || null;
    const semanas = data.semanas_gravidez ?? data.gestacao_semanas_registo ?? null;
    const dias = data.dias_gravidez ?? data.gestacao_dias_registo ?? null;
    const gestacaoRegistadaEm = data.gestacao_registada_em || null;
    const [rows] = await connection.execute(
      `SELECT id FROM informacao_clinica WHERE processo_id = ? ORDER BY data_registo DESC LIMIT 1`,
      [processoId]
    );

    if (rows[0]) {
      await connection.execute(
        `UPDATE informacao_clinica
         SET tipo_gravidez = ?, motivo_prescricao = ?, semanas_gravidez = ?, dias_gravidez = ?, gestacao_registada_em = ?
         WHERE id = ?`,
        [tipoGravidez, motivo, semanas, dias, gestacaoRegistadaEm, rows[0].id]
      );
      return rows[0].id;
    }

    if (!tipoGravidez && !motivo && semanas == null && dias == null && !gestacaoRegistadaEm) return null;

    const id = uuidv4();
    await connection.execute(
      `INSERT INTO informacao_clinica
        (id, processo_id, semanas_gravidez, dias_gravidez, tipo_gravidez, motivo_prescricao, gestacao_registada_em, quer_saber_sexo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [id, processoId, semanas, dias, tipoGravidez, motivo, gestacaoRegistadaEm]
    );
    return id;
  } finally {
    connection.release();
  }
};
