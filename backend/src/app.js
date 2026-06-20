/**
 * Configuração Principal da Aplicação Express
 * Define middlewares, rotas e tratamento de erros
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

// Importações customizadas
const environment = require('./config/environment');
const swaggerDocument = require('./swagger.json');
const { errorHandler } = require('./middleware/error.middleware');
const routes = require('./routes');
const notificationsService = require('./services/notifications.service');

const app = express();

// Respostas da API são sempre dinâmicas; desativar ETag evita 304 (Not Modified).
app.set('etag', false);

// Subsistema de notificacoes (e-mail/SMS) orientado a eventos.
notificationsService.registerListeners();

// ============================================
// 1. MIDDLEWARES DE SEGURANÇA
// ============================================

// Helmet - Define headers de segurança HTTP
app.use(helmet());

// CORS - Aceita requisições de origins configuradas
app.use(cors(environment.CORS));

// Rate Limiting - Proteção contra abuso (desativado em desenvolvimento)
app.use(rateLimit({
  ...environment.RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: true,
  skip: () => environment.isDevelopment,
}));

// ============================================
// 2. MIDDLEWARES DE PARSING
// ============================================

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// 3. MIDDLEWARE DE LOGGING (Desenvolvimento)
// ============================================

if (environment.isDevelopment) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status =
        res.statusCode >= 400 ? '❌'
        : res.statusCode < 300 || res.statusCode === 304 ? '✅'
        : '⚠️';
      console.log(
        `${status} [${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    });
    next();
  });
}

// ============================================
// 4. ROTAS DE SAÚDE E INFORMAÇÃO
// ============================================

// Health Check - Para monitoramento
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API está operacional',
    timestamp: new Date().toISOString(),
    environment: environment.NODE_ENV
  });
});

// Root Endpoint - Informações da API
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Genoma - Sistema de Laboratório Genómico',
    version: '1.0.0',
    environment: environment.NODE_ENV,
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      api: '/api'
    }
  });
});

// ============================================
// 5. DOCUMENTAÇÃO SWAGGER
// ============================================

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    url: '/api-docs.json',
    displayOperationId: true
  }
}));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// ============================================
// 6. ROTAS DA API
// ============================================

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
}, routes);

// ============================================
// 7. TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path,
    method: req.method
  });
});

// ============================================
// 8. MIDDLEWARE DE TRATAMENTO GLOBAL DE ERROS
// ============================================

// Deve ser o último middleware registado
app.use(errorHandler);

module.exports = app;