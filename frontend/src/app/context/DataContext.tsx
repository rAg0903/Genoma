import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { Contact, Processo, Kit, Lote, Utilizador, Empresa, Teste, TipoKit, MotivoAnulacao, ItemPesquisa, SistemaSaude, Posto, Laboratorio, Entidade, RequisicaoKit, Anexo } from '../data/types';
import { apiRequest } from '../../lib/api';
import { normalizeCalendarDate, todayLocal } from '../../lib/dates';
import {
  ApiPaciente,
  contactToApiBody,
  mapApiPacienteToContact,
} from '../../lib/pacientes';
import { resolveTesteIdFromSelection } from '../../lib/testes';

type ApiListResponse<T> = {
  data?: T[];
  count?: number;
};

type ApiEntityResponse<T> = {
  data?: T;
  message?: string;
};

interface ApiProcesso {
  id: string;
  paciente_id: string;
  paciente_nome?: string;
  medico_id: string;
  medico_nome?: string;
  teste_id: string;
  teste_nome?: string;
  teste_pai_id?: string | null;
  teste_pai_nome?: string | null;
  sub_teste_nome?: string | null;
  empresa_id: string;
  status: string;
  data_pedido?: string;
  data_entrada?: string;
  notas_clinicas?: string | null;
  numero_processo?: string | null;
  posto?: string | null;
  kit_codigo?: string | null;
  data_colheita?: string | null;
  data_colheita_prevista?: string | null;
  data_chegada_laboratorio?: string | null;
  data_resultado?: string | null;
  data_validacao?: string | null;
  data_envio_relatorio?: string | null;
  responsavel_fluxo?: string | null;
  relatorio_validado?: boolean | null;
  relatorio_enviado_para?: 'Nenhum' | 'Medico' | 'Utente' | 'Ambos' | null;
  resultado_tudo_ok?: boolean | null;
  resultado_anomalias?: string | null;
  fracao_fetal?: string | null;
  fatura_emitida?: boolean | null;
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
  onde_seguida?: string | null;
  tipo_gravidez?: 'singular' | 'gemelar' | null;
  gestacao_semanas_registo?: number | null;
  gestacao_dias_registo?: number | null;
  gestacao_registada_em?: string | null;
  motivo_anulacao_id?: string | null;
  motivo_anulacao_nome?: string | null;
  data_anulacao?: string | null;
}

interface ApiMedico {
  utilizador_id: string;
  nome: string;
}

interface ApiTeste {
  id: string;
  nome: string;
  descricao?: string | null;
  preco?: number | string | null;
  codigo?: string | null;
  preco_compra?: number | string | null;
  preco_venda?: number | string | null;
  tempo_resposta_dias?: number | null;
  gestacao_minima_semanas?: number | null;
  tipo_teste?: string | null;
  empresa?: string | null;
  tipo_kit?: string | null;
  cromossomas?: string | null;
  delecoes_duplicacoes?: number | boolean | null;
  microdelecoes_microduplicacoes?: number | boolean | null;
  gemeos?: number | boolean | null;
  determinacao_sexo_fetal?: number | boolean | null;
  incluir_fracao_fetal?: number | boolean | null;
  laboratorio_final_id?: string | null;
  laboratorio_processamento_id?: string | null;
  teste_pai_id?: string | null;
  ativo?: boolean | null;
  sub_testes?: ApiTeste[];
}

const mapSubTesteFromApi = (t: ApiTeste): import('../data/types').SubTeste => ({
  id: t.id,
  teste_pai_id: t.teste_pai_id || '',
  nome: t.nome,
  descricao: t.descricao || '',
  preco: Number(t.preco || 0),
  codigo: t.codigo || '',
  preco_compra: Number(t.preco_compra || 0),
  preco_venda: Number(t.preco_venda || 0),
  cromossomas: t.cromossomas ? String(t.cromossomas).split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)) : [],
  delecoes_duplicacoes: !!t.delecoes_duplicacoes,
  microdelecoes_microduplicacoes: !!t.microdelecoes_microduplicacoes,
  gemeos: !!t.gemeos,
  determinacao_sexo_fetal: !!t.determinacao_sexo_fetal,
  incluir_fracao_fetal: t.incluir_fracao_fetal === undefined || t.incluir_fracao_fetal === null ? true : !!t.incluir_fracao_fetal,
  ativo: t.ativo !== false,
});

const mapTesteFromApi = (t: ApiTeste): Teste => ({
  id: t.id,
  nome: t.nome,
  descricao: t.descricao || '',
  preco: Number(t.preco || 0),
  codigo: t.codigo || '',
  preco_compra: Number(t.preco_compra || 0),
  preco_venda: Number(t.preco_venda || 0),
  tempo_resposta_dias: t.tempo_resposta_dias ?? null,
  gestacao_minima_semanas: t.gestacao_minima_semanas ?? null,
  tipo_teste: t.tipo_teste || '',
  empresa: t.empresa || '',
  tipo_kit: t.tipo_kit || '',
  cromossomas: t.cromossomas ? String(t.cromossomas).split(',').map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)) : [],
  delecoes_duplicacoes: !!t.delecoes_duplicacoes,
  microdelecoes_microduplicacoes: !!t.microdelecoes_microduplicacoes,
  gemeos: !!t.gemeos,
  determinacao_sexo_fetal: !!t.determinacao_sexo_fetal,
  incluir_fracao_fetal: t.incluir_fracao_fetal === undefined || t.incluir_fracao_fetal === null ? true : !!t.incluir_fracao_fetal,
  laboratorio_final_id: t.laboratorio_final_id || t.laboratorio_processamento_id || null,
  teste_pai_id: t.teste_pai_id || null,
  ativo: t.ativo !== false,
  sub_testes: (t.sub_testes || []).map(mapSubTesteFromApi),
});

interface ApiEmpresa {
  id: string;
  nome?: string;
  morada?: string | null;
  codigo_postal?: string | null;
  telefone?: string | null;
  contacto?: string | null;
  email?: string | null;
  nif?: string | null;
  tipo_empresa?: 'CLINICA' | 'POSTO' | 'LABORATORIO' | 'PARCEIRO' | null;
  pais?: string | null;
  ativo?: boolean | null;
}

const mapEmpresaFromApi = (e: ApiEmpresa): Empresa => ({
  id: e.id,
  nome: e.nome || '',
  morada: e.morada || '',
  codigo_postal: e.codigo_postal || '',
  contacto: e.contacto || e.telefone || '',
  email: e.email || '',
  nif: e.nif || '',
  tipo_empresa: e.tipo_empresa || undefined,
  pais: e.pais || '',
  ativo: e.ativo === undefined || e.ativo === null ? true : !!e.ativo,
});

interface ApiUtilizador {
  id: string;
  nome?: string;
  email?: string;
  ativo?: boolean | null;
  perfil_nome?: string | null;
  avatar_url?: string | null;
}

const mapUtilizadorFromApi = (u: ApiUtilizador): Utilizador => ({
  id: u.id,
  nome: u.nome || '',
  email: u.email || '',
  perfil: u.perfil_nome || '',
  ativo: u.ativo === undefined || u.ativo === null ? true : !!u.ativo,
  avatar_url: u.avatar_url ?? null,
});

const utilizadorToApiBody = (data: Partial<Utilizador>) => ({
  ...(data.nome !== undefined ? { nome: data.nome } : {}),
  ...(data.email !== undefined ? { email: data.email } : {}),
  ...(data.perfil !== undefined ? { perfil_nome: data.perfil } : {}),
  ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
});

interface ApiContactoSecundario {
  nome?: string | null;
  funcao?: string | null;
  email?: string | null;
  telefone?: string | null;
}

interface ApiCondicaoTeste {
  teste_id: string;
  comissao?: number | null;
  prazo_pagamento_dias?: number | null;
}

interface ApiPosto {
  id: string;
  nome?: string | null;
  codigo?: string | null;
  entidade_id?: string | null;
  laboratorio_id?: string | null;
  morada?: string | null;
  codigo_postal?: string | null;
  cidade?: string | null;
  distrito?: string | null;
  pais?: string | null;
  contacto?: string | null;
  email?: string | null;
  notas?: string | null;
  contactos_secundarios?: ApiContactoSecundario[] | null;
  condicoes_testes?: ApiCondicaoTeste[] | null;
  ativo?: boolean | null;
}

const mapContactosSecundariosFromApi = (items?: ApiContactoSecundario[] | null) =>
  (items || []).map((c) => ({
    nome: c.nome || '',
    funcao: c.funcao || '',
    email: c.email || '',
    telefone: c.telefone || '',
  }));

const mapCondicoesTestesFromApi = (items?: ApiCondicaoTeste[] | null) =>
  (items || []).map((c) => ({
    teste_id: c.teste_id,
    comissao: c.comissao ?? null,
    prazo_pagamento_dias: c.prazo_pagamento_dias ?? null,
  }));

