const testesRepository = require('../repositories/testes.repository');
const laboratorioFinalService = require('./laboratorio-final.service');
const logService = require('./log.service');

// Normaliza os metadados ricos do teste para gravação na BD.
const normalizeMeta = (data) => {
    const meta = {};
    const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
    const bool = (v) => (v === undefined ? undefined : (v ? 1 : 0));

    if (data.preco_compra !== undefined) meta.preco_compra = num(data.preco_compra) ?? 0;
    if (data.preco_venda !== undefined) meta.preco_venda = num(data.preco_venda) ?? 0;
    if (data.tempo_resposta_dias !== undefined) meta.tempo_resposta_dias = num(data.tempo_resposta_dias);
    if (data.gestacao_minima_semanas !== undefined) meta.gestacao_minima_semanas = num(data.gestacao_minima_semanas);
    if (data.codigo !== undefined) meta.codigo = data.codigo ? String(data.codigo).trim() : null;
    if (data.tipo_teste !== undefined) meta.tipo_teste = data.tipo_teste ? String(data.tipo_teste).trim() : null;
    if (data.empresa !== undefined) meta.empresa = data.empresa ? String(data.empresa).trim() : null;
    if (data.tipo_kit !== undefined) meta.tipo_kit = data.tipo_kit ? String(data.tipo_kit).trim() : null;
    if (data.cromossomas !== undefined) {
        // Aceita array (1..23) ou string CSV; grava como CSV ordenado.
        let lista = data.cromossomas;
        if (Array.isArray(lista)) {
            lista = lista.map((n) => Number(n)).filter((n) => n >= 1 && n <= 23);
        } else if (typeof lista === 'string') {
            lista = lista.split(',').map((n) => Number(n.trim())).filter((n) => n >= 1 && n <= 23);
        } else {
            lista = [];
        }
        meta.cromossomas = Array.from(new Set(lista)).sort((a, b) => a - b).join(',') || null;
    }
    const del = bool(data.delecoes_duplicacoes);
    if (del !== undefined) meta.delecoes_duplicacoes = del;
    const micro = bool(data.microdelecoes_microduplicacoes);
    if (micro !== undefined) meta.microdelecoes_microduplicacoes = micro;
    const gem = bool(data.gemeos);
    if (gem !== undefined) meta.gemeos = gem;
    const sexoFetal = bool(data.determinacao_sexo_fetal);
    if (sexoFetal !== undefined) meta.determinacao_sexo_fetal = sexoFetal;
    const ff = bool(data.incluir_fracao_fetal);
    if (ff !== undefined) meta.incluir_fracao_fetal = ff;

    const labFinalId = data.laboratorio_final_id ?? data.laboratorio_processamento_id;
    if (labFinalId !== undefined) {
        meta.laboratorio_processamento_id = labFinalId ? String(labFinalId).trim() : null;
    }

    return meta;
};

const mapTesteResponse = (row) => {
    if (!row) return row;
    return {
        ...row,
        laboratorio_final_id: row.laboratorio_processamento_id || null,
    };
};

exports.listAll = async (user) => {
    const rows = await testesRepository.findAll();
    return rows.map(mapTesteResponse);
};

exports.getById = async (id, user) => {
    const row = await testesRepository.findById(id);
    return mapTesteResponse(row);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do teste é obrigatório');
    }

    // Verificar se já existe teste com o mesmo nome
    const existente = await testesRepository.findByNome(data.nome);
    if (existente) {
        throw new Error('Já existe um teste com este nome');
    }

    // Validar preço
    if (data.preco !== undefined) {
        if (isNaN(data.preco) || parseFloat(data.preco) < 0) {
            throw new Error('Preço deve ser um número positivo');
        }
    }

    const meta = normalizeMeta(data);
    if (!meta.laboratorio_processamento_id) {
        throw new Error('Selecione o laboratório final (destino de descarte) do teste');
    }
    meta.laboratorio_processamento_id = await laboratorioFinalService.validateFinalLaboratorioId(
        meta.laboratorio_processamento_id,
    );

    const teste = await testesRepository.create({
        nome: data.nome.trim(),
        preco: data.preco ? parseFloat(data.preco) : 0.00,
        descricao: data.descricao ? data.descricao.trim() : null,
        ...meta
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Criou teste",
            tabela: "testes",
            registro_id: teste.id
        });
    }

    return mapTesteResponse({ ...teste, id: teste.id });
};

exports.update = async (id, data, user) => {
    // Verificar se existe
    const teste = await testesRepository.findById(id);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    // Validações
    if (data.nome !== undefined) {
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('Nome do teste não pode estar vazio');
        }
        
        if (teste.nome !== data.nome) {
            const existente = await testesRepository.findByNome(data.nome);
            if (existente) {
                throw new Error('Já existe outro teste com este nome');
            }
        }
    }

    if (data.preco !== undefined) {
        if (isNaN(data.preco) || parseFloat(data.preco) < 0) {
            throw new Error('Preço deve ser um número positivo');
        }
    }

    const updateData = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (data.preco !== undefined) updateData.preco = parseFloat(data.preco);
    if (data.descricao !== undefined) updateData.descricao = data.descricao ? data.descricao.trim() : null;
    Object.assign(updateData, normalizeMeta(data));

    if (updateData.laboratorio_processamento_id) {
        updateData.laboratorio_processamento_id = await laboratorioFinalService.validateFinalLaboratorioId(
            updateData.laboratorio_processamento_id,
        );
    }

    await testesRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou teste",
            tabela: "testes",
            registro_id: id
        });
    }

    return mapTesteResponse({ id, ...teste, ...updateData });
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const teste = await testesRepository.findById(id);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    // Verificar se tem itens de composição
    const countItens = await testesRepository.countItensComposicao(id);
    if (countItens > 0) {
        throw new Error(`Não é possível deletar um teste que tem ${countItens} item(ns) de composição associado(s)`);
    }

    // Verificar se tem pedidos associados
    const countPedidos = await testesRepository.countPedidosAssociados(id);
    if (countPedidos > 0) {
        throw new Error(`Não é possível deletar um teste que tem ${countPedidos} pedido(s) de exame(s) associado(s)`);
    }

    await testesRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou teste",
            tabela: "testes",
            registro_id: id
        });
    }

    return true;
};
