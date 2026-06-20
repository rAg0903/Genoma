const composicaoRepository = require('../repositories/teste_composicao.repository');
const testesRepository = require('../repositories/testes.repository');
const itensRepository = require('../repositories/itens_pesquisa.repository');
const logService = require('./log.service');

exports.listByTeste = async (testeId, user) => {
    // Verificar se teste existe
    const teste = await testesRepository.findById(testeId);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    return await composicaoRepository.findByTeste(testeId);
};

exports.listByItem = async (itemId, user) => {
    // Verificar se item existe
    const item = await itensRepository.findById(itemId);
    if (!item) {
        throw new Error('Item de pesquisa não encontrado');
    }

    return await composicaoRepository.findByItem(itemId);
};

exports.addItemToTeste = async (testeId, itemId, user) => {
    // Validações
    if (!testeId || !itemId) {
        throw new Error('ID do teste e ID do item são obrigatórios');
    }

    // Verificar se teste existe
    const teste = await testesRepository.findById(testeId);
    if (!teste) {
        throw new Error('Teste não encontrado');
    }

    // Verificar se item existe
    const item = await itensRepository.findById(itemId);
    if (!item) {
        throw new Error('Item de pesquisa não encontrado');
    }

    // Verificar se já existe essa composição
    const jãExiste = await composicaoRepository.findByComposicao(testeId, itemId);
    if (jãExiste) {
        throw new Error('Este item já está associado a este teste');
    }

    const composicao = await composicaoRepository.create({
        teste_id: testeId,
        item_id: itemId
    });

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Adicionou item a teste",
            tabela: "teste_composicao",
            registro_id: `${testeId}|${itemId}`
        });
    }

    return composicao;
};

exports.removeItemFromTeste = async (testeId, itemId, user) => {
    // Validações
    if (!testeId || !itemId) {
        throw new Error('ID do teste e ID do item são obrigatórios');
    }

    // Verificar se composição existe
    const jãExiste = await composicaoRepository.findByComposicao(testeId, itemId);
    if (!jãExiste) {
        throw new Error('Esta composição não existe');
    }

    await composicaoRepository.delete(testeId, itemId);

    if (user) {
        await logService.log({
            empresa_id: user.empresa_id,
            utilizador_id: user.id,
            acao: "Removeu item de teste",
            tabela: "teste_composicao",
            registro_id: `${testeId}|${itemId}`
        });
    }

    return true;
};
