import { Contact, EstadoContactoAgendamento, Processo } from '../app/data/types';
import { parseGestacaoRegistoInput, resolveGestacaoRegistadaEm } from './gestacao';

/** Estados visiveis na pagina Contactos (pipeline + filtros). */
export type ContactoPipelineEstado = 'Agendado' | 'Cancelado';

export const CONTACTO_PAGE_ESTADOS: ContactoPipelineEstado[] = ['Agendado', 'Cancelado'];

export const CONTACTO_PIPELINE_LABEL: Record<ContactoPipelineEstado, string> = {
  Agendado: 'Agendado',
  Cancelado: 'Cancelado',
};

export const CONTACTO_PIPELINE_COLORS: Record<ContactoPipelineEstado, string> = {
  Agendado: '#f59e0b',
  Cancelado: '#f43f5e',
};

/** @deprecated usar CONTACTO_PIPELINE_LABEL */
export const CONTACTO_ESTADO_LABEL: Record<EstadoContactoAgendamento, string> = {
  Agendado: 'Agendado',
  'Kit Reservado': 'Agendado',
};

/** Estado visual do contacto no pipeline (Cancelado reservado — sem regras por agora). */
export const getContactoPipelineEstado = (contact: Contact): ContactoPipelineEstado | null => {
  if (contact.estado_contacto === 'Cancelado') return 'Cancelado';
  if (contact.data_colheita_prevista?.trim()) return 'Agendado';
  if (contact.estado_agendamento === 'Agendado' || contact.estado_agendamento === 'Kit Reservado') {
    return 'Agendado';
  }
  return null;
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

/** Contacto ja convertido em processo (exclui cancelados). */
export const contactTemProcessoAtivo = (contactId: string, processos: Processo[]): boolean =>
  processos.some(
    (p) => p.paciente_id === contactId && p.estado !== 'Cancelado' && isProcessoLaboratorio(p.estado),
  );

export const findProcessoDoContacto = (contactId: string, processos: Processo[]): Processo | undefined =>
  processos.find(
    (p) => p.paciente_id === contactId && p.estado !== 'Cancelado' && isProcessoLaboratorio(p.estado),
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
  gestacao_semanas_registo: null,
  gestacao_dias_registo: null,
  gestacao_registada_em: null,
  onde_seguida: undefined,
  posto_colheita_id: undefined,
  data_colheita_prevista: undefined,
  notas_internas: undefined,
  estado_agendamento: null,
});

export type GravidezFormState = {
  medico_id: string;
  onde_seguida: string;
  teste_id: string;
  tipo_gravidez: string;
  gestacao_semanas_registo: string;
  gestacao_dias_registo: string;
  gestacao_registada_em: string;
};

export const buildContactClinicalPayload = (
  form: Omit<Contact, 'id' | 'created_at'>,
  gravidez: GravidezFormState,
  colheita: { posto_id: string; data_prevista: string },
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
    gestacao_semanas_registo: gestacao?.semanas ?? null,
    gestacao_dias_registo: gestacao?.dias ?? null,
    gestacao_registada_em: gestacao_registada_em,
    onde_seguida: gravidez.onde_seguida?.trim() || undefined,
    posto_colheita_id: colheita.posto_id || undefined,
    data_colheita_prevista: colheita.data_prevista || undefined,
    notas_internas: notas?.trim() || undefined,
    estado_agendamento: deriveEstadoAgendamento(gravidez, colheita) ?? null,
  };
};
