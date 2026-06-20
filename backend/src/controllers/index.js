/**
 * Índice centralizado de Controllers
 * Facilita importação de camada HTTP
 */

const authController = require('./auth.controller');
const perfisController = require('./perfis.controller');
const empresasController = require('./empresas.controller');
const utilizadoresController = require('./utilizadores.controller');
const pacientesController = require('./pacientes.controller');
const testesController = require('./testes.controller');
const itensController = require('./itens_pesquisa.controller');
const medicosController = require('./medicos.controller');
const testeComposicaoController = require('./teste_composicao.controller');
const pedidosController = require('./pedidos_exames.controller');
const resultadosController = require('./resultados_detalhados.controller');

module.exports = {
  authController,
  perfisController,
  empresasController,
  utilizadoresController,
  pacientesController,
  testesController,
  itensController,
  medicosController,
  testeComposicaoController,
  pedidosController,
  resultadosController
};
