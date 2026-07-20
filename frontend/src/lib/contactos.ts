import { Contact, EstadoContactoAgendamento, Processo } from '../app/data/types';
import { parseGestacaoRegistoInput, resolveGestacaoRegistadaEm } from './gestacao';
import { normalizeOrigemConceicao } from './origem-conceicao';
import { isAtivo } from './processos';
import { ColheitaFormState, colheitaContactPayload } from './colheita';

/** Estados visiveis na pagina Contactos (pipeline + filtros). */
export type ContactoPipelineEstado = 'Criado' | 'Agendado' | 'Cancelado';

export const CONTACTO_PAGE_ESTADOS: ContactoPipelineEstado[] = ['Criado', 'Agendado', 'Cancelado'];

export const CONTACTO_PIPELINE_LABEL: Record<ContactoPipelineEstado, string> = {
  Criado: 'Criado',
  Agendado: 'Agendado',
  Cancelado: 'Cancelado',
};

export const CONTACTO_PIPELINE_COLORS: Record<ContactoPipelineEstado, string> = {
  Criado: '#64748b',
  Agendado: '#f59e0b',
  Cancelado: '#f43f5e',
};

/** @deprecated usar CONTACTO_PIPELINE_LABEL */
export const CONTACTO_ESTADO_LABEL: Record<EstadoContactoAgendamento, string> = {
  Agendado: 'Agendado',
  'Kit Reservado': 'Agendado',
};

/** Contacto marcado como anulado/cancelado. */
export const isContactoCancelado = (contact: Contact): boolean =>
  contact.estado_contacto === 'Cancelado';

/** Estado visual do contacto no pipeline. */
export const getContactoPipelineEstado = (contact: Contact): ContactoPipelineEstado => {
  if (contact.estado_contacto === 'Cancelado') return 'Cancelado';
  if (contact.data_colheita_prevista?.trim()) return 'Agendado';
  if (contact.estado_agendamento === 'Agendado' || contact.estado_agendamento === 'Kit Reservado') {
    return 'Agendado';
  }
  return 'Criado';
};

export const isContactoAgendado = (contact: Contact): boolean =>
  getContactoPipelineEstado(contact) === 'Agendado';

/** Processos visiveis na pagina Processos (exclui fases pre-laboratorio do contacto). */
export const isProcessoLaboratorio = (estado: string): boolean =>
  estado !== 'Agendado' && estado !== 'Kit Reservado';

export const deriveEstadoAgendamento = (
  _gravidez: { medico_id?: string; teste_id?: string },
  colheita: { posto_id?: string; data_prevista?: string },
): EstadoContactoAgendamento | null => {
  if (colheita.data_prevista) return 'Agendado';
  return null;
};

/** Contacto com processo laboratorial ainda em curso. */
export const contactTemProcessoAtivo = (contactId: string, processos: Processo[]): boolean =>
  processos.some(
    (p) => p.paciente_id === contactId && isAtivo(p) && isProcessoLaboratorio(p.estado),
  );

export const findProcessoDoContacto = (contactId: string, processos: Processo[]): Processo | undefined =>
  processos.find(
    (p) => p.paciente_id === contactId && isAtivo(p) && isProcessoLaboratorio(p.estado),
  );

/** Processos concluídos ou cancelados do contacto (histórico). */
export const findProcessosHistoricoDoContacto = (contactId: string, processos: Processo[]): Processo[] =>
  processos.filter(
    (p) => p.paciente_id === contactId && !isAtivo(p) && isProcessoLaboratorio(p.estado),
  );

/** Lista de contactos ainda em fase pre-processo (sem processo laboratorial activo). */
export const filterContactosPreProcesso = (contacts: Contact[], processos: Processo[]): Contact[] =>
  contacts.filter((c) => !contactTemProcessoAtivo(c.id, processos));

/** Limpa dados de gravidez/colheita apos conversao em processo. */
export const buildContactPosConversao = (
  form: Omit<Contact, 'id' | 'created_at'>,
): Omit<Contact, 'id' | 'created_at'> => ({
  ...form,
  medico_id: undefined,
  teste_id: undefined,
  tipo_gravidez: null,
  origem_conceicao: null,
  quer_saber_sexo: false,
  gestacao_semanas_registo: null,
  gestacao_dias_registo: null,
  gestacao_registada_em: null,
  onde_seguida: undefined,
  posto_colheita_id: undefined,
  data_colheita_prevista: undefined,
  colheita_periodo: null,
  colheita_facturado_entidade: false,
  colheita_repeticao: false,
  colheita_nao_notificar: false,
  colheita_semanas_gestacao: null,
  colheita_dias_gestacao: null,
  colheita_data_recepcao_amostra: null,
  colheita_data_efetiva: null,
  notas_internas: undefined,
  estado_agendamento: null,
});

export type GravidezFormState = {
  medico_id: string;
  onde_seguida: string;
  teste_id: string;
  tipo_gravidez: string;
  origem_conceicao: string;
  quer_saber_sexo: boolean;
  gestacao_semanas_registo: string;
  gestacao_dias_registo: string;
  gestacao_registada_em: string;
};

export const buildContactClinicalPayload = (
  form: Omit<Contact, 'id' | 'created_at'>,
  gravidez: GravidezFormState,
  colheita: ColheitaFormState,
  notas: string,
): Omit<Contact, 'id' | 'created_at'> => {
  const gestacao = parseGestacaoRegistoInput(
    gravidez.gestacao_semanas_registo,
    gravidez.gestacao_dias_registo,
  );
  const gestacao_registada_em = resolveGestacaoRegistadaEm(
    gravidez.gestacao_semanas_registo,
    gravidez.gestacao_dias_registo,
    gravidez.gestacao_registada_em,
  );

  return {
    ...form,
    medico_id: gravidez.medico_id || undefined,
    teste_id: gravidez.teste_id || undefined,
    tipo_gravidez: gravidez.tipo_gravidez === 'Gemelar' ? 'gemelar' : gravidez.tipo_gravidez === 'Singular' ? 'singular' : null,
    origem_conceicao: normalizeOrigemConceicao(gravidez.origem_conceicao),
    quer_saber_sexo: !!gravidez.quer_saber_sexo,
    gestacao_semanas_registo: gestacao?.semanas ?? null,
    gestacao_dias_registo: gestacao?.dias ?? null,
    gestacao_registada_em: gestacao_registada_em,
    onde_seguida: gravidez.onde_seguida?.trim() || undefined,
    posto_colheita_id: colheita.posto_id || undefined,
    data_colheita_prevista: colheita.data_prevista || undefined,
    ...colheitaContactPayload(colheita),
    notas_internas: notas?.trim() || undefined,
    estado_agendamento: deriveEstadoAgendamento(gravidez, colheita) ?? null,
  };
};
