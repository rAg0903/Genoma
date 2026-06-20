/**
 * Helper para calcular offset e limit para paginação
 * @param {number} page - Número da página (começa em 1)
 * @param {number} limit - Quantidade de registros por página
 * @returns {object} Objeto com offset e limit
 */
const getPaginationParams = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (p - 1) * l;
  
  return {
    offset,
    limit: l,
    page: p
  };
};

/**
 * Helper para formatar resposta com paginação
 * @param {array} data - Array de dados
 * @param {number} total - Total de registros
 * @param {number} page - Página atual
 * @param {number} limit - Limite por página
 * @returns {object} Objeto com dados e metadados de paginação
 */
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      pageSize: limit,
      totalRecords: total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * Helper para formatar lista com informações de contagem
 * @param {array} data - Array de dados
 * @param {number} total - Total de registros
 * @returns {object} Objeto com dados e total
 */
const formatListResponse = (data, total) => {
  return {
    data,
    meta: {
      total,
      count: data.length
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginationResponse,
  formatListResponse
};
