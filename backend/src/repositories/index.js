/**
 * Índice centralizado de Repositories
 * Facilita importação de camada de dados
 */

const perfisRepository = require('./perfis.repository');
const empresasRepository = require('./empresas.repository');
const utilizadoresRepository = require('./utilizadores.repository');
const pacientesRepository = require('./pacientes.repository');
const testesRepository = require('./testes.repository');
const itensRepository = require('./itens_pesquisa.repository');
const medicosRepository = require('./medicos.repository');
const testeComposicaoRepository = require('./teste_composicao.repository');
const pedidosRepository = require('./pedidos_exames.repository');
const processosRepository = require('./processos.repository');
const resultadosRepository = require('./resultados_detalhados.repository');
const stocksRepository = require('./stocks.repository');

module.exports = {
  perfisRepository,
  empresasRepository,
  utilizadoresRepository,
  pacientesRepository,
  testesRepository,
  itensRepository,
  medicosRepository,
  testeComposicaoRepository,
  pedidosRepository,
  processosRepository,
  resultadosRepository,
  stocksRepository
};
