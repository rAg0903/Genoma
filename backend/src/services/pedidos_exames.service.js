const pedidosRepository = require('../repositories/pedidos_exames.repository');
const pacientesRepository = require('../repositories/pacientes.repository');
const medicosRepository = require('../repositories/medicos.repository');
const testesRepository = require('../repositories/testes.repository');
const empresasRepository = require('../repositories/empresas.repository');
const logService = require('./log.service');

const STATUS_CANONICOS = ['Aguardando Colheita', 'Em Laboratorio', 'Em Analise', 'Concluido', 'Cancelado'];
const RELATORIO_DESTINOS_VALIDOS = ['Nenhum', 'Medico', 'Utente', 'Ambos'];

const normalizeStringOrNull = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
};

const normalizeStatus = (status) => {
    if (!status) return null;
    const normalized = String(status).trim().toLowerCase();
    if (normalized === 'aguardando colheita') return 'Aguardando Colheita';
    if (normalized === 'em laboratório' || normalized === 'em laboratorio') return 'Em Laboratorio';
    if (normalized === 'em análise' || normalized === 'em analise') return 'Em Analise';
    if (normalized === 'concluído' || normalized === 'concluido') return 'Concluido';
    if (normalized === 'cancelado') return 'Cancelado';
    return null;
};

const statusExigeKit = (status) => ['Em Laboratorio', 'Em Analise', 'Concluido'].includes(status);

const normalizeWorkflowBillingPayload = (data) => {
    const normalized = {};

    if (data.numero_processo !== undefined) normalized.numero_processo = normalizeStringOrNull(data.numero_processo);
    if (data.posto !== undefined) normalized.posto = normalizeStringOrNull(data.posto);
    if (data.kit_codigo !== undefined) normalized.kit_codigo = normalizeStringOrNull(data.kit_codigo);
    if (data.data_colheita !== undefined) normalized.data_colheita = normalizeStringOrNull(data.data_colheita);
    if (data.data_chegada_laboratorio !== undefined) normalized.data_chegada_laboratorio = normalizeStringOrNull(data.data_chegada_laboratorio);
    if (data.data_resultado !== undefined) normalized.data_resultado = normalizeStringOrNull(data.data_resultado);
    if (data.data_validacao !== undefined) normalized.data_validacao = normalizeStringOrNull(data.data_validacao);
    if (data.data_envio_relatorio !== undefined) normalized.data_envio_relatorio = normalizeStringOrNull(data.data_envio_relatorio);
    if (data.responsavel_fluxo !== undefined) normalized.responsavel_fluxo = normalizeStringOrNull(data.responsavel_fluxo);
    if (data.relatorio_validado !== undefined) normalized.relatorio_validado = !!data.relatorio_validado;

    if (data.relatorio_enviado_para !== undefined) {
        if (!RELATORIO_DESTINOS_VALIDOS.includes(data.relatorio_enviado_para)) {
            throw new Error(`Destino de relatório inválido. Valores válidos: ${RELATORIO_DESTINOS_VALIDOS.join(', ')}`);
        }
        normalized.relatorio_enviado_para = data.relatorio_enviado_para;
    }

    if (data.resultado_tudo_ok !== undefined) normalized.resultado_tudo_ok = !!data.resultado_tudo_ok;
    if (data.resultado_anomalias !== undefined) normalized.resultado_anomalias = normalizeStringOrNull(data.resultado_anomalias);
    if (data.fatura_emitida !== undefined) normalized.fatura_emitida = !!data.fatura_emitida;
    if (data.fatura_numero !== undefined) normalized.fatura_numero = normalizeStringOrNull(data.fatura_numero);
    if (data.fatura_data_emissao !== undefined) normalized.fatura_data_emissao = normalizeStringOrNull(data.fatura_data_emissao);
    if (data.valor_base !== undefined) normalized.valor_base = Number(data.valor_base) || 0;
    if (data.desconto_percentual !== undefined) normalized.desconto_percentual = Number(data.desconto_percentual) || 0;
    if (data.valor_final !== undefined) normalized.valor_final = Number(data.valor_final) || 0;
    if (data.pagamento_data !== undefined) normalized.pagamento_data = normalizeStringOrNull(data.pagamento_data);
    if (data.recibo_numero !== undefined) normalized.recibo_numero = normalizeStringOrNull(data.recibo_numero);

    return normalized;
};

exports.listAll = async (user) => {
    if (user.empresa_id) {
        return await pedidosRepository.findByEmpresa(user.empresa_id);
    }
    return await pedidosRepository.findAll();
};

exports.getById = async (id, user) => {
    const pedido = await pedidosRepository.findById(id);
    
    if (!pedido) {
        throw new Error('Pedido não encontrado');
    }

    // Verificar permissões
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para aceder a este pedido');
    }

    return pedido;
};

