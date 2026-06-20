# API Genoma - Sistema de Laboratório Genómico

## 📋 Visão Geral

API RESTful robusta para gerenciamento completo de laboratório genómico, com suporte para pacientes, testes, pedidos de exame e resultados.

## 🚀 Funcionalidades Implementadas

### ✅ Funcionalidades Principais

#### 1. **CRUD Completo para Todas as Entidades**
- **Pacientes**: Criar, ler, atualizar, deletar (soft-delete)
- **Testes**: Catálogo de testes genómicos
- **Pedidos de Exames**: Fluxo completo de requisições
- **Resultados**: Resultados detalhados por teste
- **Utilizadores**: Gerenciamento de usuários
- **Empresas**: Gerenciamento de organizações
- **Médicos**: Perfis de médicos prescritores
- **Itens de Pesquisa**: Componentes individuais dos testes
- **Composição de Testes**: Mapeamento de itens em testes

#### 2. **Soft-delete (Exclusão Lógica)**
Todas as tabelas incluem campo `ativo` (BOOLEAN) para deletar registros sem perder referências. Queries filtravam automaticamente registros inativos.

```sql
-- Exemplo: Deletar um paciente
UPDATE pacientes SET ativo = FALSE WHERE id = ?;

-- Exemplo: Listar apenas ativos
SELECT * FROM pacientes WHERE ativo = TRUE;
```

#### 3. **Paginação**
Suporte completo para listagens paginadas com metadados:

```bash
# Request
GET /api/pacientes?page=2&limit=20

# Response
{
  "success": true,
  "message": "Pacientes listados com sucesso",
  "data": [...],
  "pagination": {
    "currentPage": 2,
    "pageSize": 20,
    "totalRecords": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

#### 4. **Validação Global com Express-Validator**
Validators reutilizáveis para todas as rotas:

```javascript
// Arquivo: src/middleware/validators.js
// Exemplo de uso em rotas:
const { pacienteValidator, paginationValidator } = require('../middleware/validators');

router.post('/pacientes', pacienteValidator, validationMiddleware, controller.create);
```

Validações incluem:
- Emails válidos e únicos
- Telefones no formato português
- Datas de nascimento no passado
- NIF com 9 dígitos
- Preços não negativos
- Status enums

#### 5. **Tratamento de Erros Centralizado**
Middleware global de erro handling (`src/middleware/error.middleware.js`):

```javascript
// Respostas de erro padronizadas
{
  "success": false,
  "message": "Erro de integridade referencial",
  "error": "Mensagem detalhada (apenas em desenvolvimento)"
}
```

Trata:
- Erros de validação
- Erros de banco de dados (duplicatas, FK violations)
- Erros não capturados

#### 6. **Documentação com Swagger/OpenAPI**
Acesse em: `http://localhost:3000/api-docs`

Funcionalidades:
- Documentação interativa de todos os endpoints
- Schemas de exemplo para requisições/respostas
- Teste direto dos endpoints da UI

```bash
# Arquivo: src/swagger.json
# URL de acesso: http://localhost:3000/api-docs.json
```

#### 7. **Health Check**
Endpoint para monitoramento:

```bash
GET /health

# Response
{
  "success": true,
  "message": "API está operacional",
  "timestamp": "2026-03-04T10:30:45.123Z"
}
```

#### 8. **Segurança**
- **JWT Authentication**: Proteção de rotas sensíveis
- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: 100 requisições por 15 minutos por IP
- **CORS**: Configurado para aceitar requisições cross-origin
- **Password Hashing**: Bcrypt com 10 salt rounds

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── app.js                 # Configuração da aplicação
│   ├── config/
│   │   └── database.js        # Pool de conexões MariaDB
│   ├── controllers/           # Lógica HTTP (11 controllers)
│   ├── middleware/
│   │   ├── auth.middleware.js # Autenticação JWT
│   │   ├── error.middleware.js # Tratamento de erros
│   │   └── validators.js      # Validadores reutilizáveis
│   ├── migrations/
│   │   ├── 000_create_base_tables.js
│   │   ├── 001_create_logs.js
│   │   └── 002_add_soft_delete.js # ✨ NOVO
│   ├── repositories/          # Acesso aos dados (11 repositories)
│   ├── routes/                # Definição de rotas (11 route files)
│   ├── services/              # Lógica de negócio (11 services)
│   ├── utils/
│   │   └── pagination.js      # ✨ NOVO - Helpers de paginação
│   └── swagger.json           # ✨ NOVO - Documentação OpenAPI
├── package.json
├── migrate.js
└── server.js
```

## 🛠️ Instalação & Setup

### 1. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Por padrão, o projeto está preparado para usar:
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=root`
- `DB_PASSWORD=root`
- `DB_NAME=genoma`

