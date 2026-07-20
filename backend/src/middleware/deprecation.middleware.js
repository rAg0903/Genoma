/**
 * Middleware de Depreciacao
 * Marca rotas legadas como obsoletas. O dominio operacional foi unificado em
 * `processos`; `pedidos_exames` e `resultados_detalhados` permanecem apenas
 * para compatibilidade retroativa e serao removidos numa versao futura.
 */

const deprecationMiddleware = ({ successor } = {}) => (req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('X-API-Deprecated', 'true');
  if (successor) {
    res.setHeader('Link', `<${successor}>; rel="successor-version"`);
    res.setHeader('X-API-Successor', successor);
  }
  next();
};

module.exports = deprecationMiddleware;
