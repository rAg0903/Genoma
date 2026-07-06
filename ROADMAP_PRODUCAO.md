# GENOMA CRM — Roadmap para Produção

**Última actualização:** 6 de Julho de 2026
**Objectivo:** Estado actual do projecto e plano de melhorias para go-live em produção.

---

## Resumo executivo

O GENOMA já é um **CRM operacional completo** — não é apenas uma lista de contactos. Tem máquina de estados de processos, ciclo de vida de kits com auto-descartes automáticos, listagens com exportação, auditoria, isolamento por médico e upload de anexos.

Para **produção real**, o que falta divide-se em três camadas:

1. **Funcionalidade de negócio** — notificações externas (e-mail/SMS), importação histórica, templates PDF oficiais
2. **Robustez técnica** — testes automatizados, RBAC na API, CI/CD
3. **Operação do dia-a-dia** — backups automáticos, logging estruturado, monitorização, Docker completo

> **Conclusão:** A força está no domínio de negócio bem modelado (63 migrações, workflow completo, inventário com ciclo de vida). A fraqueza principal é a "camada industrial" — testes, segurança API, deploy, notificações externas e documentos PDF oficiais.

---

## O que já está bem encaminhado

| Área | Estado |
|---|---|
| Fluxo clínico | Contacto → colheita/kit → processo → laboratório → resultado → faturação |
| Inventário | Lotes, kits, requisições, descarte manual e **auto-descarte agendado** (`kit-auto-descarte.service.js`) |
| Ciclo de vida do kit | 7 fases explícitas em `kit-lifecycle.js`; `DevolucaoDescarte` adicionado (migração 063) |
| Relatórios | Painel de Bordo, 10 listagens, exportação Excel/CSV/PDF |
| Regras de negócio | Transições de estado, motivos de anulação, rastreabilidade de kits |
| Auditoria | `logs_auditoria` usado em dezenas de serviços |
| Notificações in-app | Centro de alertas com categorias, filtros, preferências por utilizador |
| Anexos | Upload de ficheiros (PDF/Word/Excel/imagens, 15 MB) via `anexos-upload.middleware.js` (multer) |
| Dados clínicos | Origem da conceção (natural/FIV) e preferência de divulgação do sexo fetal (migração 060) |
| Histórico de processos | Campo `data_conclusao` em processos concluídos/cancelados com backfill (migração 061) |
| Design system | Tokens slate/teal, toggles consistentes (matriz de permissões, parâmetros Maternity) |
| Arquitectura | Express 5 + React/Vite + MariaDB, **63 migrações**, state machine |

### Stack técnica

| Camada | Tecnologias |
|---|---|
| Frontend | React 18, Vite 6, React Router 7, Tailwind 4, MUI 7, Radix UI |
| Backend | Node ≥18, Express 5, mysql2, JWT, bcrypt, Helmet, rate-limit, multer |
| Base de dados | MariaDB 11 (Docker compose disponível) |
| Documentação | `README.md`, `BASE_DE_DADOS.md`, `backend/ARCHITECTURE.md`, `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md`, `relatorio_final/` |

### Módulos implementados

| Módulo | Rotas / API | Ficheiros principais |
|---|---|---|
| Dashboard | `/` | `DashboardPage.tsx`, `MedicoDashboard.tsx` |
| Contactos | `/contactos` | `ContactFormPage.tsx`, `ContactDetail.tsx` |
| Processos | `/processos` | `ProcessesPage.tsx`, Kanban, `ProcessDrawer.tsx` |
| Inventário | `/stocks` | `StocksPage.tsx`, Lotes, Kits, Requisições, Descartes |
| Listagens | `/listagens` | `ListingsPage.tsx`, Painel de Bordo, exportações |
| Administração | `/definicoes` | Utilizadores, perfis, empresas, testes, postos, labs |
| Anexos | `/api/anexos` | `anexos.controller.js`, `anexos-upload.middleware.js` |
| Auth | `/login` | JWT, forgot/reset password |

---

## Novidades desde a última actualização (27 Jun → 6 Jul 2026)

