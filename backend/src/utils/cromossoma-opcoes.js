const NUMEROS = Array.from({ length: 23 }, (_, i) => i + 1);

const Positivo = 'Positivo';
const Negativo = 'Negativo';
const Suspeita = 'Suspeita';

const RESULTADOS_CROMOSSOMA = [Negativo, Positivo, Suspeita];
const RESULTADOS_SEXUAIS = ['', Negativo, Positivo, Suspeita];

const KitBase = 'Kit Base';
const KitIntermedio = 'Kit Intermédio';
const KitCompleto = 'Kit Completo';

const CROMOSSOMAS_KIT_BASE = [13, 18, 21];
const CROMOSSOMAS_KIT_INTERMEDIO = Array.from({ length: 22 }, (_, i) => i + 1);
const CROMOSSOMAS_KIT_COMPLETO = NUMEROS;

const normalizarResultado = (resultado) => {
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
      return Positivo;
    case 'Não analisado':
    case 'Detectado':
      return Suspeita;
    default:
      return Negativo;
  }
};

const parseCromossomasCsv = (raw) => {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(/[,;\s]+/)
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 23);
};

const resolverTipoKitPorNome = (nome) => {
  const n = String(nome || '').toLowerCase();
  if (n.includes('básico') || n.includes('basico') || n.includes('core') || n.includes('base')) return KitBase;
  if (n.includes('inter')) return KitIntermedio;
  if (n.includes('complet') || n.includes('genome') || n.includes('plus')) return KitCompleto;
  return null;
};

const cromossomasDoKit = (tipoKit) => {
  switch (tipoKit) {
    case KitBase:
      return CROMOSSOMAS_KIT_BASE;
    case KitIntermedio:
      return CROMOSSOMAS_KIT_INTERMEDIO;
    case KitCompleto:
      return CROMOSSOMAS_KIT_COMPLETO;
    default:
      return [];
  }
};

/**
 * Cromossomas analisados para um processo: prioriza teste.cromossomas (CSV),
 * depois nome do sub-teste/teste, depois tier Kit Base/Intermédio/Completo.
 */
const cromossomasAnalisados = (processo = {}) => {
  const fromTeste = parseCromossomasCsv(processo.teste_cromossomas);
  if (fromTeste.length > 0) return [...new Set(fromTeste)].sort((a, b) => a - b);

  const nome = `${processo.sub_teste_nome || ''} ${processo.teste_pai_nome || ''} ${processo.teste_nome || ''}`;
  const tipoKit = resolverTipoKitPorNome(nome);
  const fromKit = cromossomasDoKit(tipoKit);
  if (fromKit.length > 0) return fromKit;

  return CROMOSSOMAS_KIT_BASE;
};

const inicializarNegativo = (cromossomas) => {
  const out = {};
  for (const n of cromossomas) out[n] = Negativo;
  return out;
};

const parseResultadosJson = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      const n = parseInt(key, 10);
      if (Number.isFinite(n)) out[n] = normalizarResultado(value);
    }
    return out;
  } catch {
    return {};
  }
};

const serializarResultados = (resultados) => JSON.stringify(resultados);

const obterResultado = (resultados, numero, analisados) => {
  if (!analisados.includes(numero)) return '';
  if (resultados[numero] !== undefined) return normalizarResultado(resultados[numero]);
  return Negativo;
};

const temPositivoOuSuspeita = (resultado) => {
  const r = normalizarResultado(resultado);
  return r === Positivo || r === Suspeita;
};

const derivarTudoOk = (resultados, analisados, sugerirRepeticao = false) => {
  if (sugerirRepeticao) return false;
  return analisados.every((n) => !temPositivoOuSuspeita(resultados[n]));
};