const mapPostoFromApi = (p: ApiPosto): Posto => ({
  id: p.id,
  nome: p.nome || '',
  codigo: p.codigo || '',
  entidade_id: p.entidade_id || null,
  laboratorio_id: p.laboratorio_id || null,
  morada: p.morada || '',
  codigo_postal: p.codigo_postal || '',
  cidade: p.cidade || '',
  distrito: p.distrito || '',
  pais: p.pais || '',
  contacto: p.contacto || '',
  email: p.email || '',
  notas: p.notas || '',
  contactos_secundarios: mapContactosSecundariosFromApi(p.contactos_secundarios),
  condicoes_testes: mapCondicoesTestesFromApi(p.condicoes_testes),
  ativo: p.ativo === undefined || p.ativo === null ? true : !!p.ativo,
});

interface ApiLaboratorio {
  id: string;
  nome?: string | null;
  codigo?: string | null;
  morada?: string | null;
  codigo_postal?: string | null;
  cidade?: string | null;
  distrito?: string | null;
  pais?: string | null;
  contacto?: string | null;
  email?: string | null;
  notas?: string | null;
  contactos_secundarios?: ApiContactoSecundario[] | null;
  condicoes_testes?: ApiCondicaoTeste[] | null;
  ativo?: boolean | null;
  tipo?: 'operacional' | 'final' | null;
}

const mapLaboratorioFromApi = (l: ApiLaboratorio): Laboratorio => ({
  id: l.id,
  nome: l.nome || '',
  codigo: l.codigo || '',
  morada: l.morada || '',
  codigo_postal: l.codigo_postal || '',
  cidade: l.cidade || '',
  distrito: l.distrito || '',
  pais: l.pais || '',
  contacto: l.contacto || '',
  email: l.email || '',
  notas: l.notas || '',
  contactos_secundarios: mapContactosSecundariosFromApi(l.contactos_secundarios),
  condicoes_testes: mapCondicoesTestesFromApi(l.condicoes_testes),
  ativo: l.ativo === undefined || l.ativo === null ? true : !!l.ativo,
  tipo: l.tipo === 'final' ? 'final' : 'operacional',
});

const postoToApiBody = (data: Partial<Posto>) => ({
  ...(data.nome !== undefined ? { nome: data.nome } : {}),
  ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
  ...(data.entidade_id !== undefined ? { entidade_id: data.entidade_id } : {}),
  ...(data.laboratorio_id !== undefined ? { laboratorio_id: data.laboratorio_id } : {}),
  ...(data.morada !== undefined ? { morada: data.morada } : {}),
  ...(data.codigo_postal !== undefined ? { codigo_postal: data.codigo_postal } : {}),
  ...(data.cidade !== undefined ? { cidade: data.cidade } : {}),
  ...(data.distrito !== undefined ? { distrito: data.distrito } : {}),
  ...(data.pais !== undefined ? { pais: data.pais } : {}),
  ...(data.contacto !== undefined ? { contacto: data.contacto } : {}),
  ...(data.email !== undefined ? { email: data.email } : {}),
  ...(data.notas !== undefined ? { notas: data.notas } : {}),
  ...(data.contactos_secundarios !== undefined ? { contactos_secundarios: data.contactos_secundarios } : {}),
  ...(data.condicoes_testes !== undefined ? { condicoes_testes: data.condicoes_testes } : {}),
  ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
});

const laboratorioToApiBody = (data: Partial<Laboratorio>) => ({
  ...(data.nome !== undefined ? { nome: data.nome } : {}),
  ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
  ...(data.morada !== undefined ? { morada: data.morada } : {}),
  ...(data.codigo_postal !== undefined ? { codigo_postal: data.codigo_postal } : {}),
  ...(data.cidade !== undefined ? { cidade: data.cidade } : {}),
  ...(data.distrito !== undefined ? { distrito: data.distrito } : {}),
  ...(data.pais !== undefined ? { pais: data.pais } : {}),
  ...(data.contacto !== undefined ? { contacto: data.contacto } : {}),
  ...(data.email !== undefined ? { email: data.email } : {}),
  ...(data.notas !== undefined ? { notas: data.notas } : {}),
  ...(data.contactos_secundarios !== undefined ? { contactos_secundarios: data.contactos_secundarios } : {}),
  ...(data.condicoes_testes !== undefined ? { condicoes_testes: data.condicoes_testes } : {}),
  ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
  ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
});

type ApiEntidade = ApiLaboratorio;

const mapEntidadeFromApi = (e: ApiEntidade): Entidade => ({
  id: e.id,
  nome: e.nome || '',
  codigo: e.codigo || '',
  morada: e.morada || '',
  codigo_postal: e.codigo_postal || '',
  cidade: e.cidade || '',
  distrito: e.distrito || '',
  pais: e.pais || '',
  contacto: e.contacto || '',
  email: e.email || '',
  notas: e.notas || '',
  contactos_secundarios: mapContactosSecundariosFromApi(e.contactos_secundarios),
  condicoes_testes: mapCondicoesTestesFromApi(e.condicoes_testes),
  ativo: e.ativo === undefined || e.ativo === null ? true : !!e.ativo,
});

const entidadeToApiBody = (data: Partial<Entidade>) => laboratorioToApiBody(data);

export interface PostoKitDisponivel {
  id: string;
  codigo_barras: string;
  tracking: string;
  tipo_kit: string;
  teste_nome?: string;
  teste_id?: string | null;
  data_validade: string;
}

interface ApiKit {
  id: string;
  codigo_barras: string;
  tracking?: string | null;
  tipo_kit?: string | null;
  lote?: string | null;
  status?: string | null;
  data_validade?: string | null;
  localizacao?: string | null;
  empresa_id?: string | null;
  posto_id?: string | null;
  laboratorio_id?: string | null;
  fase_ciclo?: string | null;
}

interface ApiLote {
  id: string;
  codigo?: string | null;
  tipo_kit?: string | null;
  tipo_teste?: string | null;
  teste_id?: string | null;
  teste_nome?: string | null;
  quantidade_total?: number | string | null;
  quantidade_disponivel?: number | string | null;
  data_rececao?: string | null;
  data_validade?: string | null;
  fornecedor?: string | null;
  fornecedor_id?: string | null;
}

interface ApiRequisicao {
  id: string;
  numero_envio?: string | null;
  data: string;
  origem: string;
  destino: string;
  origem_nome?: string | null;
  destino_nome?: string | null;
  origem_empresa_id?: string | null;
  origem_posto_id?: string | null;
  origem_laboratorio_id?: string | null;
  destino_empresa_id?: string | null;
  destino_posto_id?: string | null;
  destino_laboratorio_id?: string | null;
  quantidade: number;
  status?: string | null;
  tracking_number?: string | null;
  transportadora?: string | null;
  lote_codigo?: string | null;
  kit_ids?: string[] | string | null;
  utilizador_id?: string | null;
  utilizador_nome?: string | null;
  observacoes?: string | null;
}

const AUTH_TOKEN_KEYS = ['token', 'authToken', 'jwtToken', 'access_token'];

const getAuthToken = () => {
  if (typeof window === 'undefined') return undefined;
  for (const key of AUTH_TOKEN_KEYS) {
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value;
  }
  return undefined;
};

const mapEstadoToApi = (estado: Processo['estado']): string => estado;

const mapPacienteToContact = mapApiPacienteToContact;

const mapEstadoFromApi = (estado: string | null | undefined): Processo['estado'] => {
  if (!estado) return 'Agendado';
  const normalized = estado.toLowerCase();
  if (normalized === 'pendente' || normalized === 'aguardando colheita' || normalized === 'agendado') return 'Agendado';
  if (normalized === 'kit reservado' || normalized === 'reservado') return 'Kit Reservado';
  if (normalized === 'colheita realizada') return 'Colheita Realizada';
  if (normalized === 'em laboratório' || normalized === 'em laboratorio' || normalized === 'enviado laboratorio') return 'Enviado Laboratorio';
  if (normalized === 'em análise' || normalized === 'em analise') return 'Em Analise';
  if (normalized === 'concluído' || normalized === 'concluido' || normalized === 'resultado disponivel' || normalized === 'resultado disponível') return 'Resultado Disponivel';
  if (normalized === 'validado') return 'Validado';
  if (normalized === 'faturado') return 'Faturado';
  if (normalized === 'cancelado') return 'Cancelado';
  return 'Agendado';
};

const normalizeDate = (value: string | Date | null | undefined): string =>
  normalizeCalendarDate(value);

