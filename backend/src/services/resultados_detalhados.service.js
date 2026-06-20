const resultadosRepository = require('../repositories/resultados_detalhados.repository');
const pedidosRepository = require('../repositories/pedidos_exames.repository');
const itensRepository = require('../repositories/itens_pesquisa.repository');
const logService = require('./log.service');

exports.listAll = async (user) => {
    return await resultadosRepository.findAll();
};

exports.getById = async (id, user) => {
    return await resultadosRepository.findById(id);
};

exports.listByPedido = async (pedidoId, user) => {
    // Verificar se pedido existe
    const pedido = await pedidosRepository.findById(pedidoId);
    if (!pedido) {
        throw new Error('Pedido não encontrado');
    }

    // Verificar permissões
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para aceder a este pedido');
    }

    return await resultadosRepository.findByPedido(pedidoId);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.pedido_id || !data.item_id) {
        throw new Error('Pedido e item são obrigatórios');
    }

    // Verificar se pedido existe
    const pedido = await pedidosRepository.findById(data.pedido_id);
    if (!pedido) {
        throw new Error('Pedido não encontrado');
    }

    // Verificar permissões
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para adicionar resultado a este pedido');
    }

    // Verificar se item existe
    const item = await itensRepository.findById(data.item_id);
    if (!item) {
        throw new Error('Item de pesquisa não encontrado');
    }

    const resultado = await resultadosRepository.create({
        pedido_id: data.pedido_id,
        item_id: data.item_id,
        resultado: data.resultado ? data.resultado.trim() : null,
        observacoes: data.observacoes ? data.observacoes.trim() : null
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id || pedido.empresa_id,
            utilizador_id: user.id,
            acao: "Criou resultado",
            tabela: "resultados_detalhados",
            registro_id: resultado.id
        });
    }

    return resultado;
};

exports.update = async (id, data, user) => {
    // Verificar se existe
    const resultado = await resultadosRepository.findById(id);
    if (!resultado) {
        throw new Error('Resultado não encontrado');
    }

    // Verificar se pedido existe e tem permissões
    const pedido = await pedidosRepository.findById(resultado.pedido_id);
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para atualizar este resultado');
    }

    const updateData = {};
    if (data.resultado !== undefined) updateData.resultado = data.resultado ? data.resultado.trim() : null;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes ? data.observacoes.trim() : null;

    await resultadosRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id || pedido.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou resultado",
            tabela: "resultados_detalhados",
            registro_id: id
        });
    }

    return { id, ...updateData };
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const resultado = await resultadosRepository.findById(id);
    if (!resultado) {
        throw new Error('Resultado não encontrado');
    }

    // Verificar se pedido existe e tem permissões
    const pedido = await pedidosRepository.findById(resultado.pedido_id);
    if (user.empresa_id && pedido.empresa_id !== user.empresa_id) {
        throw new Error('Sem permissão para deletar este resultado');
    }

    await resultadosRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id || pedido.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou resultado",
            tabela: "resultados_detalhados",
            registro_id: id
        });
    }

    return true;
};
