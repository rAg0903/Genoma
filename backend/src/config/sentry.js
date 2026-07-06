/**
 * Monitorização de erros (Sentry) — activa apenas se SENTRY_DSN estiver definido.
 */
const environment = require('./environment');
const logger = require('./logger');

let sentry = null;

function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    // eslint-disable-next-line global-require
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: environment.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    });
    sentry = Sentry;
    logger.info('Sentry inicializado');
    return Sentry;
  } catch (error) {
    logger.warn({ err: error }, 'Sentry não disponível — instale @sentry/node para monitorização');
    return null;
  }
}

function captureException(error, context = {}) {
  if (sentry) {
    sentry.captureException(error, { extra: context });
    return;
  }
  logger.error({ err: error, ...context }, 'Excepção não reportada ao Sentry');
}

module.exports = { initSentry, captureException };
