const pool = require('../config/database');

exports.findAll = async () => {
    const connection = await pool.getConnection();
    try {
                const [rows] = await connection.execute(`
                        SELECT pe.*,
                                     p.nome as paciente_nome, u.nome as medico_nome, t.nome as teste_nome,
                                     e.nome as empresa_nome
            FROM pedidos_exames pe
            JOIN pacientes p ON pe.paciente_id = p.id
            JOIN medicos m ON pe.medico_id = m.utilizador_id
            JOIN utilizadores u ON m.utilizador_id = u.id
            JOIN testes t ON pe.teste_id = t.id
            JOIN empresas e ON pe.empresa_id = e.id
            ORDER BY pe.data_pedido DESC
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
                        SELECT pe.*,
                                     p.nome as paciente_nome, u.nome as medico_nome, t.nome as teste_nome,
                                     e.nome as empresa_nome
            FROM pedidos_exames pe
            JOIN pacientes p ON pe.paciente_id = p.id
            JOIN medicos m ON pe.medico_id = m.utilizador_id
            JOIN utilizadores u ON m.utilizador_id = u.id
            JOIN testes t ON pe.teste_id = t.id
            JOIN empresas e ON pe.empresa_id = e.id
            WHERE pe.id = ?
        `, [id]);
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.findByPaciente = async (pacienteId) => {
    const connection = await pool.getConnection();
    try {
                const [rows] = await connection.execute(`
                        SELECT pe.*,
                                     u.nome as medico_nome, t.nome as teste_nome
            FROM pedidos_exames pe
            JOIN medicos m ON pe.medico_id = m.utilizador_id
            JOIN utilizadores u ON m.utilizador_id = u.id
            JOIN testes t ON pe.teste_id = t.id
            WHERE pe.paciente_id = ?
            ORDER BY pe.data_pedido DESC
        `, [pacienteId]);
        return rows;
    } finally {
        connection.release();
    }
};

exports.findByEmpresa = async (empresaId) => {
    const connection = await pool.getConnection();
    try {
                const [rows] = await connection.execute(`
                        SELECT pe.*,
                                     p.nome as paciente_nome, u.nome as medico_nome, t.nome as teste_nome
            FROM pedidos_exames pe
            JOIN pacientes p ON pe.paciente_id = p.id
            JOIN medicos m ON pe.medico_id = m.utilizador_id
            JOIN utilizadores u ON m.utilizador_id = u.id
            JOIN testes t ON pe.teste_id = t.id
            WHERE pe.empresa_id = ?
            ORDER BY pe.data_pedido DESC
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
        const id = uuidv4();
        
        await connection.execute(
            `INSERT INTO pedidos_exames (
                id, paciente_id, medico_id, teste_id, empresa_id, status, notas_clinicas,
                numero_processo, posto, kit_codigo, data_colheita, data_chegada_laboratorio, data_resultado, data_validacao, data_envio_relatorio,
                responsavel_fluxo, relatorio_validado, relatorio_enviado_para,
                resultado_tudo_ok, resultado_anomalias,
                fatura_emitida, fatura_numero, fatura_data_emissao, valor_base, desconto_percentual, valor_final, pagamento_data, recibo_numero
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                data.paciente_id,
                data.medico_id,
                data.teste_id,
                data.empresa_id,
                data.status || 'Pendente',
                data.notas_clinicas || null,
                data.numero_processo || null,
                data.posto || null,
                data.kit_codigo || null,
                data.data_colheita || null,
                data.data_chegada_laboratorio || null,
                data.data_resultado || null,
                data.data_validacao || null,
                data.data_envio_relatorio || null,
                data.responsavel_fluxo || null,
                data.relatorio_validado === undefined ? false : !!data.relatorio_validado,
                data.relatorio_enviado_para || 'Nenhum',
                data.resultado_tudo_ok === undefined ? true : !!data.resultado_tudo_ok,
                data.resultado_anomalias || null,
                data.fatura_emitida === undefined ? false : !!data.fatura_emitida,
                data.fatura_numero || null,
                data.fatura_data_emissao || null,
                data.valor_base || 0,
                data.desconto_percentual || 0,
                data.valor_final || 0,
                data.pagamento_data || null,
                data.recibo_numero || null
            ]
        );
        
        return {
            id,
            paciente_id: data.paciente_id,
            medico_id: data.medico_id,
            teste_id: data.teste_id,
            empresa_id: data.empresa_id,
            status: data.status || 'Pendente',
            notas_clinicas: data.notas_clinicas || null,
            numero_processo: data.numero_processo || null,
            posto: data.posto || null,
            kit_codigo: data.kit_codigo || null,
            data_colheita: data.data_colheita || null,
            data_chegada_laboratorio: data.data_chegada_laboratorio || null,
            data_resultado: data.data_resultado || null,
            data_validacao: data.data_validacao || null,
            data_envio_relatorio: data.data_envio_relatorio || null,
            responsavel_fluxo: data.responsavel_fluxo || null,
            relatorio_validado: data.relatorio_validado === undefined ? false : !!data.relatorio_validado,
            relatorio_enviado_para: data.relatorio_enviado_para || 'Nenhum',
            resultado_tudo_ok: data.resultado_tudo_ok === undefined ? true : !!data.resultado_tudo_ok,
            resultado_anomalias: data.resultado_anomalias || null,
            fatura_emitida: data.fatura_emitida === undefined ? false : !!data.fatura_emitida,
            fatura_numero: data.fatura_numero || null,
            fatura_data_emissao: data.fatura_data_emissao || null,
            valor_base: data.valor_base || 0,
            desconto_percentual: data.desconto_percentual || 0,
            valor_final: data.valor_final || 0,
            pagamento_data: data.pagamento_data || null,
            recibo_numero: data.recibo_numero || null,
            data_pedido: new Date()
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
        
        if (data.status !== undefined) {
            updates.push('status = ?');
            values.push(data.status);
        }
        if (data.notas_clinicas !== undefined) {
            updates.push('notas_clinicas = ?');
            values.push(data.notas_clinicas);
        }
        if (data.numero_processo !== undefined) {
            updates.push('numero_processo = ?');
            values.push(data.numero_processo || null);
        }
        if (data.posto !== undefined) {
            updates.push('posto = ?');
            values.push(data.posto || null);
        }
        if (data.kit_codigo !== undefined) {
            updates.push('kit_codigo = ?');
            values.push(data.kit_codigo || null);
        }
        if (data.data_colheita !== undefined) {
            updates.push('data_colheita = ?');
            values.push(data.data_colheita || null);
        }
        if (data.data_chegada_laboratorio !== undefined) {
            updates.push('data_chegada_laboratorio = ?');
            values.push(data.data_chegada_laboratorio || null);
        }
        if (data.data_resultado !== undefined) {
            updates.push('data_resultado = ?');
            values.push(data.data_resultado || null);
        }
        if (data.data_validacao !== undefined) {
            updates.push('data_validacao = ?');
            values.push(data.data_validacao || null);
        }
        if (data.data_envio_relatorio !== undefined) {
            updates.push('data_envio_relatorio = ?');
            values.push(data.data_envio_relatorio || null);
        }
        if (data.responsavel_fluxo !== undefined) {
            updates.push('responsavel_fluxo = ?');
            values.push(data.responsavel_fluxo || null);
        }
        if (data.relatorio_validado !== undefined) {
            updates.push('relatorio_validado = ?');
            values.push(!!data.relatorio_validado);
        }
        if (data.relatorio_enviado_para !== undefined) {
            updates.push('relatorio_enviado_para = ?');
            values.push(data.relatorio_enviado_para || 'Nenhum');
        }
        if (data.resultado_tudo_ok !== undefined) {
            updates.push('resultado_tudo_ok = ?');
            values.push(!!data.resultado_tudo_ok);
        }
        if (data.resultado_anomalias !== undefined) {
            updates.push('resultado_anomalias = ?');
            values.push(data.resultado_anomalias || null);
        }
        if (data.fatura_emitida !== undefined) {
            updates.push('fatura_emitida = ?');
            values.push(!!data.fatura_emitida);
        }
        if (data.fatura_numero !== undefined) {
            updates.push('fatura_numero = ?');
            values.push(data.fatura_numero || null);
        }
        if (data.fatura_data_emissao !== undefined) {
            updates.push('fatura_data_emissao = ?');
            values.push(data.fatura_data_emissao || null);
        }
        if (data.valor_base !== undefined) {
            updates.push('valor_base = ?');
            values.push(data.valor_base || 0);
        }
        if (data.desconto_percentual !== undefined) {
            updates.push('desconto_percentual = ?');
            values.push(data.desconto_percentual || 0);
        }
        if (data.valor_final !== undefined) {
            updates.push('valor_final = ?');
            values.push(data.valor_final || 0);
        }
        if (data.pagamento_data !== undefined) {
            updates.push('pagamento_data = ?');
            values.push(data.pagamento_data || null);
        }
        if (data.recibo_numero !== undefined) {
            updates.push('recibo_numero = ?');
            values.push(data.recibo_numero || null);
        }
        
        if (updates.length === 0) return false;
        
        values.push(id);
        const query = `UPDATE pedidos_exames SET ${updates.join(', ')} WHERE id = ?`;
        const result = await connection.execute(query, values);
        
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.findByKitCodigo = async (kitCodigo) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT id, kit_codigo, status FROM pedidos_exames WHERE kit_codigo = ? LIMIT 1',
            [kitCodigo]
        );
        return rows[0] || null;
    } finally {
        connection.release();
    }
};

exports.delete = async (id) => {
    const connection = await pool.getConnection();
    try {
        const result = await connection.execute('DELETE FROM pedidos_exames WHERE id = ?', [id]);
        return result[0].affectedRows > 0;
    } finally {
        connection.release();
    }
};

exports.countResultados = async (pedidoId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM resultados_detalhados WHERE pedido_id = ?', [pedidoId]);
        return rows[0].count;
    } finally {
        connection.release();
    }
};
