const logRepository = require('../repositories/log.repository');

exports.log = async ({ utilizador_id, acao, tabela, registro_id }) => {
    await logRepository.create({
        utilizador_id,
        acao,
        tabela_afetada: tabela,
        registro_id: registro_id || null,
    });
};