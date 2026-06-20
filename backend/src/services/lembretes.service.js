const lembretesRepository = require('../repositories/lembretes.repository');
const logService = require('./log.service');

const PRIORIDADES = ['Baixa', 'Normal', 'Alta'];
const ESTADOS = ['Pendente', 'Concluido'];

const normalizeData = (data) => {
  const out = {};
  if (data.titulo !== undefined) out.titulo = String(data.titulo).trim();
  if (data.descricao !== undefined) out.descricao = data.descricao ? String(data.descricao).trim() : null;
  if (data.prioridade !== undefined) {
    out.prioridade = PRIORIDADES.includes(data.prioridade) ? data.prioridade : 'Normal';
  }
  if (data.estado !== undefined) {
    out.estado = ESTADOS.includes(data.estado) ? data.estado : 'Pendente';
  }
  if (data.data_limite !== undefined) out.data_limite = data.data_limite || null;
  if (data.paciente_id !== undefined) out.paciente_id = data.paciente_id || null;
  if (data.processo_id !== undefined) out.processo_id = data.processo_id || null;
  if (data.atribuido_a !== undefined) out.atribuido_a = data.atribuido_a || null;
  return out;
};

exports.listAll = async (filters = {}) => {
  return lembretesRepository.findAll(filters);
};

exports.getById = async (id) => {
  return lembretesRepository.findById(id);
};

exports.create = async (data, user) => {
  const normalized = normalizeData(data);
  if (!normalized.titulo) {
    throw new Error('O título do lembrete é obrigatório');
  }

  const lembrete = await lembretesRepository.create({
    ...normalized,
    estado: normalized.estado || 'Pendente',
    prioridade: normalized.prioridade || 'Normal',
    criado_por: user?.id || null,
  });

  if (user) {
    try {
      await logService.log({
        utilizador_id: user.id,
        acao: 'Criou lembrete',
        tabela: 'lembretes',
        registro_id: lembrete.id,
      });
    } catch (err) {
      console.warn('Falha ao registar auditoria de lembrete:', err.message);
    }
  }

  return lembrete;
};

exports.update = async (id, data, user) => {
  const existing = await lembretesRepository.findById(id);
  if (!existing) throw new Error('Lembrete não encontrado');

  const normalized = normalizeData(data);

  // Gerir o carimbo temporal de conclusão automaticamente.
  if (normalized.estado === 'Concluido' && existing.estado !== 'Concluido') {
    normalized.completed_at = new Date();
  } else if (normalized.estado === 'Pendente') {
    normalized.completed_at = null;
  }

  await lembretesRepository.update(id, normalized);

  if (user) {
    try {
      await logService.log({
        utilizador_id: user.id,
        acao: 'Atualizou lembrete',
        tabela: 'lembretes',
        registro_id: id,
      });
    } catch (err) {
      console.warn('Falha ao registar auditoria de lembrete:', err.message);
    }
  }

  return lembretesRepository.findById(id);
};

exports.delete = async (id, user) => {
  const removed = await lembretesRepository.delete(id);
  if (!removed) throw new Error('Lembrete não encontrado');
  if (user) {
    try {
      await logService.log({
        utilizador_id: user.id,
        acao: 'Removeu lembrete',
        tabela: 'lembretes',
        registro_id: id,
      });
    } catch (err) {
      console.warn('Falha ao registar auditoria de lembrete:', err.message);
    }
  }
  return true;
};
