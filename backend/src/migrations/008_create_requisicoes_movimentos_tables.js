/**
 * Migracao 008 - SUPERSEDED / NO-OP
 *
 * As tabelas `requisicoes_kits`, `requisicao_kits_itens` e `movimentos_kits`
 * ja sao criadas na migracao 007_create_requisicoes_movimentos.js, com a
 * collation padrao do projeto (utf8mb4_unicode_ci).
 *
 * A versao original desta migracao duplicava essas tabelas usando a collation
 * `utf8mb4_uca1400_ai_ci` (especifica do MariaDB), criando risco de drift de
 * schema/collation. Para manter a cadeia de migracoes idempotente e com uma
 * unica fonte de verdade, esta migracao foi neutralizada.
 */
module.exports.up = async () => {
  console.log('  ℹ Migracao 008 ignorada (tabelas criadas em 007, collation alinhada)');
};
