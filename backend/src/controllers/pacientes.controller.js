const pacientesService = require('../services/pacientes.service.js');

exports.list = async (req, res) => {
    try {
        const pacientes = await pacientesService.listAll(req.user);
        res.json({ data: pacientes, count: pacientes.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const paciente = await pacientesService.getById(req.params.id, req.user);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente não encontrado' });
        }
        res.json(paciente);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.search = async (req, res) => {
    try {
        const { nome } = req.query;
        const pacientes = await pacientesService.search(nome, req.user);
        res.json({ data: pacientes, count: pacientes.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const paciente = await pacientesService.create(req.body, req.user);
        res.status(201).json({ message: 'Paciente criado com sucesso', data: paciente });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const paciente = await pacientesService.update(req.params.id, req.body, req.user);
        res.json({ message: 'Paciente atualizado com sucesso', data: paciente });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.delete = async (req, res) => {
    try {
        await pacientesService.delete(req.params.id, req.user);
        res.json({ message: 'Paciente deletado com sucesso' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};