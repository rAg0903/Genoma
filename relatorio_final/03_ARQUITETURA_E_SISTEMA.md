# Capítulo 3 — Arquitectura do Sistema

**Projeto:** CRM Genoma  
**Padrão Arquitectónico:** Three-Tier Architecture / API-Based (REST)  
**Data:** Junho de 2026

---

## 3.1. Visão Geral

O CRM Genoma adopta uma arquitectura **Three-Tier** (três camadas) com comunicação **API-Based** entre o cliente web e o servidor de aplicações. Esta separação permite:

- Evolução independente do frontend e backend;
- Reutilização da API por clientes futuros (mobile, integrações);
- Centralização da lógica de negócio e regras de conformidade no servidor;
- Escalabilidade horizontal da camada de apresentação e da API.

[INSERIR DIAGRAMA DE ARQUITECTURA THREE-TIER AQUI]

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│         React 18 SPA (Vite) — Porta 5173 (dev)              │
│   Dashboard │ Contactos │ Processos │ Stocks │ Listagens    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/JSON (REST)
                           │ Authorization: Bearer <JWT>
┌──────────────────────────▼──────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO                       │
│         Node.js + Express 5 API — Porta 3000                │
│   Routes → Controllers → Services → Repositories            │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL (mysql2 pool)
┌──────────────────────────▼──────────────────────────────────┐
│                    CAMADA DE DADOS                           │
│         MariaDB/MySQL — Base de dados `genoma`              │
│         29 tabelas InnoDB, charset utf8mb4                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3.2. Camada de Apresentação (Frontend)

### 3.2.1. Stack e Organização

| Componente | Tecnologia | Ficheiro de Referência |
|---|---|---|
| Framework UI | React 18.3.1 | `frontend/package.json` |
| Build tool | Vite 6.3.5 | `frontend/vite.config.ts` |
| Routing | React Router 7.13.0 | `frontend/src/app/routes.tsx` |
| Estilos | Tailwind CSS 4 + MUI 7 | `frontend/src/styles/` |
| Componentes UI | Radix UI + shadcn patterns | `frontend/src/app/components/ui/` |
| Internacionalização | Contexto i18n (PT/EN) | `frontend/src/i18n/` |
| Cliente HTTP | `fetch` encapsulado | `frontend/src/lib/api.ts` |

### 3.2.2. Estrutura de Módulos

```
frontend/src/
├── app/
│   ├── App.tsx                 # Raiz da aplicação
│   ├── routes.tsx              # Definição de rotas protegidas
│   ├── context/
│   │   ├── AuthContext.tsx     # Sessão e permissões
│   │   ├── DataContext.tsx     # Estado partilhado
│   │   └── ThemeContext.tsx    # Tema claro/escuro
│   └── components/
│       ├── DashboardPage.tsx
│       ├── ContactsPage.tsx
│       ├── ProcessesPage.tsx
│       ├── StocksPage.tsx
│       ├── listagens/
│       └── processos/
├── lib/
│   ├── api.ts                  # Cliente HTTP genérico
│   ├── api-processos.ts        # Endpoints de processos
│   ├── api-stocks.ts           # Endpoints de stocks
│   └── permissions.ts          # RBAC frontend
└── i18n/
```

### 3.2.3. Padrões de Interface

1. **Rotas protegidas** — `RequireAuth` verifica JWT em `localStorage`; redireccionamento para `/login` se ausente.
2. **Permissões por módulo** — `ProtectedRoute` consulta `hasPermission(module, 'read')` antes de renderizar.
3. **Lazy loading** — Módulos carregados sob demanda via `React.lazy()` para optimizar performance.
4. **Proxy de desenvolvimento** — Vite reencaminha `/api` e `/health` para `http://localhost:3000`.

---

## 3.3. Camada de Aplicação (Backend)

### 3.3.1. Arquitectura em Camadas (Layered Architecture)

O backend segue o padrão **Routes → Controllers → Services → Repositories**, documentado em `backend/ARCHITECTURE.md`:

