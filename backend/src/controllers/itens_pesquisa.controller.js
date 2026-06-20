const itensService = require('../services/itens_pesquisa.service');

exports.list = async (req, res) => {
    try {
        const itens = await itensService.listAll(req.user);
        res.json({ data: itens, count: itens.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const item = await itensService.getById(req.params.id, req.user);
        if (!item) {
            return res.status(404).json({ error: 'Item de pesquisa não encontrado' });
        }
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const item = await itensService.create(req.body, req.user);
        res.status(201).json({ message: 'Item de pesquisa criado com sucesso', data: item });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const item = await itensService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Item de pesquisa atualizado com sucesso', data: item });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await itensService.delete(req.params.id, req.user);
        res.json({ message: 'Item de pesquisa deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
