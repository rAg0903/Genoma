const perfisService = require('../services/perfis.service');

exports.list = async (req, res) => {
    try {
        const perfis = await perfisService.listAll(req.user);
        res.json({ data: perfis, count: perfis.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const perfil = await perfisService.getById(req.params.id, req.user);
        if (!perfil) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        res.json(perfil);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const perfil = await perfisService.create(req.body, req.user);
        res.status(201).json({ message: 'Perfil criado com sucesso', data: perfil });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const perfil = await perfisService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Perfil atualizado com sucesso', data: perfil });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await perfisService.delete(req.params.id, req.user);
        res.json({ message: 'Perfil deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getStockSubmodulos = async (req, res) => {
    try {
        const data = await perfisService.getStockSubmodulos(req.params.id);
        res.json({ data });
    } catch (err) {
        if (err.message === 'Perfil não encontrado') {
            return res.status(404).json({ error: err.message });
        }
        res.status(400).json({ error: err.message });
    }
};

exports.updateStockSubmodulos = async (req, res) => {
    try {
        const data = await perfisService.updateStockSubmodulos(req.params.id, req.body, req.user);
        res.json({ message: 'Permissões de Stocks atualizadas com sucesso', data });
    } catch (err) {
        if (err.message === 'Perfil não encontrado') {
            return res.status(404).json({ error: err.message });
        }
        res.status(400).json({ error: err.message });
    }
};
