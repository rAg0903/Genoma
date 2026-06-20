const pool = require('../config/database');

exports.findByTeste = async (testeId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT tc.teste_id, tc.item_id, ip.codigo, ip.descricao
            FROM teste_composicao tc
            JOIN itens_pesquisa ip ON tc.item_id = ip.id
            WHERE tc.teste_id = ?
            ORDER BY ip.codigo ASC
        `, [testeId]);
        return rows;
    } finally {
        connection.release();
    }
};

exports.findByItem = async (itemId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT tc.teste_id, tc.item_id, t.nome
            FROM teste_composicao tc
            JOIN testes t ON tc.teste_id = t.id
            WHERE tc.item_id = ?
            ORDER BY t.nome ASC
        `, [itemId]);
        return rows;
    } finally {
        connection.release();
    }
};

exports.findByComposicao = async (testeId, itemId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM teste_composicao WHERE teste_id = ? AND item_id = ?',
            [testeId, itemId]
        );
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.create = async (data) => {
    const connection = await pool.getConnection();
    try {
        await connection.execute(
            'INSERT INTO teste_composicao (teste_id, item_id) VALUES (?, ?)',
            [data.teste_id, data.item_id]
        );
        
        return {
            teste_id: data.teste_id,
            item_id: data.item_id
        };
    } finally {
        connection.release();
    }
};

exports.delete = async (testeId, itemId) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute(
            'DELETE FROM teste_composicao WHERE teste_id = ? AND item_id = ?',
            [testeId, itemId]
        );
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};
