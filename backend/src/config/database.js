/**
 * Configuração do Pool de Conexão MariaDB
 * Centraliza criação e gerenciamento de conexões
 */

const mysql = require('mysql2/promise');
const environment = require('./environment');
const logger = require('./logger');

const pool = mysql.createPool({
  host: environment.DATABASE.host,
  port: environment.DATABASE.port,
  user: environment.DATABASE.user,
  password: environment.DATABASE.password,
  database: environment.DATABASE.database,
  waitForConnections: environment.DATABASE.waitForConnections,
  connectionLimit: environment.DATABASE.connectionLimit,
  queueLimit: environment.DATABASE.queueLimit,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: 'utf8mb4',
  ssl: false,
  authPlugins: {
    sha256_password: () => () => environment.DATABASE.password
  },
  // MariaDB no Windows pode usar auth_gssapi_client, incompatível com mysql2 por defeito.
  authSwitchHandler: (data, callback) => {
    if (data.pluginName === 'auth_gssapi_client') {
      callback(null, Buffer.from(`${environment.DATABASE.password}\0`));
      return;
    }
    callback(new Error(`Plugin de autenticação não suportado: ${data.pluginName}`));
  }
});

// Log de conexão bem-sucedida
pool.on('connection', () => {
  if (environment.isDevelopment) {
    logger.debug('Nova conexão ao banco de dados estabelecida');
  }
});

pool.on('error', (err) => {
  logger.error({ err, code: err.code }, 'Erro de conexão ao banco de dados');
});

module.exports = pool;