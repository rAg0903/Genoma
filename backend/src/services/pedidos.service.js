const pedidosRepository = require('../repositories/pedidos.repository');
const logService = require('./log.service');

exports.createPedido = async (data, user) => {

    const pedido = await pedidosRepository.create(data);

    await logService.log({
        utilizador_id: user.id,
        acao: "Criou pedido de exame",
        tabela: "pedidos_exames"
    });

    return pedido;
};