const mapPedidoToProcesso = (pedido: ApiProcesso): Processo => ({
  id: pedido.id,
  numero: pedido.numero_processo || pedido.kit_codigo || `PED-${pedido.id.slice(0, 8).toUpperCase()}`,
  paciente_id: pedido.paciente_id,
  paciente_nome: pedido.paciente_nome || '',
  medico: pedido.medico_nome || '',
  medico_id: pedido.medico_id,
  posto: pedido.posto || '',
  kit_codigo: pedido.kit_codigo || '',
  estado: mapEstadoFromApi(pedido.status),
  data_entrada: normalizeDate(pedido.data_entrada || pedido.data_pedido) || todayLocal(),
  data_colheita: normalizeDate(pedido.data_colheita),
  data_colheita_prevista: normalizeDate(pedido.data_colheita_prevista),
  data_chegada_laboratorio: normalizeDate(pedido.data_chegada_laboratorio),
  data_resultado: normalizeDate(pedido.data_resultado),
  data_validacao: normalizeDate(pedido.data_validacao),
  data_envio_relatorio: normalizeDate(pedido.data_envio_relatorio),
  teste: pedido.teste_nome || '',
  teste_id: pedido.teste_id,
  teste_pai_nome: pedido.teste_pai_nome || undefined,
  sub_teste_nome: pedido.sub_teste_nome || undefined,
  observacoes: pedido.notas_clinicas || '',
  responsavel_fluxo: pedido.responsavel_fluxo || '',
  relatorio_validado: !!pedido.relatorio_validado,
  relatorio_enviado_para: pedido.relatorio_enviado_para || 'Nenhum',
  resultado_tudo_ok: pedido.resultado_tudo_ok !== false,
  resultado_anomalias: pedido.resultado_anomalias || '',
  fracao_fetal: pedido.fracao_fetal || '',
  fatura_emitida: !!pedido.fatura_emitida,
  fatura_numero: pedido.fatura_numero || '',
  fatura_data_emissao: normalizeDate(pedido.fatura_data_emissao),
  valor_base: Number(pedido.valor_base || 0),
  desconto_percentual: Number(pedido.desconto_percentual || 0),
  valor_final: Number(pedido.valor_final || 0),
  pagamento_data: normalizeDate(pedido.pagamento_data),
  recibo_numero: pedido.recibo_numero || '',
  pago: !!pedido.pago,
  entidade_multibanco: pedido.entidade_multibanco || '',
  referencia_multibanco: pedido.referencia_multibanco || '',
  nao_gera_comissao: !!pedido.nao_gera_comissao,
  fatura_envio_email: normalizeDate(pedido.fatura_envio_email) || '',
  fatura_envio_sms: normalizeDate(pedido.fatura_envio_sms) || '',
  onde_seguida: pedido.onde_seguida || '',
  tipo_gravidez: pedido.tipo_gravidez || null,
  gestacao_semanas_registo: pedido.gestacao_semanas_registo ?? null,
  gestacao_dias_registo: pedido.gestacao_dias_registo ?? null,
  gestacao_registada_em: normalizeDate(pedido.gestacao_registada_em) || null,
  motivo_anulacao_id: pedido.motivo_anulacao_id || null,
  motivo_anulacao_nome: pedido.motivo_anulacao_nome || undefined,
  data_anulacao: normalizeDate(pedido.data_anulacao) || null,
});

const mapKitStatusFromApi = (status: string | null | undefined): Kit['status'] => {
  if (!status) return 'Disponível';
  if (status === 'Disponível' || status === 'Disponivel') return 'Disponível';
  if (status === 'Reservado') return 'Reservado';
  if (status === 'Em trânsito' || status === 'Em transito') return 'Em trânsito';
  if (status === 'Utilizado') return 'Utilizado';
  if (status === 'Inválido' || status === 'Invalido') return 'Inválido';
  if (status === 'Perdido') return 'Perdido';
  if (status === 'Expirado') return 'Expirado';
  return 'Disponível';
};

const mapKitLocalizacaoFromApi = (localizacao: string | null | undefined): Kit['localizacao'] => {
  if (localizacao === 'Posto' || localizacao === 'Laboratorio' || localizacao === 'Escritorio') {
    return localizacao as Kit['localizacao'];
  }
  return 'Escritorio';
};

const mapKitFromApi = (kit: ApiKit): Kit => ({
  id: kit.id,
  codigo_barras: kit.codigo_barras || '',
  tracking: kit.tracking || '',
  tipo_kit: kit.tipo_kit || '',
  lote: kit.lote || '',
  status: mapKitStatusFromApi(kit.status),
  data_validade: normalizeDate(kit.data_validade),
  localizacao: mapKitLocalizacaoFromApi(kit.localizacao),
  fase_ciclo: (kit.fase_ciclo as Kit['fase_ciclo']) || undefined,
  empresa_id: kit.empresa_id || '',
  posto_id: kit.posto_id || '',
  laboratorio_id: kit.laboratorio_id || '',
});

const mapLoteFromApi = (lote: ApiLote): Lote => ({
  id: lote.id,
  codigo: lote.codigo || '',
  tipo_kit: lote.tipo_kit || '',
  tipo_teste: lote.tipo_teste || '',
  teste_id: lote.teste_id || '',
  teste_nome: lote.teste_nome || '',
  quantidade_total: Number(lote.quantidade_total || 0),
  quantidade_disponivel: Number(lote.quantidade_disponivel || 0),
  data_rececao: normalizeDate(lote.data_rececao),
  data_validade: normalizeDate(lote.data_validade),
  fornecedor: lote.fornecedor || '',
  fornecedor_id: lote.fornecedor_id || '',
});

const mapRequisicaoStatusFromApi = (status: string | null | undefined): RequisicaoKit['status'] => {
  if (!status) return 'Pendente';
  if (status === 'Pendente') return 'Pendente';
  if (status === 'Em trânsito' || status === 'Em transito') return 'Em trânsito';
  if (status === 'Entregue') return 'Entregue';
  if (status === 'Cancelada') return 'Cancelada';
  return 'Pendente';
};

const mapRequisicaoFromApi = (requisicao: ApiRequisicao): RequisicaoKit => ({
  id: requisicao.id,
  numero_envio: requisicao.numero_envio || '',
  data: normalizeDate(requisicao.data),
  origem: (requisicao.origem as RequisicaoKit['origem']) || 'Escritorio',
  destino: (requisicao.destino as RequisicaoKit['destino']) || 'Posto',
  origem_nome: requisicao.origem_nome || '',
  destino_nome: requisicao.destino_nome || '',
  origem_empresa_id: requisicao.origem_empresa_id || '',
  origem_posto_id: requisicao.origem_posto_id || '',
  origem_laboratorio_id: requisicao.origem_laboratorio_id || '',
  destino_empresa_id: requisicao.destino_empresa_id || '',
  destino_posto_id: requisicao.destino_posto_id || '',
  destino_laboratorio_id: requisicao.destino_laboratorio_id || '',
  quantidade: Number(requisicao.quantidade || 0),
  status: mapRequisicaoStatusFromApi(requisicao.status),
  tracking_number: requisicao.tracking_number || '',
  transportadora: requisicao.transportadora || '',
  lote_codigo: requisicao.lote_codigo || '',
  kit_ids: Array.isArray(requisicao.kit_ids)
    ? requisicao.kit_ids
    : (requisicao.kit_ids ? String(requisicao.kit_ids).split(',').filter(Boolean) : []),
  utilizador_id: requisicao.utilizador_id || '',
  utilizador_nome: requisicao.utilizador_nome || '',
  observacoes: requisicao.observacoes || '',
});

