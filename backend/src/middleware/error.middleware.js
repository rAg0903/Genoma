const { validationResult } = require('express-validator');

/**
 * Middleware para lidar com erros de validação
 * Deve ser usado após validadores do express-validator
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erros de validação',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Middleware global de tratamento de erros
 * Deve ser o último middleware a ser registado no app
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro para monitoramento
  console.error('❌ Erro:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    message: err.message,
    stack: err.stack
  });

  // Defina status code baseado no tipo de erro
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erro interno do servidor';

  // Erros de banco de dados
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Registro duplicado';
  } else if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 422;
    message = 'Erro de integridade referencial';
  } else if (err.code === 'ER_PARSE_ERROR') {
    statusCode = 400;
    message = 'Erro de sintaxe na query';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

/**
 * Wrapper para capturar erros em rotas async
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  validationMiddleware,
  errorHandler,
  asyncHandler
};
