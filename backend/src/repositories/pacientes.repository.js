const pool = require('../config/database');
const { getPaginationParams } = require('../utils/pagination');

exports.findAll = async (page, limit) => {
    const connection = await pool.getConnection();
    try {
        if (page === undefined && limit === undefined) {
            const [rows] = await connection.execute(
                'SELECT * FROM pacientes WHERE ativo = TRUE ORDER BY created_at DESC'
            );
            return rows;
        }
        const { offset, limit: l } = getPaginationParams(page, limit);
        const [rows] = await connection.execute(
            'SELECT * FROM pacientes WHERE ativo = TRUE ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [l, offset]
        );
        return rows;
    } finally {
        connection.release();
    }
};

exports.countAll = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as total FROM pacientes WHERE ativo = TRUE');
        return rows[0].total;
    } finally {
        connection.release();
    }
};

exports.findById = async (id) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM pacientes WHERE id = ? AND ativo = TRUE', [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByNif = async (nif) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM pacientes WHERE nif = ? AND ativo = TRUE', [nif]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByEmail = async (email) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT * FROM pacientes WHERE email = ? AND ativo = TRUE', [email]);
        return rows;
    } finally {
        connection.release();
    }
};

exports.searchByNome = async (nome, page, limit) => {
    const connection = await pool.getConnection();
    try {
        const { offset, limit: l } = getPaginationParams(page, limit);
        const [rows] = await connection.execute(
            'SELECT * FROM pacientes WHERE nome LIKE ? AND ativo = TRUE ORDER BY nome LIMIT ? OFFSET ?',
            [`%${nome}%`, l, offset]
        );
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
            `INSERT INTO pacientes
                (id, nome, data_nascimento, genero, nif, telemovel, email, morada,
                 codigo_postal, pais, distrito, cidade, altura, peso,
                 medico_id, teste_id, tipo_gravidez, gestacao_semanas_registo, gestacao_dias_registo,
                 gestacao_registada_em, onde_seguida, posto_colheita_id,
                 data_colheita_prevista, notas_internas, estado_agendamento)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, data.nome, data.data_nascimento || null, data.genero || null, data.nif || null,
                data.telemovel || null, data.email || null, data.morada || null,
                data.codigo_postal || null, data.pais || null, data.distrito || null,
                data.cidade || null, data.altura ?? null, data.peso ?? null,
                data.medico_id || null, data.teste_id || null, data.tipo_gravidez || null,
                data.gestacao_semanas_registo ?? null, data.gestacao_dias_registo ?? null,
                data.gestacao_registada_em || null,
                data.onde_seguida || null, data.posto_colheita_id || null,
                data.data_colheita_prevista || null, data.notas_internas || null,
                data.estado_agendamento || null
            ]
        );
        const [rows] = await connection.execute(
            'SELECT * FROM pacientes WHERE id = ? AND ativo = TRUE',
            [id]
        );
        return rows[0] || null;
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
        if (data.data_nascimento !== undefined) {
            updates.push('data_nascimento = ?');
            values.push(data.data_nascimento);
        }
        if (data.genero !== undefined) {
            updates.push('genero = ?');
            values.push(data.genero);
        }
        if (data.nif !== undefined) {
            updates.push('nif = ?');
            values.push(data.nif);
        }
        if (data.telemovel !== undefined) {
            updates.push('telemovel = ?');
            values.push(data.telemovel);
        }
        if (data.email !== undefined) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.morada !== undefined) {
            updates.push('morada = ?');
            values.push(data.morada);
        }
        if (data.codigo_postal !== undefined) {
            updates.push('codigo_postal = ?');
            values.push(data.codigo_postal);
        }
        if (data.pais !== undefined) {
            updates.push('pais = ?');
            values.push(data.pais);
        }
        if (data.distrito !== undefined) {
            updates.push('distrito = ?');
            values.push(data.distrito);
        }
        if (data.cidade !== undefined) {
            updates.push('cidade = ?');
            values.push(data.cidade);
        }
        if (data.altura !== undefined) {
            updates.push('altura = ?');
            values.push(data.altura);
        }
        if (data.peso !== undefined) {
            updates.push('peso = ?');
            values.push(data.peso);
        }
        if (data.medico_id !== undefined) {
            updates.push('medico_id = ?');
            values.push(data.medico_id);
        }
        if (data.teste_id !== undefined) {
            updates.push('teste_id = ?');
            values.push(data.teste_id);
        }
        if (data.tipo_gravidez !== undefined) {
            updates.push('tipo_gravidez = ?');
            values.push(data.tipo_gravidez);
        }
        if (data.gestacao_semanas_registo !== undefined) {
            updates.push('gestacao_semanas_registo = ?');
            values.push(data.gestacao_semanas_registo);
        }
        if (data.gestacao_dias_registo !== undefined) {
            updates.push('gestacao_dias_registo = ?');
            values.push(data.gestacao_dias_registo);
        }
        if (data.gestacao_registada_em !== undefined) {
            updates.push('gestacao_registada_em = ?');
            values.push(data.gestacao_registada_em);
        }
        if (data.onde_seguida !== undefined) {
            updates.push('onde_seguida = ?');
            values.push(data.onde_seguida);
        }
        if (data.posto_colheita_id !== undefined) {
            updates.push('posto_colheita_id = ?');
            values.push(data.posto_colheita_id);
        }
        if (data.data_colheita_prevista !== undefined) {
            updates.push('data_colheita_prevista = ?');
            values.push(data.data_colheita_prevista);
        }
        if (data.notas_internas !== undefined) {
            updates.push('notas_internas = ?');
            values.push(data.notas_internas);
        }
        if (data.estado_agendamento !== undefined) {
            updates.push('estado_agendamento = ?');
            values.push(data.estado_agendamento);
        }
        if (data.fatura_emitida !== undefined) {
            updates.push('fatura_emitida = ?');
            values.push(!!data.fatura_emitida);
        }
        if (data.fatura_numero !== undefined) {
            updates.push('fatura_numero = ?');
            values.push(data.fatura_numero);
        }
        if (data.fatura_data_emissao !== undefined) {
            updates.push('fatura_data_emissao = ?');
            values.push(data.fatura_data_emissao);
        }
        if (data.valor_base !== undefined) {
            updates.push('valor_base = ?');
            values.push(data.valor_base);
        }
        if (data.desconto_percentual !== undefined) {
            updates.push('desconto_percentual = ?');
            values.push(data.desconto_percentual);
        }
        if (data.valor_final !== undefined) {
            updates.push('valor_final = ?');
            values.push(data.valor_final);
        }
        if (data.pagamento_data !== undefined) {
            updates.push('pagamento_data = ?');
            values.push(data.pagamento_data);
        }
        if (data.recibo_numero !== undefined) {
            updates.push('recibo_numero = ?');
            values.push(data.recibo_numero);
        }
        if (data.pago !== undefined) {
            updates.push('pago = ?');
            values.push(!!data.pago);
        }
        if (data.entidade_multibanco !== undefined) {
            updates.push('entidade_multibanco = ?');
            values.push(data.entidade_multibanco);
        }
        if (data.referencia_multibanco !== undefined) {
            updates.push('referencia_multibanco = ?');
            values.push(data.referencia_multibanco);
        }
        if (data.nao_gera_comissao !== undefined) {
            updates.push('nao_gera_comissao = ?');
            values.push(!!data.nao_gera_comissao);
        }
        if (data.fatura_envio_email !== undefined) {
            updates.push('fatura_envio_email = ?');
            values.push(data.fatura_envio_email);
        }
        if (data.fatura_envio_sms !== undefined) {
            updates.push('fatura_envio_sms = ?');
            values.push(data.fatura_envio_sms);
        }
        if (data.estado_contacto !== undefined) {
            updates.push('estado_contacto = ?');
            values.push(data.estado_contacto);
        }
        if (data.motivo_anulacao_id !== undefined) {
            updates.push('motivo_anulacao_id = ?');
            values.push(data.motivo_anulacao_id);
        }
        if (data.data_anulacao !== undefined) {
            updates.push('data_anulacao = ?');
            values.push(data.data_anulacao);
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE pacientes SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM pacientes WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.existeNif = async (nif, excluirId = null) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT COUNT(*) as count FROM pacientes WHERE nif = ?';
        let params = [nif];
        
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

exports.countPacientes = async () => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM pacientes');
        return rows[0].count;
    } finally {
        connection.release();
    }
};