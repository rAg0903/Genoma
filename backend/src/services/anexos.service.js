const anexosRepository = require('../repositories/anexos.repository');
const logService = require('./log.service');

const TIPOS_VALIDOS = ['Documento', 'Email', 'Outro'];

exports.listByPaciente = async (pacienteId) => {
  return anexosRepository.findByPaciente(pacienteId);
};

exports.listByProcesso = async (processoId) => {
  return anexosRepository.findByProcesso(processoId);
};

exports.create = async (data, user) => {
  if (!data.titulo || !String(data.titulo).trim()) {
    throw new Error('Título do anexo é obrigatório');
  }
  if (!data.paciente_id && !data.processo_id) {
    throw new Error('Anexo tem de estar associado a um contacto ou processo');
  }
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

exports.delete = async (id, user) => {
  const removed = await anexosRepository.delete(id);
  if (!removed) throw new Error('Anexo não encontrado');
  if (user) {
    try {
      await logService.log({ utilizador_id: user.id, acao: 'Removeu anexo', tabela: 'anexos', registro_id: id });
    } catch (err) {
      console.warn('Falha ao registar auditoria de anexo:', err.message);
    }
  }
};
