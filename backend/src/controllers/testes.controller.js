const testesService = require('../services/testes.service');

exports.list = async (req, res) => {
    try {
        const testes = await testesService.listAll(req.user);
        res.json({ data: testes, count: testes.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const teste = await testesService.getById(req.params.id, req.user);
        if (!teste) {
            return res.status(404).json({ error: 'Teste não encontrado' });
        }
        res.json(teste);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const teste = await testesService.create(req.body, req.user);
        res.status(201).json({ message: 'Teste criado com sucesso', data: teste });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const teste = await testesService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Teste atualizado com sucesso', data: teste });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await testesService.delete(req.params.id, req.user);
        res.json({ message: 'Teste deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
