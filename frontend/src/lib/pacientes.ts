import { Contact } from '../app/data/types';
import { normalizeCalendarDate } from './dates';

export interface ApiPaciente {
  id: string;
  nome: string;
  data_nascimento: string;
  genero: string | null;
  nif: string | null;
  telemovel: string | null;
  email: string | null;
  morada: string | null;
  codigo_postal?: string | null;
  pais?: string | null;
  distrito?: string | null;
  cidade?: string | null;
  altura?: number | string | null;
  peso?: number | string | null;
  medico_id?: string | null;
  teste_id?: string | null;
  tipo_gravidez?: 'singular' | 'gemelar' | null;
  gestacao_semanas_registo?: number | null;
  gestacao_dias_registo?: number | null;
  gestacao_registada_em?: string | null;
  onde_seguida?: string | null;
  posto_colheita_id?: string | null;
  data_colheita_prevista?: string | null;
  notas_internas?: string | null;
  estado_agendamento?: 'Agendado' | 'Kit Reservado' | null;
  created_at: string;
}

export const mapGeneroFromApi = (genero: string | null | undefined): string => {
  if (!genero) return 'Feminino';
  const normalized = genero.toLowerCase();
  if (normalized === 'm' || normalized === 'masculino') return 'Masculino';
  return 'Feminino';
};

export const mapGeneroToApi = (genero: string): string => {
  if (genero === 'Masculino') return 'M';
  return 'F';
};

export const mapApiPacienteToContact = (paciente: ApiPaciente): Contact => ({
  id: paciente.id,
  nome: paciente.nome,
  data_nascimento: normalizeCalendarDate(paciente.data_nascimento),
  genero: mapGeneroFromApi(paciente.genero),
  nif: paciente.nif || '',
  telemovel: paciente.telemovel || '',
  email: paciente.email || '',
  morada: paciente.morada || '',
  codigo_postal: paciente.codigo_postal || '',
  pais: paciente.pais || '',
  distrito: paciente.distrito || '',
  cidade: paciente.cidade || '',
  altura: paciente.altura !== null && paciente.altura !== undefined ? String(paciente.altura) : '',
  peso: paciente.peso !== null && paciente.peso !== undefined ? String(paciente.peso) : '',
  medico_id: paciente.medico_id || undefined,
  teste_id: paciente.teste_id || undefined,
  tipo_gravidez: paciente.tipo_gravidez || null,
  gestacao_semanas_registo: paciente.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: paciente.gestacao_dias_registo ?? null,
  gestacao_registada_em: normalizeCalendarDate(paciente.gestacao_registada_em) || null,
  onde_seguida: paciente.onde_seguida || undefined,
  posto_colheita_id: paciente.posto_colheita_id || undefined,
  data_colheita_prevista: normalizeCalendarDate(paciente.data_colheita_prevista) || undefined,
  notas_internas: paciente.notas_internas || undefined,
  estado_agendamento: paciente.estado_agendamento || null,
  created_at: paciente.created_at,
});

export const contactToApiBody = (data: Omit<Contact, 'id' | 'created_at'>) => ({
  nome: data.nome,
  data_nascimento: data.data_nascimento,
  genero: mapGeneroToApi(data.genero),
  nif: data.nif || null,
  telemovel: data.telemovel || null,
  email: data.email || null,
  morada: data.morada || null,
  codigo_postal: data.codigo_postal || null,
  pais: data.pais || null,
  distrito: data.distrito || null,
  cidade: data.cidade || null,
  altura: data.altura === '' ? null : data.altura,
  peso: data.peso === '' ? null : data.peso,
  medico_id: data.medico_id || null,
  teste_id: data.teste_id || null,
  tipo_gravidez: data.tipo_gravidez || null,
  gestacao_semanas_registo: data.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: data.gestacao_dias_registo ?? null,
  gestacao_registada_em: data.gestacao_registada_em || null,
  onde_seguida: data.onde_seguida || null,
  posto_colheita_id: data.posto_colheita_id || null,
  data_colheita_prevista: data.data_colheita_prevista || null,
  notas_internas: data.notas_internas || null,
  estado_agendamento: data.estado_agendamento || null,
});