| Área | O que foi feito | Ficheiros / migrações |
|---|---|---|
| Auto-descartes | Serviço agendado (`setInterval` diário, startup delay 30 s) activo em `server.js` | `kit-auto-descarte.service.js`, `server.js:67` |
| Backfill descartes | Migração que processa kits pendentes em bases de dados já existentes | `062_backfill_auto_descartes.js` |
| Devolução de descarte | Novo motivo `DevolucaoDescarte` para correcção de descartes indevidos | `063_devolucao_descarte.js` |
| Origem da conceção | Campos `origem_conceicao` (ENUM natural/FIV próprios/FIV doação) e `quer_saber_sexo` em `pacientes` e `informacao_clinica` | `060_paciente_origem_conceicao.js`, `ContactFormPage.tsx` |
| Data de conclusão | Campo `data_conclusao` em processos terminais (faturado/cancelado) com backfill | `061_processo_data_conclusao.js` |
| Upload de anexos | Middleware multer com validação de MIME (PDF/Word/Excel/imagens/email), 15 MB, UUID no disco | `anexos-upload.middleware.js` |
| Repositórios/services | Actualizações em colheitas, informação clínica, pacientes, postos, processos, stocks, listagens, medico-access | Múltiplos ficheiros |

---

## Prioridade 1 — Crítico (antes de produção)

### 1.1 Segurança: RBAC no backend ✅ Concluído

**Problema:** As permissões por módulo (`frontend/src/lib/permissions.ts`) vivem sobretudo no browser. Na API, a maioria das rotas exige apenas **login** — `requireAdmin` aparece sobretudo em perfis; stocks tem sub-módulos; processos/contactos/admin **não têm RBAC equivalente no backend**.

**Risco:** Qualquer utilizador autenticado com token pode chamar APIs de admin via Postman ou script.

**Implementado em 6 Jul 2026:**

- [x] `requireAdmin` aplicado a todas as operações de escrita sensíveis
- [x] `utilizadores` — todas as rotas requerem `requireAdmin` (listar, criar, editar, eliminar)
- [x] `medicos` — POST / PUT / DELETE requerem `requireAdmin`
- [x] `testes` — POST / PUT / DELETE requerem `requireAdmin`
- [x] `empresas` — POST / PUT / DELETE requerem `requireAdmin`
- [x] `postos` — POST / PUT / DELETE requerem `requireAdmin`
- [x] `processos` — DELETE requer `requireAdmin`
- [x] `pacientes` — DELETE requer `requireAdmin`
- [x] `auth/register` — exige autenticação + `requireAdmin`

**Ficheiros alterados:** `backend/src/routes/utilizadores.routes.js`, `backend/src/routes/medicos.routes.js`, `backend/src/routes/testes.routes.js`, `backend/src/routes/empresas.routes.js`, `backend/src/routes/postos.routes.js`, `backend/src/routes/processos.routes.js`, `backend/src/routes/pacientes.routes.js`, `backend/src/routes/auth.routes.js`

---

### 1.2 Testes automatizados ✅ Concluído (base)

**Problema:** O backend declarava Jest em `package.json` mas não havia ficheiros de teste.

**Implementado em 6 Jul 2026:**

- [x] Jest + Supertest instalados (`npm install --save-dev jest supertest`)
- [x] `jest.config.js` criado
- [x] 25 testes unitários, todos a verde:
  - `middleware.auth.test.js` — JWT ausente/inválido/utilizador inactivo/activo
  - `middleware.authorization.test.js` — `requireAdmin` com perfis admin/não-admin/ausente
  - `middleware.validators.test.js` — validadores de paciente, utilizador, empresa
  - `routes.auth.test.js` — login, register bloqueado sem auth
  - `kit-auto-descarte.test.js` — sem kits pendentes, com kit expirado agrupado

**Pendente (próxima iteração):**

