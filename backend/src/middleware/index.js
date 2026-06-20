/**
 * Índice centralizado de middlewares
 * Facilita importação e manutenção
 */

const { authMiddleware } = require('./auth.middleware');
const { errorHandler, validationMiddleware, asyncHandler } = require('./error.middleware');

module.exports = {
  authMiddleware,
  errorHandler,
  validationMiddleware,
  asyncHandler
};
