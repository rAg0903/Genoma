/**
 * Migracao 003 - SUPERSEDED / NO-OP
 *
 * Originalmente adicionava colunas de workflow e faturacao a tabela legada
 * `pedidos_exames` (apenas quando ENABLE_PEDIDOS_WORKFLOW_MIGRATION=true).
 *
 * O dominio operacional foi unificado em `processos` (ver migracao
 * 009_align_processos_core.js), onde todas as colunas de workflow/faturacao
 * passaram a viver. A tabela `pedidos_exames` e considerada legada e nao
 * necessita destas colunas, pelo que esta migracao foi neutralizada para
 * evitar duplicacao de modelo e divergencia de estados.
 */
module.exports.up = async () => {
  console.log('  ℹ Migracao 003 ignorada (workflow/faturacao unificados em processos)');
};
