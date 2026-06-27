/**
 * Inventário inicial: kits disponíveis na empresa e em todos os postos.
 * Nº kit = tracking = codigo_barras (ex.: NPT5914573).
 * Requer seed:admin.
 */

const LOTE = {
  codigo_lote: 'LOTE-MAT-2026-01',
  tipo_kit_nome: 'Maternity',
  teste_codigo: 'MT-001',
  fornecedor_nome: 'Genoma',
  data_rececao: '2026-01-10',
  validade: '2027-06-30',
  kit_validade: '2027-06-30',
  estado: 'Disponivel',
};

/** Kits disponíveis no escritório Genoma. */
const KITS_ESCRITORIO = 10;

/** Kits disponíveis em cada posto activo. */
const KITS_POR_POSTO = 3;

/** Primeiro número NPT (NPT5914573, NPT5914574, …). */
const KIT_NUMERO_BASE = 5914573;

const KIT_NUMERO_PREFIX = 'NPT';

function formatKitNumero(seq) {
  return `${KIT_NUMERO_PREFIX}${KIT_NUMERO_BASE + seq}`;
}

module.exports = {
  LOTE,
  KITS_ESCRITORIO,
  KITS_POR_POSTO,
  KIT_NUMERO_BASE,
  KIT_NUMERO_PREFIX,
  formatKitNumero,
};
