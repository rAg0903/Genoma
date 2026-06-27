# Capítulo 6 — Stack Tecnológico e Planeamento

**Projeto:** CRM Genoma  
**Data:** Junho de 2026

---

## 6.1. Stack Tecnológico

### 6.1.1. Visão Geral

| Camada | Tecnologia | Versão | Ficheiro de Referência |
|---|---|---|---|
| **Runtime Backend** | Node.js | ≥ 18.0.0 | `backend/package.json` → `engines` |
| **Framework API** | Express.js | 5.2.1 | `backend/package.json` |
| **Runtime Frontend** | React | 18.3.1 | `frontend/package.json` |
| **Build Frontend** | Vite | 6.3.5 | `frontend/package.json` |
| **Base de Dados** | MariaDB / MySQL | 10.x / 8.x | `BASE_DE_DADOS.md` |
| **Driver SQL** | mysql2 | 3.18.2 | `backend/package.json` |
| **Linguagem Frontend** | TypeScript | [via Vite/React] | `frontend/tsconfig` |
| **Linguagem Backend** | JavaScript (CommonJS) | ES2022+ | `backend/package.json` → `"type": "commonjs"` |

---

### 6.1.2. Backend — Dependências de Produção

| Pacote | Versão | Função no Sistema |
|---|---|---|
| `express` | ^5.2.1 | Servidor HTTP e routing REST |
| `mysql2` | ^3.18.2 | Pool de conexões à base de dados |
| `bcrypt` | ^6.0.0 | Hash de passwords (segurança) |
| `jsonwebtoken` | ^9.0.3 | Autenticação JWT stateless |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `helmet` | ^8.1.0 | Headers de segurança HTTP |
| `express-rate-limit` | ^8.2.1 | Protecção contra abuse (100 req/15 min) |
| `express-validator` | ^7.3.1 | Validação de payloads de entrada |
| `dotenv` | ^17.3.1 | Gestão de variáveis de ambiente |
| `exceljs` | ^4.4.0 | Geração de exportações Excel |
| `swagger-ui-express` | ^5.0.1 | Documentação interactiva da API |
| `uuid` | ^9.0.1 | Geração de identificadores UUID v4 |

### 6.1.3. Backend — Dependências de Desenvolvimento

| Pacote | Versão | Função |
|---|---|---|
| `nodemon` | ^3.1.14 | Hot reload em desenvolvimento |
| `jest` | [configurado] | Framework de testes unitários |
| `eslint` | [configurado] | Análise estática de código |
| `prettier` | [configurado] | Formatação de código |

### 6.1.4. Frontend — Dependências de Produção

#### Core

| Pacote | Versão | Função |
|---|---|---|
| `react` | 18.3.1 | Biblioteca UI |
| `react-dom` | 18.3.1 | Renderização DOM |
| `react-router` | 7.13.0 | Routing SPA |
| `react-hook-form` | 7.55.0 | Gestão de formulários |

#### UI e Estilos

| Pacote | Versão | Função |
|---|---|---|
| `@mui/material` | 7.3.5 | Componentes Material Design |
| `@mui/icons-material` | 7.3.5 | Iconografia |
| `@emotion/react` | 11.14.0 | CSS-in-JS (peer de MUI) |
| `@emotion/styled` | 11.14.1 | Styled components |
| `tailwindcss` | 4.1.12 | Utility-first CSS |
| `tailwind-merge` | 3.2.0 | Merge de classes Tailwind |
| `class-variance-authority` | 0.7.1 | Variantes de componentes |
| `clsx` | 2.1.1 | Composição de classes CSS |
| `lucide-react` | 0.487.0 | Icones SVG |
| `motion` | 12.23.24 | Animações |
| `next-themes` | 0.4.6 | Tema claro/escuro |

#### Componentes Radix UI (acessibilidade)

| Pacote | Versão |
|---|---|
| `@radix-ui/react-dialog` | 1.1.6 |
| `@radix-ui/react-dropdown-menu` | 2.1.6 |
| `@radix-ui/react-select` | 2.1.6 |
| `@radix-ui/react-tabs` | 1.1.3 |
| `@radix-ui/react-tooltip` | 1.1.8 |
| `@radix-ui/react-accordion` | 1.2.3 |
| ... | (20+ pacotes Radix) |

#### Funcionalidades Específicas

| Pacote | Versão | Função no CRM |
|---|---|---|
| `react-dnd` | 16.0.1 | Drag-and-drop no pipeline Kanban |
| `react-dnd-html5-backend` | 16.0.1 | Backend HTML5 para DnD |
| `react-day-picker` | 8.10.1 | Calendário de agendamentos |
| `date-fns` | 3.6.0 | Manipulação de datas |
| `recharts` | 2.15.2 | Gráficos no dashboard |
| `cmdk` | 1.1.1 | Pesquisa global (Ctrl+K) |
| `sonner` | 2.0.3 | Notificações toast |
| `vaul` | 1.1.2 | Drawers/painéis laterais |
| `canvas-confetti` | 1.9.4 | Feedback visual |

