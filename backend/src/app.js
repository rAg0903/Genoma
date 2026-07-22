/**
 * Configuração Principal da Aplicação Express
 * Define middlewares, rotas e tratamento de erros
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const pinoHttp = require('pino-http');
const fs = require('fs');
const path = require('path');

// Importações customizadas
const environment = require('./config/environment');
const logger = require('./config/logger');
const swaggerDocument = require('./swagger.json');
const pool = require('./config/database');
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

app.use(helmet());

app.use(cors(environment.CORS));

app.use(rateLimit({
  ...environment.RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: true,
  skip: () => environment.isDevelopment || process.env.DESKTOP_MODE === '1',
}));

// ============================================
// 2. MIDDLEWARES DE PARSING
// ============================================

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// 3. LOGGING ESTRUTURADO
// ============================================

app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/health/live',
  },
  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
}));

// ============================================
// 4. ROTAS DE SAÚDE E INFORMAÇÃO
// ============================================

app.get('/health/live', (req, res) => {
  res.json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req, res) => {
  const payload = {
    success: true,
    status: 'ok',
    message: 'API está operacional',
    timestamp: new Date().toISOString(),
    environment: environment.NODE_ENV,
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: 'unknown',
    },
  };

  try {
    await pool.query('SELECT 1');
    payload.checks.database = 'up';
    res.json(payload);
  } catch (error) {
    payload.success = false;
    payload.status = 'degraded';
    payload.message = 'API online mas base de dados indisponível';
    payload.checks.database = 'down';
    req.log.error({ err: error }, 'Health check — base de dados indisponível');
    res.status(503).json(payload);
  }
});

if (!process.env.SERVE_FRONTEND) {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'API Genoma - Sistema de Laboratório Genómico',
      version: process.env.APP_VERSION || '1.0.0',
      environment: environment.NODE_ENV,
      endpoints: {
        health: '/health',
        docs: environment.SWAGGER_ENABLED ? '/api-docs' : null,
        api: '/api',
      },
    });
  });
}

// ============================================
// 5. DOCUMENTAÇÃO SWAGGER (parcial — só se activada)
// ============================================

if (environment.SWAGGER_ENABLED) {
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      url: '/api-docs.json',
      displayOperationId: true,
    },
  }));

  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocument);
  });
}

// ============================================
// 6. ROTAS DA API
// ============================================

app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
}, routes);

// ============================================
// 6b. FRONTEND ESTÁTICO (modo desktop / produção local)
// ============================================

const frontendDist = process.env.SERVE_FRONTEND;
if (frontendDist && fs.existsSync(frontendDist)) {
  const desktopFrontend = process.env.DESKTOP_MODE === '1';
  app.use(express.static(frontendDist, {
    index: false,
    maxAge: environment.isProduction && !desktopFrontend ? '1h' : 0,
    setHeaders(res, filePath) {
      if (!desktopFrontend) return;
      if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
      }
    },
  }));

  app.get(/^(?!\/api(?:\/|$)|\/health(?:\/|$)|\/api-docs).*/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (/\.(js|mjs|css|map|ico|png|jpe?g|gif|webp|svg|woff2?|ttf|eot)$/i.test(req.path)) {
      return res.status(404).json({ success: false, message: 'Asset não encontrado' });
    }
    const indexHtml = path.join(frontendDist, 'index.html');
    if (!fs.existsSync(indexHtml)) return next();
    if (desktopFrontend) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
    res.sendFile(indexHtml);
  });

  logger.info({ frontendDist }, 'Frontend estático activo (modo desktop)');
}

// ============================================
// 7. TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada',
    path: req.path,
    method: req.method,
  });
});

// ============================================
// 8. MIDDLEWARE DE TRATAMENTO GLOBAL DE ERROS
// ============================================

app.use(errorHandler);

module.exports = app;
