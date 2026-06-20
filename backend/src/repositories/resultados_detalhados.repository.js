const pool = require('../config/database');

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT rd.id, rd.pedido_id, rd.item_id, rd.resultado, rd.observacoes, rd.data_resultado,
                   ip.codigo, ip.descricao
            FROM resultados_detalhados rd
            JOIN itens_pesquisa ip ON rd.item_id = ip.id
            ORDER BY rd.data_resultado DESC
        `);
        return rows;
    } finally {
        connection.release();
    }
};

exports.findById = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT rd.id, rd.pedido_id, rd.item_id, rd.resultado, rd.observacoes, rd.data_resultado,
                   ip.codigo, ip.descricao
            FROM resultados_detalhados rd
            JOIN itens_pesquisa ip ON rd.item_id = ip.id
            WHERE rd.id = ?
        `, [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByPedido = async (pedidoId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT rd.id, rd.pedido_id, rd.item_id, rd.resultado, rd.observacoes, rd.data_resultado,
                   ip.codigo, ip.descricao
            FROM resultados_detalhados rd
            JOIN itens_pesquisa ip ON rd.item_id = ip.id
            WHERE rd.pedido_id = ?
            ORDER BY rd.data_resultado DESC
        `, [pedidoId]);
        return rows;
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
            'INSERT INTO resultados_detalhados (id, pedido_id, item_id, resultado, observacoes) VALUES (?, ?, ?, ?, ?)',
            [
                id,
                data.pedido_id,
                data.item_id,
                data.resultado || null,
                data.observacoes || null
            ]
        );
        
        return {
            id,
            pedido_id: data.pedido_id,
            item_id: data.item_id,
            resultado: data.resultado || null,
            observacoes: data.observacoes || null,
            data_resultado: new Date()
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
        
        if (data.resultado !== undefined) {
            updates.push('resultado = ?');
            values.push(data.resultado);
        }
        if (data.observacoes !== undefined) {
            updates.push('observacoes = ?');
            values.push(data.observacoes);
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE resultados_detalhados SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM resultados_detalhados WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};
