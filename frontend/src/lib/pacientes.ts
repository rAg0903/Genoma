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
  origem_conceicao?: 'natural' | 'fiv_ovulos_proprios' | 'fiv_doacao_ovulos' | null;
  quer_saber_sexo?: boolean | null;
  gestacao_semanas_registo?: number | null;
  gestacao_dias_registo?: number | null;
  gestacao_registada_em?: string | null;
  onde_seguida?: string | null;
  posto_colheita_id?: string | null;
  data_colheita_prevista?: string | null;
  notas_internas?: string | null;
  estado_agendamento?: 'Agendado' | 'Kit Reservado' | null;
  estado_contacto?: 'Cancelado' | null;
  motivo_anulacao_id?: string | null;
  data_anulacao?: string | null;
  created_at: string;
  fatura_emitida?: boolean;
  fatura_numero?: string | null;
  fatura_data_emissao?: string | null;
  valor_base?: number | null;
  desconto_percentual?: number | null;
  valor_final?: number | null;
  pagamento_data?: string | null;
  recibo_numero?: string | null;
  pago?: boolean | null;
  entidade_multibanco?: string | null;
  referencia_multibanco?: string | null;
  nao_gera_comissao?: boolean | null;
  fatura_envio_email?: string | null;
  fatura_envio_sms?: string | null;
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
  origem_conceicao: paciente.origem_conceicao || null,
  quer_saber_sexo: !!paciente.quer_saber_sexo,
  gestacao_semanas_registo: paciente.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: paciente.gestacao_dias_registo ?? null,
  gestacao_registada_em: normalizeCalendarDate(paciente.gestacao_registada_em) || null,
  onde_seguida: paciente.onde_seguida || undefined,
  posto_colheita_id: paciente.posto_colheita_id || undefined,
  data_colheita_prevista: normalizeCalendarDate(paciente.data_colheita_prevista) || undefined,
  notas_internas: paciente.notas_internas || undefined,
  estado_agendamento: paciente.estado_agendamento || null,
  estado_contacto: paciente.estado_contacto === 'Cancelado' ? 'Cancelado' : null,
  motivo_anulacao_id: paciente.motivo_anulacao_id || undefined,
  data_anulacao: normalizeCalendarDate(paciente.data_anulacao) || undefined,
  created_at: paciente.created_at,
  fatura_emitida: paciente.fatura_emitida || false,
  fatura_numero: paciente.fatura_numero || undefined,
  fatura_data_emissao: normalizeCalendarDate(paciente.fatura_data_emissao) || undefined,
  valor_base: paciente.valor_base != null ? Number(paciente.valor_base) : undefined,
  desconto_percentual: paciente.desconto_percentual != null ? Number(paciente.desconto_percentual) : undefined,
  valor_final: paciente.valor_final != null ? Number(paciente.valor_final) : undefined,
  pagamento_data: normalizeCalendarDate(paciente.pagamento_data) || undefined,
  recibo_numero: paciente.recibo_numero || undefined,
  pago: paciente.pago || false,
  entidade_multibanco: paciente.entidade_multibanco || undefined,
  referencia_multibanco: paciente.referencia_multibanco || undefined,
  nao_gera_comissao: paciente.nao_gera_comissao || false,
  fatura_envio_email: normalizeCalendarDate(paciente.fatura_envio_email) || undefined,
  fatura_envio_sms: normalizeCalendarDate(paciente.fatura_envio_sms) || undefined,
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
  origem_conceicao: data.origem_conceicao || null,
  quer_saber_sexo: !!data.quer_saber_sexo,
  gestacao_semanas_registo: data.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: data.gestacao_dias_registo ?? null,
  gestacao_registada_em: data.gestacao_registada_em || null,
  onde_seguida: data.onde_seguida || null,
  posto_colheita_id: data.posto_colheita_id || null,
  data_colheita_prevista: data.data_colheita_prevista || null,
  notas_internas: data.notas_internas || null,
  estado_agendamento: data.estado_agendamento || null,
  estado_contacto: data.estado_contacto || null,
  motivo_anulacao_id: data.motivo_anulacao_id || null,
  data_anulacao: data.data_anulacao || null,
  fatura_emitida: data.fatura_emitida ?? false,
  fatura_numero: data.fatura_numero || null,
  fatura_data_emissao: data.fatura_data_emissao || null,
  valor_base: data.valor_base ?? 0,
  desconto_percentual: data.desconto_percentual ?? 0,
  valor_final: data.valor_final ?? 0,
  pagamento_data: data.pagamento_data || null,
  recibo_numero: data.recibo_numero || null,
  pago: data.pago ?? false,
  entidade_multibanco: data.entidade_multibanco || null,
  referencia_multibanco: data.referencia_multibanco || null,
  nao_gera_comissao: data.nao_gera_comissao ?? false,
  fatura_envio_email: data.fatura_envio_email || null,
  fatura_envio_sms: data.fatura_envio_sms || null,
});
