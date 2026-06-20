/**
 * Configuração do Pool de Conexão MariaDB
 * Centraliza criação e gerenciamento de conexões
 */

const mysql = require('mysql2/promise');
const environment = require('./environment');

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
    console.log('✅ Nova conexão ao banco de dados estabelecida');
  }
});

// Log de erros de conexão
pool.on('error', (err) => {
  console.error('❌ Erro de conexão ao banco de dados:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('   Conexão foi deixada cair pelo servidor');
  } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('   Muitas conexões falharam');
  } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
    console.error('   Sem conexão válida com o MySQL durante query');
  }
});

module.exports = pool;