### 2. Subir MariaDB (Opcional com Docker)
```bash
docker compose up -d
```

### 3. Instalar Dependências
```bash
cd backend
npm install
```

### 4. Executar Migrations
```bash
npm run migrate
```

Cria todas as tabelas incluindo o campo `ativo` para soft-delete.

### 5. Iniciar o Servidor
```bash
npm start
# ou em desenvolvimento
npm run dev
```

Servidor rodará em `http://localhost:3000`

## 📚 Exemplos de Uso

### 1. Listar Pacientes com Paginação
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/pacientes?page=1&limit=10
```

### 2. Criar Novo Paciente
```bash
curl -X POST http://localhost:3000/api/pacientes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "data_nascimento": "1990-05-15",
    "genero": "M",
    "nif": "123456789",
    "telemovel": "+351912345678",
    "email": "joao@example.com",
    "morada": "Rua Principal, 123"
  }'
```

### 3. Executar Health Check
```bash
curl http://localhost:3000/health
```

### 4. Acessar Documentação Swagger
Abra no navegador: `http://localhost:3000/api-docs`

## 🔐 Autenticação

Todos os endpoints de dados (exceto `/health` e `/`) requerem token JWT:

```bash
# 1. Fazer login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}

# 2. Usar o token nas requisições
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## ✨ Novas Funcionalidades Adicionadas

### Migration: Soft-Delete
- Adicionado campo `ativo` a 8 tabelas principais
- Queries filtram automaticamente registros inativos
- Permite recuperar registros se necessário

### Paginação em Listagens
- Parâmetros: `page` (padrão: 1) e `limit` (padrão: 10, máximo: 100)
- Respostas incluem metadados: totalPages, hasNextPage, totalRecords
- Implementado em: pacientes, testes, itens_pesquisa, e mais

### Validação com Express-Validator
- **52+ validadores** reutilizáveis
- Validação de: emails, telefones, datas, NIF, preços
- Enum validation para status
- Mensagens de erro em português

### Error Handling Centralizado
- Middleware captura erros não tratados
- Normaliza respostas de erro
- Trata erros específicos de MariaDB
- Stack traces apenas em desenvolvimento

### Documentação Swagger
- **30+ endpoints documentados**
- Schemas de exemplo para todas as entidades
- Testes diretos via UI
- Autenticação Bearer configurada

### Health Check e Monitoramento
- Endpoint `/health` para verificar disponibilidade
- Timestamp de verificação
- Útil para load balancers e alertas

## 🧪 Endpoints Implementados

### Pacientes
- `GET /api/pacientes` - Listar (com paginação)
- `GET /api/pacientes/:id` - Detalhe
- `POST /api/pacientes` - Criar
- `PUT /api/pacientes/:id` - Atualizar
- `DELETE /api/pacientes/:id` - Deletar (soft)

### Testes
- `GET /api/testes` - Listar
- `GET /api/testes/:id` - Detalhe
- `POST /api/testes` - Criar
- `PUT /api/testes/:id` - Atualizar
- `DELETE /api/testes/:id` - Deletar

### Pedidos de Exames
- `GET /api/pedidos` - Listar
- `GET /api/pedidos/:id` - Detalhe
- `GET /api/pedidos/paciente/:pacienteId` - Por paciente
- `POST /api/pedidos` - Criar
- `PUT /api/pedidos/:id` - Atualizar
- `DELETE /api/pedidos/:id` - Deletar

### Resultados
- `GET /api/resultados` - Listar
- `GET /api/resultados/:id` - Detalhe
- `GET /api/resultados/pedido/:pedidoId` - Por pedido
- `POST /api/resultados` - Criar
- `PUT /api/resultados/:id` - Atualizar
- `DELETE /api/resultados/:id` - Deletar

### E mais...
- Utilizadores, Empresas, Médicos, Itens de Pesquisa, Composição de Testes, Perfis

## 📝 Variáveis de Ambiente

Crie arquivo `.env` na raiz do `backend/`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=genoma
JWT_SECRET=your_jwt_secret_key_here
```

## 🔧 Scripts NPM

```bash
npm start          # Inicia servidor em produção
npm run dev        # Inicia com nodemon (desenvolvimento)
npm run migrate    # Executa migrations
npm run drop       # Deleta todas as tabelas (CUIDADO!)
```

## 🚧 Próximas Melhorias

- [ ] Testes automatizados (Jest + Supertest)
- [ ] Redis para cache
- [ ] Webhooks para notificações
- [ ] Relatórios em PDF
- [ ] Integração com SMS/Email
- [ ] GraphQL API alternativa
- [ ] Containerização com Docker

## 📞 Suporte

Para dúvidas ou problemas, contacte: support@genoma.lab

---

**Versão**: 1.0.0  
**Última atualização**: Março 2026  
**Status**: ✅ Produção
