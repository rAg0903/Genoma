const testesRepository = require('../repositories/testes.repository');
const laboratorioFinalService = require('./laboratorio-final.service');
const logService = require('./log.service');

const isSubTeste = (row) => Boolean(row?.teste_pai_id);

const normalizeMeta = (data, { subTeste = false } = {}) => {
    const meta = {};
    const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
    const bool = (v) => (v === undefined ? undefined : (v ? 1 : 0));

    if (!subTeste) {
        if (data.preco_compra !== undefined) meta.preco_compra = 0;
        if (data.preco_venda !== undefined) meta.preco_venda = 0;
    } else {
        if (data.preco_compra !== undefined) meta.preco_compra = num(data.preco_compra) ?? 0;
        if (data.preco_venda !== undefined) meta.preco_venda = num(data.preco_venda) ?? 0;
    }

    if (data.tempo_resposta_dias !== undefined) meta.tempo_resposta_dias = num(data.tempo_resposta_dias);
    if (data.gestacao_minima_semanas !== undefined) meta.gestacao_minima_semanas = num(data.gestacao_minima_semanas);
    if (data.codigo !== undefined) meta.codigo = data.codigo ? String(data.codigo).trim() : null;
    if (data.tipo_teste !== undefined) meta.tipo_teste = data.tipo_teste ? String(data.tipo_teste).trim() : null;
    if (data.empresa !== undefined) meta.empresa = data.empresa ? String(data.empresa).trim() : null;
    if (data.tipo_kit !== undefined) meta.tipo_kit = data.tipo_kit ? String(data.tipo_kit).trim() : null;
    if (data.cromossomas !== undefined) {
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

    if (data.teste_pai_id !== undefined) {
        meta.teste_pai_id = data.teste_pai_id ? String(data.teste_pai_id).trim() : null;
    }

    return meta;
};

const mapTesteResponse = (row) => {
    if (!row) return row;
    const { sub_testes, ...rest } = row;
    const mapped = {
        ...rest,
        laboratorio_final_id: rest.laboratorio_processamento_id || null,
    };
    if (Array.isArray(sub_testes)) {
        mapped.sub_testes = sub_testes.map((st) => mapTesteResponse(st));
    }
    return mapped;
};

const validatePreco = (preco) => {
    if (preco !== undefined && (isNaN(preco) || parseFloat(preco) < 0)) {
        throw new Error('Preço deve ser um número positivo');
    }
};

exports.listAll = async (user) => {
    const rows = await testesRepository.findAllPrincipais();
    return rows.map(mapTesteResponse);
};

exports.getById = async (id, user) => {
    const row = await testesRepository.findById(id);
    if (!row) return null;
    if (!isSubTeste(row)) {
        const subTestes = await testesRepository.findSubTestesByPaiId(id);
        return mapTesteResponse({ ...row, sub_testes: subTestes });
    }
    return mapTesteResponse(row);
};

exports.create = async (data, user) => {
    if (!data.nome || data.nome.trim() === '') {
        throw new Error('Nome do teste é obrigatório');
    }

    const paiId = data.teste_pai_id ? String(data.teste_pai_id).trim() : null;
    const subTeste = Boolean(paiId);

    if (subTeste) {
        const pai = await testesRepository.findById(paiId);
        if (!pai || isSubTeste(pai)) {
            throw new Error('Teste pai inválido');
        }
    }

    const existente = await testesRepository.findByNome(data.nome.trim(), {
        testePaiId: subTeste ? paiId : null,
    });
    if (existente) {
        throw new Error(subTeste ? 'Já existe um sub-teste com este nome' : 'Já existe um teste com este nome');
    }

    const meta = normalizeMeta(data, { subTeste });

    if (subTeste) {
        validatePreco(data.preco);
        validatePreco(data.preco_venda);
        validatePreco(data.preco_compra);
        meta.teste_pai_id = paiId;
        const pai = await testesRepository.findById(paiId);
        if (!meta.tipo_kit && pai.tipo_kit) meta.tipo_kit = pai.tipo_kit;
        if (!meta.empresa && pai.empresa) meta.empresa = pai.empresa;
        if (!meta.laboratorio_processamento_id && pai.laboratorio_processamento_id) {
            meta.laboratorio_processamento_id = pai.laboratorio_processamento_id;
        }
    } else {
        if (!meta.laboratorio_processamento_id) {
            throw new Error('Selecione o laboratório final (destino de descarte) do teste');
        }
        meta.laboratorio_processamento_id = await laboratorioFinalService.validateFinalLaboratorioId(
            meta.laboratorio_processamento_id,
        );
        meta.preco_compra = 0;
        meta.preco_venda = 0;
    }

    const precoVenda = subTeste ? (data.preco_venda ? parseFloat(data.preco_venda) : 0) : 0;

    const teste = await testesRepository.create({
        nome: data.nome.trim(),
        preco: subTeste ? precoVenda : 0,
        descricao: data.descricao ? data.descricao.trim() : null,
        ...meta,
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: subTeste ? 'Criou sub-teste' : 'Criou teste',
            tabela: 'testes',
            registro_id: teste.id,
        });
    }

    return mapTesteResponse({ ...teste, id: teste.id });
};

