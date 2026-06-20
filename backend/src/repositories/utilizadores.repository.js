const pool = require('../config/database');

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT u.id, u.perfil_id, u.empresa_id, u.nome, u.email, u.telefone, u.ativo, u.avatar_url, u.created_at,
                   p.nome as perfil_nome, e.nome as empresa_nome
            FROM utilizadores u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            LEFT JOIN empresas e ON u.empresa_id = e.id
            ORDER BY u.created_at DESC
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
            SELECT u.id, u.perfil_id, u.empresa_id, u.nome, u.email, u.telefone, u.ativo, u.avatar_url, u.created_at,
                   p.nome as perfil_nome, e.nome as empresa_nome
            FROM utilizadores u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            LEFT JOIN empresas e ON u.empresa_id = e.id
            WHERE u.id = ?
        `, [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByEmail = async (email) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM utilizadores WHERE email = ?', [email]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByResetTokenHash = async (tokenHash) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT *
             FROM utilizadores
             WHERE reset_token_hash = ?
               AND reset_token_expires_at IS NOT NULL
               AND reset_token_expires_at > NOW()
             LIMIT 1`,
            [tokenHash]
        );
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByEmpresa = async (empresaId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(`
            SELECT u.id, u.perfil_id, u.empresa_id, u.nome, u.email, u.telefone, u.ativo, u.avatar_url, u.created_at,
                   p.nome as perfil_nome
            FROM utilizadores u
            LEFT JOIN perfis p ON u.perfil_id = p.id
            WHERE u.empresa_id = ?
            ORDER BY u.created_at DESC
        `, [empresaId]);
        return rows;
    } finally {
        connection.release();
    }
};

exports.create = async (data) => {
    const connection = await pool.getConnection();
    try {
        const { v4: uuidv4 } = require('uuid');
        const id = data.id || uuidv4();
        
        await connection.execute(
            'INSERT INTO utilizadores (id, perfil_id, empresa_id, nome, email, telefone, password_hash, ativo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id,
                data.perfil_id || null,
                data.empresa_id || null,
                data.nome,
                data.email,
                data.telefone || null,
                data.password_hash,
                data.ativo !== undefined ? data.ativo : true
            ]
        );
        
        return {
            id,
            perfil_id: data.perfil_id || null,
            empresa_id: data.empresa_id || null,
            nome: data.nome,
            email: data.email,
            telefone: data.telefone || null,
            ativo: data.ativo !== undefined ? data.ativo : true,
            created_at: new Date()
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
        
        if (data.nome !== undefined) {
            updates.push('nome = ?');
            values.push(data.nome);
        }
        if (data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.telefone !== undefined) {
            updates.push('telefone = ?');
            values.push(data.telefone);
        }
        if (data.perfil_id !== undefined) {
            updates.push('perfil_id = ?');
            values.push(data.perfil_id);
        }
        if (data.empresa_id !== undefined) {
            updates.push('empresa_id = ?');
            values.push(data.empresa_id);
        }
        if (data.password_hash !== undefined) {
            updates.push('password_hash = ?');
            values.push(data.password_hash);
        }
        if (data.reset_token_hash !== undefined) {
            updates.push('reset_token_hash = ?');
            values.push(data.reset_token_hash);
        }
        if (data.reset_token_expires_at !== undefined) {
            updates.push('reset_token_expires_at = ?');
            values.push(data.reset_token_expires_at);
        }
        if (data.ativo !== undefined) {
            updates.push('ativo = ?');
            values.push(data.ativo);
        }
        if (data.avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            values.push(data.avatar_url);
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE utilizadores SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM utilizadores WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.countByPerfilId = async (perfilId, excluirId = null) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT COUNT(*) as count FROM utilizadores WHERE perfil_id = ?';
        const params = [perfilId];

        if (excluirId) {
            query += ' AND id != ?';
            params.push(excluirId);
        }

        const [rows] = await connection.execute(query, params);
        return rows[0].count;
    } finally {
        connection.release();
    }
};

exports.existeEmail = async (email, excluirId = null) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT COUNT(*) as count FROM utilizadores WHERE email = ?';
        let params = [email];
        
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
