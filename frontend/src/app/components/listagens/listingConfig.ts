import {
  Activity, FlaskConical, Receipt, Users, Stethoscope,
  Package, Boxes, CalendarDays, ShieldCheck, LayoutDashboard, LucideIcon,
} from 'lucide-react';
import { ListingKey } from '../../../lib/api-listagens';
import { LISTINGS_NAV_ORDER } from '../../../lib/listings-nav';
import { PROCESS_STATUS_STYLES, KIT_STATUS_STYLES } from '../../../lib/design-system';

export type CellFormat = 'text' | 'date' | 'datetime' | 'eur' | 'status' | 'mono' | 'number';

export type FilterField =
  | 'data' | 'estado' | 'medico' | 'posto' | 'empresa' | 'teste'
  | 'pago' | 'validado' | 'tipo' | 'localizacao' | 'fornecedor' | 'especialidade' | 'fase_ciclo';

export interface ListingDef {
  key: ListingKey;
  label: string;
  icon: LucideIcon;
  searchPlaceholder: string;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  formats: Record<string, CellFormat>;
  statusMap?: Record<string, string>;
  statusKey?: string;
  filters: FilterField[];
}

const PROCESS_ESTADOS = [
  'Agendado', 'Kit Reservado', 'Colheita Realizada', 'Enviado Laboratorio',
  'Em Analise', 'Resultado Disponivel', 'Validado', 'Faturado', 'Cancelado',
];

const KIT_ESTADOS = ['Disponível', 'Reservado', 'Em trânsito', 'Utilizado', 'Inválido', 'Perdido', 'Expirado'];

export const KIT_FASE_CICLO_OPTIONS = [
  'Em empresa',
  'Em posto (aguarda)',
  'Reservado colheita',
  'Aguarda envio lab',
  'Em trânsito p/ lab',
  'Em lab final',
  'Encerrado',
];

export const LISTINGS: Record<ListingKey, ListingDef> = {
  painel_bordo: {
    key: 'painel_bordo',
    label: 'Painel de Bordo',
    icon: LayoutDashboard,
    searchPlaceholder: 'Pesquisar paciente, teste, nº processo...',
    defaultSort: { key: 'data_registo', dir: 'desc' },
    formats: {
      processo: 'mono',
      data_registo: 'date',
      data_factura: 'date',
      data_pagamento: 'date',
      colheita_prevista: 'date',
      colheita_efetiva: 'date',
      envio_laboratorio: 'date',
      recepcao_laboratorio: 'date',
      data_prev_relatorio: 'date',
      data_relatorio: 'date',
      envio_relatorio: 'date',
    },
    filters: ['data', 'estado', 'medico', 'empresa', 'teste'],
  },
  processos: {
    key: 'processos',
    label: 'Processos',
    icon: Activity,
    searchPlaceholder: 'Pesquisar nº, paciente, médico, kit, teste...',
    defaultSort: { key: 'data_entrada', dir: 'desc' },
    formats: { numero: 'mono', kit: 'mono', estado: 'status', data_entrada: 'date', data_resultado: 'date', valor: 'eur' },
    statusMap: PROCESS_STATUS_STYLES,
    statusKey: 'estado',
    filters: ['data', 'estado', 'medico', 'posto', 'empresa', 'teste'],
  },
  resultados: {
    key: 'resultados',
    label: 'Resultados',
    icon: FlaskConical,
    searchPlaceholder: 'Pesquisar nº, paciente, teste...',
    defaultSort: { key: 'data_resultado', dir: 'desc' },
    formats: { numero: 'mono', estado: 'status', data_resultado: 'date' },
    statusMap: PROCESS_STATUS_STYLES,
    statusKey: 'estado',
    filters: ['data', 'estado', 'validado'],
  },
  faturacao: {
    key: 'faturacao',
    label: 'Faturação',
    icon: Receipt,
    searchPlaceholder: 'Pesquisar nº fatura, processo, paciente...',
    defaultSort: { key: 'data_emissao', dir: 'desc' },
    formats: { fatura_numero: 'mono', numero: 'mono', valor: 'eur', data_emissao: 'date' },
    filters: ['data', 'empresa', 'pago'],
  },
  pacientes: {
    key: 'pacientes',
    label: 'Pacientes',
    icon: Users,
    searchPlaceholder: 'Pesquisar nome, NIF, telemóvel, email...',
    defaultSort: { key: 'nome', dir: 'asc' },
    formats: { processos_total: 'number' },
    filters: [],
  },
  medicos: {
    key: 'medicos',
    label: 'Médicos',
    icon: Stethoscope,
    searchPlaceholder: 'Pesquisar nome, nº ordem, especialidade...',
    defaultSort: { key: 'nome', dir: 'asc' },
    formats: { processos_total: 'number' },
    filters: ['especialidade'],
  },
  kits: {
    key: 'kits',
    label: 'Kits',
    icon: Package,
    searchPlaceholder: 'Pesquisar código, tipo, teste, lote...',
    defaultSort: { key: 'codigo', dir: 'asc' },
    formats: { codigo: 'mono', estado: 'status', validade: 'date' },
    statusMap: KIT_STATUS_STYLES,
    statusKey: 'estado',
    filters: ['estado', 'fase_ciclo', 'tipo', 'localizacao', 'data'],
  },
  lotes: {
    key: 'lotes',
    label: 'Lotes',
    icon: Boxes,
    searchPlaceholder: 'Pesquisar código, tipo ou fornecedor...',
    defaultSort: { key: 'validade', dir: 'asc' },
    formats: { codigo: 'mono', quantidade: 'number', kits_total: 'number', kits_disponiveis: 'number', validade: 'date' },
    filters: ['fornecedor', 'data'],
  },
  colheitas: {
    key: 'colheitas',
    label: 'Colheitas',
    icon: CalendarDays,
    searchPlaceholder: 'Pesquisar nº, paciente, posto, kit...',
    defaultSort: { key: 'data_prevista', dir: 'desc' },
    formats: { numero: 'mono', kit: 'mono', estado: 'status', data_prevista: 'date' },
    statusMap: PROCESS_STATUS_STYLES,
    statusKey: 'estado',
    filters: ['data', 'posto', 'estado'],
  },
  auditoria: {
    key: 'auditoria',
    label: 'Auditoria',
    icon: ShieldCheck,
    searchPlaceholder: 'Pesquisar utilizador, ação, tabela...',
    defaultSort: { key: 'data', dir: 'desc' },
    formats: { data: 'datetime', registro_id: 'mono' },
    filters: ['data'],
  },
};

export const LISTING_ORDER: ListingKey[] = [...LISTINGS_NAV_ORDER];

export const ESTADO_OPTIONS: Record<string, string[]> = {
  painel_bordo: PROCESS_ESTADOS,
  resultados: PROCESS_ESTADOS,
  colheitas: PROCESS_ESTADOS,
  kits: KIT_ESTADOS,
};
