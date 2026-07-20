import { Empresa, Kit, Laboratorio, Lote, Posto, Teste } from '../app/data/types';

export type StockLocationKind = 'empresa' | 'posto' | 'laboratorio';

export type StockLocationRef = {
  kind: StockLocationKind;
  id: string;
  nome: string;
  localizacao: Kit['localizacao'];
};

export const encodeLocationRef = (ref: StockLocationRef): string => `${ref.kind}:${ref.id}`;

export const parseLocationRef = (value: string): StockLocationRef | null => {
  const [kind, id] = value.split(':');
  if (!id || (kind !== 'empresa' && kind !== 'posto' && kind !== 'laboratorio')) return null;
  return {
    kind,
    id,
    nome: '',
    localizacao: kind === 'empresa' ? 'Escritorio' : kind === 'posto' ? 'Posto' : 'Laboratorio',
  };
};

export const formatLocationRef = (ref: Pick<StockLocationRef, 'kind' | 'nome'>): string => {
  const prefix = ref.kind === 'empresa' ? 'Empresa' : ref.kind === 'posto' ? 'Posto' : 'Laboratório';
  return `${prefix}: ${ref.nome}`;
};

export const buildStockLocationOptions = (
  empresas: Empresa[],
  postos: Posto[],
  laboratorios: Laboratorio[],
): StockLocationRef[] => {
  const options: StockLocationRef[] = [];
  empresas
    .filter((e) => e.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach((e) => options.push({ kind: 'empresa', id: e.id, nome: e.nome, localizacao: 'Escritorio' }));
  postos
    .filter((p) => p.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach((p) => options.push({ kind: 'posto', id: p.id, nome: p.nome, localizacao: 'Posto' }));
  laboratorios
    .filter((l) => l.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .forEach((l) => options.push({ kind: 'laboratorio', id: l.id, nome: l.nome, localizacao: 'Laboratorio' }));
  return options;
};

export interface ShipmentLaboratorioGroup {
  laboratorio: StockLocationRef;
  postos: StockLocationRef[];
}

export interface ShipmentLocationOptions {
  empresas: StockLocationRef[];
  laboratorioGroups: ShipmentLaboratorioGroup[];
  postosSemLaboratorio: StockLocationRef[];
}

/** Opções de origem/destino para envios: postos agrupados por laboratório. */
export const buildShipmentLocationOptions = (
  empresas: Empresa[],
  postos: Posto[],
  laboratorios: Laboratorio[],
): ShipmentLocationOptions => {
  const postosAtivos = postos.filter((p) => p.ativo !== false);
  const postosByLab = new Map<string, Posto[]>();
  const postosSemLaboratorio: Posto[] = [];

  postosAtivos.forEach((p) => {
    if (p.laboratorio_id) {
      const list = postosByLab.get(p.laboratorio_id) || [];
      list.push(p);
      postosByLab.set(p.laboratorio_id, list);
    } else {
      postosSemLaboratorio.push(p);
    }
  });

  const toPostoRef = (p: Posto): StockLocationRef => ({
    kind: 'posto',
    id: p.id,
    nome: p.nome,
    localizacao: 'Posto',
  });

  return {
    empresas: empresas
      .filter((e) => e.ativo !== false)
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((e) => ({ kind: 'empresa', id: e.id, nome: e.nome, localizacao: 'Escritorio' as const })),
    laboratorioGroups: laboratorios
      .filter((l) => l.ativo !== false && l.tipo !== 'final')
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((l) => ({
        laboratorio: { kind: 'laboratorio', id: l.id, nome: l.nome, localizacao: 'Laboratorio' as const },
        postos: (postosByLab.get(l.id) || [])
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map(toPostoRef),
      })),
    postosSemLaboratorio: postosSemLaboratorio
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map(toPostoRef),
  };
};

export const flattenShipmentLocationOptions = (options: ShipmentLocationOptions): StockLocationRef[] => {
  const flat: StockLocationRef[] = [...options.empresas];
  options.laboratorioGroups.forEach((group) => {
    flat.push(...group.postos);
  });
  flat.push(...options.postosSemLaboratorio);
  return flat;
};

/** Opções de origem/destino para envios de distribuição (empresa ↔ posto, sem lab final). */
export const buildDistributionLocationOptions = (
  empresas: Empresa[],
  postos: Posto[],
  laboratorios: Laboratorio[],
): ShipmentLocationOptions => buildShipmentLocationOptions(empresas, postos, laboratorios);

export const flattenDistributionLocationOptions = flattenShipmentLocationOptions;

export const filterShipmentLocationOptions = (
  options: ShipmentLocationOptions,
  excludeKey?: string,
): ShipmentLocationOptions => {
  if (!excludeKey) return options;
  const keep = (ref: StockLocationRef) => encodeLocationRef(ref) !== excludeKey;
  return {
    empresas: options.empresas.filter(keep),
    laboratorioGroups: options.laboratorioGroups.map((group) => ({
      ...group,
      postos: group.postos.filter(keep),
    })),
    postosSemLaboratorio: options.postosSemLaboratorio.filter(keep),
  };
};

/** Mantém apenas empresas/postos com kits utilizados, expirados ou aguardando descarte. */
export const filterShipmentLocationsWithDescarteKits = (
  options: ShipmentLocationOptions,
  kits: Kit[],
): ShipmentLocationOptions => {
  const hasDescarteKits = (ref: StockLocationRef) =>
    kits.some((k) => kitMatchesLocationRefForDescarte(k, ref));

  return {
    empresas: options.empresas.filter(hasDescarteKits),
    laboratorioGroups: options.laboratorioGroups
      .map((group) => ({
        ...group,
        postos: group.postos.filter(hasDescarteKits),
      }))
      .filter((group) => group.postos.length > 0),
    postosSemLaboratorio: options.postosSemLaboratorio.filter(hasDescarteKits),
  };
};

const normalizeStatus = (status?: string) => (status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const isKitEligibleForDistribuicao = (kit: Kit): boolean => {
  if (normalizeStatus(kit.status) !== 'disponivel') return false;
  if (kit.laboratorio_id) return false;
  if (kit.fase_ciclo && !['em_empresa', 'em_posto_aguarda'].includes(kit.fase_ciclo)) return false;
  return kit.localizacao === 'Escritorio' || kit.localizacao === 'Posto';
};

export const isKitExpiredForDescarte = (kit: Kit): boolean => {
  if (normalizeStatus(kit.status) === 'expirado') return true;
  if (!kit.data_validade) return false;
  const today = new Date().toISOString().slice(0, 10);
  return kit.data_validade.slice(0, 10) < today;
};

export const isKitEligibleForDescarte = (kit: Kit): boolean => {
  if (kit.fase_ciclo === 'em_lab_final' || kit.fase_ciclo === 'em_transito_lab') return false;
  if (kit.localizacao !== 'Escritorio' && kit.localizacao !== 'Posto') return false;
  if (kit.fase_ciclo === 'aguarda_envio_lab') return true;
  const st = normalizeStatus(kit.status);
  if (st === 'utilizado' || st === 'expirado') return true;
  return isKitExpiredForDescarte(kit);
};

export const kitMatchesLocationRefForDistribuicao = (kit: Kit, ref: StockLocationRef): boolean => {
  if (!isKitEligibleForDistribuicao(kit)) return false;
  if (ref.kind === 'empresa') {
    return kit.localizacao === 'Escritorio' && (!kit.empresa_id || kit.empresa_id === ref.id);
  }
  if (ref.kind === 'posto') {
    return kit.localizacao === 'Posto' && kit.posto_id === ref.id;
  }
  return false;
};

export const kitMatchesLocationRefForDescarte = (kit: Kit, ref: StockLocationRef): boolean => {
  if (!isKitEligibleForDescarte(kit)) return false;
  if (ref.kind === 'empresa') {
    return kit.localizacao === 'Escritorio' && (!kit.empresa_id || kit.empresa_id === ref.id);
  }
  if (ref.kind === 'posto') {
    return kit.localizacao === 'Posto' && kit.posto_id === ref.id;
  }
  return false;
};

export const resolveFeatureHealthLab = (laboratorios: Laboratorio[]) =>
  laboratorios.find((l) => l.tipo === 'final' && l.ativo !== false)
  || laboratorios.find(
    (l) => l.codigo?.toUpperCase() === 'FEATUREHEALTH_UK' || l.nome.toLowerCase().includes('featurehealth'),
  );

export const filterLaboratoriosFinais = (laboratorios: Laboratorio[]) =>
  laboratorios.filter((l) => l.ativo !== false && l.tipo === 'final');

export const filterLaboratoriosOperacionais = (laboratorios: Laboratorio[]) =>
  laboratorios.filter((l) => l.ativo !== false && l.tipo !== 'final');

export function resolveKitFinalLabId(
  kit: Kit,
  lotes: Lote[],
  testes: Teste[],
): string | null {
  const lote = lotes.find((l) => l.codigo === kit.lote?.trim());
  const testeId = lote?.teste_id;
  if (!testeId) return null;
  const teste = testes.find((t) => t.id === testeId);
  return teste?.laboratorio_final_id || null;
}

export function resolveSelectedKitsFinalLabLabel(
  kits: Kit[],
  lotes: Lote[],
  testes: Teste[],
  laboratorios: Laboratorio[],
): { labId: string | null; labNome: string; mixed: boolean } {
  const labIds = kits.map((k) => resolveKitFinalLabId(k, lotes, testes)).filter(Boolean) as string[];
  const unique = [...new Set(labIds)];
  if (unique.length === 0) {
    return { labId: null, labNome: 'Conforme teste (configure em Administração → Testes)', mixed: false };
  }
  if (unique.length > 1) {
    return { labId: null, labNome: 'Vários laboratórios — selecione kits do mesmo teste/destino', mixed: true };
  }
  const lab = laboratorios.find((l) => l.id === unique[0]);
  return { labId: unique[0], labNome: lab?.nome || 'Laboratório final', mixed: false };
}

export const isRequisicaoDescarte = (
  r: { destino: string; destino_laboratorio_id?: string },
  finalLabIds?: string[],
) =>
  r.destino === 'Laboratorio'
  && (!finalLabIds?.length || (r.destino_laboratorio_id && finalLabIds.includes(r.destino_laboratorio_id)));

export const kitMatchesLocationRef = (kit: Kit, ref: StockLocationRef): boolean =>
  kitMatchesLocationRefForDistribuicao(kit, ref);

export const locationRefToApiPayload = (ref: StockLocationRef, prefix: 'origem' | 'destino') => ({
  [prefix]: ref.localizacao,
  [`${prefix}_nome`]: ref.nome,
  [`${prefix}_empresa_id`]: ref.kind === 'empresa' ? ref.id : null,
  [`${prefix}_posto_id`]: ref.kind === 'posto' ? ref.id : null,
  [`${prefix}_laboratorio_id`]: ref.kind === 'laboratorio' ? ref.id : null,
});

export const formatRequisicaoLocationLabel = (
  localizacao: Kit['localizacao'],
  nome?: string,
): string => {
  if (nome) return formatLocationRef({ kind: localizacao === 'Escritorio' ? 'empresa' : localizacao === 'Posto' ? 'posto' : 'laboratorio', nome });
  if (localizacao === 'Escritorio') return 'Empresa/Escritório (Armazém)';
  if (localizacao === 'Posto') return 'Posto';
  return 'Laboratório';
};

export const encodeRequisicaoLocationRef = (
  localizacao: Kit['localizacao'],
  ids: { empresa_id?: string; posto_id?: string; laboratorio_id?: string; nome?: string },
): string => {
  if (localizacao === 'Posto' && ids.posto_id) {
    return encodeLocationRef({ kind: 'posto', id: ids.posto_id, nome: ids.nome || '', localizacao: 'Posto' });
  }
  if (localizacao === 'Laboratorio' && ids.laboratorio_id) {
    return encodeLocationRef({ kind: 'laboratorio', id: ids.laboratorio_id, nome: ids.nome || '', localizacao: 'Laboratorio' });
  }
  if (ids.empresa_id) {
    return encodeLocationRef({ kind: 'empresa', id: ids.empresa_id, nome: ids.nome || '', localizacao: 'Escritorio' });
  }
  return '';
};
