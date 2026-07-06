export type OrigemConceicao = 'natural' | 'fiv_ovulos_proprios' | 'fiv_doacao_ovulos';

export const ORIGEM_CONCEICAO_OPTIONS: { value: OrigemConceicao; label: string }[] = [
  { value: 'natural', label: 'Natural' },
  { value: 'fiv_ovulos_proprios', label: 'FIV com Óvulos Próprios' },
  { value: 'fiv_doacao_ovulos', label: 'FIV com Doação de Óvulos' },
];

export function formatOrigemConceicao(value?: OrigemConceicao | string | null): string {
  if (!value) return '';
  return ORIGEM_CONCEICAO_OPTIONS.find((item) => item.value === value)?.label || '';
}

export function normalizeOrigemConceicao(value?: string | null): OrigemConceicao | null {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return ORIGEM_CONCEICAO_OPTIONS.some((item) => item.value === normalized)
    ? (normalized as OrigemConceicao)
    : null;
}
