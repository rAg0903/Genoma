const pacientesRepository = require('../repositories/pacientes.repository');
const processosRepository = require('../repositories/processos.repository');
const motivosAnulacaoService = require('./motivos_anulacao.service');
const logService = require('./log.service');
const { isMedicoUser, assertPacienteAccess } = require('../utils/medico-access');

const normalizeOrigemConceicao = (v) => {
    if (v === undefined) return undefined;
    if (v === null || v === '') return null;
    const normalized = String(v).trim().toLowerCase();
    if (['natural', 'fiv_ovulos_proprios', 'fiv_doacao_ovulos'].includes(normalized)) return normalized;
    throw new Error('Origem da conceção inválida');
};

exports.listAll = async (user) => {
    if (await isMedicoUser(user)) {
        return pacientesRepository.findForMedico(user.id);
    }
    return pacientesRepository.findAll();
};

exports.getById = async (id, user) => {
    const paciente = await pacientesRepository.findById(id);
    await assertPacienteAccess(paciente, user);
    return paciente;
};

exports.search = async (nome, user) => {
    if (!nome || nome.trim() === '') {
        throw new Error('Nome é obrigatório para busca');
    }
    if (await isMedicoUser(user)) {
        return pacientesRepository.searchByNomeForMedico(nome, user.id);
    }
    return pacientesRepository.searchByNome(nome);
};

/** Repõe contacto para nova colheita (ex.: repetição por fração fetal insuficiente). */
exports.resetParaNovaColheita = async (id, user) => {
    const paciente = await pacientesRepository.findById(id);
    if (!paciente) throw new Error('Paciente não encontrado');
    await assertPacienteAccess(paciente, user);

    await pacientesRepository.update(id, {
        medico_id: null,
        teste_id: null,
        tipo_gravidez: null,
        origem_conceicao: null,
        quer_saber_sexo: false,
        gestacao_semanas_registo: null,
        gestacao_dias_registo: null,
        gestacao_registada_em: null,
        onde_seguida: null,
        posto_colheita_id: null,
        data_colheita_prevista: null,
        estado_agendamento: null,
        estado_contacto: null,
        motivo_anulacao_id: null,
        data_anulacao: null,
        fatura_emitida: 0,
        fatura_numero: null,
        fatura_data_emissao: null,
        valor_base: 0,
        desconto_percentual: 0,
        valor_final: 0,
        pagamento_data: null,
        recibo_numero: null,
        pago: 0,
        entidade_multibanco: null,
        referencia_multibanco: null,
        nao_gera_comissao: 0,
        fatura_envio_email: null,
        fatura_envio_sms: null,
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: 'Reabriu contacto para nova colheita',
            tabela: 'pacientes',
            registro_id: id,
        });
    }

    return pacientesRepository.findById(id);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do paciente é obrigatório');
    }

    if (!data.telemovel || !String(data.telemovel).trim()) {
        throw new Error('Telemóvel é obrigatório');
    }

    if (data.data_nascimento) {
        const dataNasc = new Date(data.data_nascimento);
        const hoje = new Date();
        if (dataNasc >= hoje) {
            throw new Error('Data de nascimento inválida');
        }
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
        data_nascimento: data.data_nascimento || null,
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
        origem_conceicao: normalizeOrigemConceicao(data.origem_conceicao) ?? null,
        quer_saber_sexo: !!data.quer_saber_sexo,
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
    await assertPacienteAccess(paciente, user);

    // Validações
    if (data.nome !== undefined) {
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('Nome do paciente não pode estar vazio');
        }
    }

    if (data.telemovel !== undefined) {
        if (!data.telemovel || !String(data.telemovel).trim()) {
            throw new Error('Telemóvel é obrigatório');
        }
    }

    if (data.data_nascimento !== undefined && data.data_nascimento) {
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
    if (data.data_nascimento !== undefined) updateData.data_nascimento = data.data_nascimento || null;
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
    if (data.origem_conceicao !== undefined) {
        updateData.origem_conceicao = normalizeOrigemConceicao(data.origem_conceicao) ?? null;
    }
    if (data.quer_saber_sexo !== undefined) updateData.quer_saber_sexo = !!data.quer_saber_sexo;
    if (data.gestacao_semanas_registo !== undefined) updateData.gestacao_semanas_registo = toNumber(data.gestacao_semanas_registo);
    if (data.gestacao_dias_registo !== undefined) updateData.gestacao_dias_registo = toNumber(data.gestacao_dias_registo);
    if (data.gestacao_registada_em !== undefined) updateData.gestacao_registada_em = data.gestacao_registada_em || null;
    if (data.onde_seguida !== undefined) updateData.onde_seguida = data.onde_seguida ? String(data.onde_seguida).trim() : null;
    if (data.posto_colheita_id !== undefined) updateData.posto_colheita_id = data.posto_colheita_id || null;
    if (data.data_colheita_prevista !== undefined) updateData.data_colheita_prevista = data.data_colheita_prevista || null;
    if (data.notas_internas !== undefined) updateData.notas_internas = data.notas_internas ? String(data.notas_internas).trim() : null;
    if (data.estado_agendamento !== undefined) updateData.estado_agendamento = normalizeEstadoAgendamento(data.estado_agendamento);

    if (data.estado_contacto !== undefined) {
        if (data.estado_contacto !== null && data.estado_contacto !== 'Cancelado') {
            throw new Error('Estado de contacto inválido');
        }
        updateData.estado_contacto = data.estado_contacto;
        if (data.estado_contacto === null) {
            updateData.motivo_anulacao_id = null;
            updateData.data_anulacao = null;
        } else if (data.data_anulacao === undefined && !paciente.data_anulacao) {
            updateData.data_anulacao = new Date().toISOString().slice(0, 10);
        }
    }
    if (data.motivo_anulacao_id !== undefined) updateData.motivo_anulacao_id = data.motivo_anulacao_id || null;
    if (data.data_anulacao !== undefined) updateData.data_anulacao = data.data_anulacao || null;

    const estadoResultante = data.estado_contacto !== undefined ? data.estado_contacto : paciente.estado_contacto;
    const motivoResultante = data.motivo_anulacao_id !== undefined ? data.motivo_anulacao_id : paciente.motivo_anulacao_id;
    if (estadoResultante === 'Cancelado' && !motivoResultante) {
        throw new Error('Motivo de anulação é obrigatório quando o contacto está anulado');
    }
    if (estadoResultante === 'Cancelado') {
        await motivosAnulacaoService.assertMotivoParaContexto(motivoResultante, 'contacto');
        const processos = await processosRepository.findByPaciente(id);
        const temProcessoAtivo = processos.some((p) => {
            const status = p.status_id || p.status;
            return status !== 'Cancelado' && status !== 'Faturado';
        });
        if (temProcessoAtivo) {
            throw new Error('Este contacto tem um processo activo. Cancele o processo em Processos.');
        }
    }

    const passthrough = [
        'fatura_emitida', 'fatura_numero', 'fatura_data_emissao', 'valor_base', 'desconto_percentual',
        'valor_final', 'pagamento_data', 'recibo_numero', 'pago', 'entidade_multibanco', 'referencia_multibanco',
        'nao_gera_comissao', 'fatura_envio_email', 'fatura_envio_sms',
    ];
    for (const key of passthrough) {
        if (data[key] !== undefined) updateData[key] = data[key];
    }

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
    await assertPacienteAccess(paciente, user);

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