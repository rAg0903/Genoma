import type { SubTeste, Teste } from '../app/data/types';

export function isSubTeste(t: Pick<Teste, 'teste_pai_id'>): boolean {
  return Boolean(t.teste_pai_id);
}

/** Ordenação natural por código (MT-001, MT-002, MT-003…). */
export function compareTesteCodigo(
  a: { codigo?: string | null; nome?: string },
  b: { codigo?: string | null; nome?: string },
): number {
  const codeA = String(a.codigo || '').trim();
  const codeB = String(b.codigo || '').trim();
  if (codeA && codeB) {
    const byCode = codeA.localeCompare(codeB, 'pt', { numeric: true, sensitivity: 'base' });
    if (byCode !== 0) return byCode;
  } else if (codeA) return -1;
  else if (codeB) return 1;
  return String(a.nome || '').localeCompare(String(b.nome || ''), 'pt');
}

export function sortTestesByCodigo<T extends { codigo?: string | null; nome?: string }>(items: T[]): T[] {
  return [...items].sort(compareTesteCodigo);
}

/** Testes principais (sem pai). */
export function getTestesPrincipais(testes: Teste[]): Teste[] {
  return testes.filter((t) => !isSubTeste(t));
}

/** Sub-testes disponíveis para seleção (colheita, agendamento, condições comerciais). */
export function getTestesSelecionaveis(testes: Teste[]): Array<SubTeste | Teste> {
  const result: Array<SubTeste | Teste> = [];
  for (const t of getTestesPrincipais(testes)) {
    if (t.sub_testes?.length) {
      result.push(...sortTestesByCodigo(t.sub_testes.filter((st) => st.ativo !== false)));
    } else if (t.ativo !== false) {
      result.push(t);
    }
  }
  return result.sort(compareTesteCodigo);
}

export function getSubTesteLabel(teste: Pick<Teste, 'nome'>, parent?: Pick<Teste, 'nome'>): string {
  if (parent) return `${parent.nome} — ${teste.nome}`;
  return teste.nome;
}

export function findTestePrincipal(testes: Teste[], id: string): Teste | undefined {
  return getTestesPrincipais(testes).find((t) => t.id === id);
}

export function findSubTeste(testes: Teste[], subId: string): { parent: Teste; sub: SubTeste } | undefined {
  for (const parent of getTestesPrincipais(testes)) {
    const sub = parent.sub_testes?.find((st) => st.id === subId);
    if (sub) return { parent, sub };
  }
  return undefined;
}

/** Preço de venda do teste ou sub-teste seleccionável (pacote). */
export function resolvePrecoTesteSelecionavel(testes: Teste[], testeId?: string): number | null {
  if (!testeId) return null;
  const sub = findSubTeste(testes, testeId);
  if (sub) {
    const preco = sub.sub.preco_venda ?? sub.sub.preco ?? 0;
    return preco > 0 ? preco : null;
  }
  const principal = findTestePrincipal(testes, testeId);
  if (!principal) return null;
  const preco = principal.preco_venda ?? principal.preco ?? 0;
  return preco > 0 ? preco : null;
}

export function formatSubTestesResumo(teste: Teste): string {
  const subs = teste.sub_testes ?? [];
  if (subs.length === 0) return '—';
  const precos = subs.map((s) => s.preco_venda ?? s.preco ?? 0).filter((p) => p > 0);
  if (precos.length === 0) return `${subs.length} sub-teste${subs.length === 1 ? '' : 's'}`;
  const min = Math.min(...precos);
  const max = Math.max(...precos);
  if (min === max) return `${min.toFixed(2)} €`;
  return `${min.toFixed(2)} – ${max.toFixed(2)} €`;
}

export interface TesteSelecionavel {
  id: string;
  nome: string;
  label: string;
}

export function getTestesSelecionaveisComLabel(testes: Teste[]): TesteSelecionavel[] {
  const result: TesteSelecionavel[] = [];
  for (const parent of getTestesPrincipais(testes)) {
    if (parent.sub_testes?.length) {
      for (const st of sortTestesByCodigo(parent.sub_testes.filter((s) => s.ativo !== false))) {
        result.push({ id: st.id, nome: st.nome, label: getSubTesteLabel(st, parent) });
      }
    } else if (parent.ativo !== false) {
      result.push({ id: parent.id, nome: parent.nome, label: parent.nome });
    }
  }
  return result.sort((a, b) => a.label.localeCompare(b.label, 'pt', { numeric: true }));
}

export function resolveTesteSelecionavelLabel(testes: Teste[], testeId?: string): string {
  if (!testeId) return '';
  const match = getTestesSelecionaveisComLabel(testes).find((t) => t.id === testeId);
  if (match) return match.label;
  const sub = findSubTeste(testes, testeId);
  if (sub) return getSubTesteLabel(sub.sub, sub.parent);
  return getTestesPrincipais(testes).find((t) => t.id === testeId)?.nome || '';
}

export function getTestesComSubTestes(testes: Teste[]): Teste[] {
  return getTestesPrincipais(testes).filter((t) => (t.sub_testes?.length ?? 0) > 0);
}

export function resolveTesteIdFromSelection(
  testes: Teste[],
  { testeId, label }: { testeId?: string; label?: string },
): string | undefined {
  if (testeId) return testeId;
  if (!label) return undefined;
  return getTestesSelecionaveisComLabel(testes).find((t) => t.label === label || t.nome === label)?.id;
}

export function resolveParentFromTesteId(testes: Teste[], testeId?: string): Teste | undefined {
  if (!testeId) return undefined;
  const match = findSubTeste(testes, testeId);
  if (match) return match.parent;
  return findTestePrincipal(testes, testeId);
}
