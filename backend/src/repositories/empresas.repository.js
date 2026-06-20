const pool = require('../config/database');

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM empresas ORDER BY created_at DESC');
        return rows;
    } finally {
        connection.release();
    }
};

exports.findById = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM empresas WHERE id = ?', [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByEmail = async (email) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM empresas WHERE email = ?', [email]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByNome = async (nome) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM empresas WHERE nome = ?', [nome]);
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
            `INSERT INTO empresas
              (id, nome, morada, codigo_postal, telefone, email, tipo_empresa, nif, pais, contacto, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.nome,
                data.morada || null,
                data.codigo_postal || null,
                data.telefone || null,
                data.email || null,
                data.tipo_empresa || null,
                data.nif || null,
                data.pais || null,
                data.contacto || null,
                data.ativo === undefined ? true : !!data.ativo
            ]
        );
        
        return {
            id,
            nome: data.nome,
            morada: data.morada || null,
            codigo_postal: data.codigo_postal || null,
            telefone: data.telefone || null,
            email: data.email || null,
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
        if (data.morada !== undefined) {
            updates.push('morada = ?');
            values.push(data.morada);
        }
        if (data.codigo_postal !== undefined) {
            updates.push('codigo_postal = ?');
            values.push(data.codigo_postal);
        }
        if (data.telefone !== undefined) {
            updates.push('telefone = ?');
            values.push(data.telefone);
        }
        if (data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.tipo_empresa !== undefined) {
            updates.push('tipo_empresa = ?');
            values.push(data.tipo_empresa || null);
        }
        if (data.nif !== undefined) {
            updates.push('nif = ?');
            values.push(data.nif || null);
        }
        if (data.pais !== undefined) {
            updates.push('pais = ?');
            values.push(data.pais || null);
        }
        if (data.contacto !== undefined) {
            updates.push('contacto = ?');
            values.push(data.contacto || null);
        }
        if (data.ativo !== undefined) {
            updates.push('ativo = ?');
            values.push(!!data.ativo);
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE empresas SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM empresas WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.countUtilizadores = async (empresaId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM utilizadores WHERE empresa_id = ?', [empresaId]);
        return rows[0].count;
    } finally {
        connection.release();
    }
};
