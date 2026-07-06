/**
 * Logger estruturado (Pino) — JSON em produção, pretty em desenvolvimento.
 */
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const environment = require('./environment');

const logLevel = environment.LOG.level === 'development' ? 'debug' : environment.LOG.level;

function buildTransport() {
  if (environment.isDevelopment) {
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  const targets = [{ target: 'pino/file', options: { destination: 1 } }];

  if (environment.LOG.dir) {
    try {
      fs.mkdirSync(environment.LOG.dir, { recursive: true });
      targets.push({
        target: 'pino/file',
        options: { destination: path.join(environment.LOG.dir, 'app.log'), mkdir: true },
      });
    } catch {
      // Sem ficheiro — apenas stdout
    }
  }

  return { targets };
}

const logger = pino(
  {
    level: logLevel,
    base: { env: environment.NODE_ENV },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.transport(buildTransport())
);

module.exports = logger;
