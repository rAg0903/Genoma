const pool = require('../config/database');

exports.create = async (data) => {
    const connection = await pool.getConnection();
    try {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();
        
        await connection.execute(
            `INSERT INTO logs_auditoria (id, empresa_id, utilizador_id, acao, tabela_afetada, registro_id) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.empresa_id || null,
                data.utilizador_id || null,
                data.acao,
                data.tabela_afetada,
                data.registro_id || null
            ]
        );
        
        return {
            id,
            ...data,
            data: new Date()
        };
    } finally {
        connection.release();
    }
};

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT l.*, u.nome as utilizador_nome, e.nome as empresa_nome
            FROM logs_auditoria l
            LEFT JOIN utilizadores u ON l.utilizador_id = u.id
            LEFT JOIN empresas e ON l.empresa_id = e.id
            ORDER BY l.data DESC
        `);
        return rows;
    } finally {
        connection.release();
    }
};

exports.findByUtilizador = async (utilizadorId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT l.*, u.nome as utilizador_nome, e.nome as empresa_nome
            FROM logs_auditoria l
            LEFT JOIN utilizadores u ON l.utilizador_id = u.id
            LEFT JOIN empresas e ON l.empresa_id = e.id
            WHERE l.utilizador_id = ?
            ORDER BY l.data DESC
        `, [utilizadorId]);
        return rows;
    } finally {
        connection.release();
    }
};

exports.findByEmpresa = async (empresaId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT l.*, u.nome as utilizador_nome
            FROM logs_auditoria l
            LEFT JOIN utilizadores u ON l.utilizador_id = u.id
            WHERE l.empresa_id = ?
            ORDER BY l.data DESC
        `, [empresaId]);
        return rows;
    } finally {
        connection.release();
    }
};