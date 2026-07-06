import { normalizePortuguesePostalCode } from './postal-code-pt';

/** Pontuação menor = posto mais próximo do contacto (com base no CP). */
export function postalCodeProximityScore(contactCp: string, postoCp: string): number | null {
  const contact = normalizePortuguesePostalCode(contactCp);
  const posto = normalizePortuguesePostalCode(postoCp);
  if (!contact || !posto) return null;
  if (contact === posto) return 0;

  const contactCp4 = contact.slice(0, 4);
  const postoCp4 = posto.slice(0, 4);
  const contactSuffix = parseInt(contact.slice(5), 10);
  const postoSuffix = parseInt(posto.slice(5), 10);

  if (contactCp4 === postoCp4) {
    return Math.abs(contactSuffix - postoSuffix);
  }

  const contactPrefix2 = contactCp4.slice(0, 2);
  const postoPrefix2 = postoCp4.slice(0, 2);
  const cp4Diff = Math.abs(parseInt(contactCp4, 10) - parseInt(postoCp4, 10));

  if (contactPrefix2 === postoPrefix2) {
    return 100 + cp4Diff;
  }

  const contactPrefix1 = contactCp4.slice(0, 1);
  const postoPrefix1 = postoCp4.slice(0, 1);
  if (contactPrefix1 === postoPrefix1) {
    return 1000 + cp4Diff;
  }

  return 10000 + cp4Diff;
}

/**
 * Limite de proximidade só por CP (quando distrito/cidade ainda não coincidem).
 * Ex.: Lisboa 1700-123 vs 1800-456 ficam incluídos; Lisboa vs Braga ficam de fora.
 */
export const POSTO_PROXIMITY_MAX_SCORE = 1200;

export type PostoProximidadeMotivo = 'distrito' | 'cidade' | 'codigo_postal';

export interface PostoComProximidade<T> {
  posto: T;
  proximityScore: number;
  motivo: PostoProximidadeMotivo;
}

function normalizeLocalidade(value?: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function sameLocalidade(a?: string, b?: string): boolean {
  const left = normalizeLocalidade(a);
  const right = normalizeLocalidade(b);
  return Boolean(left && right && left === right);
}

function resolveMotivo(
  distritoMatch: boolean,
  cidadeMatch: boolean,
): PostoProximidadeMotivo {
  if (distritoMatch) return 'distrito';
  if (cidadeMatch) return 'cidade';
  return 'codigo_postal';
}

export function filterPostosNearContact<T extends { codigo_postal?: string; distrito?: string; cidade?: string }>(
  postos: T[],
  contact: { codigo_postal?: string; distrito?: string; cidade?: string },
): PostoComProximidade<T>[] {
  const contactCp = normalizePortuguesePostalCode(contact.codigo_postal || '');
  if (!contactCp) return [];

  const contactDistrito = contact.distrito?.trim();
  const contactCidade = contact.cidade?.trim();

  return postos
    .map((posto) => {
      const postoCp = normalizePortuguesePostalCode(posto.codigo_postal || '');
      if (!postoCp) return null;

      const cpScore = postalCodeProximityScore(contactCp, postoCp);
      if (cpScore === null) return null;

      const distritoMatch = sameLocalidade(contactDistrito, posto.distrito);
      const cidadeMatch = sameLocalidade(contactCidade, posto.cidade);
      const cpNear = cpScore <= POSTO_PROXIMITY_MAX_SCORE;

      // 1) Todo o distrito do contacto; 2) mesma cidade; 3) CP próximo
      if (!distritoMatch && !cidadeMatch && !cpNear) return null;

      const motivo = resolveMotivo(distritoMatch, cidadeMatch);
      const proximityScore = distritoMatch
        ? cpScore
        : cidadeMatch
          ? 2000 + cpScore
          : cpScore;

      return { posto, proximityScore, motivo };
    })
    .filter((item): item is PostoComProximidade<T> => item !== null)
    .sort((a, b) => a.proximityScore - b.proximityScore);
}

export function hasValidContactPostalCode(codigoPostal?: string): boolean {
  return Boolean(normalizePortuguesePostalCode(codigoPostal || ''));
}

export function formatPostoProximidadeMotivo(motivo: PostoProximidadeMotivo): string {
  switch (motivo) {
    case 'distrito':
      return 'mesmo distrito';
    case 'cidade':
      return 'mesma cidade';
    default:
      return 'CP próximo';
  }
}

export function formatPostoOptionLabel(posto: {
  nome?: string;
  cidade?: string;
  codigo_postal?: string;
}): string {
  return [
    posto.nome,
    posto.cidade ? ` — ${posto.cidade}` : '',
    posto.codigo_postal ? ` (${posto.codigo_postal})` : '',
  ].join('');
}