export interface DataContextType {
  refreshProcessos: () => Promise<void>;
  refreshKits: () => Promise<void>;
  refreshLotes: () => Promise<void>;
  refreshRequisicoes: () => Promise<void>;

  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'created_at'>) => Promise<Contact>;
  updateContact: (id: string, contact: Omit<Contact, 'id' | 'created_at'>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;

  getAnexosByPaciente: (pacienteId: string) => Promise<Anexo[]>;
  addAnexo: (data: { paciente_id?: string; processo_id?: string; tipo: Anexo['tipo']; titulo: string; descricao?: string; url?: string }) => Promise<void>;
  deleteAnexo: (id: string) => Promise<void>;

  processos: Processo[];
  addProcesso: (processo: Omit<Processo, 'id'>) => Promise<Processo>;
  updateProcesso: (id: string, data: Partial<Processo>) => Promise<void>;
  deleteProcesso: (id: string) => Promise<void>;

  kits: Kit[];
  addKit: (kit: Omit<Kit, 'id'>) => void;
  updateKit: (id: string, data: Partial<Kit>) => void;
  deleteKit: (id: string) => void;
  checkKitDuplicado: (codigoBarras: string) => Promise<{ duplicado: boolean; numero_processo?: string | null; paciente_nome?: string | null }>;

  lotes: Lote[];
  addLote: (lote: Omit<Lote, 'id'>) => Promise<Lote>;
  updateLote: (id: string, data: Partial<Lote>) => void;

  requisicoesKits: RequisicaoKit[];
  addRequisicaoKit: (requisicao: Omit<RequisicaoKit, 'id'>) => Promise<void>;
  addDescarteEnvio: (data: {
    data: string;
    observacoes?: string;
    kit_ids: string[];
    origem: string;
    origem_nome?: string;
    origem_empresa_id?: string | null;
    origem_posto_id?: string | null;
  }) => Promise<void>;
  updateRequisicaoKit: (id: string, data: Partial<RequisicaoKit>) => Promise<void>;
  deleteRequisicaoKit: (id: string) => Promise<void>;

  utilizadores: Utilizador[];
  addUtilizador: (u: Omit<Utilizador, 'id'>) => Promise<void>;
  updateUtilizador: (id: string, data: Partial<Utilizador>) => Promise<void>;
  deleteUtilizador: (id: string) => Promise<void>;

  empresas: Empresa[];
  addEmpresa: (e: Omit<Empresa, 'id'>) => Promise<void>;
  updateEmpresa: (id: string, data: Partial<Empresa>) => Promise<void>;
  deleteEmpresa: (id: string) => Promise<void>;

  testes: Teste[];
  refreshTestes: () => Promise<void>;
  addTeste: (t: Omit<Teste, 'id'>) => Promise<void>;
  updateTeste: (id: string, data: Partial<Teste>) => Promise<void>;
  deleteTeste: (id: string) => Promise<void>;
  addSubTeste: (testePaiId: string, data: Omit<import('../data/types').SubTeste, 'id' | 'teste_pai_id'>) => Promise<void>;
  updateSubTeste: (id: string, data: Partial<import('../data/types').SubTeste>) => Promise<void>;
  deleteSubTeste: (id: string) => Promise<void>;

  tiposKit: TipoKit[];
  refreshTiposKit: () => Promise<void>;
  addTipoKit: (t: Omit<TipoKit, 'id'>) => Promise<void>;
  updateTipoKit: (id: string, data: Partial<TipoKit>) => Promise<void>;
  deleteTipoKit: (id: string) => Promise<void>;

  motivosAnulacao: MotivoAnulacao[];
  refreshMotivosAnulacao: () => Promise<void>;
  addMotivoAnulacao: (m: Omit<MotivoAnulacao, 'id'>) => Promise<void>;
  updateMotivoAnulacao: (id: string, data: Partial<MotivoAnulacao>) => Promise<void>;
  deleteMotivoAnulacao: (id: string) => Promise<void>;

  itensPesquisa: ItemPesquisa[];
  addItemPesquisa: (i: Omit<ItemPesquisa, 'id'>) => void;
  updateItemPesquisa: (id: string, data: Partial<ItemPesquisa>) => void;
  deleteItemPesquisa: (id: string) => void;

  sistemasSaude: SistemaSaude[];
  addSistemaSaude: (s: Omit<SistemaSaude, 'id'>) => void;
  updateSistemaSaude: (id: string, data: Partial<SistemaSaude>) => void;
  deleteSistemaSaude: (id: string) => void;

  postos: Posto[];
  refreshPostos: () => Promise<void>;
  addPosto: (p: Omit<Posto, 'id'>) => Promise<string | void>;
  updatePosto: (id: string, data: Partial<Posto>) => Promise<void>;
  deletePosto: (id: string) => Promise<void>;
  getPostoStock: (postoId: string, testeId?: string) => Promise<{ disponiveis: number }>;
  getPostoKitsDisponiveis: (postoId: string, testeId?: string) => Promise<PostoKitDisponivel[]>;
  marcarKitUtilizado: (kitId: string, options?: { processo_id?: string; posto_id?: string; laboratorio_final_id?: string }) => Promise<void>;
  confirmKitLabArrival: (kitId: string, data?: { processo_id?: string; data_chegada?: string }) => Promise<void>;

  laboratorios: Laboratorio[];
  refreshLaboratorios: () => Promise<void>;
  addLaboratorio: (l: Omit<Laboratorio, 'id'>) => Promise<string | void>;
  updateLaboratorio: (id: string, data: Partial<Laboratorio>) => Promise<void>;
  deleteLaboratorio: (id: string) => Promise<void>;

  entidades: Entidade[];
  refreshEntidades: () => Promise<void>;
  addEntidade: (e: Omit<Entidade, 'id'>) => Promise<void>;
  updateEntidade: (id: string, data: Partial<Entidade>) => Promise<void>;
  deleteEntidade: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);
const genId = () => Math.random().toString(36).substr(2, 9);

