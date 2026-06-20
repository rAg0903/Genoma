const pool = require('../config/database');

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM itens_pesquisa ORDER BY codigo ASC');
        return rows;
    } finally {
        connection.release();
    }
};

exports.findById = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM itens_pesquisa WHERE id = ?', [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByCodigo = async (codigo) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM itens_pesquisa WHERE codigo = ?', [codigo]);
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
            'INSERT INTO itens_pesquisa (id, codigo, descricao) VALUES (?, ?, ?)',
            [id, data.codigo, data.descricao]
        );
        
        return {
            id,
            codigo: data.codigo,
            descricao: data.descricao
        };
    } finally {
        connection.release();
    }
};

exports.update = async (id, data) => {
    const connection = await pool.getConnection();
    try {
        const updates = [];
        const values = [];
        
        if (data.codigo !== undefined) {
            updates.push('codigo = ?');
            values.push(data.codigo);
        }
        if (data.descricao !== undefined) {
            updates.push('descricao = ?');
            values.push(data.descricao);
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE itens_pesquisa SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM itens_pesquisa WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.countTestesAssociados = async (itemId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM teste_composicao WHERE item_id = ?', [itemId]);
        return rows[0].count;
    } finally {
        connection.release();
    }
};

exports.existeCodigo = async (codigo, excluirId = null) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT COUNT(*) as count FROM itens_pesquisa WHERE codigo = ?';
        let params = [codigo];
        
        if (excluirId) {
            query += ' AND id != ?';
            params.push(excluirId);
        }
        
        const [rows] = await connection.execute(query, params);
        return rows[0].count > 0;
    } finally {
        connection.release();
    }
};
