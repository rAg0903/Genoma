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

module.exports = {
  isMedicoUser,
  pacientePertenceAoMedico,
  assertPacienteAccess,
};
