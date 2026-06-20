# 🏗️ Estrutura da Aplicação

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────┐
│           Express Server (server.js)         │
│  - Carrega .env                             │
│  - Valida variáveis de ambiente             │
│  - Inicializa aplicação                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│              Express App (app.js)            │
│  - Middlewares de segurança (Helmet, CORS)  │
│  - Rate limiting                            │
│  - Swagger docs                             │
│  - Global error handler                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Routes (src/routes/*)               │
│  - Define endpoints HTTP                    │
│  - Aplica validação (express-validator)     │
│  - Protege com auth middleware              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│       Controllers (src/controllers/*)       │
│  - Manipula requisições HTTP                │
│  - Chama services                           │
│  - Formata respostas                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Services (src/services/*)          │
│  - Lógica de negócio                        │
│  - Validações                               │
│  - Logs de auditoria                        │
│  - Permissões                               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│       Repositories (src/repositories/*)     │
│  - Acesso direto ao banco                   │
│  - Queries SQL                              │
│  - Paginação                                │
│  - Helpers (count, exists, etc)             │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│    Database Pool (src/config/database.js)  │
│  - Conexão MariaDB                          │
│  - Pool de conexões                         │
│  - Tratamento de erros                      │
└─────────────────────────────────────────────┘
```

## 📁 Estrutura de Diretórios

```
backend/
├── server.js                    # 🚀 Ponto de entrada
├── package.json                 # NPM dependencies
├── .env.example                 # Template de variáveis
├── migrate.js                   # Script de migrations
├── drop-tables.js               # Script de limpeza
│
└── src/
    ├── app.js                   # Configuração Express
    │
    ├── config/
    │   ├── database.js          # Pool MariaDB
    │   └── environment.js       # Configuração centralizada
    │
    ├── middleware/
    │   ├── index.js             # 📌 Índice centralizado
    │   ├── auth.middleware.js   # JWT authentication
    │   ├── error.middleware.js  # Error handling
    │   └── validators.js        # Express-validator schemas
    │
    ├── routes/
    │   ├── index.js             # 📌 Índice centralizado
    │   ├── auth.routes.js
    │   ├── perfis.routes.js
    │   ├── empresas.routes.js
    │   ├── utilizadores.routes.js
    │   ├── pacientes.routes.js
    │   ├── testes.routes.js
    │   ├── itens_pesquisa.routes.js
    │   ├── medicos.routes.js
    │   ├── teste_composicao.routes.js
    │   ├── pedidos_exames.routes.js
    │   └── resultados_detalhados.routes.js
    │
    ├── controllers/
    │   ├── index.js             # 📌 Índice centralizado
    │   ├── auth.controller.js
    │   ├── perfis.controller.js
    │   ├── empresas.controller.js
    │   ├── utilizadores.controller.js
    │   ├── pacientes.controller.js
    │   ├── testes.controller.js
    │   ├── itens_pesquisa.controller.js
    │   ├── medicos.controller.js
    │   ├── teste_composicao.controller.js
    │   ├── pedidos_exames.controller.js
    │   └── resultados_detalhados.controller.js
    │
    ├── services/
    │   ├── index.js             # 📌 Índice centralizado
    │   ├── auth.service.js
    │   ├── perfis.service.js
    │   ├── empresas.service.js
    │   ├── utilizadores.service.js
    │   ├── pacientes.service.js
    │   ├── testes.service.js
    │   ├── itens_pesquisa.service.js
    │   ├── medicos.service.js
    │   ├── teste_composicao.service.js
    │   ├── pedidos_exames.service.js
    │   ├── resultados_detalhados.service.js
    │   └── log.service.js
    │
    ├── repositories/
    │   ├── index.js             # 📌 Índice centralizado
    │   ├── perfis.repository.js
    │   ├── empresas.repository.js
    │   ├── utilizadores.repository.js
    │   ├── pacientes.repository.js
    │   ├── testes.repository.js
    │   ├── itens_pesquisa.repository.js
    │   ├── medicos.repository.js
    │   ├── teste_composicao.repository.js
    │   ├── pedidos_exames.repository.js
    │   └── resultados_detalhados.repository.js
    │
    ├── migrations/
    │   ├── 000_create_base_tables.js
    │   ├── 001_create_logs.js
    │   ├── 002_add_soft_delete.js
    │   └── tables.js
    │
    ├── utils/
    │   └── pagination.js        # Helpers de paginação
    │
    └── swagger.json             # Documentação OpenAPI
```

## 🔄 Fluxo de Requisição

### Exemplo: Obter lista de pacientes

```
1. CLIENT
   └─ GET /api/pacientes?page=1&limit=10
      + Header: Authorization: Bearer <JWT_TOKEN>

2. SERVER.JS
   ├─ Carrega dotenv
   ├─ Valida variáveis ambiente
   └─ Inicializa app

3. APP.JS
   ├─ Middlewares de segurança (Helmet, CORS)
   ├─ Rate limiting (100 req/15 min)
   ├─ Parsing JSON
   └─ Routing

4. ROUTES (pacientes.routes.js)
   ├─ Valida token: authMiddleware
   ├─ Valida paginação: paginationValidator
   ├─ errorHandler middleware
   └─ Chama controller

5. CONTROLLER (pacientes.controller.js)
   ├─ Extrai page & limit de req.query
   ├─ Chama service
   ├─ Formata resposta
   └─ Retorna JSON com sucesso

6. SERVICE (pacientes.service.js)
   ├─ Valida inputs
   ├─ Chama repository
   ├─ Aplica lógica de negócio
   ├─ Registra logs (auditoria)
   └─ Retorna dados processados

7. REPOSITORY (pacientes.repository.js)
   ├─ Obtém conexão do pool
   ├─ Executa query SQL
   │  SELECT * FROM pacientes 
   │  WHERE ativo = TRUE 
   │  LIMIT 10 OFFSET 0
   ├─ Libera conexão
   └─ Retorna resultados

8. DATABASE (config/database.js)
   ├─ Pool de 10 conexões
   ├─ MariaDB 10.x+
   └─ charset utf8mb4

9. RESPONSE
   ├─ Status: 200 OK
   ├─ Headers: Content-Type: application/json
   └─ Body:
      {
        "success": true,
        "message": "Pacientes listados com sucesso",
        "data": [...],
        "pagination": {
          "currentPage": 1,
          "pageSize": 10,
          "totalRecords": 150,
          "totalPages": 15,
          "hasNextPage": true,
          "hasPreviousPage": false
        }
      }
```

## 🔐 Camadas de Segurança

```
Requisição Entrada
    ↓
┌─ Helmet: Headers HTTP
│
├─ CORS: Origin validation
│
├─ Rate Limiting: Max 100 req/15 min
│
├─ Body Parsing: JSON only, max 100kb
│
├─ Auth Middleware: JWT verification
│
├─ Validation Middleware: express-validator
│
├─ Service Layer: Business logic validation
│
├─ Repository Layer: SQL Injection prevention (prepared statements)
│
└─ Error Handler: Erro normalization, no stack traces em prod
    ↓
Resposta Saída
```

## 📦 Índices Centralizados

Os índices facilitam importação e manutenção:

### Middleware Index
```javascript
// src/middleware/index.js
module.exports = {
  authMiddleware,
  errorHandler,
  validationMiddleware,
  asyncHandler
};

// Uso em rotas:
const { authMiddleware, validationMiddleware } = require('../middleware');
```

### Services Index
```javascript
// src/services/index.js
module.exports = {
  authService,
  perfisService,
  empresasService,
  // ... mais services
};

// Uso em controllers:
const { pacientesService } = require('../services');
```

### Controllers Index
```javascript
// src/controllers/index.js
module.exports = {
  authController,
  perfisController,
  // ... mais controllers
};
```

### Repositories Index
```javascript
// src/repositories/index.js
module.exports = {
  perfisRepository,
  pacientesRepository,
  // ... mais repositories
};
```

## 🛠️ Padrões de Desenvolvimento

### 1. Criando Nova Rota

```javascript
// 1. Definir rota em src/routes/novo.routes.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { novoValidator } = require('../middleware/validators');
const { validationMiddleware } = require('../middleware');
const { novoController } = require('../controllers');

const router = express.Router();

router.get('/', authMiddleware, novoController.list);
router.post('/', authMiddleware, novoValidator, validationMiddleware, novoController.create);

module.exports = router;

// 2. Registrar em routes/index.js
const novoRoutes = require('./novo.routes');
router.use('/novo', novoRoutes);

// 3. Implementar controller em src/controllers/novo.controller.js
// 4. Implementar service em src/services/novo.service.js
// 5. Implementar repository em src/repositories/novo.repository.js
```

### 2. Tratamento de Erros

```javascript
// No service:
if (!record) {
  const error = new Error('Registro não encontrado');
  error.statusCode = 404;
  throw error;
}

// No middleware error handler:
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message
  });
};
```

### 3. Validação

```javascript
// Definir validação em validators.js
const novoValidator = [
  body('campo').notEmpty().withMessage('Campo obrigatório'),
  body('email').isEmail().withMessage('Email inválido')
];

// Usar em rota
router.post('/', novoValidator, validationMiddleware, controller.create);
```

## ✅ Boas Práticas Implementadas

- ✅ Separação de responsabilidades (MVC)
- ✅ Índices centralizados para fácil importação
- ✅ Configuração centralizada de ambiente
- ✅ Middlewares bem organizados
- ✅ Error handling robusto
- ✅ Validação em múltiplas camadas
- ✅ Rate limiting e segurança
- ✅ Paginação implementada
- ✅ Soft-delete em uso
- ✅ Logging de auditoria
- ✅ Documentação Swagger
- ✅ Health check endpoint

---

**Última atualização**: Março 2026  
**Versão**: 1.0.0
