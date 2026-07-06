/**
 * Ponto de entrada da aplicação
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const logger = require('./src/config/logger');
const { initSentry, captureException } = require('./src/config/sentry');
const environment = require('./src/config/environment');

initSentry();

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter((env) => !process.env[env]);
if (missingEnvVars.length > 0) {
  logger.fatal({ missing: missingEnvVars }, 'Variáveis de ambiente obrigatórias em falta');
  process.exit(1);
}

if (environment.isProduction && environment.JWT.secret === 'default_secret_key_change_in_production') {
  logger.warn('JWT_SECRET parece ser o valor por defeito — altere em produção');
}

const app = require('./src/app');

const PORT = environment.PORT;
const DB_HOST = environment.DATABASE.host;
const DB_PORT = environment.DATABASE.port;
const DB_NAME = environment.DATABASE.database;

const server = app.listen(PORT, () => {
  logger.info({
    port: PORT,
    env: environment.NODE_ENV,
    database: `${DB_HOST}:${DB_PORT}/${DB_NAME}`,
    swagger: environment.SWAGGER_ENABLED,
    rateLimit: !environment.isDevelopment,
    kitAutoDescarte: environment.KIT_AUTO_DESCARTE.enabled,
  }, 'API Genoma online');
});

const kitAutoDescarte = require('./src/services/kit-auto-descarte.service');
if (environment.KIT_AUTO_DESCARTE.enabled) {
  kitAutoDescarte.scheduleAutoDescartes();
} else {
  logger.warn('KIT_AUTO_DESCARTE_ENABLED=false — auto-descarte desactivado');
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal({ port: PORT }, 'Porta já em uso');
  } else {
    logger.fatal({ err }, 'Erro ao iniciar servidor');
  }
  process.exit(1);
});

function shutdown(signal) {
  logger.info({ signal }, 'Encerramento graceful');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  captureException(err, { type: 'uncaughtException' });
  logger.fatal({ err }, 'Excepção não capturada');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  captureException(reason instanceof Error ? reason : new Error(String(reason)), {
    type: 'unhandledRejection',
  });
  logger.error({ err: reason }, 'Promise rejection não tratada');
});

module.exports = server;
