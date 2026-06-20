const composicaoService = require('../services/teste_composicao.service');

exports.listByTeste = async (req, res) => {
    try {
        const itens = await composicaoService.listByTeste(req.params.testeId, req.user);
        res.json({ data: itens, count: itens.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.listByItem = async (req, res) => {
    try {
        const testes = await composicaoService.listByItem(req.params.itemId, req.user);
        res.json({ data: testes, count: testes.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.addItem = async (req, res) => {
    try {
        const composicao = await composicaoService.addItemToTeste(req.body.teste_id, req.body.item_id, req.user);
        res.status(201).json({ message: 'Item adicionado ao teste com sucesso', data: composicao });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.removeItem = async (req, res) => {
    try {
        await composicaoService.removeItemFromTeste(req.params.testeId, req.params.itemId, req.user);
        res.json({ message: 'Item removido do teste com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
