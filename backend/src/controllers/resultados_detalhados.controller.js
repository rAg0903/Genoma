const resultadosService = require('../services/resultados_detalhados.service');

exports.list = async (req, res) => {
    try {
        const resultados = await resultadosService.listAll(req.user);
        res.json({ data: resultados, count: resultados.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const resultado = await resultadosService.getById(req.params.id, req.user);
        if (!resultado) {
            return res.status(404).json({ error: 'Resultado não encontrado' });
        }
        res.json(resultado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.listByPedido = async (req, res) => {
    try {
        const resultados = await resultadosService.listByPedido(req.params.pedidoId, req.user);
        res.json({ data: resultados, count: resultados.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const resultado = await resultadosService.create(req.body, req.user);
        res.status(201).json({ message: 'Resultado criado com sucesso', data: resultado });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const resultado = await resultadosService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Resultado atualizado com sucesso', data: resultado });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await resultadosService.delete(req.params.id, req.user);
        res.json({ message: 'Resultado deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
