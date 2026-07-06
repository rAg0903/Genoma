/**
 * Configuração de Ambiente
 * Centraliza validação e acesso a variáveis de ambiente
 * Garante que valores padrão são usados quando apropriado
 */

module.exports = {
  // Validação
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',

  // Servidor
  PORT: parseInt(process.env.PORT, 10) || 3000,

  // Base de Dados
  DATABASE: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'genoma',
    waitForConnections: true,
    // Configuravel para suportar carga concorrente (ex.: ~300 utilizadores).
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 20,
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0
  },

  // JWT
  JWT: {
    secret: process.env.JWT_SECRET || 'default_secret_key_change_in_production',
    expiration: process.env.JWT_EXPIRE || '8h'
  },

  // CORS
  CORS: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    optionsSuccessStatus: 200
  },

  // Rate Limiting
  RATE_LIMIT: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.'
  },

  // Logging
  LOG: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },

  // Documentação API (desactivada em produção por defeito)
  SWAGGER_ENABLED: process.env.SWAGGER_ENABLED === 'true'
    || (process.env.SWAGGER_ENABLED !== 'false' && (process.env.NODE_ENV || 'development') !== 'production'),

  // Backups
  BACKUP: {
    dir: process.env.BACKUP_DIR || './database/backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30
  },

  // Auto-descarte de kits
  KIT_AUTO_DESCARTE: {
    enabled: process.env.KIT_AUTO_DESCARTE_ENABLED !== 'false',
    startupMs: parseInt(process.env.KIT_AUTO_DESCARTE_STARTUP_MS, 10) || 30_000
  }
};