- [ ] Testes de integração: `processos.service.js` (transições válidas/inválidas) — TC-02, TC-03
- [ ] Testes: `kit-lifecycle.service.js`, descarte, devolução — TC-04
- [ ] Testes: médico só vê os seus processos — TC-05
- [ ] 1–2 testes E2E (Playwright): login → criar contacto → ver processo — TC-01

| ID | Fluxo | Estado |
|---|---|---|
| TC-01 | Criar contacto com colheita → associar kit → processo com dados intactos | Pendente |
| TC-02 | Avançar processo só para estados válidos | Pendente |
| TC-03 | Cancelar processo exige motivo de anulação | Pendente |
| TC-04 | Descarte de kit actualiza stock e fase_ciclo | Pendente |
| TC-05 | Médico só vê os seus processos/contactos | Pendente |
| TC-06 | Auto-descarte marca expirados e cria movimentos correctos | **Implementado** (`kit-auto-descarte.test.js`) |
| TC-07 | Upload de anexo inválido (MIME não suportado) retorna 400 | Pendente |

---

### 1.3 CI/CD básico ✅ Concluído

**Problema:** Não existia pipeline (`.github/workflows/` vazio).

**Implementado em 6 Jul 2026:**

- [x] `.github/workflows/ci.yml` criado com dois jobs:
  - **backend**: instala dependências, corre migrações em MariaDB de teste, executa `npm test`
  - **frontend**: typecheck com `tsc --noEmit` + build de produção
- [x] Dispara em push e pull request para `main` e `develop`
- [ ] (Opcional) Deploy automático para staging

---

### 1.4 Registo aberto ✅ Concluído

**Problema:** `POST /api/auth/register` estava exposto sem gate de administrador.

**Implementado em 6 Jul 2026:**

- [x] Rota `POST /api/auth/register` passa agora por `authMiddleware + requireAdmin`
- [x] Admin cria utilizadores via `POST /api/utilizadores` (rota principal) ou via `auth/register` (agora também protegida)

**Ficheiro:** `backend/src/routes/auth.routes.js`

---

### 1.5 Validação de input na API ✅ Concluído

**Problema:** Existia `backend/src/middleware/validators.js` mas não estava ligado às rotas principais.

**Implementado em 6 Jul 2026:**

- [x] `pacienteValidator` / `pacienteUpdateValidator` ligados a `pacientes.routes.js`
- [x] `utilizadorValidator` / `utilizadorUpdateValidator` ligados a `utilizadores.routes.js`
- [x] `empresaValidator` / `empresaUpdateValidator` ligados a `empresas.routes.js`
- [x] `testeValidator` / `testeUpdateValidator` ligados a `testes.routes.js`
- [x] `idValidator` + `validationMiddleware` adicionados a todas as rotas com parâmetro `/:id`
- [x] `validationMiddleware` corrigido para usar `err.path` (express-validator v7)
- [x] `pacienteValidator` corrigido: `data_nascimento` passa a opcional (alinhado com migração 051)

---

### 1.6 Armazenamento de anexos em produção

**Estado actual:** `anexos-upload.middleware.js` guarda ficheiros em `backend/uploads/anexos/` (disco local do servidor).

**Problema:** Em deploy, o disco local não escala e não persiste entre restarts de container.

**Acção:**

- [ ] Migrar para armazenamento externo: S3/Backblaze B2/Cloudflare R2 (ou volume persistente Docker)
- [ ] Variáveis de ambiente: `STORAGE_PROVIDER`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
- [ ] Adaptar `anexos.service.js` para gerar URLs pré-assinadas (download seguro)
- [ ] Limitar acesso a ficheiros ao utilizador com permissão (não servir directamente da pasta `uploads/`)
- [ ] Definir política de retenção para dados genéticos (RGPD — Art. 5.º, n.º 1, al. e))

---

## Prioridade 2 — Funcionalidade para go-live

### 2.1 Notificações — canal externo (e-mail / SMS) ✅ Concluído

| Camada | Estado |
|---|---|
| **In-app** | Centro de alertas, categorias, sino, página dedicada, preferências ✅ |
| **E-mail SMTP** | nodemailer instalado, templates HTML, 5 eventos cobertos ✅ |
| **SMS webhook** | Infra implementada; requer `SMS_WEBHOOK_URL` env var ✅ |
| **Push browser** | Opcional — pendente |

