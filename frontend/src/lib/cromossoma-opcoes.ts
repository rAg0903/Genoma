export const NUMEROS = Array.from({ length: 23 }, (_, i) => i + 1);

export const Positivo = 'Positivo';
export const Negativo = 'Negativo';
export const Suspeita = 'Suspeita';

export const RESULTADOS_CROMOSSOMA = [Negativo, Positivo, Suspeita] as const;
export const RESULTADOS_SEXUAIS = ['', Negativo, Positivo, Suspeita] as const;

export type ResultadoCromossoma = typeof RESULTADOS_CROMOSSOMA[number];
export type ResultadosMap = Record<number, string>;

export const parseCromossomasCsv = (raw?: string | null): number[] => {
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 23);
};

const resolverTipoKitPorNome = (nome: string): string | null => {
  const n = nome.toLowerCase();
  if (n.includes('básico') || n.includes('basico') || n.includes('core') || n.includes('base')) return 'Kit Base';
  if (n.includes('inter')) return 'Kit Intermédio';
  if (n.includes('complet') || n.includes('genome') || n.includes('plus')) return 'Kit Completo';
  return null;
};

const cromossomasDoKit = (tipoKit: string | null): number[] => {
  switch (tipoKit) {
    case 'Kit Base':
      return [13, 18, 21];
    case 'Kit Intermédio':
      return Array.from({ length: 22 }, (_, i) => i + 1);
    case 'Kit Completo':
      return NUMEROS;
    default:
      return [];
  }
};

export const cromossomasAnalisados = (opts: {
  teste_cromossomas?: string | null;
  sub_teste_nome?: string;
  teste_pai_nome?: string;
  teste?: string;
}): number[] => {
  const fromTeste = parseCromossomasCsv(opts.teste_cromossomas);
  if (fromTeste.length > 0) return [...new Set(fromTeste)].sort((a, b) => a - b);

  const nome = `${opts.sub_teste_nome || ''} ${opts.teste_pai_nome || ''} ${opts.teste || ''}`;
  const fromKit = cromossomasDoKit(resolverTipoKitPorNome(nome));
  if (fromKit.length > 0) return fromKit;

  return [13, 18, 21];
};

export const normalizarResultado = (resultado?: string | null): ResultadoCromossoma => {
  switch (resultado) {
    case Positivo:
    case Negativo:
    case Suspeita:
      return resultado;
    case 'Sem anomalia':
    case 'Normal':
    case 'Baixo Risco':
      return Negativo;
    case 'Alto Risco':
    case 'Detectado':
      return Positivo;
    case 'Não analisado':
      return Suspeita;
    default:
      return Negativo;
  }
};

export const inicializarNegativo = (cromossomas: number[]): ResultadosMap => {
  const out: ResultadosMap = {};
  for (const n of cromossomas) out[n] = Negativo;
  return out;
};

export const temPositivoOuSuspeita = (resultado?: string | null): boolean => {
  const r = normalizarResultado(resultado);
  return r === Positivo || r === Suspeita;
};

export const classeResultado = (resultado?: string | null): string => {
  switch (normalizarResultado(resultado)) {
    case Positivo:
      return 'positivo';
    case Suspeita:
      return 'suspeita';
    default:
      return 'negativo';
  }
};

export const derivarSemAnomalias = (
  resultados: ResultadosMap,
  analisados: number[],
  sugerirRepeticao: boolean,
): boolean => {
  if (sugerirRepeticao) return false;
  return analisados.every((n) => !temPositivoOuSuspeita(resultados[n]));
};
