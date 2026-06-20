const itensRepository = require('../repositories/itens_pesquisa.repository');
const logService = require('./log.service');

exports.listAll = async (user) => {
    return await itensRepository.findAll();
};

exports.getById = async (id, user) => {
    return await itensRepository.findById(id);
};

exports.create = async (data, user) => {
    // Validações
    if (!data.codigo || data.codigo.trim() === '') {
        throw new Error('Código do item é obrigatório');
    }

    if (!data.descricao || data.descricao.trim() === '') {
        throw new Error('Descrição do item é obrigatória');
    }

    // Verificar se já existe item com o mesmo código
    const existente = await itensRepository.findByCodigo(data.codigo);
    if (existente) {
        throw new Error('Já existe um item com este código');
    }

    const item = await itensRepository.create({
        codigo: data.codigo.trim().toUpperCase(),
        descricao: data.descricao.trim()
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Criou item de pesquisa",
            tabela: "itens_pesquisa",
            registro_id: item.id
        });
    }

    return item;
};

exports.update = async (id, data, user) => {
    // Verificar se existe
    const item = await itensRepository.findById(id);
    if (!item) {
        throw new Error('Item de pesquisa não encontrado');
    }

    // Validações
    if (data.codigo !== undefined) {
        if (!data.codigo || data.codigo.trim() === '') {
            throw new Error('Código do item não pode estar vazio');
        }
        
        if (item.codigo !== data.codigo.toUpperCase()) {
            const existente = await itensRepository.findByCodigo(data.codigo);
            if (existente) {
                throw new Error('Já existe outro item com este código');
            }
        }
    }

    if (data.descricao !== undefined) {
        if (!data.descricao || data.descricao.trim() === '') {
            throw new Error('Descrição do item não pode estar vazia');
        }
    }

    const updateData = {};
    if (data.codigo !== undefined) updateData.codigo = data.codigo.trim().toUpperCase();
    if (data.descricao !== undefined) updateData.descricao = data.descricao.trim();

    await itensRepository.update(id, updateData);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Atualizou item de pesquisa",
            tabela: "itens_pesquisa",
            registro_id: id
        });
    }

    return { id, ...updateData };
};

exports.delete = async (id, user) => {
    // Verificar se existe
    const item = await itensRepository.findById(id);
    if (!item) {
        throw new Error('Item de pesquisa não encontrado');
    }

    // Verificar se há testes associados
    const countTestes = await itensRepository.countTestesAssociados(id);
    if (countTestes > 0) {
        throw new Error(`Não é possível deletar este item que tem ${countTestes} teste(s) associado(s)`);
    }

    await itensRepository.delete(id);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Deletou item de pesquisa",
            tabela: "itens_pesquisa",
            registro_id: id
        });
    }

    return true;
};