```
server.js
    └── app.js (Express)
            ├── Middlewares globais (Helmet, CORS, Rate Limit, JSON parser)
            ├── Swagger UI (/api-docs)
            └── routes/index.js
                    ├── /auth
                    ├── /processos
                    ├── /agendamentos
                    ├── /stocks
                    ├── /listagens
                    ├── /trace
                    ├── /notificacoes
                    └── ... (20+ grupos de rotas)
```

### 3.3.2. Responsabilidades por Camada

| Camada | Responsabilidade | Exemplo |
|---|---|---|
| **Routes** | Definição de endpoints HTTP, aplicação de middlewares | `processos.routes.js` |
| **Controllers** | Parsing de request/response, códigos HTTP | `processos.controller.js` |
| **Services** | Lógica de negócio, validações, auditoria | `processos.service.js` — `TRANSICOES_VALIDAS` |
| **Repositories** | Queries SQL, transacções, paginação | `processos.repository.js` |
| **Middleware** | Autenticação JWT, validação, erros | `auth.middleware.js` |

### 3.3.3. Endpoints REST Principais

| Grupo | Prefixo | Domínio |
|---|---|---|
| Autenticação | `/api/auth` | Login, recuperação de password |
| Processos | `/api/processos` | Workflow clínico-laboratorial |
| Agendamentos | `/api/agendamentos` | Calendário de colheitas |
| Stocks | `/api/stocks` | Lotes, kits, movimentos |
| Listagens | `/api/listagens` | Consultas e exportações |
| Rastreio | `/api/trace` | Cadeia lote-kit-processo |
| Administração | `/api/utilizadores`, `/api/perfis`, `/api/testes`, etc. | Configuração |

### 3.3.4. Segurança na API

```
Requisição HTTP
    → Helmet (headers seguros)
    → CORS (validação de origem)
    → Rate Limiting (100 req / 15 min)
    → Body parser (JSON, máx. 100 KB)
    → authMiddleware (JWT verify)
    → express-validator (schemas)
    → Service (regras de negócio)
    → Repository (prepared statements)
    → errorHandler (normalização de erros)
```

---

## 3.4. Camada de Dados

### 3.4.1. Motor e Configuração

| Propriedade | Valor |
|---|---|
| SGBD | MariaDB / MySQL |
| Engine | InnoDB |
| Base de dados | `genoma` |
| Charset | `utf8mb4_unicode_ci` |
| Identificadores | UUID v4 (`CHAR(36)`) |
| Pool de conexões | 10 conexões (`database.js`) |

### 3.4.2. Entidade Central

A tabela `processos` é a **entidade agregadora** do domínio operacional, relacionando:

- `pacientes` (contacto clínico)
- `medicos` (prescritor)
- `kits` (amostra física, relação 1:1)
- `testes` (tipo de exame genómico)
- `postos` (local de colheita)
- `processo_status` (estado do workflow)
- Tabelas satélite: `colheitas`, `informacao_clinica`, `resultados_geneticos`, `facturacao`, `processo_relatorios`

### 3.4.3. Migrações

O schema evolui de forma controlada através de ficheiros numerados em `backend/src/migrations/` (000–046+), executados via `npm run migrate`.

---

## 3.5. Fluxo de Dados — Cenários Críticos

### 3.5.1. Autenticação e Sessão

```
1. Utilizador submete email + password em LoginPage.tsx
2. POST /api/auth/login → auth.service.js
3. bcrypt.compare(password, password_hash) contra utilizadores
4. Geração de JWT com payload { id, perfil_id, empresa_id }
5. Frontend armazena token em localStorage
6. Pedidos subsequentes incluem Header: Authorization: Bearer <token>
7. auth.middleware.js valida JWT em cada endpoint protegido
8. Se 401 → handleSessionExpired() limpa token e redirecciona para /login
```

### 3.5.2. Agendamento de Colheita com Criação de Processo