### 6.1.5. Frontend — Dependências de Desenvolvimento

| Pacote | Versão | Função |
|---|---|---|
| `vite` | 6.3.5 | Build tool e dev server |
| `@vitejs/plugin-react` | 4.7.0 | Plugin React para Vite |
| `@tailwindcss/vite` | 4.1.12 | Integração Tailwind + Vite |

### 6.1.6. Ferramentas de Projeto (Raiz)

| Pacote / Script | Função |
|---|---|
| `npm run backend:dev` | Inicia API em modo desenvolvimento |
| `npm run frontend:dev` | Inicia SPA em `localhost:5173` |
| `npm run migrate` | Executa migrações de BD |
| `npm run frontend:build` | Build de produção do frontend |

### 6.1.7. Scripts de Seed e Reset (CRM)

| Script | Função |
|---|---|
| `backend/src/utils/seed-admin.js` | Cria utilizador admin e dados base de demonstração |
| `backend/src/seeds/seed-admin-data.js` | Dados administrativos (empresa, médicos, utilizadores) |
| `backend/src/utils/seed-inventory.js` | Wrapper para seed de inventário |
| `backend/src/seeds/seed-inventory-data.js` | Lotes, kits e stocks via envios simulados |
| `backend/src/utils/reset-crm.js` | Reset parcial de dados CRM para re-demonstração |
| `backend/src/utils/wipe-crm-data.js` | Limpeza completa de dados operacionais |

**Credenciais de teste (após seed):** admin `admin.teste@genoma.local` / `Teste1234!`; médicos ex. `anaclaraferreira@genoma.pt` / `Teste1234!`

---

## 6.2. Infraestrutura e Ambientes

| Ambiente | URL / Host | Base de Dados | Notas |
|---|---|---|---|
| Desenvolvimento | `localhost:5173` (FE) + `localhost:3000` (BE) | MariaDB local `genoma` | Proxy Vite para `/api` |
| Staging | [INSERIR URL] | [INSERIR] | Validação com cliente |
| Produção | [INSERIR URL] | [INSERIR] | HTTPS obrigatório (RNF-010) |

### Variáveis de Ambiente (Backend)

| Variável | Descrição |
|---|---|
| `DB_HOST` | Host da base de dados |
| `DB_PORT` | Porta (default 3306) |
| `DB_USER` | Utilizador SQL |
| `DB_PASSWORD` | Password SQL |
| `DB_NAME` | Nome da BD (`genoma`) |
| `JWT_SECRET` | Chave de assinatura JWT |
| `PORT` | Porta do servidor (default 3000) |

[Ficheiro de referência: `backend/.env.example`]

---

## 6.3. Planeamento do Projecto

### 6.3.1. Fases do Projecto

| Fase | Descrição | Estado |
|---|---|---|
| **Fase 1** | Levantamento de requisitos e viabilidade | Concluída |
| **Fase 2** | Modelação de dados e arquitectura | Concluída |
| **Fase 3** | Implementação do backend (API REST) | Concluída |
| **Fase 4** | Implementação do frontend (SPA) | Concluída |
| **Fase 5** | Módulos operacionais (Processos, Stocks, Listagens) | Concluída |
| **Fase 6** | Testes e validação com cliente | Em curso |
| **Fase 7** | Integrações pendentes (e-mail/SMS, faturação certificada) | Parcial (in-app OK) |
| **Fase 8** | Documentação e entrega do PFC | Em curso |

### 6.3.2. Cronograma (Gantt)

[INSERIR DIAGRAMA DE GANTT AQUI]

```
Sugestão de estrutura para o Gantt:

Jan 2026 ████ Levantamento de requisitos
Fev 2026 ████████ Modelação BD + Arquitectura
Mar 2026 ████████████ Backend core + Auth
Abr 2026 ████████████████ Frontend + Módulos base
Mai 2026 ████████████████████ Processos + Stocks + Listagens
Jun 2026 ████████████████████████ Testes + Documentação PFC
```

### 6.3.3. Marcos (Milestones)

| Marco | Data | Entregável |
|---|---|---|
| M1 — Requisitos validados | [INSERIR] | Documento de requisitos (Cap. 2) |
| M2 — Schema de BD estável | [INSERIR] | Migrações 000–046 aplicadas |
| M3 — API funcional | [INSERIR] | Swagger docs + endpoints testados |
| M4 — MVP operacional | [INSERIR] | Fluxo contacto → faturação |
| M5 — Validação cliente | [INSERIR] | Sessão de demonstração Genoma |
| M6 — Entrega PFC | [INSERIR] | Relatório final completo |

### 6.3.4. Recursos

