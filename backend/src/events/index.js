/**
 * Barramento de eventos do dominio (event-driven).
 *
 * Permite desacoplar acoes secundarias (notificacoes, alertas) das operacoes
 * principais. Os servicos emitem eventos; os listeners (ex.: notificacoes)
 * reagem de forma assincrona, sem bloquear o fluxo operacional.
 */
const { EventEmitter } = require('events');

const bus = new EventEmitter();
// Evita warnings caso varios listeners sejam registados.
bus.setMaxListeners(50);

const EVENTS = {
  AGENDAMENTO_CRIADO: 'agendamento.criado',
  COLHEITA_REGISTADA: 'colheita.registada',
  RESULTADO_DISPONIVEL: 'resultado.disponivel',
  RESULTADO_VALIDADO: 'resultado.validado',
  RELATORIO_GERADO: 'relatorio.gerado',
  RELATORIO_ENVIADO: 'relatorio.enviado',
  FATURA_EMITIDA: 'fatura.emitida',
  PAGAMENTO_REGISTADO: 'pagamento.registado',
  STOCK_BAIXO: 'stock.baixo',
};

/**
 * Emite um evento de forma segura: erros nos listeners nunca interrompem o
 * fluxo principal de negocio.
 */
const emit = (event, payload = {}) => {
  setImmediate(() => {
    try {
      bus.emit(event, payload);
    } catch (error) {
      console.error(`[events] Erro ao emitir ${event}:`, error.message);
    }
  });
};

module.exports = { bus, EVENTS, emit };