exports.listByPaciente = async (pacienteId, user) => {
    const paciente = await pacientesRepository.findById(pacienteId);
    if (!paciente) {
        throw new Error('Paciente não encontrado');
    }

    return await pedidosRepository.findByPaciente(pacienteId);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.paciente_id || !data.medico_id || !data.teste_id || !data.empresa_id) {
        throw new Error('Paciente, médico, teste e empresa são obrigatórios');
    }

    // Verificar se paciente existe
    const paciente = await pacientesRepository.findById(data.paciente_id);
    if (!paciente) {
        throw new Error('Paciente não encontrado');
    }

    // Verificar se médico existe
    const medico = await medicosRepository.findById(data.medico_id);
    if (!medico) {
        throw new Error('Médico não encontrado');
    }

    // Verificar se teste existe
    const teste = await testesRepository.findById(data.teste_id);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    // Verificar se empresa existe
    const empresa = await empresasRepository.findById(data.empresa_id);
    if (!empresa) {
        throw new Error('Empresa não encontrada');
    }

    // Validar status se fornecido
    if (data.status && !normalizeStatus(data.status)) {
        throw new Error(`Status inválido. Valores válidos: ${STATUS_CANONICOS.join(', ')}`);
    }

    const workflowBillingData = normalizeWorkflowBillingPayload(data);
    const statusPedido = normalizeStatus(data.status) || 'Aguardando Colheita';
    const kitCodigo = workflowBillingData.kit_codigo || null;

    if (workflowBillingData.desconto_percentual !== undefined && (workflowBillingData.desconto_percentual < 0 || workflowBillingData.desconto_percentual > 100)) {
        throw new Error('Desconto percentual deve estar entre 0 e 100.');
    }

    if (workflowBillingData.pagamento_data && !workflowBillingData.recibo_numero) {
        throw new Error('Número de recibo é obrigatório ao marcar pagamento.');
    }

    if (statusExigeKit(statusPedido) && !kitCodigo) {
        throw new Error('Código do kit é obrigatório após colheita.');
    }

    if (kitCodigo) {
        const pedidoComKit = await pedidosRepository.findByKitCodigo(kitCodigo);
        if (pedidoComKit) {
            throw new Error('Já existe um processo com este código de kit.');
        }
    }

    const pedido = await pedidosRepository.create({
        paciente_id: data.paciente_id,
        medico_id: data.medico_id,
        teste_id: data.teste_id,
        empresa_id: data.empresa_id,
        status: statusPedido,
        notas_clinicas: data.notas_clinicas ? data.notas_clinicas.trim() : null,
        ...workflowBillingData
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id || data.empresa_id,
            utilizador_id: user.id,
            acao: "Criou pedido de exame",
            tabela: "pedidos_exames",
            registro_id: pedido.id
        });
    }

    return pedido;
};

exports.update = async (id, data, user) => {
    // Verificar se existe
    const pedido = await pedidosRepository.findById(id);
    if (!pedido) {
        throw new Error('Pedido não encontrado');
    }

    // Verificar permissões
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para atualizar este pedido');
    }

    // Validar status se fornecido
    if (data.status && !normalizeStatus(data.status)) {
        throw new Error(`Status inválido. Valores válidos: ${STATUS_CANONICOS.join(', ')}`);
    }

    const workflowBillingData = normalizeWorkflowBillingPayload(data);
    const statusResultante = normalizeStatus(data.status) || pedido.status;
    const kitResultante = workflowBillingData.kit_codigo !== undefined
        ? workflowBillingData.kit_codigo
        : (pedido.kit_codigo || null);

    if (workflowBillingData.desconto_percentual !== undefined && (workflowBillingData.desconto_percentual < 0 || workflowBillingData.desconto_percentual > 100)) {
        throw new Error('Desconto percentual deve estar entre 0 e 100.');
    }

    if (statusExigeKit(statusResultante) && !kitResultante) {
        throw new Error('Código do kit é obrigatório após colheita.');
    }

    if (workflowBillingData.kit_codigo) {
        const pedidoComKit = await pedidosRepository.findByKitCodigo(workflowBillingData.kit_codigo);
        if (pedidoComKit && pedidoComKit.id !== id) {
            throw new Error('Já existe um processo com este código de kit.');
        }
    }

    if (workflowBillingData.pagamento_data && !workflowBillingData.recibo_numero && !(pedido.recibo_numero && workflowBillingData.recibo_numero === undefined)) {
        throw new Error('Número de recibo é obrigatório ao marcar pagamento.');
    }

    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notas_clinicas !== undefined) updateData.notas_clinicas = data.notas_clinicas ? data.notas_clinicas.trim() : null;
    Object.assign(updateData, workflowBillingData);

    await pedidosRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id || pedido.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou pedido de exame",
            tabela: "pedidos_exames",
            registro_id: id
        });
    }

    return { id, ...updateData };
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const pedido = await pedidosRepository.findById(id);
    if (!pedido) {
        throw new Error('Pedido não encontrado');
    }

    // Verificar permissões
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para deletar este pedido');
    }

    // Verificar se há resultados associados
    const countResultados = await pedidosRepository.countResultados(id);
    if (countResultados > 0) {
        throw new Error(`Não é possível deletar um pedido que tem ${countResultados} resultado(s) associado(s)`);
    }

    await pedidosRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id || pedido.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou pedido de exame",
            tabela: "pedidos_exames",
            registro_id: id
        });
    }

    return true;
};
