const pedidosService = require('../services/pedidos_exames.service');

exports.list = async (req, res) => {
    try {
        const pedidos = await pedidosService.listAll(req.user);
        res.json({ data: pedidos, count: pedidos.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const pedido = await pedidosService.getById(req.params.id, req.user);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        res.json(pedido);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.listByPaciente = async (req, res) => {
    try {
        const pedidos = await pedidosService.listByPaciente(req.params.pacienteId, req.user);
        res.json({ data: pedidos, count: pedidos.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const pedido = await pedidosService.create(req.body, req.user);
        res.status(201).json({ message: 'Pedido de exame criado com sucesso', data: pedido });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const pedido = await pedidosService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Pedido de exame atualizado com sucesso', data: pedido });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await pedidosService.delete(req.params.id, req.user);
        res.json({ message: 'Pedido de exame deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