```
1. Operador selecciona data, posto e paciente no calendário de agendamentos
2. POST /api/agendamentos → colheitas.service.js
3. Service invoca colheitas.repository.js:
   a. SELECT kit Disponivel compatível com tipo de teste
   b. BEGIN TRANSACTION
   c. INSERT em processos (status_id = 'Agendado' → 'Kit Reservado')
   d. UPDATE kits SET status = 'Reservado'
   e. INSERT em colheitas (data_prevista, posto_id, processo_id)
   f. INSERT em logs_auditoria
   g. COMMIT
4. Resposta JSON com processo e colheita criados
5. Frontend actualiza calendário e pipeline de processos
```

### 3.5.3. Transição de Estado do Processo

```
1. Técnico arrasta processo no pipeline (ProcessPipeline.tsx) ou edita no drawer
2. PUT /api/processos/:id → processos.controller.js
3. processos.service.js:
   a. Carrega processo actual (status_id)
   b. assertTransicaoValida(status_atual, status_destino)
   c. Valida campos obrigatórios por estado (ex.: kit após colheita)
   d. Actualiza datas contextuais (data_colheita, data_resultado, etc.)
   e. processos.repository.js executa UPDATE
   f. log.service.js regista acção em logs_auditoria
4. Resposta com processo actualizado
5. Frontend reflecte novo estado no Kanban e KPIs
```

### 3.5.4. Exportação de Listagem

```
1. Utilizador aplica filtros em ListingsPage.tsx e selecciona "Exportar Excel"
2. GET /api/listagens/:tipo/export?format=xlsx&...filtros
3. listagens.service.js aplica filtros e obtém dataset
4. export.service.js (ExcelJS) gera workbook em memória
5. Resposta com Content-Type application/vnd.openxmlformats...
6. Browser descarrega ficheiro .xlsx
```

### 3.5.5. Rastreabilidade de Lote

```
1. Director consulta lote problemático em StocksPage.tsx
2. GET /api/trace/lote/:id
3. trace service percorre cadeia:
   lotes → kits (lote_id) → processos (kit_id) → resultados_geneticos
4. Resposta JSON com árvore de dependências
5. Interface apresenta cadeia completa para acção de recall
```

---

## 3.6. Padrões e Boas Práticas

| Padrão | Aplicação |
|---|---|
| **Separation of Concerns** | Camadas distintas no backend |
| **Repository Pattern** | Abstracção de acesso a dados |
| **State Machine** | Workflow de processos com transições finitas |
| **Soft Delete** | Campo `ativo` em vez de DELETE físico |
| **Audit Trail** | `logs_auditoria` para acções críticas |
| **API Versioning** | Prefixo `/api` (preparado para v2) |
| **Deprecation** | Rotas legadas `/pedidos` com middleware de aviso |

---

## 3.7. Diagramas Complementares

[INSERIR DIAGRAMA DE COMPONENTES AQUI]

[INSERIR DIAGRAMA DE SEQUÊNCIA — TRANSICÃO DE ESTADO DO PROCESSO AQUI]

[INSERIR DIAGRAMA DE DEPLOYMENT AQUI]

---

## 3.8. Decisões Arquitectónicas (ADR Resumidas)

| Decisão | Alternativa Considerada | Justificação |
|---|---|---|
| API REST vs GraphQL | GraphQL | REST mais simples para CRUD e equipa reduzida |
| JWT vs Sessions | Sessions server-side | JWT stateless, adequado a SPA |
| MariaDB vs PostgreSQL | PostgreSQL | MariaDB já em uso pelo cliente |
| Monolito modular vs Microserviços | Microserviços | Monolito adequado à escala actual; menor complexidade operacional |
| React SPA vs SSR (Next.js) | Next.js | SPA suficiente; Vite oferece DX superior para PFC |

---

## Referências

- `backend/ARCHITECTURE.md`
- `backend/src/routes/index.js`
- `frontend/src/app/routes.tsx`
- `frontend/vite.config.ts`
- `BASE_DE_DADOS.md`
