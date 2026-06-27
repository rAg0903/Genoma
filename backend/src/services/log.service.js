const logRepository = require('../repositories/log.repository');
const utilizadoresRepository = require('../repositories/utilizadores.repository');

/** Regista auditoria sem falhar a operação principal (ex.: token obsoleto após reset da BD). */
exports.log = async ({ utilizador_id, empresa_id, acao, tabela, registro_id }) => {
  try {
    let validUserId = utilizador_id || null;
    let validEmpresaId = empresa_id || null;

    if (validUserId) {
      const utilizador = await utilizadoresRepository.findById(validUserId);
      if (!utilizador) {
        validUserId = null;
        validEmpresaId = null;
      } else if (!validEmpresaId) {
        validEmpresaId = utilizador.empresa_id || null;
      }
    }

    await logRepository.create({
      utilizador_id: validUserId,
      empresa_id: validEmpresaId,
      acao,
      tabela_afetada: tabela,
      registro_id: registro_id || null,
    });
  } catch (err) {
    console.warn('Falha ao registar auditoria (ignorado):', err.message);
  }
};