| Recurso | Papel | Alocação |
|---|---|---|
| [INSERIR NOME] | Desenvolvedor / Autor do PFC | [INSERIR %] |
| [INSERIR NOME] | Orientador académico | Supervisão |
| Equipa Genoma | Cliente / Stakeholder | Validação e feedback |

---

## 6.4. Gestão de Riscos do Projecto

| Risco | Probabilidade | Impacto | Mitigação | Estado |
|---|---|---|---|---|
| Atraso na validação do cliente | Média | Alto | Documento de perguntas (`PONTO_DE_SITUACAO`) | Activo |
| Integração faturação certificada | Média | Médio | API modular; campos já modelados | Pendente |
| Dados históricos para importação | Baixa | Médio | Script de importação [A DESENVOLVER] | Pendente |
| Conformidade RGPD | Baixa | Alto | RBAC, auditoria, soft-delete | Mitigado |

---

## 6.5. Trabalho Futuro

1. **Ligação de motivos de anulação** ao ecrã de cancelamento de processos.
2. **Activação de notificações** e-mail/SMS com credenciais reais (in-app já operacional).
3. **Consolidação do design system** — estender tokens slate/teal a formulários legacy.
4. **Integração com software de faturação** certificado (a definir com cliente).
5. **Importação de dados históricos** (pacientes, processos, lotes).
6. **Suite de testes automatizados** (Jest + E2E).
7. **Modelo gráfico de relatório** personalizado Genoma (PDF).
8. **Deploy em produção** com HTTPS, backups automáticos e monitorização.

---

## 6.6. Conclusões

### 6.6.1. Objectivos Alcançados

[INSERIR APÓS CONCLUSÃO DO PROJECTO — exemplo de estrutura:]

O projecto CRM Genoma demonstrou a viabilidade técnica, económica e operacional de digitalizar o fluxo completo de testes genéticos, desde a recepção de material biológico até à faturação final. A arquitectura Three-Tier com API REST mostrou-se adequada à complexidade do domínio, permitindo:

- Implementação de um workflow rigoroso com máquina de estados finita;
- Rastreabilidade ponta a ponta essencial para conformidade e recalls;
- Interface moderna e modular com seis áreas funcionais operacionais;
- Fundações sólidas de segurança (JWT, RBAC, auditoria, rate limiting);
- **Isolamento de dados por médico prescritor** e painel clínico dedicado (`MedicoDashboard.tsx`).

### 6.6.2. Objectivos Não Alcançados / Parcialmente Alcançados

[INSERIR — exemplos baseados no estado actual:]

- Notificações automáticas: **centro in-app implementado**; canais e-mail/SMS por configurar.
- Motivos de anulação: tabela criada, ligação ao UI de processos pendente.
- Integração com faturação certificada: aguarda decisão do cliente.

### 6.6.3. Aprendizagens

[INSERIR REFLEXÃO PESSOAL DO AUTOR — exemplos:]

- A importância de validar o workflow com stakeholders antes de implementar a máquina de estados.
- O valor da rastreabilidade bidireccional num contexto de dados genéticos sensíveis.
- A complexidade de gerir datas e fusos horários em sistemas clínicos.

### 6.6.4. Contributo para a Organização

[INSERIR — o CRM substitui processos manuais e oferece visibilidade operacional em tempo real, reduzindo erros humanos e preparando a Genoma para escalar a sua carteira de testes genéticos.]

---

## 6.7. Referências Bibliográficas

[INSERIR REFERÊNCIAS BIBLIOGRÁFICAS NO FORMATO ISLA — exemplos:]

1. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson.
2. Regulamento (UE) 2016/679 — Regulamento Geral sobre a Protecção de Dados (RGPD).
3. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (REST).
4. Documentação oficial: React (https://react.dev), Express (https://expressjs.com), MariaDB (https://mariadb.org).
5. Documentação interna: `backend/ARCHITECTURE.md`, `BASE_DE_DADOS.md`, `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md`.

---

## 6.8. Anexos

| Anexo | Descrição | Localização |
|---|---|---|
| A | Documentação API (Swagger) | `backend/src/swagger.json` |
| B | Schema completo da BD | `BASE_DE_DADOS.md` |
| C | Manual de instalação | `backend/README.md` |
| D | Capturas de ecrã da aplicação | [INSERIR PASTA DE SCREENSHOTS] |
| E | Guiões de entrevista (registos) | Capítulo 1, Secção 1.5 |
| F | Resultados de testes | Capítulo 5, Secção 5.2 |

---

## Referências Técnicas do Repositório

- `package.json` (raiz) — Scripts de orquestração
- `backend/package.json` — Dependências da API
- `frontend/package.json` — Dependências da SPA
- `frontend/vite.config.ts` — Configuração de build e proxy
- `ROADMAP_PRODUCAO.md` — Plano de melhorias para produção
- `frontend/src/lib/design-tokens.ts` — Tokens visuais (slate/teal)
