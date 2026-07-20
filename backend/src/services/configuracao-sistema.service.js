const configuracaoRepository = require('../repositories/configuracao-sistema.repository');
const logService = require('./log.service');

let cache = null;
let cacheAt = 0;
const CACHE_MS = 30_000;

const invalidateCache = () => {
  cache = null;
  cacheAt = 0;
};

const mapRow = (row) => ({
  clinica_nome: row?.clinica_nome || 'GENOMA',
  clinica_morada: row?.clinica_morada || '',
  clinica_codigo_postal: row?.clinica_codigo_postal || '',
  clinica_telefone: row?.clinica_telefone || '',
  clinica_email: row?.clinica_email || '',
  updated_at: row?.updated_at || null,
});

exports.get = async () => {
  if (cache && Date.now() - cacheAt < CACHE_MS) {
    return cache;
  }
  const row = await configuracaoRepository.find();
  cache = mapRow(row);
  cacheAt = Date.now();
  return cache;
};

exports.save = async (data, user) => {
  const nome = String(data.clinica_nome || '').trim();
  if (!nome) {
    throw new Error('O nome da clínica é obrigatório.');
  }

  const email = data.clinica_email ? String(data.clinica_email).trim() : '';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email da clínica inválido.');
  }

  const row = await configuracaoRepository.upsert({
    clinica_nome: nome,
    clinica_morada: data.clinica_morada ? String(data.clinica_morada).trim() : null,
    clinica_codigo_postal: data.clinica_codigo_postal ? String(data.clinica_codigo_postal).trim() : null,
    clinica_telefone: data.clinica_telefone ? String(data.clinica_telefone).trim() : null,
    clinica_email: email || null,
    updated_by: user?.id || null,
  });

  invalidateCache();
  const mapped = mapRow(row);

  if (user) {
    try {
      await logService.log({
        utilizador_id: user.id,
        acao: 'Atualizou configuração da clínica',
        tabela: 'configuracao_sistema',
      });
    } catch (err) {
      console.warn('[configuracao-sistema] Falha auditoria:', err.message);
    }
  }

  return mapped;
};

/**
 * Dados do emitente para relatórios: BD → .env → processo.empresa.
 */
exports.resolveClinica = async (processo = {}) => {
  const cfg = await exports.get();
  return {
    nome: cfg.clinica_nome || process.env.CLINICA_NOME || processo.empresa_nome || 'GENOMA',
    morada: cfg.clinica_morada || process.env.CLINICA_MORADA || '',
    codigoPostal: cfg.clinica_codigo_postal || process.env.CLINICA_CODIGO_POSTAL || '',
    telefone: cfg.clinica_telefone || process.env.CLINICA_TELEFONE || '',
    email: cfg.clinica_email || process.env.CLINICA_EMAIL || processo.empresa_email || '',
  };
};

exports.invalidateCache = invalidateCache;