**Implementado em 6 Jul 2026:**

- [x] `nodemailer` instalado
- [x] Templates HTML responsivos com branding Genoma para: agendamento criado, resultado disponível, relatório enviado, fatura emitida, stock baixo
- [x] Listeners para todos os eventos: `AGENDAMENTO_CRIADO`, `COLHEITA_REGISTADA`, `RESULTADO_DISPONIVEL`, `RELATORIO_ENVIADO`, `FATURA_EMITIDA`, `STOCK_BAIXO`
- [x] Modo de contingência (log) quando SMTP não configurado

**Variáveis de ambiente necessárias (produção):**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<SendGrid API key>
SMTP_FROM=genoma@genomalab.pt
NOTIFY_POSTOS_EMAIL=postos@genomalab.pt
NOTIFY_STOCK_EMAIL=stock@genomalab.pt
NOTIFY_FATURACAO_EMAIL=faturacao@genomalab.pt
SMS_WEBHOOK_URL=https://...  # opcional
```

---

### 2.2 Colheitas e agendamentos (UI operacional) ✅ Concluído

**Implementado / consolidado em 6 Jul 2026:**

- [x] API `/api/agendamentos` — calendário mensal, listagem por dia/posto, criação e reserva de kit (backend)
- [x] **`ColheitasDoDiaPage`** — rota `/colheitas-hoje`: calendário + lista do dia + filtro por posto (layout alinhado com a antiga vista de agendamentos)
- [x] Entrada na sidebar «Colheitas hoje»; **`/agendamentos` redirecciona** para `/colheitas-hoje` (página Agendamentos removida do menu)
- [x] Acção «Registar colheita» → ficha do contacto, separador **Colheita** (`/contactos/:id/editar?tab=colheita`) para data efectiva e kit — não regista via API directamente na lista
- [x] Botão outline teal (padrão «+ Novo contacto»); acção de cancelamento removida desta vista
- [x] Listagem de agendamentos inclui `paciente_id` (contactos pré-processo e processos)
- [x] Cores de carga verde/amarelo/vermelho no calendário
- [x] Formulário de novo agendamento com modal (`AgendamentoForm.tsx`) — a partir da ficha do contacto

**Nota:** `AgendamentosPage.tsx` mantém-se no repositório como referência; a UI activa é só `/colheitas-hoje`.

---

### 2.3 Importação de dados históricos ✅ Concluído (base)

**Implementado em 6 Jul 2026:**

- [x] `backend/src/utils/import-historico.js` — script CLI para importação de .xlsx e .csv
- [x] `npm run import:historico -- --file <ficheiro.xlsx> [--dry-run]`
- [x] Suporte a folhas: `pacientes`/`contactos`, `processos`
- [x] Modo dry-run: simula importação sem persistir
- [x] Deduplicação por NIF (pacientes) e número de processo
- [x] Relatório de erros por linha
- [x] Mapeamento de estados antigos → estados Genoma

**Pendente:**
- [ ] Import de kits em stock e lotes
- [ ] Import de médicos e empresas do sistema legado
- [ ] Validação de integridade pós-import (relatório detalhado)

---

### 2.4 Templates PDF (relatório clínico e fatura) ✅ Concluído (base)

**Implementado em 6 Jul 2026:**

- [x] `pdfkit` instalado
- [x] `backend/src/services/pdf.service.js` — geração de fatura PDF com pdfkit (A4, tabela, totais, emitente/receptor)
- [x] Rota `GET /api/processos/:id/fatura/pdf` — download directo da fatura como PDF
- [x] Relatório clínico HTML (`buildRelatorioClinicoMaternityHtml`) já existia e é servido por `GET /api/processos/:id/relatorio/html`; a pré-visualização "Abrir PDF" abre no browser para impressão

**Pendente:**
- [ ] Conversão server-side do relatório clínico HTML → PDF (puppeteer — requer ~170MB Chromium; adequado para produção num servidor dedicado)
- [ ] Armazenamento do PDF gerado em storage externo (ver 1.6)

---

### 2.5 Painel de Bordo e alertas SLA ✅ Concluído

**Implementado em 6 Jul 2026:**

- [x] Endpoint `GET /api/dashboards/sla` com dados detalhados:
  - Processos em "Em Análise" com SLA ultrapassado (>15 dias por defeito, configurável via `tempo_resposta_dias` do teste)
  - Colheitas agendadas nos próximos 7 dias, agrupadas por posto e dia
  - Processos "Validado" há mais de 7 dias sem fatura emitida
- [x] Alertas críticos/aviso calculados server-side
- [x] `dashboardsRepository`: 3 novas queries — `processosEmAnaliseAtrasados`, `colheitasPorPosto`, `processosValidadosSemFatura`
- [x] `dashboardsService.getSLA()` agrega os dados com alertas
- [x] `dashboardsController.sla()` expõe o endpoint
- [x] Os alertas existentes no painel operacional já cobrem: stock baixo, processos parados, requisições pendentes, faturas em falta

---

### 2.6 Rastreabilidade completa (UI) ✅ Já estava implementado

- [x] `TraceView.tsx` — componente bidireccional lote ↔ kit ↔ processo ↔ resultado
- [x] Separador "Rastreio" no `ProcessDrawer` com `renderTrace={(p) => <TraceView tipo="processo" id={p.id} />}`
- [x] Backend: `GET /api/trace?tipo=&id=` (route `trace.routes.js`)

---

## Prioridade 3 — Robustez e operação ✅ Concluído (base)

**Implementado em 6 Jul 2026:**

| Área | Estado anterior | Implementado |
|---|---|---|
| **Migrações** | 63 ficheiros; sem tracking; exit 0 em falha | Tabela `schema_migrations`; só pendentes; baseline automático; exit 1 em falha |
| **Backups** | Export manual | `npm run backup:database` com retenção 30 dias + cron documentado |
| **Logging** | `console.log` apenas | Pino estruturado + `pino-http`; ficheiro em `LOG_DIR` em produção |
| **Monitorização** | Só `GET /health` | `/health` com ping BD; `/health/live`; Sentry opcional (`SENTRY_DSN`) |
| **Docker** | Só MariaDB | `docker-compose.yml` raiz (MariaDB + backend + nginx frontend) |
| **Swagger** | ~9 endpoints documentados | UI desactivada em produção; aviso na spec OpenAPI |
| **TypeScript FE** | Sem typecheck no CI | `tsc --noEmit` no CI (P1.3) |
| **JWT** | `JWT_EXPIRE=7d` no `.env`, código `8h` | `auth.service.js` usa `environment.JWT.expiration` (defeito `8h`) |
| **Secrets** | Credenciais exemplo | `.env.example` actualizado; aviso se `JWT_SECRET` por defeito em prod |
| **Rate limit** | Desactivado em dev | Documentado; activo quando `NODE_ENV=production` |
| **Legacy API** | `/api/pedidos`, `/api/resultados` deprecated | Rotas removidas de `routes/index.js` (frontend não usava) |
| **Uploads** | Disco local | Pendente — ver 1.6 (armazenamento externo) |
| **Auto-descarte** | Env var pouco documentada | `KIT_AUTO_DESCARTE_ENABLED` documentado; aviso no arranque se desactivado |

### Migrações — runner melhorado ✅

- [x] Tabela `schema_migrations (filename, executed_at)`
- [x] Executar só migrações novas
- [x] Baseline automático para bases já provisionadas
- [x] Exit code ≠ 0 em falha (CI/deploy)
- [x] Testes em `migrate.test.js`

**Ficheiro:** `backend/migrate.js`

### Backups ✅

- [x] `npm run backup:database` — `backend/src/utils/backup-database.js`
- [x] Preferência `mysqldump`; fallback export Node
- [x] Retenção configurável (`BACKUP_RETENTION_DAYS`, defeito 30)
- [x] Procedimento cron documentado em `docs/OPERATIONS.md`

### Logging ✅

- [x] Pino + pino-http em `backend/src/config/logger.js`
- [x] Request logging em todos os ambientes
- [x] Erros via `error.middleware.js` + Sentry opcional
- [x] Variáveis `LOG_LEVEL`, `LOG_DIR` activas

### Monitorização ✅

- [x] `GET /health` — ping à BD (`503` se down)
- [x] `GET /health/live` — liveness
- [x] Sentry opcional — `backend/src/config/sentry.js`
- [ ] Uptime check externo (configurar no hosting — ver `docs/OPERATIONS.md`)

### Docker ✅

- [x] `backend/Dockerfile` — migrate + server no arranque
- [x] `frontend/Dockerfile` + `nginx.conf` — proxy `/api` e `/health`
- [x] `docker-compose.yml` na raiz do projecto
- [x] `.env.docker.example` com variáveis necessárias

### Swagger ✅

- [x] `SWAGGER_ENABLED=false` por defeito em produção
- [x] Descrição na spec a indicar cobertura parcial (~9/~28 módulos)

### JWT ✅

- [x] Token usa `JWT_EXPIRE` do ambiente (defeito alinhado: `8h`)
- [ ] Refresh token — pendente (re-login após expiração)

### Legacy API ✅

- [x] Rotas `/api/pedidos` e `/api/resultados` removidas do router
- [ ] Remover ficheiros órfãos (`pedidos_exames.*`, `resultados_detalhados.*`) — opcional

### Pendente (fora do âmbito P3 base)

- [ ] Armazenamento externo de anexos (ver 1.6)
- [ ] Refresh token JWT
- [ ] Completar spec OpenAPI ou gerar automaticamente
- [ ] Deploy automático para staging

### Backups — procedimento sugerido

```bash
# Manual (já existe)
cd backend && npm run export:database

