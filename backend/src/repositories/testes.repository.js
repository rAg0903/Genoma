const pool = require('../config/database');

exports.findAllPrincipais = async () => {
    const connection = await pool.getConnection();
    try {
        const [parents] = await connection.execute(
            'SELECT * FROM testes WHERE teste_pai_id IS NULL ORDER BY nome ASC',
        );
        const [children] = await connection.execute(
            'SELECT * FROM testes WHERE teste_pai_id IS NOT NULL ORDER BY codigo ASC, nome ASC',
        );
        const byParent = new Map();
        for (const row of children) {
            const list = byParent.get(row.teste_pai_id) || [];
            list.push(row);
            byParent.set(row.teste_pai_id, list);
        }
        return parents.map((parent) => ({
            ...parent,
            sub_testes: byParent.get(parent.id) || [],
        }));
    } finally {
        connection.release();
    }
};

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM testes ORDER BY nome ASC');
        return rows;
    } finally {
        connection.release();
    }
};

exports.findById = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM testes WHERE id = ?', [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findSubTestesByPaiId = async (paiId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM testes WHERE teste_pai_id = ? ORDER BY codigo ASC, nome ASC',
            [paiId],
        );
        return rows;
    } finally {
        connection.release();
    }
};

exports.findByNome = async (nome, { testePaiId = undefined, excludeId = null } = {}) => {
    const connection = await pool.getConnection();
    try {
        let sql = 'SELECT * FROM testes WHERE nome = ?';
        const params = [nome];
        if (testePaiId === null) {
            sql += ' AND teste_pai_id IS NULL';
        } else if (testePaiId !== undefined) {
            sql += ' AND teste_pai_id = ?';
            params.push(testePaiId);
        }
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await connection.execute(sql, params);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

const META_COLUMNS = [
    'codigo', 'preco_compra', 'preco_venda', 'tempo_resposta_dias', 'gestacao_minima_semanas',
    'tipo_teste', 'empresa', 'tipo_kit', 'cromossomas',
    'delecoes_duplicacoes', 'microdelecoes_microduplicacoes', 'gemeos', 'incluir_fracao_fetal',
    'laboratorio_processamento_id', 'determinacao_sexo_fetal', 'teste_pai_id',
];

exports.create = async (data) => {
    const connection = await pool.getConnection();
    try {
        const { v4: uuidv4 } = require('uuid');
        const id = uuidv4();

        const columns = ['id', 'nome', 'preco', 'descricao'];
        const placeholders = ['?', '?', '?', '?'];
        const values = [id, data.nome, data.preco || 0.00, data.descricao || null];

        META_COLUMNS.forEach((col) => {
            if (data[col] !== undefined) {
                columns.push(col);
                placeholders.push('?');
                values.push(data[col]);
            }
        });

        await connection.execute(
            `INSERT INTO testes (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
            values
        );

        return { id, ...data, preco: data.preco || 0.00, descricao: data.descricao || null };
    } finally {
        connection.release();
    }
};

exports.update = async (id, data) => {
    const connection = await pool.getConnection();
    try {
        const updates = [];
        const values = [];
        
        if (data.nome !== undefined) {
            updates.push('nome = ?');
            values.push(data.nome);
        }
        if (data.preco !== undefined) {
            updates.push('preco = ?');
            values.push(data.preco);
        }
        if (data.descricao !== undefined) {
            updates.push('descricao = ?');
            values.push(data.descricao);
        }
        META_COLUMNS.forEach((col) => {
            if (data[col] !== undefined) {
                updates.push(`${col} = ?`);
                values.push(data[col]);
            }
        });
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE testes SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM testes WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.countSubTestes = async (testeId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT COUNT(*) as count FROM testes WHERE teste_pai_id = ?',
            [testeId],
        );
        return rows[0].count;
    } finally {
        connection.release();
    }
};

exports.countItensComposicao = async (testeId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM teste_composicao WHERE teste_id = ?', [testeId]);
        return rows[0].count;
    } finally {
        connection.release();
    }
};

exports.countPedidosAssociados = async (testeId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM pedidos_exames WHERE teste_id = ?', [testeId]);
        return rows[0].count;
    } finally {
        connection.release();
    }
};
