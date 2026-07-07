import type { TipoKit } from '../app/data/types';

export function resolveTipoKitEditPath(
  tiposKit: TipoKit[],
  tipoKitNome?: string | null,
  tab?: 'dados' | 'testes',
): string | null {
  const nome = tipoKitNome?.trim();
  if (!nome) return null;
  const tipoKit = tiposKit.find((item) => item.nome === nome);
  if (!tipoKit) return null;
  return tab === 'testes'
    ? `/definicoes/tipos-kit/${tipoKit.id}/editar?tab=testes`
    : `/definicoes/tipos-kit/${tipoKit.id}/editar`;
}

export const TIPOS_KIT_LIST_PATH = '/definicoes?tab=tipos_kit';