exports.update = async (id, data, user) => {
    const teste = await testesRepository.findById(id);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    const subTeste = isSubTeste(teste);

    if (data.nome !== undefined) {
        if (!data.nome || data.nome.trim() === '') {
            throw new Error('Nome do teste não pode estar vazio');
        }

        if (teste.nome !== data.nome.trim()) {
            const existente = await testesRepository.findByNome(data.nome.trim(), {
                testePaiId: subTeste ? teste.teste_pai_id : null,
                excludeId: id,
            });
            if (existente) {
                throw new Error(subTeste ? 'Já existe outro sub-teste com este nome' : 'Já existe outro teste com este nome');
            }
        }
    }

    if (subTeste) {
        validatePreco(data.preco);
        validatePreco(data.preco_venda);
        validatePreco(data.preco_compra);
    }

    const updateData = {};
    if (data.nome !== undefined) updateData.nome = data.nome.trim();
    if (subTeste) {
        if (data.preco !== undefined) updateData.preco = parseFloat(data.preco);
        if (data.preco_venda !== undefined) {
            updateData.preco_venda = parseFloat(data.preco_venda);
            updateData.preco = parseFloat(data.preco_venda);
        }
    } else {
        updateData.preco = 0;
        updateData.preco_compra = 0;
        updateData.preco_venda = 0;
    }
    if (data.descricao !== undefined) updateData.descricao = data.descricao ? data.descricao.trim() : null;
    Object.assign(updateData, normalizeMeta(data, { subTeste }));

    if (!subTeste && updateData.laboratorio_processamento_id) {
        updateData.laboratorio_processamento_id = await laboratorioFinalService.validateFinalLaboratorioId(
            updateData.laboratorio_processamento_id,
        );
    }

    await testesRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: subTeste ? 'Atualizou sub-teste' : 'Atualizou teste',
            tabela: 'testes',
            registro_id: id,
        });
    }

    return mapTesteResponse({ id, ...teste, ...updateData });
};

exports.delete = async (id, user) => {
    const teste = await testesRepository.findById(id);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    if (!isSubTeste(teste)) {
        const countSubs = await testesRepository.countSubTestes(id);
        if (countSubs > 0) {
            throw new Error(`Não é possível eliminar um teste que tem ${countSubs} sub-teste(s). Elimine os sub-testes primeiro.`);
        }
    }

    const countItens = await testesRepository.countItensComposicao(id);
    if (countItens > 0) {
        throw new Error(`Não é possível deletar um teste que tem ${countItens} item(ns) de composição associado(s)`);
    }

    const countPedidos = await testesRepository.countPedidosAssociados(id);
    if (countPedidos > 0) {
        throw new Error(`Não é possível deletar um teste que tem ${countPedidos} pedido(s) de exame(s) associado(s)`);
    }

    await testesRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: isSubTeste(teste) ? 'Deletou sub-teste' : 'Deletou teste',
            tabela: 'testes',
            registro_id: id,
        });
    }

    return true;
};