export function DataProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [requisicoesKits, setRequisicoesKits] = useState<RequisicaoKit[]>([]);
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [testes, setTestes] = useState<Teste[]>([]);
  const [tiposKit, setTiposKit] = useState<TipoKit[]>([]);
  const [motivosAnulacao, setMotivosAnulacao] = useState<MotivoAnulacao[]>([]);
  const [itensPesquisa, setItensPesquisa] = useState<ItemPesquisa[]>([]);
  const [sistemasSaude, setSistemasSaude] = useState<SistemaSaude[]>([]);
  const [postos, setPostos] = useState<Posto[]>([]);
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);

  const refreshContacts = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    const response = await apiRequest<ApiListResponse<ApiPaciente>>('/pacientes', { token });
    const pacientes = response?.data || [];
    setContacts(pacientes.map(mapPacienteToContact));
  }, []);

  const refreshProcessos = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    const response = await apiRequest<ApiListResponse<ApiProcesso>>('/processos', { token });
    const pedidos = response?.data || [];
    setProcessos(pedidos.map(mapPedidoToProcesso));
  }, []);

  const refreshKits = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    const response = await apiRequest<ApiListResponse<ApiKit>>('/stocks/kits', { token });
    const apiKits = response?.data || [];
    setKits(apiKits.map(mapKitFromApi));
  }, []);

  const refreshLotes = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    const response = await apiRequest<ApiListResponse<ApiLote>>('/stocks/lotes', { token });
    const apiLotes = response?.data || [];
    setLotes(apiLotes.map(mapLoteFromApi));
  }, []);

  const refreshRequisicoes = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    const response = await apiRequest<ApiListResponse<ApiRequisicao>>('/stocks/requisicoes', { token });
    const apiRequisicoes = response?.data || [];
    setRequisicoesKits(apiRequisicoes.map(mapRequisicaoFromApi));
  }, []);

  const refreshTestes = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiTeste>>('/testes', { token });
    setTestes((response?.data || []).map(mapTesteFromApi));
  }, []);

  const refreshTiposKit = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiTipoKit>>('/tipos-kit', { token });
    setTiposKit((response?.data || []).map((t) => ({
      id: t.id,
      nome: t.nome || '',
      ativo: t.ativo !== false,
    })));
  }, []);

  const refreshMotivosAnulacao = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiMotivoAnulacao>>('/motivos-anulacao', { token });
    setMotivosAnulacao((response?.data || []).map((m) => ({
      id: m.id,
      nome: m.nome || '',
      ativo: m.ativo !== false,
      contexto: m.contexto === 'processo' ? 'processo' : 'contacto',
      reabre_contacto: !!m.reabre_contacto,
    })));
  }, []);

  const refreshEmpresas = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiEmpresa>>('/empresas', { token });
    setEmpresas((response?.data || []).map(mapEmpresaFromApi));
  }, []);

  const refreshPostos = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiPosto>>('/postos', { token });
    setPostos((response?.data || []).map(mapPostoFromApi));
  }, []);

  const refreshLaboratorios = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiLaboratorio>>('/laboratorios', { token });
    setLaboratorios((response?.data || []).map(mapLaboratorioFromApi));
  }, []);

  const refreshEntidades = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiEntidade>>('/entidades', { token });
    setEntidades((response?.data || []).map(mapEntidadeFromApi));
  }, []);

  const refreshUtilizadores = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    const response = await apiRequest<ApiListResponse<ApiUtilizador>>('/utilizadores', { token });
    setUtilizadores((response?.data || []).map(mapUtilizadorFromApi));
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      // Sem token (ecrã de login) não há nada a carregar; o carregamento é
      // re-disparado pelo evento 'genoma:auth-changed' após o login.
      if (!getAuthToken()) return;
      try {
        await Promise.all([
          refreshContacts(),
          refreshProcessos(),
          refreshKits(),
          refreshLotes(),
          refreshRequisicoes(),
          refreshTestes(),
          refreshTiposKit(),
          refreshMotivosAnulacao(),
          refreshEmpresas(),
          refreshPostos(),
          refreshLaboratorios(),
          refreshEntidades(),
          refreshUtilizadores(),
        ]);
      } catch (error) {
        console.warn('Falha ao carregar dados reais.', error);
      }
    };

    // Carrega na montagem (caso já exista sessão, ex.: após F5) e sempre que
    // a autenticação muda (login client-side, sem recarregar a página).
    void loadInitialData();
    const onAuthChanged = () => { void loadInitialData(); };
    const onUtilizadoresChanged = () => { void refreshUtilizadores(); };
    window.addEventListener('genoma:auth-changed', onAuthChanged);
    window.addEventListener('genoma:utilizadores-changed', onUtilizadoresChanged);
    return () => {
      window.removeEventListener('genoma:auth-changed', onAuthChanged);
      window.removeEventListener('genoma:utilizadores-changed', onUtilizadoresChanged);
    };
  }, [refreshContacts, refreshProcessos, refreshKits, refreshLotes, refreshRequisicoes, refreshTestes, refreshTiposKit, refreshMotivosAnulacao, refreshEmpresas, refreshPostos, refreshLaboratorios, refreshEntidades, refreshUtilizadores]);

  const addContact = async (data: Omit<Contact, 'id' | 'created_at'>) => {
    const token = getAuthToken();
    if (!token) {
      const newContact: Contact = { ...data, id: genId(), created_at: new Date().toISOString() };
      setContacts(prev => [...prev, newContact]);
      return newContact;
    }

    const response = await apiRequest<ApiEntityResponse<ApiPaciente>>('/pacientes', {
      method: 'POST',
      token,
      body: contactToApiBody(data),
    });

    const created = response?.data;
    if (!created) {
      throw new Error('Resposta inválida ao criar paciente');
    }

    const mapped = mapPacienteToContact(created);
    setContacts(prev => [mapped, ...prev.filter((c) => c.id !== mapped.id)]);
    return mapped;
  };

  const updateContact = async (id: string, data: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> => {
    const token = getAuthToken();
    if (!token) {
      let result!: Contact;
      setContacts((prev) => {
        const existing = prev.find((c) => c.id === id);
        result = existing ? { ...existing, ...data } : { ...data, id, created_at: '' };
        return prev.map((c) => (c.id === id ? result : c));
      });
      return result;
    }

    const response = await apiRequest<ApiEntityResponse<ApiPaciente>>(`/pacientes/${id}`, {
      method: 'PUT',
      token,
      body: contactToApiBody(data),
    });

    const existing = contacts.find((c) => c.id === id);
    const updated = response?.data
      ? mapPacienteToContact(response.data)
      : { ...data, id, created_at: existing?.created_at || '' } as Contact;
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...updated, created_at: c.created_at } : c)));
    return { ...updated, created_at: existing?.created_at || updated.created_at };
  };

  const deleteContact = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setContacts(prev => prev.filter(c => c.id !== id));
      return;
    }

    await apiRequest(`/pacientes/${id}`, { method: 'DELETE', token });
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const getAnexosByPaciente = async (pacienteId: string): Promise<Anexo[]> => {
    const token = getAuthToken();
    if (!token) return [];
    const response = await apiRequest<ApiListResponse<Anexo>>(`/anexos/paciente/${pacienteId}`, { token });
    return response?.data || [];
  };

  const addAnexo = async (data: { paciente_id?: string; processo_id?: string; tipo: Anexo['tipo']; titulo: string; descricao?: string; url?: string }) => {
    const token = getAuthToken();
    if (!token) return;
    await apiRequest('/anexos', { method: 'POST', token, body: data });
  };

  const deleteAnexo = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;
    await apiRequest(`/anexos/${id}`, { method: 'DELETE', token });
  };

  const addProcesso = async (data: Omit<Processo, 'id'>): Promise<Processo> => {
    const estadoExigeKit = ['Colheita Realizada', 'Enviado Laboratorio', 'Em Analise', 'Resultado Disponivel', 'Validado', 'Faturado']
      .includes(data.estado);
    if (estadoExigeKit && !data.kit_codigo.trim()) {
      throw new Error('Código do kit é obrigatório após colheita.');
    }

    const kitDuplicado = data.kit_codigo.trim()
      ? processos.some((p) => p.kit_codigo.trim().toLowerCase() === data.kit_codigo.trim().toLowerCase())
      : false;

    if (kitDuplicado) {
      throw new Error('Já existe um processo com este código de kit.');
    }

    const token = getAuthToken();
    if (!token) {
      const local: Processo = { ...data, id: genId() };
      setProcessos(prev => [...prev, local]);
      return local;
    }

    const [medicosResponse, testesResponse, empresasResponse] = await Promise.all([
      apiRequest<ApiListResponse<ApiMedico>>('/medicos', { token }),
      apiRequest<ApiListResponse<ApiTeste>>('/testes', { token }),
      apiRequest<ApiListResponse<ApiEmpresa>>('/empresas', { token }),
    ]);

    const catalog = (testesResponse.data || []).map(mapTesteFromApi);
    const medicoId = data.medico_id
      || (medicosResponse.data || []).find((m) => m.nome === data.medico)?.utilizador_id;
    const testeId = resolveTesteIdFromSelection(catalog, { testeId: data.teste_id, label: data.teste });
    const empresaId = (empresasResponse.data || [])[0]?.id;

    if (!medicoId || !testeId || !empresaId) {
      throw new Error('Não foi possível mapear médico, sub-teste ou empresa para criar o processo.');
    }

    const numeroProcesso = (data.numero?.trim() || data.kit_codigo?.trim());
    if (!numeroProcesso) {
      throw new Error('O código do kit é obrigatório para criar o processo.');
    }

    const response = await apiRequest<ApiEntityResponse<ApiProcesso>>('/processos', {
      method: 'POST',
      token,
      body: {
        paciente_id: data.paciente_id,
        medico_id: medicoId,
        teste_id: testeId,
        empresa_id: empresaId,
        status: mapEstadoToApi(data.estado),
        data_entrada: data.data_entrada || null,
        notas_clinicas: data.observacoes || null,
        numero_processo: numeroProcesso,
        posto: data.posto || null,
        posto_id: data.posto_id || null,
        kit_codigo: data.kit_codigo || null,
        data_colheita: data.data_colheita || null,
        data_colheita_prevista: data.data_colheita_prevista || null,
        tipo_gravidez: data.tipo_gravidez || null,
        onde_seguida: data.onde_seguida || null,
        gestacao_semanas_registo: data.gestacao_semanas_registo ?? null,
        gestacao_dias_registo: data.gestacao_dias_registo ?? null,
        gestacao_registada_em: data.gestacao_registada_em || null,
        data_chegada_laboratorio: data.data_chegada_laboratorio || null,
        data_resultado: data.data_resultado || null,
        data_validacao: data.data_validacao || null,
        data_envio_relatorio: data.data_envio_relatorio || null,
        responsavel_fluxo: data.responsavel_fluxo || null,
        relatorio_validado: !!data.relatorio_validado,
        relatorio_enviado_para: data.relatorio_enviado_para || 'Nenhum',
        resultado_tudo_ok: data.resultado_tudo_ok !== false,
        resultado_anomalias: data.resultado_anomalias || null,
        fracao_fetal: data.fracao_fetal || null,
        fatura_emitida: !!data.fatura_emitida,
        fatura_numero: data.fatura_numero || null,
        fatura_data_emissao: data.fatura_data_emissao || null,
        valor_base: data.valor_base || 0,
        desconto_percentual: data.desconto_percentual || 0,
        valor_final: data.valor_final || 0,
        pagamento_data: data.pagamento_data || null,
        recibo_numero: data.recibo_numero || null,
        pago: !!data.pago,
        entidade_multibanco: data.entidade_multibanco || null,
        referencia_multibanco: data.referencia_multibanco || null,
        nao_gera_comissao: !!data.nao_gera_comissao,
        fatura_envio_email: data.fatura_envio_email || null,
        fatura_envio_sms: data.fatura_envio_sms || null,
      },
    });

    await refreshProcessos();
    if (!response?.data?.id) {
      throw new Error('Processo criado mas resposta invalida.');
    }
    return mapPedidoToProcesso(response.data);
  };

  const updateProcesso = async (id: string, data: Partial<Processo>) => {
    const processoAtual = processos.find((p) => p.id === id);
    if (!processoAtual) return;

    const estadoResultante = data.estado ?? processoAtual.estado;
    const kitResultante = (data.kit_codigo ?? processoAtual.kit_codigo ?? '').trim();
    const estadoExigeKit = ['Colheita Realizada', 'Enviado Laboratorio', 'Em Analise', 'Resultado Disponivel', 'Validado', 'Faturado']
      .includes(estadoResultante);

    if (estadoExigeKit && !kitResultante) {
      throw new Error('Código do kit é obrigatório após colheita.');
    }

    if (data.kit_codigo !== undefined && kitResultante) {
      const kitDuplicado = processos.some((p) => p.id !== id && p.kit_codigo.trim().toLowerCase() === kitResultante.toLowerCase());
      if (kitDuplicado) {
        throw new Error('Já existe um processo com este código de kit.');
      }
    }

    const token = getAuthToken();
    if (!token) {
      setProcessos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
      return;
    }

    await apiRequest(`/processos/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...(data.estado !== undefined ? { status: mapEstadoToApi(data.estado) } : {}),
        ...(data.observacoes !== undefined ? { notas_clinicas: data.observacoes } : {}),
        ...(data.numero !== undefined && data.numero.trim()
          ? { numero_processo: data.numero.trim() }
          : {}),
        ...(data.posto !== undefined ? { posto: data.posto || null } : {}),
        ...(data.data_entrada !== undefined ? { data_entrada: data.data_entrada || null } : {}),
        ...(data.kit_codigo !== undefined ? { kit_codigo: data.kit_codigo || null } : {}),
        ...(data.data_colheita !== undefined ? { data_colheita: data.data_colheita || null } : {}),
        ...(data.data_chegada_laboratorio !== undefined ? { data_chegada_laboratorio: data.data_chegada_laboratorio || null } : {}),
        ...(data.data_resultado !== undefined ? { data_resultado: data.data_resultado || null } : {}),
        ...(data.data_validacao !== undefined ? { data_validacao: data.data_validacao || null } : {}),
        ...(data.data_envio_relatorio !== undefined ? { data_envio_relatorio: data.data_envio_relatorio || null } : {}),
        ...(data.responsavel_fluxo !== undefined ? { responsavel_fluxo: data.responsavel_fluxo || null } : {}),
        ...(data.relatorio_validado !== undefined ? { relatorio_validado: !!data.relatorio_validado } : {}),
        ...(data.relatorio_enviado_para !== undefined ? { relatorio_enviado_para: data.relatorio_enviado_para || 'Nenhum' } : {}),
        ...(data.resultado_tudo_ok !== undefined ? { resultado_tudo_ok: data.resultado_tudo_ok !== false } : {}),
        ...(data.resultado_anomalias !== undefined ? { resultado_anomalias: data.resultado_anomalias || null } : {}),
        ...(data.fracao_fetal !== undefined ? { fracao_fetal: data.fracao_fetal || null } : {}),
        ...(data.fatura_emitida !== undefined ? { fatura_emitida: !!data.fatura_emitida } : {}),
        ...(data.fatura_numero !== undefined ? { fatura_numero: data.fatura_numero || null } : {}),
        ...(data.fatura_data_emissao !== undefined ? { fatura_data_emissao: data.fatura_data_emissao || null } : {}),
        ...(data.valor_base !== undefined ? { valor_base: data.valor_base || 0 } : {}),
        ...(data.desconto_percentual !== undefined ? { desconto_percentual: data.desconto_percentual || 0 } : {}),
        ...(data.valor_final !== undefined ? { valor_final: data.valor_final || 0 } : {}),
        ...(data.pagamento_data !== undefined ? { pagamento_data: data.pagamento_data || null } : {}),
        ...(data.recibo_numero !== undefined ? { recibo_numero: data.recibo_numero || null } : {}),
        ...(data.pago !== undefined ? { pago: !!data.pago } : {}),
        ...(data.entidade_multibanco !== undefined ? { entidade_multibanco: data.entidade_multibanco || null } : {}),
        ...(data.referencia_multibanco !== undefined ? { referencia_multibanco: data.referencia_multibanco || null } : {}),
        ...(data.nao_gera_comissao !== undefined ? { nao_gera_comissao: !!data.nao_gera_comissao } : {}),
        ...(data.fatura_envio_email !== undefined ? { fatura_envio_email: data.fatura_envio_email || null } : {}),
        ...(data.fatura_envio_sms !== undefined ? { fatura_envio_sms: data.fatura_envio_sms || null } : {}),
        ...(data.motivo_anulacao_id !== undefined ? { motivo_anulacao_id: data.motivo_anulacao_id || null } : {}),
        ...(data.data_anulacao !== undefined ? { data_anulacao: data.data_anulacao || null } : {}),
      },
    });

    await refreshProcessos();
    if (data.estado === 'Cancelado') {
      await refreshContacts();
    }
  };

  const deleteProcesso = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setProcessos(prev => prev.filter(p => p.id !== id));
      return;
    }

    await apiRequest(`/processos/${id}`, { method: 'DELETE', token });
    setProcessos(prev => prev.filter(p => p.id !== id));
  };

  const addKit = async (data: Omit<Kit, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      setKits(prev => [...prev, { ...data, id: genId() }]);
      return;
    }
    await apiRequest('/stocks/kits', {
      method: 'POST',
      token,
      body: {
        codigo_barras: data.codigo_barras,
        tracking: data.tracking || null,
        tipo_kit: data.tipo_kit,
        lote: data.lote || null,
        status: data.status,
        localizacao: data.localizacao,
        data_validade: data.data_validade || null,
        ...(data.empresa_id ? { empresa_id: data.empresa_id } : {}),
      },
    });
    await refreshKits();
  };

  const updateKit = async (id: string, data: Partial<Kit>) => {
    const token = getAuthToken();
    if (!token) {
      setKits(prev => prev.map(k => k.id === id ? { ...k, ...data } : k));
      return;
    }
    await apiRequest(`/stocks/kits/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...(data.codigo_barras !== undefined ? { codigo_barras: data.codigo_barras } : {}),
        ...(data.tracking !== undefined ? { tracking: data.tracking || null } : {}),
        ...(data.tipo_kit !== undefined ? { tipo_kit: data.tipo_kit } : {}),
        ...(data.lote !== undefined ? { lote: data.lote || null } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.localizacao !== undefined ? { localizacao: data.localizacao } : {}),
        ...(data.data_validade !== undefined ? { data_validade: data.data_validade || null } : {}),
      },
    });
    await refreshKits();
  };

  const deleteKit = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setKits(prev => prev.filter(k => k.id !== id));
      return;
    }
    await apiRequest(`/stocks/kits/${id}`, { method: 'DELETE', token });
    await refreshKits();
  };

  const checkKitDuplicado = async (codigoBarras: string) => {
    const token = getAuthToken();
    const codigo = codigoBarras.trim();
    if (!token) {
      const local = kits.find(k => k.codigo_barras.trim().toLowerCase() === codigo.toLowerCase());
      return { duplicado: !!local };
    }
    const response = await apiRequest<ApiEntityResponse<{ duplicado: boolean; numero_processo?: string | null; paciente_nome?: string | null }>>(
      `/stocks/kits/check-duplicado?codigo_barras=${encodeURIComponent(codigo)}`,
      { token },
    );
    return response?.data || { duplicado: false };
  };

  const updateLote = async (id: string, data: Partial<Lote>) => {
    const token = getAuthToken();
    if (!token) {
      setLotes(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
      return;
    }
    await apiRequest(`/stocks/lotes/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
        ...(data.tipo_kit !== undefined ? { tipo_kit: data.tipo_kit } : {}),
        ...(data.tipo_kit_id !== undefined ? { tipo_kit_id: data.tipo_kit_id } : {}),
        ...(data.tipo_teste !== undefined ? { tipo_teste: data.tipo_teste || null } : {}),
        ...(data.teste_id !== undefined ? { teste_id: data.teste_id || null } : {}),
        ...(data.fornecedor !== undefined ? { fornecedor: data.fornecedor } : {}),
        // Quantidades deixaram de ser usadas: o stock é derivado dos kits reais.
        ...(data.data_rececao !== undefined ? { data_rececao: data.data_rececao || null } : {}),
        ...(data.data_validade !== undefined ? { data_validade: data.data_validade || null } : {}),
      },
    });
    await Promise.all([refreshLotes(), refreshKits()]);
  };

  const addLote = async (data: Omit<Lote, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      const lote: Lote = { ...data, id: genId() };
      setLotes(prev => [...prev, lote]);
      return lote;
    }

    const response = await apiRequest<ApiEntityResponse<ApiLote>>('/stocks/lotes', {
      method: 'POST',
      token,
      body: {
        codigo: data.codigo,
        tipo_kit: data.tipo_kit,
        ...(data.tipo_kit_id ? { tipo_kit_id: data.tipo_kit_id } : {}),
        ...(data.tipo_teste ? { tipo_teste: data.tipo_teste } : {}),
        ...(data.teste_id ? { teste_id: data.teste_id } : {}),
        fornecedor: data.fornecedor,
        quantidade_total: data.quantidade_total,
        quantidade_disponivel: data.quantidade_disponivel,
        data_rececao: data.data_rececao || null,
        data_validade: data.data_validade || null,
      },
    });

    const created = response?.data;
    if (!created) {
      throw new Error('Resposta inválida ao criar lote');
    }

    await Promise.all([refreshLotes(), refreshKits()]);
    return mapLoteFromApi(created);
  };

  const addRequisicaoKit = async (data: Omit<RequisicaoKit, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      if (data.kit_ids?.length) {
        setKits((prev) => prev.map((k) => (
          data.kit_ids?.includes(k.id)
            ? {
              ...k,
              localizacao: data.destino,
              status: 'Disponível' as Kit['status'],
              empresa_id: data.destino_empresa_id || '',
              posto_id: data.destino_posto_id || '',
              laboratorio_id: data.destino_laboratorio_id || '',
            }
            : k
        )));
      }
      setRequisicoesKits(prev => [{ ...data, id: `REQ-${genId()}` }, ...prev]);
      return;
    }

    const response = await apiRequest<ApiEntityResponse<ApiRequisicao>>('/stocks/requisicoes', {
      method: 'POST',
      token,
      body: {
        data: data.data,
        origem: data.origem,
        destino: data.destino,
        ...(data.origem_nome ? { origem_nome: data.origem_nome } : {}),
        ...(data.destino_nome ? { destino_nome: data.destino_nome } : {}),
        ...(data.origem_empresa_id ? { origem_empresa_id: data.origem_empresa_id } : {}),
        ...(data.origem_posto_id ? { origem_posto_id: data.origem_posto_id } : {}),
        ...(data.origem_laboratorio_id ? { origem_laboratorio_id: data.origem_laboratorio_id } : {}),
        ...(data.destino_empresa_id ? { destino_empresa_id: data.destino_empresa_id } : {}),
        ...(data.destino_posto_id ? { destino_posto_id: data.destino_posto_id } : {}),
        ...(data.destino_laboratorio_id ? { destino_laboratorio_id: data.destino_laboratorio_id } : {}),
        quantidade: data.quantidade,
        status: data.status,
        tracking_number: data.tracking_number || null,
        transportadora: data.transportadora || null,
        lote_codigo: data.lote_codigo || null,
        ...(data.kit_ids?.length ? { kit_ids: data.kit_ids } : {}),
        observacoes: data.observacoes || null,
      },
    });

    if (!response?.data) {
      throw new Error('Resposta inválida ao criar requisição');
    }

    await Promise.all([refreshRequisicoes(), refreshKits(), refreshLotes()]);
  };

  const addDescarteEnvio = async (data: {
    data: string;
    observacoes?: string;
    kit_ids: string[];
    origem: string;
    origem_nome?: string;
    origem_empresa_id?: string | null;
    origem_posto_id?: string | null;
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error('Sessão expirada');

    await apiRequest('/stocks/descartes', {
      method: 'POST',
      token,
      body: {
        data: data.data,
        observacoes: data.observacoes || null,
        kit_ids: data.kit_ids,
        origem: data.origem,
        origem_nome: data.origem_nome || null,
        origem_empresa_id: data.origem_empresa_id || null,
        origem_posto_id: data.origem_posto_id || null,
      },
    });

    await Promise.all([refreshRequisicoes(), refreshKits()]);
  };

  const updateRequisicaoKit = async (id: string, data: Partial<RequisicaoKit>) => {
    const token = getAuthToken();
    if (!token) {
      setRequisicoesKits(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
      return;
    }

    const current = requisicoesKits.find(r => r.id === id);
    if (!current) {
      throw new Error('Requisição não encontrada para atualizar');
    }
    const payload = { ...current, ...data };

    await apiRequest(`/stocks/requisicoes/${id}`, {
      method: 'PUT',
      token,
      body: {
        data: payload.data,
        origem: payload.origem,
        destino: payload.destino,
        origem_nome: payload.origem_nome || null,
        destino_nome: payload.destino_nome || null,
        origem_empresa_id: payload.origem_empresa_id || null,
        origem_posto_id: payload.origem_posto_id || null,
        origem_laboratorio_id: payload.origem_laboratorio_id || null,
        destino_empresa_id: payload.destino_empresa_id || null,
        destino_posto_id: payload.destino_posto_id || null,
        destino_laboratorio_id: payload.destino_laboratorio_id || null,
        quantidade: payload.quantidade,
        status: payload.status,
        tracking_number: payload.tracking_number || null,
        transportadora: payload.transportadora || null,
        observacoes: payload.observacoes || null,
      },
    });

    await Promise.all([refreshRequisicoes(), refreshKits()]);
  };

  const deleteRequisicaoKit = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setRequisicoesKits(prev => prev.filter(r => r.id !== id));
      return;
    }

    await apiRequest(`/stocks/requisicoes/${id}`, { method: 'DELETE', token });
    await refreshRequisicoes();
  };

  const addUtilizador = async (data: Omit<Utilizador, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      setUtilizadores(prev => [...prev, { ...data, id: genId() }]);
      return;
    }
    await apiRequest('/utilizadores', { method: 'POST', token, body: utilizadorToApiBody(data) });
    await refreshUtilizadores();
  };

  const updateUtilizador = async (id: string, data: Partial<Utilizador>) => {
    const token = getAuthToken();
    if (!token) {
      setUtilizadores(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      return;
    }
    await apiRequest(`/utilizadores/${id}`, { method: 'PUT', token, body: utilizadorToApiBody(data) });
    await refreshUtilizadores();
  };

  const deleteUtilizador = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setUtilizadores(prev => prev.filter(u => u.id !== id));
      return;
    }
    await apiRequest(`/utilizadores/${id}`, { method: 'DELETE', token });
    await refreshUtilizadores();
  };

  const empresaToApiBody = (data: Partial<Empresa>) => ({
    ...(data.nome !== undefined ? { nome: data.nome } : {}),
    ...(data.morada !== undefined ? { morada: data.morada } : {}),
    ...(data.codigo_postal !== undefined ? { codigo_postal: data.codigo_postal } : {}),
    ...(data.contacto !== undefined ? { contacto: data.contacto, telefone: data.contacto } : {}),
    ...(data.email !== undefined ? { email: data.email } : {}),
    ...(data.nif !== undefined ? { nif: data.nif } : {}),
    ...(data.tipo_empresa !== undefined ? { tipo_empresa: data.tipo_empresa } : {}),
    ...(data.pais !== undefined ? { pais: data.pais } : {}),
    ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
  });

  const addEmpresa = async (data: Omit<Empresa, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      setEmpresas(prev => [...prev, { ...data, id: genId() }]);
      return;
    }
    await apiRequest('/empresas', { method: 'POST', token, body: empresaToApiBody(data) });
    await refreshEmpresas();
  };
  const updateEmpresa = async (id: string, data: Partial<Empresa>) => {
    const token = getAuthToken();
    if (!token) {
      setEmpresas(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
      return;
    }
    await apiRequest(`/empresas/${id}`, { method: 'PUT', token, body: empresaToApiBody(data) });
    await refreshEmpresas();
  };
  const deleteEmpresa = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setEmpresas(prev => prev.filter(e => e.id !== id));
      return;
    }
    await apiRequest(`/empresas/${id}`, { method: 'DELETE', token });
    await refreshEmpresas();
  };

  const testeToApiBody = (data: Partial<Teste>, testePaiId?: string) => ({
    ...(data.nome !== undefined ? { nome: data.nome } : {}),
    ...(data.descricao !== undefined ? { descricao: data.descricao } : {}),
    ...(data.preco !== undefined ? { preco: data.preco } : {}),
    ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
    ...(data.preco_compra !== undefined ? { preco_compra: data.preco_compra } : {}),
    ...(data.preco_venda !== undefined ? { preco_venda: data.preco_venda } : {}),
    ...(data.tempo_resposta_dias !== undefined ? { tempo_resposta_dias: data.tempo_resposta_dias } : {}),
    ...(data.gestacao_minima_semanas !== undefined ? { gestacao_minima_semanas: data.gestacao_minima_semanas } : {}),
    ...(data.tipo_teste !== undefined ? { tipo_teste: data.tipo_teste } : {}),
    ...(data.empresa !== undefined ? { empresa: data.empresa } : {}),
    ...(data.tipo_kit !== undefined ? { tipo_kit: data.tipo_kit } : {}),
    ...(data.cromossomas !== undefined ? { cromossomas: data.cromossomas } : {}),
    ...(data.delecoes_duplicacoes !== undefined ? { delecoes_duplicacoes: data.delecoes_duplicacoes } : {}),
    ...(data.microdelecoes_microduplicacoes !== undefined ? { microdelecoes_microduplicacoes: data.microdelecoes_microduplicacoes } : {}),
    ...(data.gemeos !== undefined ? { gemeos: data.gemeos } : {}),
    ...(data.determinacao_sexo_fetal !== undefined ? { determinacao_sexo_fetal: data.determinacao_sexo_fetal } : {}),
    ...(data.incluir_fracao_fetal !== undefined ? { incluir_fracao_fetal: data.incluir_fracao_fetal } : {}),
    ...(data.laboratorio_final_id !== undefined ? { laboratorio_final_id: data.laboratorio_final_id || null } : {}),
    ...(testePaiId ? { teste_pai_id: testePaiId } : {}),
  });

  const addTeste = async (data: Omit<Teste, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      setTestes(prev => [...prev, { ...data, id: genId() }]);
      return;
    }
    await apiRequest('/testes', { method: 'POST', token, body: testeToApiBody(data) });
    await refreshTestes();
  };
  const updateTeste = async (id: string, data: Partial<Teste>) => {
    const token = getAuthToken();
    if (!token) {
      setTestes(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      return;
    }
    await apiRequest(`/testes/${id}`, { method: 'PUT', token, body: testeToApiBody(data) });
    await refreshTestes();
  };
  const deleteTeste = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setTestes(prev => prev.filter(t => t.id !== id));
      return;
    }
    await apiRequest(`/testes/${id}`, { method: 'DELETE', token });
    await refreshTestes();
  };

  const addSubTeste = async (testePaiId: string, data: Omit<import('../data/types').SubTeste, 'id' | 'teste_pai_id'>) => {
    const token = getAuthToken();
    if (!token) {
      setTestes((prev) => prev.map((t) => (
        t.id === testePaiId
          ? { ...t, sub_testes: [...(t.sub_testes || []), { ...data, id: genId(), teste_pai_id: testePaiId }] }
          : t
      )));
      return;
    }
    await apiRequest('/testes', { method: 'POST', token, body: testeToApiBody(data, testePaiId) });
    await refreshTestes();
  };

  const updateSubTeste = async (id: string, data: Partial<import('../data/types').SubTeste>) => {
    const token = getAuthToken();
    if (!token) {
      setTestes((prev) => prev.map((t) => ({
        ...t,
        sub_testes: (t.sub_testes || []).map((st) => (st.id === id ? { ...st, ...data } : st)),
      })));
      return;
    }
    await apiRequest(`/testes/${id}`, { method: 'PUT', token, body: testeToApiBody(data) });
    await refreshTestes();
  };

  const deleteSubTeste = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setTestes((prev) => prev.map((t) => ({
        ...t,
        sub_testes: (t.sub_testes || []).filter((st) => st.id !== id),
      })));
      return;
    }
    await apiRequest(`/testes/${id}`, { method: 'DELETE', token });
    await refreshTestes();
  };

  interface ApiTipoKit { id: string; nome?: string | null; ativo?: boolean | null }
  interface ApiMotivoAnulacao {
    id: string;
    nome?: string | null;
    ativo?: boolean | null;
    contexto?: string | null;
    reabre_contacto?: boolean | null;
  }

  const addTipoKit = async (data: Omit<TipoKit, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      setTiposKit((prev) => [...prev, { ...data, id: genId() }]);
      return;
    }
    await apiRequest('/tipos-kit', { method: 'POST', token, body: { nome: data.nome, ativo: data.ativo !== false } });
    await refreshTiposKit();
  };

  const updateTipoKit = async (id: string, data: Partial<TipoKit>) => {
    const token = getAuthToken();
    if (!token) {
      setTiposKit((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      return;
    }
    await apiRequest(`/tipos-kit/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
      },
    });
    await refreshTiposKit();
  };

  const deleteTipoKit = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setTiposKit((prev) => prev.filter((t) => t.id !== id));
      return;
    }
    await apiRequest(`/tipos-kit/${id}`, { method: 'DELETE', token });
    await refreshTiposKit();
  };

  const addMotivoAnulacao = async (data: Omit<MotivoAnulacao, 'id'>) => {
    const token = getAuthToken();
    if (!token) {
      setMotivosAnulacao((prev) => [...prev, { ...data, id: genId() }]);
      return;
    }
    await apiRequest('/motivos-anulacao', {
      method: 'POST',
      token,
      body: {
        nome: data.nome,
        contexto: data.contexto || 'contacto',
        reabre_contacto: data.contexto === 'processo' ? !!data.reabre_contacto : false,
      },
    });
    await refreshMotivosAnulacao();
  };

  const updateMotivoAnulacao = async (id: string, data: Partial<MotivoAnulacao>) => {
    const token = getAuthToken();
    if (!token) {
      setMotivosAnulacao((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
      return;
    }
    await apiRequest(`/motivos-anulacao/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...(data.nome !== undefined ? { nome: data.nome } : {}),
        ...(data.ativo !== undefined ? { ativo: data.ativo } : {}),
        ...(data.contexto !== undefined ? { contexto: data.contexto } : {}),
        ...(data.reabre_contacto !== undefined ? { reabre_contacto: data.reabre_contacto } : {}),
      },
    });
    await refreshMotivosAnulacao();
  };

  const deleteMotivoAnulacao = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      setMotivosAnulacao((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    await apiRequest(`/motivos-anulacao/${id}`, { method: 'DELETE', token });
    await refreshMotivosAnulacao();
  };

  const addItemPesquisa = (data: Omit<ItemPesquisa, 'id'>) =>
    setItensPesquisa(prev => [...prev, { ...data, id: genId() }]);
  const updateItemPesquisa = (id: string, data: Partial<ItemPesquisa>) =>
    setItensPesquisa(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  const deleteItemPesquisa = (id: string) =>
    setItensPesquisa(prev => prev.filter(i => i.id !== id));

  const addSistemaSaude = (data: Omit<SistemaSaude, 'id'>) =>
    setSistemasSaude(prev => [...prev, { ...data, id: genId() }]);
  const updateSistemaSaude = (id: string, data: Partial<SistemaSaude>) =>
    setSistemasSaude(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  const deleteSistemaSaude = (id: string) =>
    setSistemasSaude(prev => prev.filter(s => s.id !== id));

  const addPosto = async (data: Omit<Posto, 'id'>): Promise<string | void> => {
    const token = getAuthToken();
    if (!token) { const newId = genId(); setPostos(prev => [...prev, { ...data, id: newId }]); return newId; }
    const response = await apiRequest<{ data: Posto }>('/postos', { method: 'POST', token, body: postoToApiBody(data) });
    await refreshPostos();
    return response?.data?.id;
  };
  const updatePosto = async (id: string, data: Partial<Posto>) => {
    const token = getAuthToken();
    if (!token) { setPostos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)); return; }
    await apiRequest(`/postos/${id}`, { method: 'PUT', token, body: postoToApiBody(data) });
    await refreshPostos();
  };
  const deletePosto = async (id: string) => {
    const token = getAuthToken();
    if (!token) { setPostos(prev => prev.filter(p => p.id !== id)); return; }
    await apiRequest(`/postos/${id}`, { method: 'DELETE', token });
    await refreshPostos();
  };

  const addLaboratorio = async (data: Omit<Laboratorio, 'id'>): Promise<string | void> => {
    const token = getAuthToken();
    if (!token) { const newId = genId(); setLaboratorios(prev => [...prev, { ...data, id: newId }]); return newId; }
    const response = await apiRequest<{ data: Laboratorio }>('/laboratorios', { method: 'POST', token, body: laboratorioToApiBody(data) });
    await refreshLaboratorios();
    return response?.data?.id;
  };
  const updateLaboratorio = async (id: string, data: Partial<Laboratorio>) => {
    const token = getAuthToken();
    if (!token) { setLaboratorios(prev => prev.map(l => l.id === id ? { ...l, ...data } : l)); return; }
    await apiRequest(`/laboratorios/${id}`, { method: 'PUT', token, body: laboratorioToApiBody(data) });
    await refreshLaboratorios();
  };
  const deleteLaboratorio = async (id: string) => {
    const token = getAuthToken();
    if (!token) { setLaboratorios(prev => prev.filter(l => l.id !== id)); return; }
    await apiRequest(`/laboratorios/${id}`, { method: 'DELETE', token });
    await refreshLaboratorios();
  };

  const addEntidade = async (data: Omit<Entidade, 'id'>) => {
    const token = getAuthToken();
    if (!token) { setEntidades(prev => [...prev, { ...data, id: genId() }]); return; }
    await apiRequest('/entidades', { method: 'POST', token, body: entidadeToApiBody(data) });
    await refreshEntidades();
  };
  const updateEntidade = async (id: string, data: Partial<Entidade>) => {
    const token = getAuthToken();
    if (!token) { setEntidades(prev => prev.map(e => e.id === id ? { ...e, ...data } : e)); return; }
    await apiRequest(`/entidades/${id}`, { method: 'PUT', token, body: entidadeToApiBody(data) });
    await refreshEntidades();
  };
  const deleteEntidade = async (id: string) => {
    const token = getAuthToken();
    if (!token) { setEntidades(prev => prev.filter(e => e.id !== id)); return; }
    await apiRequest(`/entidades/${id}`, { method: 'DELETE', token });
    await refreshEntidades();
  };

  // Validação de stock por posto (colheita).
  const getPostoStock = async (postoId: string, testeId?: string): Promise<{ disponiveis: number }> => {
    const token = getAuthToken();
    if (!token || !postoId) return { disponiveis: 0 };
    const qs = testeId ? `?teste_id=${encodeURIComponent(testeId)}` : '';
    const response = await apiRequest<ApiEntityResponse<{ disponiveis: number }>>(`/postos/${postoId}/stock${qs}`, { token });
    return { disponiveis: response?.data?.disponiveis ?? 0 };
  };
  const getPostoKitsDisponiveis = async (postoId: string, testeId?: string): Promise<PostoKitDisponivel[]> => {
    const token = getAuthToken();
    if (!token || !postoId) return [];
    const qs = testeId ? `?teste_id=${encodeURIComponent(testeId)}` : '';
    const response = await apiRequest<ApiListResponse<PostoKitDisponivel>>(`/postos/${postoId}/kits-disponiveis${qs}`, { token });
    return response?.data || [];
  };
  const marcarKitUtilizado = async (kitId: string, options?: { processo_id?: string; posto_id?: string; laboratorio_final_id?: string }) => {
    const token = getAuthToken();
    if (!token || !kitId) return;
    await apiRequest(`/postos/kits/${kitId}/utilizar`, { method: 'POST', token, body: options || {} });
    await refreshKits();
  };

  const confirmKitLabArrival = async (kitId: string, data?: { processo_id?: string; data_chegada?: string }) => {
    const token = getAuthToken();
    if (!token || !kitId) return;
    await apiRequest(`/stocks/kits/${kitId}/confirmar-lab`, { method: 'POST', token, body: data || {} });
    await refreshKits();
  };

  return (
    <DataContext.Provider value={{
      refreshProcessos, refreshKits, refreshLotes, refreshRequisicoes,
      contacts, addContact, updateContact, deleteContact,
      getAnexosByPaciente, addAnexo, deleteAnexo,
      processos, addProcesso, updateProcesso, deleteProcesso,
      kits, addKit, updateKit, deleteKit, checkKitDuplicado,
      lotes, addLote, updateLote,
      requisicoesKits, addRequisicaoKit, addDescarteEnvio, updateRequisicaoKit, deleteRequisicaoKit,
      utilizadores, addUtilizador, updateUtilizador, deleteUtilizador,
      empresas, addEmpresa, updateEmpresa, deleteEmpresa,
      testes, refreshTestes, addTeste, updateTeste, deleteTeste, addSubTeste, updateSubTeste, deleteSubTeste,
      tiposKit, refreshTiposKit, addTipoKit, updateTipoKit, deleteTipoKit,
      motivosAnulacao, refreshMotivosAnulacao, addMotivoAnulacao, updateMotivoAnulacao, deleteMotivoAnulacao,
      itensPesquisa, addItemPesquisa, updateItemPesquisa, deleteItemPesquisa,
      sistemasSaude, addSistemaSaude, updateSistemaSaude, deleteSistemaSaude,
      postos, refreshPostos, addPosto, updatePosto, deletePosto, getPostoStock, getPostoKitsDisponiveis, marcarKitUtilizado, confirmKitLabArrival,
      laboratorios, refreshLaboratorios, addLaboratorio, updateLaboratorio, deleteLaboratorio,
      entidades, refreshEntidades, addEntidade, updateEntidade, deleteEntidade,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