const resultadosParaAnomalias = (resultados, analisados, extras = {}) => {
  const anomalias = [];

  for (const n of analisados) {
    const valor = normalizarResultado(resultados[n]);
    if (temPositivoOuSuspeita(valor)) {
      anomalias.push({
        cromossoma: String(n),
        resultado_valor: valor,
        probabilidade: null,
        tipo_resultado: 'Cromossoma',
      });
    }
  }

  if (extras.resultado_cromossomas_sexuais && temPositivoOuSuspeita(extras.resultado_cromossomas_sexuais)) {
    anomalias.push({
      cromossoma: extras.cromossomas_sexuais || 'Sexual',
      resultado_valor: normalizarResultado(extras.resultado_cromossomas_sexuais),
      probabilidade: null,
      tipo_resultado: 'Sexual',
    });
  }

  return anomalias;
};

const buildResumoAnomalias = (anomalias) =>
  anomalias
    .map((a) => {
      const label = a.tipo_resultado === 'Sexual' ? a.cromossoma : `C${a.cromossoma}`;
      return `${label}: ${a.resultado_valor}`;
    })
    .join('; ');

const anomaliasParaResultados = (anomalias, analisados) => {
  const resultados = inicializarNegativo(analisados);
  for (const a of anomalias || []) {
    if ((a.tipo_resultado || 'Cromossoma') !== 'Cromossoma') continue;
    const num = parseInt(String(a.cromossoma || '').replace(/\D/g, ''), 10);
    if (analisados.includes(num)) {
      resultados[num] = normalizarResultado(a.resultado_valor);
    }
  }
  return resultados;
};

const classeResultado = (resultado) => {
  switch (normalizarResultado(resultado)) {
    case Positivo:
      return 'positivo';
    case Suspeita:
      return 'suspeita';
    default:
      return 'negativo';
  }
};

const obterValorResultado = (resultados, numero, analisados, semAnomalias) => {
  if (!analisados.includes(numero)) return '';
  if (semAnomalias) return Negativo;
  return obterResultado(resultados, numero, analisados);
};

const buildTituloConclusao = ({ sugerirRepeticao, semAnomalias }) => {
  if (sugerirRepeticao) return 'Sugerida repetição de colheita';
  if (semAnomalias) return 'Resultados negativos';
  return 'Resultados positivos ou suspeitos';
};

const buildTextoConclusao = ({ sugerirRepeticao, semAnomalias, resultados, analisados }) => {
  if (sugerirRepeticao) {
    return 'Com base nos resultados obtidos, recomenda-se a repetição da colheita para confirmação.';
  }
  if (semAnomalias) {
    return `Todos os ${analisados.length} cromossomas analisados apresentam resultado negativo.`;
  }

  const positivos = analisados
    .filter((n) => normalizarResultado(resultados[n]) === Positivo)
    .map((n) => `C${n}`);
  const suspeitos = analisados
    .filter((n) => normalizarResultado(resultados[n]) === Suspeita)
    .map((n) => `C${n}`);

  const partes = [];
  if (positivos.length > 0) partes.push(`Positivo: ${positivos.join(', ')}`);
  if (suspeitos.length > 0) partes.push(`Suspeita: ${suspeitos.join(', ')}`);

  return partes.length > 0
    ? `${partes.join('. ')}. Recomenda-se aconselhamento genético.`
    : 'Foram registados resultados alterados. Recomenda-se aconselhamento genético.';
};

const classeConclusao = ({ sugerirRepeticao, semAnomalias }) => {
  if (sugerirRepeticao) return 'alerta';
  if (semAnomalias) return 'ok';
  return 'anomalia';
};

module.exports = {
  NUMEROS,
  Positivo,
  Negativo,
  Suspeita,
  RESULTADOS_CROMOSSOMA,
  RESULTADOS_SEXUAIS,
  KitBase,
  KitIntermedio,
  KitCompleto,
  normalizarResultado,
  cromossomasAnalisados,
  inicializarNegativo,
  parseResultadosJson,
  serializarResultados,
  obterResultado,
  temPositivoOuSuspeita,
  derivarTudoOk,
  resultadosParaAnomalias,
  buildResumoAnomalias,
  anomaliasParaResultados,
  resolverTipoKitPorNome,
  classeResultado,
  obterValorResultado,
  buildTituloConclusao,
  buildTextoConclusao,
  classeConclusao,
};
