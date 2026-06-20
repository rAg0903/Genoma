const medicosService = require('../services/medicos.service');

exports.list = async (req, res) => {
    try {
        const medicos = await medicosService.listAll(req.user);
        res.json({ data: medicos, count: medicos.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const medico = await medicosService.getById(req.params.utilizadorId, req.user);
        if (!medico) {
            return res.status(404).json({ error: 'Médico não encontrado' });
        }
        res.json({ data: medico });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const medico = await medicosService.create(req.body, req.user);
        res.status(201).json({ message: 'Médico criado com sucesso', data: medico });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const medico = await medicosService.update(req.params.utilizadorId, req.body, req.user);
        res.json({ message: 'Médico atualizado com sucesso', data: medico });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await medicosService.delete(req.params.utilizadorId, req.user);
        res.json({ message: 'Médico removido com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
