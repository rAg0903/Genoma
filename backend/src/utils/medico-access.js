const perfisRepository = require('../repositories/perfis.repository');
const pacientesRepository = require('../repositories/pacientes.repository');
const processosRepository = require('../repositories/processos.repository');
const { normalizeRoleName } = require('../config/stock-permissions');

const isMedicoUser = async (user) => {
  const perfilId = user?.role || user?.perfil_id;
  if (!perfilId) return false;
  try {
    const perfil = await perfisRepository.findById(perfilId);
    return perfil ? normalizeRoleName(perfil.nome) === 'medico' : false;
  } catch {
    return false;
  }
};

const pacientePertenceAoMedico = async (paciente, medicoUtilizadorId) => {
  if (!paciente || !medicoUtilizadorId) return false;
  if (paciente.medico_id === medicoUtilizadorId) return true;
  const processos = await processosRepository.findByPaciente(paciente.id);
  return processos.some((p) => p.medico_id === medicoUtilizadorId);
};

const assertPacienteAccess = async (paciente, user) => {
  if (!paciente) throw new Error('Paciente não encontrado');
  if (!(await isMedicoUser(user))) return;
  const allowed = await pacientePertenceAoMedico(paciente, user.id);
  if (!allowed) {
    throw new Error('Sem permissão para aceder a este contacto');
  }
};

const assertProcessoAccess = async (processo, user) => {
  if (!processo) throw new Error('Processo nao encontrado');
  if (!user) return;

  if (await isMedicoUser(user) && processo.medico_id !== user.id) {
    throw new Error('Sem permissao para aceder a este processo');
  }

  if (user.empresa_id && processo.empresa_id !== user.empresa_id) {
    throw new Error('Sem permissao para aceder a este processo');
  }
};

const loadProcessoWithAccess = async (processoId, user) => {
  const processo = await processosRepository.findById(processoId);
  if (!processo) throw new Error('Processo nao encontrado');
  await assertProcessoAccess(processo, user);
  return processo;
};

/** Bloqueia escrita operacional (resultados, faturação, relatório, estados). */
const assertOperacionalWriteAllowed = async (user) => {
  if (await isMedicoUser(user)) {
    throw new Error('Sem permissao: medicos apenas podem consultar processos.');
  }
};

module.exports = {
  isMedicoUser,
  pacientePertenceAoMedico,
  assertPacienteAccess,
  assertProcessoAccess,
  loadProcessoWithAccess,
  assertOperacionalWriteAllowed,
};
