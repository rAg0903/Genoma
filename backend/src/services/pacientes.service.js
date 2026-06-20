const pacientesRepository = require('../repositories/pacientes.repository');
const logService = require('./log.service');

exports.listAll = async (user) => {
    return await pacientesRepository.findAll();
};

exports.getById = async (id, user) => {
    return await pacientesRepository.findById(id);
};

exports.search = async (nome, user) => {
    if (!nome || nome.trim() === '') {
        throw new Error('Nome é obrigatório para busca');
    }
    return await pacientesRepository.searchByNome(nome);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do paciente é obrigatório');
    }

    if (!data.data_nascimento) {
        throw new Error('Data de nascimento é obrigatória');
    }

    // Validar data de nascimento
    const dataNasc = new Date(data.data_nascimento);
    const hoje = new Date();
    if (dataNasc >= hoje) {
        throw new Error('Data de nascimento inválida');
    }

    // Validar NIF se fornecido
    if (data.nif) {
        const existeNif = await pacientesRepository.existeNif(data.nif);
        if (existeNif) {
            throw new Error('Já existe um paciente com este NIF');
        }
    }

    // Validar email se fornecido
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Email inválido');
        }
    }

    const toNumber = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

    const normalizeEstadoAgendamento = (v) => {
        if (v === undefined) return undefined;
        if (v === null || v === '') return null;
        if (v === 'Agendado' || v === 'Kit Reservado') return v;
        throw new Error('Estado de agendamento inválido');
    };

    const paciente = await pacientesRepository.create({
        nome: data.nome.trim(),
        data_nascimento: data.data_nascimento,
        genero: data.genero || null,
        nif: data.nif ? data.nif.trim() : null,
        telemovel: data.telemovel ? data.telemovel.trim() : null,
        email: data.email ? data.email.trim() : null,
        morada: data.morada ? data.morada.trim() : null,
        codigo_postal: data.codigo_postal ? String(data.codigo_postal).trim() : null,
        pais: data.pais ? String(data.pais).trim() : null,
        distrito: data.distrito ? String(data.distrito).trim() : null,
        cidade: data.cidade ? String(data.cidade).trim() : null,
        altura: toNumber(data.altura),
        peso: toNumber(data.peso),
        medico_id: data.medico_id || null,
        teste_id: data.teste_id || null,
        tipo_gravidez: data.tipo_gravidez || null,
        gestacao_semanas_registo: toNumber(data.gestacao_semanas_registo),
        gestacao_dias_registo: toNumber(data.gestacao_dias_registo),
        gestacao_registada_em: data.gestacao_registada_em || null,
        onde_seguida: data.onde_seguida ? String(data.onde_seguida).trim() : null,
        posto_colheita_id: data.posto_colheita_id || null,
        data_colheita_prevista: data.data_colheita_prevista || null,
        notas_internas: data.notas_internas ? String(data.notas_internas).trim() : null,
        estado_agendamento: normalizeEstadoAgendamento(data.estado_agendamento) ?? null,
    });

    if (!paciente) {
        throw new Error('Falha ao criar paciente');
    }

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Criou paciente",
            tabela: "pacientes",
            registro_id: paciente.id
        });
    }

    return paciente;
};

exports.update = async (id, data, user) => {
    // Verificar se existe
    const paciente = await pacientesRepository.findById(id);
    if (!paciente) {
        throw new Error('Paciente não encontrado');
    }

    // Validações
    if (data.nome !== undefined) {
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('Nome do paciente não pode estar vazio');
        }
    }

    if (data.data_nascimento !== undefined) {
        const dataNasc = new Date(data.data_nascimento);
        const hoje = new Date();
        if (dataNasc >= hoje) {
            throw new Error('Data de nascimento inválida');
        }
    }

    if (data.nif !== undefined && data.nif) {
        if (paciente.nif !== data.nif) {
            const existeNif = await pacientesRepository.existeNif(data.nif, id);
            if (existeNif) {
                throw new Error('Já existe outro paciente com este NIF');
            }
        }
    }

    if (data.email !== undefined && data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('Email inválido');
        }
    }

    const toNumber = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

    const normalizeEstadoAgendamento = (v) => {
        if (v === undefined) return undefined;
        if (v === null || v === '') return null;
        if (v === 'Agendado' || v === 'Kit Reservado') return v;
        throw new Error('Estado de agendamento inválido');
    };

    const updateData = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.data_nascimento !== undefined) updateData.data_nascimento = data.data_nascimento;
    if (data.genero !== undefined) updateData.genero = data.genero;
    if (data.nif !== undefined) updateData.nif = data.nif ? data.nif.trim() : null;
    if (data.telemovel !== undefined) updateData.telemovel = data.telemovel ? data.telemovel.trim() : null;
    if (data.email !== undefined) updateData.email = data.email ? data.email.trim() : null;
    if (data.morada !== undefined) updateData.morada = data.morada ? data.morada.trim() : null;
    if (data.codigo_postal !== undefined) updateData.codigo_postal = data.codigo_postal ? String(data.codigo_postal).trim() : null;
    if (data.pais !== undefined) updateData.pais = data.pais ? String(data.pais).trim() : null;
    if (data.distrito !== undefined) updateData.distrito = data.distrito ? String(data.distrito).trim() : null;
    if (data.cidade !== undefined) updateData.cidade = data.cidade ? String(data.cidade).trim() : null;
    if (data.altura !== undefined) updateData.altura = toNumber(data.altura);
    if (data.peso !== undefined) updateData.peso = toNumber(data.peso);
    if (data.medico_id !== undefined) updateData.medico_id = data.medico_id || null;
    if (data.teste_id !== undefined) updateData.teste_id = data.teste_id || null;
    if (data.tipo_gravidez !== undefined) updateData.tipo_gravidez = data.tipo_gravidez || null;
    if (data.gestacao_semanas_registo !== undefined) updateData.gestacao_semanas_registo = toNumber(data.gestacao_semanas_registo);
    if (data.gestacao_dias_registo !== undefined) updateData.gestacao_dias_registo = toNumber(data.gestacao_dias_registo);
    if (data.gestacao_registada_em !== undefined) updateData.gestacao_registada_em = data.gestacao_registada_em || null;
    if (data.onde_seguida !== undefined) updateData.onde_seguida = data.onde_seguida ? String(data.onde_seguida).trim() : null;
    if (data.posto_colheita_id !== undefined) updateData.posto_colheita_id = data.posto_colheita_id || null;
    if (data.data_colheita_prevista !== undefined) updateData.data_colheita_prevista = data.data_colheita_prevista || null;
    if (data.notas_internas !== undefined) updateData.notas_internas = data.notas_internas ? String(data.notas_internas).trim() : null;
    if (data.estado_agendamento !== undefined) updateData.estado_agendamento = normalizeEstadoAgendamento(data.estado_agendamento);

    await pacientesRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou paciente",
            tabela: "pacientes",
            registro_id: id
        });
    }

    return await pacientesRepository.findById(id);
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const paciente = await pacientesRepository.findById(id);
    if (!paciente) {
        throw new Error('Paciente não encontrado');
    }

    // Verificar se há pedidos associados
    const pool = require('../config/database');
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM pedidos_exames WHERE paciente_id = ?', [id]);
        if (rows[0].count > 0) {
            throw new Error(`Não é possível deletar um paciente que tem ${rows[0].count} pedido(s) de exame(s) associado(s)`);
        }
    } finally {
        connection.release();
    }

    await pacientesRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou paciente",
            tabela: "pacientes",
            registro_id: id
        });
    }

    return true;
};