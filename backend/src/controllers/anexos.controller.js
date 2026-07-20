const path = require('path');
const anexosService = require('../services/anexos.service');

exports.listByPaciente = async (req, res) => {
  try {
    const data = await anexosService.listByPaciente(req.params.pacienteId, req.user);
    res.json({ data, count: data.length });
  } catch (err) {
    const status = err.message?.includes('Sem permiss') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

exports.listByProcesso = async (req, res) => {
  try {
    const data = await anexosService.listByProcesso(req.params.processoId, req.user);
    res.json({ data, count: data.length });
  } catch (err) {
    const status = err.message?.includes('Sem permiss') || err.message?.includes('nao encontrado') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const anexo = await anexosService.create(req.body, req.user);
    res.status(201).json({ message: 'Anexo adicionado com sucesso', data: anexo });
  } catch (err) {
    const status = err.message?.includes('Sem permiss') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
};

exports.upload = async (req, res) => {
  try {
    const anexo = await anexosService.createFromUpload(req.file, req.body, req.user);
    res.status(201).json({ message: 'Anexo carregado com sucesso', data: anexo });
  } catch (err) {
    const status = err.message?.includes('Sem permiss') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const { anexo, absolutePath } = await anexosService.getFilePath(req.params.id, req.user);
    res.download(absolutePath, anexo.titulo || path.basename(absolutePath));
  } catch (err) {
    const status = err.message?.includes('Sem permiss') ? 403 : 404;
    res.status(status).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await anexosService.delete(req.params.id, req.user);
    res.json({ message: 'Anexo removido com sucesso' });
  } catch (err) {
    const status = err.message?.includes('Sem permiss') ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
};
