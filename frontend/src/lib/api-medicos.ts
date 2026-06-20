import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export interface MedicoContactoSecundario {
  nome: string;
  funcao: string;
  email: string;
  telefone: string;
}

export interface MedicoLocalTrabalho {
  entidade_id: string;
  entidade_nome?: string;
  entidade_cidade?: string;
}

export interface MedicoCondicaoTeste {
  teste_id: string;
  teste_nome?: string;
  comissao: number | null;
  prazo_pagamento_dias: number | null;
}

export interface MedicoCondicaoTesteInput {
  teste_id: string;
  comissao: string | number | null;
  prazo_pagamento_dias: string | number | null;
}

export interface Medico {
  utilizador_id: string;
  nome: string;
  titulo: string | null;
  genero: string | null;
  pais: string | null;
  num_ordem: string | null;
  especialidade: string | null;
  telefone_fixo: string | null;
  telefone_movel: string | null;
  email: string;
  criterio_busca_postos: string | null;
  notas: string | null;
  ativo: boolean;
  contactos_secundarios: MedicoContactoSecundario[];
  locais_trabalho: MedicoLocalTrabalho[];
  condicoes_testes: MedicoCondicaoTeste[];
}

export type MedicoPayload = Omit<Medico, 'utilizador_id' | 'locais_trabalho' | 'condicoes_testes'> & {
  locais_trabalho: { entidade_id: string }[];
  condicoes_testes: MedicoCondicaoTesteInput[];
};

const t = () => getAuthToken();

export type MedicoSaveFeedback = { kind: 'warning' | 'error'; message: string };

/** Converte erros da API de médicos em mensagens amigáveis para o utilizador. */
export function getMedicoSaveFeedback(raw: unknown): MedicoSaveFeedback {
  const text = raw instanceof Error ? raw.message : String(raw || '');
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('ja existe um utilizador com este email')) {
    return {
      kind: 'warning',
      message: 'Este email já está registado. Utilize outro endereço de email.',
    };
  }

  if (normalized.includes('ja existe um medico com este numero de cedula')) {
    return {
      kind: 'warning',
      message: 'Este número de cédula já está atribuído a outro médico.',
    };
  }

  return { kind: 'error', message: text || 'Não foi possível guardar o médico.' };
}

export const medicosApi = {
  list: () =>
    apiRequest<{ data: Medico[]; count: number }>('/medicos', { token: t() }).then((r) => r.data || []),

  get: (id: string) =>
    apiRequest<{ data: Medico }>(`/medicos/${id}`, { token: t() }).then((r) => r.data),

  create: (body: MedicoPayload) =>
    apiRequest<{ data: Medico }>('/medicos', { method: 'POST', token: t(), body }).then((r) => r.data),

  update: (id: string, body: Partial<MedicoPayload>) =>
    apiRequest<{ data: Medico }>(`/medicos/${id}`, { method: 'PUT', token: t(), body }).then((r) => r.data),

  remove: (id: string) =>
    apiRequest<{ message: string }>(`/medicos/${id}`, { method: 'DELETE', token: t() }),
};

export const CRITERIO_BUSCA_POSTOS = [
  { value: 'nome', label: 'Nome do posto' },
  { value: 'cidade', label: 'Cidade' },
  { value: 'distrito', label: 'Distrito' },
  { value: 'codigo', label: 'Código' },
] as const;

export const PAISES_COMUNS = ['Portugal', 'Espanha', 'França', 'Alemanha', 'Reino Unido', 'Brasil'];
