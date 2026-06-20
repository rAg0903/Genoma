import { Kit, Lote, RequisicaoKit, MovimentoKit, Posto, Laboratorio, Empresa } from '../app/data/types';
import { buildStockLocationOptions, formatLocationRef, StockLocationRef } from './stock-locations';

const MS_DIA = 1000 * 60 * 60 * 24;

export const normalize = (v: string) =>
  (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Agrega tracking únicos dos kits seleccionados (para envios). */
export const aggregateKitTracking = (kits: Pick<Kit, 'tracking'>[]): string =>
  [...new Set(kits.map((k) => k.tracking?.trim()).filter((t): t is string => !!t))].join(', ');

export const isKitDisponivel = (k: Kit) => normalize(k.status) === 'disponivel';

export const diasAteValidade = (dataValidade?: string): number | null => {
  if (!dataValidade) return null;
  const d = new Date(dataValidade).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / MS_DIA);
};

/** Formata uma data ISO para o formato pt-PT (dd/mm/aaaa). */
export const formatDataPt = (data?: string): string => {
  if (!data) return '';
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export type ValidadeEstado = 'valido' | 'a_expirar' | 'expirado' | 'sem_data';

export const validadeEstado = (dataValidade?: string, limiteDias = 45): ValidadeEstado => {
  const dias = diasAteValidade(dataValidade);
  if (dias === null) return 'sem_data';
  if (dias < 0) return 'expirado';
  if (dias <= limiteDias) return 'a_expirar';
  return 'valido';
};

export const VALIDADE_STYLE: Record<ValidadeEstado, { label: string; cls: string }> = {
  valido: { label: 'Valido', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  a_expirar: { label: 'A expirar', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  expirado: { label: 'Expirado', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  sem_data: { label: 'Sem validade', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

/**
 * Etiqueta de validade no formato "Válido até (dd/mm/aaaa)" (ou "Expirado
 * (dd/mm/aaaa)"), mostrando a data real em vez dos dias restantes.
 */
export const formatValidadeAte = (
  dataValidade?: string,
  opts?: { validUntil?: string; expired?: string; localeTag?: string },
): string => {
  const estado = validadeEstado(dataValidade);
  if (estado === 'sem_data') return '—';
  const data = opts?.localeTag
    ? new Date(dataValidade!).toLocaleDateString(opts.localeTag, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : formatDataPt(dataValidade);
  if (opts?.validUntil && opts?.expired) {
    const tpl = estado === 'expirado' ? opts.expired : opts.validUntil;
    return tpl.replace('{date}', data);
  }
  return estado === 'expirado' ? `Expirado (${data})` : `Válido até (${data})`;
};

/** Cor por estado de kit para graficos (donut). */
export const KIT_STATUS_CHART_COLOR: Record<string, string> = {
  disponivel: '#10b981',
  reservado: '#eab308',
  'em transito': '#0ea5e9',
  utilizado: '#6366f1',
  invalido: '#f43f5e',
  perdido: '#94a3b8',
  expirado: '#ef4444',
};

export interface StockKpis {
  disponiveis: number;
  lotesAtivos: number;
  lotesAExpirar: number;
  kitsExpirados: number;
  cobertura: number | null;
}

export const computeStockKpis = (
  kits: Kit[], lotes: Lote[], movimentos: MovimentoKit[],
): StockKpis => {
  const disponiveis = kits.filter(isKitDisponivel).length;
  const lotesAtivos = lotes.filter((l) => l.quantidade_disponivel > 0 && validadeEstado(l.data_validade) !== 'expirado').length;
  const lotesAExpirar = lotes.filter((l) => validadeEstado(l.data_validade) === 'a_expirar').length;
  const kitsExpirados = kits.filter((k) => normalize(k.status) === 'expirado' || validadeEstado(k.data_validade) === 'expirado').length;

  // Cobertura: dias estimados de stock = disponiveis / consumo medio diario (30d).
  const limite = Date.now() - 30 * MS_DIA;
  const consumo30 = movimentos.filter((m) => normalize(m.motivo) === 'consumo' && new Date(m.data).getTime() >= limite).length;
  const taxaDiaria = consumo30 / 30;
  const cobertura = taxaDiaria > 0 ? Math.round(disponiveis / taxaDiaria) : null;

  return { disponiveis, lotesAtivos, lotesAExpirar, kitsExpirados, cobertura };
};

export interface StockLocationLoteGroup {
  lote: string;
  teste?: string;
  quantidade: number;
  codigosKits: string[];
}

export interface StockLocationInventory {
  id: string;
  kind: 'empresa' | 'posto' | 'laboratorio';
  nome: string;
  codigo?: string;
  totalDisponiveis: number;
  totalAguardaDescarte?: number;
  lotes: StockLocationLoteGroup[];
  lotesAguardaDescarte?: StockLocationLoteGroup[];
}

export interface StockLaboratorioInventory extends StockLocationInventory {
  postos: StockLocationInventory[];
}

export interface StockLocationInventoryResult {
  empresas: StockLocationInventory[];
  laboratorios: StockLaboratorioInventory[];
  postosSemLaboratorio: StockLocationInventory[];
  laboratoriosFinais: StockLocationInventory[];
}

const isKitAguardaDescarte = (k: Kit) =>
  k.fase_ciclo === 'aguarda_envio_lab'
  || (k.localizacao === 'Posto' && normalize(k.status) === 'utilizado' && k.fase_ciclo !== 'em_lab_final');

const isKitAtLabPipeline = (k: Kit) =>
  k.fase_ciclo === 'em_lab_final'
  || k.fase_ciclo === 'em_transito_lab'
  || (k.localizacao === 'Laboratorio' && (k.status === 'Utilizado' || k.status === 'Em trânsito'));

export const LOW_STOCK_THRESHOLD = 5;

const resolveKitEmpresaId = (kit: Kit, lotes: Lote[]): string | undefined => {
  if (kit.empresa_id) return kit.empresa_id;
  const loteCodigo = kit.lote?.trim();
  if (!loteCodigo) return undefined;
  return lotes.find((l) => l.codigo === loteCodigo)?.fornecedor_id;
};

const buildLoteGroupsWithKits = (locationKits: Kit[], lotes: Lote[]): StockLocationLoteGroup[] => {
  const loteMap = new Map(lotes.map((l) => [l.codigo, l]));
  const byLote = locationKits.reduce<Record<string, Kit[]>>((acc, k) => {
    const codigo = k.lote?.trim();
    if (!codigo) return acc;
    if (!acc[codigo]) acc[codigo] = [];
    acc[codigo].push(k);
    return acc;
  }, {});

  return Object.entries(byLote)
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([lote, kitsInLote]) => {
      const meta = loteMap.get(lote);
      return {
        lote,
        teste: meta?.teste_nome || meta?.tipo_teste || undefined,
        quantidade: kitsInLote.length,
        codigosKits: kitsInLote.map((k) => k.codigo_barras).filter(Boolean).sort((a, b) => a.localeCompare(b)),
      };
    });
};

const buildLocationInventory = (
  kind: 'empresa' | 'posto' | 'laboratorio',
  id: string,
  nome: string,
  codigo: string | undefined,
  disponiveis: Kit[],
  lotes: Lote[],
  aguardaDescarte: Kit[] = [],
): StockLocationInventory => {
  const atLocation = disponiveis.filter((k) => {
    if (kind === 'empresa') {
      return k.localizacao === 'Escritorio' && resolveKitEmpresaId(k, lotes) === id;
    }
    if (kind === 'posto') {
      return k.localizacao === 'Posto' && k.posto_id === id;
    }
    return k.localizacao === 'Laboratorio' && k.laboratorio_id === id;
  });

  return {
    id,
    kind,
    nome,
    codigo,
    totalDisponiveis: atLocation.length,
    totalAguardaDescarte: aguardaDescarte.length,
    lotes: buildLoteGroupsWithKits(atLocation, lotes),
    lotesAguardaDescarte: aguardaDescarte.length > 0 ? buildLoteGroupsWithKits(aguardaDescarte, lotes) : undefined,
  };
};

const sortByStockAsc = (items: StockLocationInventory[]): StockLocationInventory[] =>
  [...items].sort((a, b) => a.totalDisponiveis - b.totalDisponiveis || a.nome.localeCompare(b.nome));

export const computeStockLocationInventory = (
  kits: Kit[],
  lotes: Lote[],
  empresas: Empresa[],
  postos: Posto[],
  laboratorios: Laboratorio[],
): StockLocationInventoryResult => {
  const disponiveis = kits.filter(isKitDisponivel);
  const aguardaDescarteKits = kits.filter(isKitAguardaDescarte);
  const postosAtivos = postos.filter((p) => p.ativo !== false);

  const postoInventory = (p: Posto) => buildLocationInventory(
    'posto',
    p.id,
    p.nome,
    p.codigo,
    disponiveis,
    lotes,
    aguardaDescarteKits.filter((k) => k.posto_id === p.id),
  );

  const empresaItems = empresas
    .filter((e) => e.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((e) => buildLocationInventory('empresa', e.id, e.nome, e.nif, disponiveis, lotes));

  const unidentifiedEmpresa = disponiveis.filter(
    (k) => k.localizacao === 'Escritorio' && !resolveKitEmpresaId(k, lotes),
  );
  if (unidentifiedEmpresa.length > 0) {
    empresaItems.push({
      id: '__empresa-unassigned__',
      kind: 'empresa',
      nome: 'Nao identificado',
      totalDisponiveis: unidentifiedEmpresa.length,
      lotes: buildLoteGroupsWithKits(unidentifiedEmpresa, lotes),
    });
  }

  const labsOperacionais = laboratorios.filter((l) => l.ativo !== false && l.tipo !== 'final');
  const labsFinais = laboratorios.filter((l) => l.ativo !== false && l.tipo === 'final');

  const laboratorioItems: StockLaboratorioInventory[] = labsOperacionais
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((l) => {
      const postosDoLab = sortByStockAsc(
        postosAtivos
          .filter((p) => p.laboratorio_id === l.id)
          .map(postoInventory),
      );
      const postosStock = postosDoLab.reduce((sum, p) => sum + p.totalDisponiveis, 0);
      return {
        id: l.id,
        kind: 'laboratorio' as const,
        nome: l.nome,
        codigo: l.codigo,
        totalDisponiveis: postosStock,
        lotes: [],
        postos: postosDoLab,
      };
    });

  const postosSemLaboratorio = sortByStockAsc(
    postosAtivos
      .filter((p) => !p.laboratorio_id)
      .map(postoInventory),
  );

  const emLab = kits.filter(isKitAtLabPipeline);
  const laboratoriosFinais = sortByStockAsc(
    labsFinais
      .map((l) => {
        const atLab = emLab.filter((k) => k.laboratorio_id === l.id);
        return {
          id: l.id,
          kind: 'laboratorio' as const,
          nome: l.nome,
          codigo: l.codigo,
          totalDisponiveis: atLab.length,
          lotes: buildLoteGroupsWithKits(atLab, lotes),
        };
      })
      .filter((item) => item.totalDisponiveis > 0),
  );

  return {
    empresas: sortByStockAsc(empresaItems),
    laboratorios: sortByStockAsc(laboratorioItems),
    postosSemLaboratorio,
    laboratoriosFinais,
  };
};

export interface StockAlertLoteDetalhe {
  lote: string;
  teste?: string;
  quantidade: number;
}

export interface StockAlert {
  id: string;
  nivel: 'critico' | 'aviso' | 'info' | 'sucesso';
  titulo: string;
  descricao?: string;
  total?: number;
  detalhes?: StockAlertLoteDetalhe[];
}

const matchesLocationRef = (kit: Kit, ref: StockLocationRef, lotes: Lote[]): boolean => {
  if (kit.localizacao !== ref.localizacao) return false;
  if (ref.kind === 'posto') return kit.posto_id === ref.id;
  if (ref.kind === 'laboratorio') return kit.laboratorio_id === ref.id;
  return resolveKitEmpresaId(kit, lotes) === ref.id;
};

const buildLowStockAlert = (
  ref: StockLocationRef,
  disponiveis: Kit[],
): StockAlert | null => {
  const total = disponiveis.length;
  if (total >= LOW_STOCK_THRESHOLD) return null;

  return {
    id: `low-${ref.kind}-${ref.id}`,
    nivel: total === 0 ? 'critico' : 'aviso',
    titulo: `Stock baixo — ${formatLocationRef(ref)}`,
    descricao: `${total} kit(s) disponiveis`,
    total,
  };
};

export const computeStockAlerts = (
  kits: Kit[],
  lotes: Lote[],
  requisicoes: RequisicaoKit[],
  empresas: Empresa[] = [],
  postos: Posto[] = [],
  laboratorios: Laboratorio[] = [],
): StockAlert[] => {
  const alerts: StockAlert[] = [];
  const disponiveis = kits.filter(isKitDisponivel);

  buildStockLocationOptions(empresas, postos, laboratorios).forEach((ref) => {
    if (ref.kind === 'laboratorio') return;
    const atLocation = disponiveis.filter((k) => matchesLocationRef(k, ref, lotes));
    const alert = buildLowStockAlert(ref, atLocation);
    if (alert) alerts.push(alert);
  });

  const unidentifiedEmpresa = disponiveis.filter(
    (k) => k.localizacao === 'Escritorio' && !resolveKitEmpresaId(k, lotes),
  );
  if (unidentifiedEmpresa.length > 0 && unidentifiedEmpresa.length < LOW_STOCK_THRESHOLD) {
    alerts.push({
      id: 'low-empresa-unassigned',
      nivel: unidentifiedEmpresa.length <= 1 ? 'critico' : 'aviso',
      titulo: 'Stock baixo — Empresa: nao identificado',
      descricao: `${unidentifiedEmpresa.length} kit(s) disponiveis sem empresa atribuida`,
      total: unidentifiedEmpresa.length,
    });
  }

  const unidentifiedPosto = disponiveis.filter((k) => k.localizacao === 'Posto' && !k.posto_id);
  if (unidentifiedPosto.length > 0 && unidentifiedPosto.length < LOW_STOCK_THRESHOLD) {
    alerts.push({
      id: 'low-posto-unassigned',
      nivel: unidentifiedPosto.length <= 1 ? 'critico' : 'aviso',
      titulo: 'Stock baixo — Posto: nao identificado',
      descricao: `${unidentifiedPosto.length} kit(s) disponiveis sem posto atribuido`,
      total: unidentifiedPosto.length,
    });
  }

  const unidentifiedLab = disponiveis.filter((k) => k.localizacao === 'Laboratorio' && !k.laboratorio_id);
  if (unidentifiedLab.length > 0 && unidentifiedLab.length < LOW_STOCK_THRESHOLD) {
    alerts.push({
      id: 'low-lab-unassigned',
      nivel: unidentifiedLab.length <= 1 ? 'critico' : 'aviso',
      titulo: 'Stock baixo — Laboratorio: nao identificado',
      descricao: `${unidentifiedLab.length} kit(s) disponiveis sem laboratorio atribuido`,
      total: unidentifiedLab.length,
    });
  }

  const expirados = lotes.filter((l) => validadeEstado(l.data_validade) === 'expirado');
  if (expirados.length) alerts.push({ id: 'lotes-exp', nivel: 'critico', titulo: 'Lotes expirados', descricao: 'Remover do inventario ativo', total: expirados.length });

  const aExpirar = lotes.filter((l) => validadeEstado(l.data_validade) === 'a_expirar');
  if (aExpirar.length) alerts.push({ id: 'lotes-aexp', nivel: 'aviso', titulo: 'Lotes a expirar (≤45d)', descricao: 'Priorizar consumo', total: aExpirar.length });

  const paradas = requisicoes.filter((r) => normalize(r.status) === 'pendente' && diasAteValidade(r.data) !== null && (diasAteValidade(r.data) ?? 0) < -3);
  if (paradas.length) alerts.push({ id: 'req-paradas', nivel: 'aviso', titulo: 'Requisicoes paradas (>3d)', descricao: 'Pendentes ha mais de 3 dias', total: paradas.length });

  const aguardaDescarte = kits.filter(isKitAguardaDescarte);
  if (aguardaDescarte.length) {
    alerts.push({
      id: 'kits-aguarda-descarte',
      nivel: 'aviso',
      titulo: 'Kits aguardam descarte para laboratório',
      descricao: 'Kits colhidos ou expirados no posto — envie via Descarte / Lab final',
      total: aguardaDescarte.length,
    });
  }

  return alerts;
};
