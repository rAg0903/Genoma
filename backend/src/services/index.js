/**
 * Índice centralizado de Services
 * Facilita importação de camada de negócio
 */

const authService = require('./auth.service');
const perfisService = require('./perfis.service');
const empresasService = require('./empresas.service');
const utilizadoresService = require('./utilizadores.service');
const pacientesService = require('./pacientes.service');
const testesService = require('./testes.service');
const itensService = require('./itens_pesquisa.service');
const medicosService = require('./medicos.service');
const testeComposicaoService = require('./teste_composicao.service');
const pedidosService = require('./pedidos_exames.service');
const processosService = require('./processos.service');
const resultadosService = require('./resultados_detalhados.service');
const logService = require('./log.service');
const stocksService = require('./stocks.service');

module.exports = {
  authService,
  perfisService,
  empresasService,
  utilizadoresService,
  pacientesService,
  testesService,
  itensService,
  medicosService,
  testeComposicaoService,
  pedidosService,
  processosService,
  resultadosService,
  logService,
  stocksService
};
