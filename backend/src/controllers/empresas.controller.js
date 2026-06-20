const empresasService = require('../services/empresas.service');

exports.list = async (req, res) => {
    try {
        const empresas = await empresasService.listAll(req.user);
        res.json({ data: empresas, count: empresas.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const empresa = await empresasService.getById(req.params.id, req.user);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa não encontrada' });
        }
        res.json(empresa);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const empresa = await empresasService.create(req.body, req.user);
        res.status(201).json({ message: 'Empresa criada com sucesso', data: empresa });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const empresa = await empresasService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Empresa atualizada com sucesso', data: empresa });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await empresasService.delete(req.params.id, req.user);
        res.json({ message: 'Empresa deletada com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
