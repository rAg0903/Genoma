/**
 * Servico de Requisicoes de Testes (App do Medico).
 *
 * Modulo desacoplado: o medico submete uma requisicao com os dados minimos do
 * utente; o sistema cria automaticamente o contacto (paciente) no CRM e abre o
 * processo no estado "Agendado". Foi desenhado para funcionar de forma
 * autonoma face aos restantes modulos.
 */
const pacientesRepository = require('../repositories/pacientes.repository');
const medicosRepository = require('../repositories/medicos.repository');
const utilizadoresRepository = require('../repositories/utilizadores.repository');
const testesRepository = require('../repositories/testes.repository');
const processosService = require('./processos.service');
const informacaoClinicaRepository = require('../repositories/informacao_clinica.repository');
const logService = require('./log.service');

// Placeholder de data de nascimento quando a requisicao nao a fornece (campos
// minimos). O back-office completa o contacto posteriormente.
const DOB_PLACEHOLDER = '1970-01-01';

const resolveMedico = async (data) => {
  if (data.medico_id) {
    const medico = await medicosRepository.findById(data.medico_id);
    if (medico) return medico;
  }
  if (data.num_ordem) {
    const medico = await medicosRepository.findByNumOrdem(data.num_ordem);
    if (medico) return medico;
  }
  throw new Error('Medico nao identificado (forneca medico_id ou num_ordem).');
};

const findOrCreatePaciente = async (data) => {
  if (data.paciente_id) {
    const existente = await pacientesRepository.findById(data.paciente_id);
    if (existente) return { paciente: existente, criado: false };
  }
  if (data.nif) {
    const porNif = await pacientesRepository.findByNif(data.nif);
    if (porNif) return { paciente: porNif, criado: false };
  }
  if (data.email) {
    const porEmail = await pacientesRepository.findByEmail(data.email);
    if (Array.isArray(porEmail) && porEmail.length > 0) {
      return { paciente: porEmail[0], criado: false };
    }
  }

  if (!data.nome || !String(data.nome).trim()) {
    throw new Error('Nome do utente e obrigatorio.');
  }

  const paciente = await pacientesRepository.create({
    nome: String(data.nome).trim(),
    data_nascimento: data.data_nascimento || DOB_PLACEHOLDER,
    genero: data.genero || null,
    nif: data.nif || null,
    telemovel: data.telefone || data.telemovel || null,
    email: data.email || null,
    morada: data.morada || null,
  });
  return { paciente, criado: true };
};

exports.criarRequisicao = async (data, user) => {
  if (!data.teste_id) {
    throw new Error('Teste e obrigatorio.');
  }
  const teste = await testesRepository.findById(data.teste_id);
  if (!teste) throw new Error('Teste nao encontrado.');

  const medico = await resolveMedico(data);

  const { paciente, criado } = await findOrCreatePaciente(data);

  // Empresa: usa a fornecida, senao a empresa do medico.
  let empresaId = data.empresa_id || null;
  if (!empresaId) {
    const utilizadorMedico = await utilizadoresRepository.findById(medico.utilizador_id);
    empresaId = utilizadorMedico?.empresa_id || null;
  }

  const processo = await processosService.create(
    {
      paciente_id: paciente.id,
      medico_id: medico.utilizador_id,
      teste_id: data.teste_id,
      empresa_id: empresaId,
      status: 'Agendado',
      observacoes: data.observacoes || data.motivo_prescricao || null,
    },
    user || { id: medico.utilizador_id, empresa_id: empresaId }
  );

  // Informacao clinica minima (idade gestacional / seguro).
  if (data.semanas_gravidez || data.dias_gravidez || data.motivo_prescricao || data.quer_saber_sexo !== undefined) {
    await informacaoClinicaRepository.create({
      processo_id: processo.id,
      semanas_gravidez: data.semanas_gravidez || null,
      dias_gravidez: data.dias_gravidez || null,
      tipo_gravidez: data.tipo_gravidez || null,
      quer_saber_sexo: !!data.quer_saber_sexo,
      motivo_prescricao: data.motivo_prescricao || null,
    });
  }

  if (user) {
    await logService.log({
      utilizador_id: user.id,
      acao: 'Criou requisicao de teste',
      tabela: 'processos',
    });
  }

  return {
    requisicao_aceite: true,
    contacto_criado: criado,
    paciente: {
      id: paciente.id,
      nome: paciente.nome,
      email: paciente.email,
      telemovel: paciente.telemovel,
    },
    processo: {
      id: processo.id,
      numero_processo: processo.numero_processo,
      status: 'Agendado',
    },
  };
};