# Backup com retenção (novo)
cd backend && npm run backup:database

# Produção (cron diário)
0 2 * * * cd /opt/genoma/backend && BACKUP_DIR=/backups npm run backup:database
```

Ver runbook completo: `docs/OPERATIONS.md`

---

## Prioridade 4 — UX (quick wins) ✅ Concluído (base)

**Implementado em 6 Jul 2026:**

| Melhoria | Estado |
|---|---|
| **Fila de trabalho por perfil** | `WorkQueuePanel` no dashboard médico (processos filtrados por médico) e admin (stock + validações + atrasos) |
| **Mobile/tablet nos postos** | Rota `/colheitas-hoje` — calendário + lista; registo na ficha do contacto |
| **Pesquisa global (Ctrl+K)** | `GlobalSearchProvider` em `ProtectedLayout`; deep-link processos, kits/lotes com `?q=` |
| **Confirmações** | `ConfirmActionProvider` para avanços de estado e bulk (transições críticas de processo) |
| **Banner dados incompletos** | `ProcessDataQualityBanner` em drawer, detalhe e regras em `process-data-quality.ts` |
| **i18n** | Chaves `ux.*` PT/EN; inglês desactivado no selector até traduções completas |
| **Design system** | `AccessDeniedState`, `ProcessViewPage`, `RouteLoading` migrados para slate/teal |
| **Loading states** | `PageLoadingSkeleton` / `TableSkeleton` no fallback de rotas lazy |
| **Mensagens de erro** | Helper `lib/toast.ts` (`notifySuccess` / `notifyError`) nos fluxos principais |

### Fila de trabalho ✅

- [x] `WorkQueuePanel.tsx` — componente reutilizável
- [x] Dashboard médico — fila scoped por `processoMatchesMedico()`
- [x] Dashboard admin — stock baixo, resultados por validar, processos em atraso

### Pesquisa global ✅

- [x] Navegação processos → vista read-only (`/processos/:id`)
- [x] Kits/lotes → listagens com query `q`
- [x] `ProcessesPage` — filtro local inclui NIF do contacto

### Confirmações ✅

- [x] `ConfirmActionContext.tsx` — modal genérico
- [x] Transições críticas: Em Análise, Resultado, Validado, Faturado (+ bulk)

### Colheitas do dia (tablet / postos) ✅

- [x] `ColheitasDoDiaPage.tsx` — `/colheitas-hoje`
- [x] Entrada na sidebar + breadcrumbs
- [x] Calendário mensal (`AgendaCalendar`) + painel de lista do dia + resumo
- [x] «Registar colheita» → contacto, tab Colheita (`paciente_id` na API)
- [x] Botão outline teal (`ADD_ACTION_BUTTON_CLASS`); sem cancelamento na lista
- [x] `/agendamentos` → redirect; item «Agendamentos» removido da sidebar

### Banner dados incompletos ✅

- [x] Posto em falta, data colheita em falta, Em Análise sem envio lab
- [x] Integrado em `ProcessDrawer`, `ProcessDetail`

### Pendente (polish contínuo)

- [ ] Kanban pipeline mobile (coluna única)
- [ ] Confirmação em descarte/requisição de stock (`StockForms.tsx`)
- [ ] Sweep completo de toasts hardcoded PT (~25 ficheiros)
- [ ] Sweep `gray-*` em `ContactsPage`, `LocalFormPage`, `ProcessFormPage`
- [ ] Completar traduções EN e reactivar no Topbar

### Protecção de dados imutáveis (lição aprendida)

Bug corrigido em jun/2026: dados de colheita apagados ao guardar processo.

**Regras a manter:**

- Campos de colheita (posto, datas) são **snapshot** na criação do processo
- Frontend não envia estes campos em updates
- Backend rejeita limpar valores existentes
- API enriquece processos com tabela `colheitas` quando campos em `processos` estão vazios

---

## Roadmap sugerido (calendário)

As datas abaixo referem-se ao período pós-entrega académica (21 Jul 2026).

| Fase | Actividades | Período estimado |
|---|---|---|
| **Crítico** | RBAC backend + fechar registo público | Jul 2026 (2 semanas) |
| **Crítico** | Testes de integração dos fluxos core | Jul 2026 (3 semanas) |
| **Crítico** | CI/CD + Docker completo + armazenamento externo de anexos | Ago 2026 (2 semanas) |
| **Go-live** | Importação de dados históricos | Ago 2026 (3 semanas) |
| **Go-live** | E-mail transaccional (nodemailer/SendGrid) | Ago 2026 (2 semanas) |
| **Go-live** | Templates PDF relatório clínico e fatura | Set 2026 (4 semanas) |
| ~~**Pós go-live**~~ | ~~Módulo Agendamentos dedicado~~ | ✅ Jul/2026 — consolidado em `/colheitas-hoje` |
| ~~**Pós go-live**~~ | ~~Alertas SLA + fila de trabalho por perfil~~ | ✅ Jul/2026 — base em P2.5 e P4 |
| **Pós go-live** | Backup automático + logging + monitorização | Out 2026 (2 semanas) |

---

## Top 5 acções antes de produção

Se só puderem fazer cinco coisas, nesta ordem:

1. **RBAC no backend** — espelhar permissões da UI na API; fechar registo público
2. **Testes dos fluxos core** — contacto → processo → stock → descarte → anexos
3. **CI/CD + Docker compose completo + armazenamento externo de anexos** — deploy reproduzível e seguro
4. **E-mail transaccional** — notificações de colheita, resultado e fatura
5. **Import histórico + templates PDF** — go-live sem sistema vazio e com documentos oficiais

---

## Checklist de go-live

### Segurança

- [ ] RBAC activo em todas as rotas sensíveis
- [ ] Registo público desactivado
- [ ] `JWT_SECRET` forte e único por ambiente
- [ ] `NODE_ENV=production` configurado
- [ ] CORS restrito aos domínios reais
- [ ] Rate limiting activo (verificar que `NODE_ENV=production`)
- [ ] HTTPS em frontend e API
- [ ] Credenciais de teste removidas/alteradas
- [ ] Pasta `uploads/` protegida (não acessível publicamente) ou migrada para armazenamento externo

### Qualidade

- [ ] Testes de integração a passar no CI
- [ ] Build frontend sem erros TypeScript
- [x] Migrações com tracking de versão (`schema_migrations`)
- [ ] Smoke test manual dos fluxos TC-01 a TC-07

### Operação

- [ ] Backup automático configurado e testado (restore validado) — script `backup:database` pronto; configurar cron em produção
- [x] Logging estruturado (Pino)
- [ ] Monitorização de uptime e erros (Sentry ou equivalente) — Sentry opcional via `SENTRY_DSN`; configurar uptime externo
- [x] `KIT_AUTO_DESCARTE_ENABLED` activo e variável `KIT_AUTO_DESCARTE_STARTUP_MS` configurada
- [x] Runbook: como fazer deploy, rollback, restore de BD — `docs/OPERATIONS.md`

### Negócio

- [ ] Importação de dados históricos concluída (a partir da base entregue pelo estagiário)
- [ ] Templates PDF validados pela Genoma
- [ ] E-mail SMTP configurado e testado
- [ ] Formação de utilizadores (contactos, processos, stocks, listagens)
- [ ] Validação final do fluxo completo em ambiente real com a equipa Genoma

---

## Referências no repositório

| Documento | Conteúdo |
|---|---|
| `README.md` | Visão geral e quick start |
| `ROADMAP_PRODUCAO.md` | Este documento — plano de go-live |
| `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md` | Estado funcional e perguntas ao cliente |
| `BASE_DE_DADOS.md` | Dicionário de dados |
| `backend/ARCHITECTURE.md` | Camadas backend |
| `backend/FILES_CHECKLIST.md` | Checklist de ficheiros |
| `docs/OPERATIONS.md` | Deploy Docker, backups, logs, health checks, rollback |
| `relatorio_final/LEI_Relatorio_a22212343_a22301601.md` | Relatório final unificado |

---

## Histórico de correcções e evoluções

| Data | Área | Detalhe |
|---|---|---|
| Jul/2026 | Auto-descartes | Serviço `kit-auto-descarte.service.js` activado em `server.js`; agendado diariamente com startup delay |
| Jul/2026 | Devolução de descarte | Novo motivo `DevolucaoDescarte` em `movimentos_kits` (migração 063) |
| Jul/2026 | Dados clínicos | Campos `origem_conceicao` e `quer_saber_sexo` em `pacientes` e `informacao_clinica` (migração 060) |
| Jul/2026 | Histórico processos | Campo `data_conclusao` com backfill em processos terminais (migração 061) |
| Jul/2026 | Backfill descartes | Migração 062 processa kits pendentes em BDs já existentes |
| Jul/2026 | Colheitas hoje | Consolidação UI: `/colheitas-hoje` substitui menu Agendamentos; registo via contacto tab Colheita; `paciente_id` na API |
| Jul/2026 | GlobalSearch | `GlobalSearchProvider` movido para `ProtectedLayout` (corrige Topbar) |
| Jul/2026 | P4 UX | Fila de trabalho, confirmações, banner dados, colheitas-hoje, skeletons, toasts |
| Jun/2026 | Notificações | Categorias, filtros, prefs; alertas faturação; mensagens com Dr./Dra. |
| Jun/2026 | UX / Design | Checkboxes teal; parâmetros Maternity alinhados; breadcrumbs com nº processo |
| Jun/2026 | Dashboard | «Últimos processos» navega para detalhe read-only (`/processos/:id`) |
| Jun/2026 | Empresas | Formulário dedicado; migração 059 (cidade, distrito, notas) |
| Jun/2026 | Processos | `data_envio_laboratorio` separada de recepção no lab (migração 057) |
| Jun/2026 | Colheita | Snapshot não apagável ao guardar processo (migração 058) |
| Jun/2026 | Inventário | Alertas e inventário por local compactos; agrupamento por laboratório |

---

*Documento actualizado a partir de análise do código em `genoma_app-main`. Actualizar conforme o projecto evolui.*
