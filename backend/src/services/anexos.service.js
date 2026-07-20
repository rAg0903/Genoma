const fs = require('fs');
const path = require('path');
const anexosRepository = require('../repositories/anexos.repository');
const pacientesRepository = require('../repositories/pacientes.repository');
const logService = require('./log.service');
const { assertPacienteAccess, loadProcessoWithAccess, assertOperacionalWriteAllowed } = require('../utils/medico-access');
const { resolveUploadRelativePath } = require('../config/uploads');

const TIPOS_VALIDOS = ['Documento', 'Email', 'Outro'];

const assertAnexoTargetAccess = async (data, user) => {
  if (data.processo_id) {
    await loadProcessoWithAccess(data.processo_id, user);
    return;
  }
  if (data.paciente_id) {
    const paciente = await pacientesRepository.findById(data.paciente_id);
    await assertPacienteAccess(paciente, user);
    return;
  }
  throw new Error('Anexo tem de estar associado a um contacto ou processo');
};

const assertAnexoAccess = async (anexo, user) => {
  if (!anexo) throw new Error('Anexo não encontrado');
  if (anexo.processo_id) {
    await loadProcessoWithAccess(anexo.processo_id, user);
    return;
  }
  if (anexo.paciente_id) {
    const paciente = await pacientesRepository.findById(anexo.paciente_id);
    await assertPacienteAccess(paciente, user);
    return;
  }
  throw new Error('Anexo sem associação válida');
};

exports.listByPaciente = async (pacienteId, user) => {
  const paciente = await pacientesRepository.findById(pacienteId);
  await assertPacienteAccess(paciente, user);
  return anexosRepository.findByPaciente(pacienteId);
};

exports.listByProcesso = async (processoId, user) => {
  await loadProcessoWithAccess(processoId, user);
  return anexosRepository.findByProcesso(processoId);
};

exports.create = async (data, user) => {
  if (!data.titulo || !String(data.titulo).trim()) {
    throw new Error('Título do anexo é obrigatório');
  }
  if (!data.paciente_id && !data.processo_id) {
    throw new Error('Anexo tem de estar associado a um contacto ou processo');
  }
  if (data.processo_id) {
    await assertOperacionalWriteAllowed(user);
  }
  await assertAnexoTargetAccess(data, user);

  const tipo = TIPOS_VALIDOS.includes(data.tipo) ? data.tipo : 'Documento';

  const anexo = await anexosRepository.create({
    paciente_id: data.paciente_id || null,
    processo_id: data.processo_id || null,
    tipo,
    titulo: String(data.titulo).trim(),
    descricao: data.descricao ? String(data.descricao).trim() : null,
    url: data.url ? String(data.url).trim() : null,
    utilizador_id: user?.id || null,
  });

  if (user) {
    try {
      await logService.log({
        utilizador_id: user.id,
        acao: `Adicionou anexo (${tipo})`,
        tabela: 'anexos',
        registro_id: anexo.id,
      });
    } catch (err) {
      console.warn('Falha ao registar auditoria de anexo:', err.message);
    }
  }

  return anexo;
};

exports.createFromUpload = async (file, data, user) => {
  if (!file) throw new Error('Ficheiro em falta');
  if (!data.paciente_id && !data.processo_id) {
    throw new Error('Anexo tem de estar associado a um contacto ou processo');
  }

  const relativePath = path.join('uploads', 'anexos', file.filename).replace(/\\/g, '/');
  return exports.create({
    paciente_id: data.paciente_id || null,
    processo_id: data.processo_id || null,
    tipo: 'Documento',
    titulo: file.originalname || file.filename,
    url: relativePath,
  }, user);
};

exports.getFilePath = async (id, user) => {
  const anexo = await anexosRepository.findById(id);
  await assertAnexoAccess(anexo, user);
  if (!anexo?.url) throw new Error('Anexo não encontrado');
  if (!anexo.url.startsWith('uploads/')) throw new Error('Anexo sem ficheiro');
  const absolutePath = resolveUploadRelativePath(anexo.url);
  if (!fs.existsSync(absolutePath)) throw new Error('Ficheiro não encontrado');
  return { anexo, absolutePath };
};

exports.delete = async (id, user) => {
  const anexo = await anexosRepository.findById(id);
  await assertAnexoAccess(anexo, user);
  const removed = await anexosRepository.delete(id);
  if (!removed) throw new Error('Anexo não encontrado');

  if (anexo?.url?.startsWith('uploads/')) {
    const absolutePath = resolveUploadRelativePath(anexo.url);
    try {
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    } catch (err) {
      console.warn('Falha ao remover ficheiro de anexo:', err.message);
    }
  }
  if (user) {
    try {
      await logService.log({ utilizador_id: user.id, acao: 'Removeu anexo', tabela: 'anexos', registro_id: id });
    } catch (err) {
      console.warn('Falha ao registar auditoria de anexo:', err.message);
    }
  }
};
