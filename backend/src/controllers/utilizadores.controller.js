const utilizadoresService = require('../services/utilizadores.service');

exports.list = async (req, res) => {
    try {
        const utilizadores = await utilizadoresService.listAll(req.user);
        res.json({ data: utilizadores, count: utilizadores.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const utilizador = await utilizadoresService.getById(req.params.id, req.user);
        if (!utilizador) {
            return res.status(404).json({ error: 'Utilizador não encontrado' });
        }
        res.json(utilizador);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const utilizador = await utilizadoresService.create(req.body, req.user);
        res.status(201).json({ message: 'Utilizador criado com sucesso', data: utilizador });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const utilizador = await utilizadoresService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Utilizador atualizado com sucesso', data: utilizador });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await utilizadoresService.delete(req.params.id, req.user);
        res.json({ message: 'Utilizador deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
