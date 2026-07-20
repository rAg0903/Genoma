# CRM Genoma — Sistema de Gestão de Testes Genéticos

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB/MySQL-InnoDB-003545?logo=mariadb&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

> Plataforma web full-stack para a gestão operacional de testes genéticos — da recepção da amostra à faturação final.

---

## Sobre o Projecto

O **CRM Genoma** é um sistema de gestão operacional desenvolvido para laboratórios e clínicas de diagnóstico genómico. Vai além de um CRM tradicional: acompanha cada amostra ao longo de todo o ciclo de vida clínico-laboratorial, garantindo rastreabilidade, conformidade e eficiência operacional.

O fluxo operacional reflectido na aplicação:

```
Lote → Kit → Agendamento → Colheita → Processo → Resultado → Relatório → Faturação
```

### O que o sistema faz

| Área | Descrição |
|---|---|
| **Gestão de amostras** | Registo de lotes e kits rastreáveis por código de barras, com controlo de stock e movimentos entre locais |
| **Triagem e workflow** | Pipeline clínico com estados validados (Agendado → Colheita → Análise → Validação → Faturação) |
| **Sequenciação e resultados** | Registo de resultados genéticos por cromossoma, upload de PDFs e validação clínica |
| **Colheitas do dia** | Calendário operacional para postos e tablet; registo de colheita na ficha do contacto (reserva de kit via API `/agendamentos`) |
| **Faturação** | Emissão de faturas com numeração e descontos decimais |
| **Rastreabilidade** | Cadeia completa lote ↔ kit ↔ processo ↔ resultado, em ambos os sentidos |
| **Listagens e exportação** | Consultas avançadas com exportação para Excel, CSV e PDF |
| **Painel médico** | Dashboard dedicado ao perfil Médico, com KPIs e dados isolados por prescritor |
| **Administração** | Utilizadores, perfis, permissões, catálogo de testes, empresas e configuração do sistema |
| **Notificações in-app** | Centro de alertas operacionais (processos, contactos, faturação, inventário, lembretes) com preferências por utilizador |

---

## Modos de execução

O mesmo código base suporta **dois modos** — escolhe conforme o contexto:

| Modo | Quando usar | Como arrancar |
|------|-------------|---------------|
| **Online (web)** | Desenvolvimento, servidor interno, Docker/nginx | Backend `:3000` + frontend Vite `:5173` |
| **Desktop (Mac/Windows)** | Utilizador final, janela nativa, tudo integrado | Electron em `desktop/` — arranca BD, migrações e API automaticamente |

```
                    ┌─────────────────────────────────────┐
                    │         CRM Genoma (código único)      │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
    ┌─────────▼─────────┐                         ┌───────────▼──────────┐
    │  Modo Online       │                         │  Modo Desktop         │
    │  Browser + API     │                         │  Electron (Mac/Win)   │
    │  localhost:5173    │                         │  localhost:3847       │
    └─────────┬─────────┘                         └───────────┬──────────┘
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      │
                            MariaDB / MySQL (serviço local)
```

> **Nota:** A app desktop tenta iniciar o serviço MariaDB/MySQL do sistema (Homebrew no Mac, `net start` no Windows), tal como a versão MAUI original. A base de dados **não vem embutida** no instalador — ver [`desktop/README.md`](./desktop/README.md).

---

## Arquitectura

Aplicação **Three-Tier / API-Based** com separação clara entre apresentação, lógica de negócio e persistência:

```
┌─────────────────────────┐
│   Frontend (React SPA)  │  ← Vite · TypeScript · Tailwind · MUI
└───────────┬─────────────┘
            │  REST / JSON · JWT
┌───────────▼─────────────┐
│   Backend (Express API) │  ← Routes → Controllers → Services → Repositories
└───────────┬─────────────┘
            │  SQL (mysql2 pool)
┌───────────▼─────────────┐
│   MariaDB / MySQL       │  ← 42 tabelas · UUIDs · Soft delete · Auditoria
└─────────────────────────┘
```

---

## Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Papel |
|---|---|---|
| [React](https://react.dev) | 18.3 | Interface de utilizador (SPA) |
| [TypeScript](https://www.typescriptlang.org) | — | Tipagem estática |
| [Vite](https://vitejs.dev) | 6.3 | Build tool e dev server |
| [React Router](https://reactrouter.com) | 7.13 | Routing e navegação |
| [Tailwind CSS](https://tailwindcss.com) | 4.1 | Estilos utility-first |
| [MUI (Material UI)](https://mui.com) | 7.3 | Componentes de interface |
| [Radix UI](https://www.radix-ui.com) | — | Primitivos acessíveis (dialogs, tabs, etc.) |
| [React Hook Form](https://react-hook-form.com) | 7.55 | Gestão de formulários |
| [React DnD](https://react-dnd.github.io/react-dnd) | 16.0 | Pipeline Kanban (drag-and-drop) |
| [Recharts](https://recharts.org) | 2.15 | Gráficos no dashboard |
| [date-fns](https://date-fns.org) | 3.6 | Manipulação de datas |

### Backend

| Tecnologia | Versão | Papel |
|---|---|---|
| [Node.js](https://nodejs.org) | ≥ 18 | Runtime JavaScript |
| [Express](https://expressjs.com) | 5.2 | Framework HTTP / API REST |
| [Puppeteer](https://pptr.dev) | — | Geração de PDF de relatórios clínicos no servidor |
| [mysql2](https://github.com/sidorares/node-mysql2) | 3.18 | Driver MariaDB/MySQL |
| [JWT](https://jwt.io) | 9.0 | Autenticação stateless |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 6.0 | Hash de passwords |
| [Helmet](https://helmetjs.github.io) | 8.1 | Segurança HTTP |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 8.2 | Protecção contra abuse |
| [express-validator](https://express-validator.github.io) | 7.3 | Validação de payloads |
| [ExcelJS](https://github.com/exceljs/exceljs) | 4.4 | Exportação Excel |
| [Swagger UI](https://swagger.io/tools/swagger-ui/) | 5.0 | Documentação interactiva da API |
| [Jest](https://jestjs.io) | — | Testes unitários |

### Base de Dados e DevOps

| Tecnologia | Papel |
|---|---|
| MariaDB / MySQL (InnoDB) | Persistência relacional (`utf8mb4`) |
| Migrações versionadas | Evolução controlada do schema (`backend/src/migrations/`) |
| dotenv | Variáveis de ambiente |
| nodemon | Hot reload em desenvolvimento |
| Electron 35 | App desktop Mac/Windows (`desktop/`) |

---

## Estrutura do Repositório

```
Genoma/
├── frontend/          # SPA React + Vite + TypeScript
├── backend/           # API REST Express + MariaDB
├── desktop/           # Aplicação nativa Mac/Windows (Electron)
├── database/          # Exportação SQL da BD (partilha entre ambientes)
├── relatorio_final/   # Documentação académica (PFC — ISLA)
├── legacy/maui/       # Versão MAUI (.NET 9) — branch `legacy/maui`
├── BASE_DE_DADOS.md   # Schema completo (documentação)
└── README.md          # Este ficheiro
```

---

## Início Rápido

### Pré-requisitos

- Node.js ≥ 18
- MariaDB ou MySQL
- npm 10+

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/rAg0903/Genoma.git
cd Genoma

# Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Editar backend/.env com credenciais da BD e JWT_SECRET

# Opção A — Importar base de dados completa (recomendado para demo)
mysql -u root -p < database/genoma_export.sql

# Opção B — Criar schema vazio via migrações
npm run migrate --prefix backend

# (Opcional) Popular dados de demonstração
npm run seed:admin --prefix backend
npm run seed:inventory --prefix backend

# Iniciar backend (porta 3000)
npm run backend:dev

# Iniciar frontend (porta 5173) — noutro terminal, na raiz
npm run frontend:dev
```

A aplicação fica disponível em `http://localhost:5173`. A API REST responde em `http://localhost:3000/api`.

### Modo desktop (Mac / Windows)

Aplicação nativa com janela própria — arranca MariaDB (se necessário), migrações, API e interface num único processo:

```bash
# Na raiz do projecto — primeira vez
npm run desktop:install

# Desenvolvimento (compila frontend + abre janela Genoma)
npm run desktop:dev

# Gerar instalador
npm run desktop:pack:mac    # → desktop/dist/*.dmg
npm run desktop:pack:win    # → desktop/dist/*.exe (num PC Windows)
```

- **Configuração desktop:** na 1.ª execução copia `.env` para a pasta de dados do utilizador (Mac: `~/Library/Application Support/genoma-desktop/`)
- **Uploads e PDFs** ficam na pasta de dados do utilizador (não dentro do `.app`)
- Detalhes: [`desktop/README.md`](./desktop/README.md)

### Credenciais de teste (após importar `database/genoma_export.sql`)

| Perfil | Email | Password |
|---|---|---|
| Administrador | `admin.teste@genoma.local` | `Teste1234!` |
| Médico | `anaclaraferreira@genoma.pt` | `Teste1234!` |
| Médico | `sofiasilva@genoma.pt` | `Teste1234!` |

### Scripts úteis (backend)

| Comando | Descrição |
|---|---|
| `npm run migrate --prefix backend` | Executar migrações de BD |
| `npm run seed:admin --prefix backend` | Criar admin e dados base |
| `npm run seed:inventory --prefix backend` | Popular stocks (lotes/kits) |
| `npm run reset:crm --prefix backend` | Reset parcial de dados CRM |
| `npm run export:database --prefix backend` | Exportar BD para `database/genoma_export.sql` |

---

## Módulos Principais

| Módulo | Rota | Funcionalidade |
|---|---|---|
| Dashboard | `/` | KPIs e alertas; painel dedicado para perfil **Médico** (`MedicoDashboard`) |
| Contactos | `/contactos`, `/contactos/:id` | Pipeline Kanban; ficha com separadores; edição inline (`?edit=1`) sem sair da vista |
| Processos | `/processos`, `/processos/:id` | Pipeline clínico-laboratorial (Kanban); vista read-only com edição inline por separador |
| Stocks | `/stocks` | Lotes, kits, requisições e movimentos |
| Listagens | `/listagens` | Consultas, filtros e exportações |
| Administração | `/definicoes` | Utilizadores (incl. médicos), perfis, empresas, testes, postos, laboratórios |

---

## Documentação Académica

Este projecto integra o **Projeto Final de Curso (PFC)** da ISLA. A documentação académica completa encontra-se na pasta [`relatorio_final/`](./relatorio_final/):

| Capítulo | Documento |
|---|---|
| Índice geral | [Relatório Final de Curso](./relatorio_final/README.md) |
| Relatório completo | [LEI_Relatorio_a22212343.md](./relatorio_final/LEI_Relatorio_a22212343.md) |
| 01 · Viabilidade e Entrevistas | [Viabilidade Técnica, Económica e Operacional](./relatorio_final/01_VIABILIDADE_E_INTERVIEWS.md) |
| 02 · User Stories e Requisitos | [User Stories, RF e RNF](./relatorio_final/02_USER_STORIES_E_REQUISITOS.md) |
| 03 · Arquitectura do Sistema | [Arquitectura Three-Tier e Fluxos de Dados](./relatorio_final/03_ARQUITETURA_E_SISTEMA.md) |
| 04 · Base de Dados | [Database Design e Dicionário de Dados](./relatorio_final/04_DATABASE_DESIGN_E_DICTIONARY.md) |
| 05 · Testes e Rastreabilidade | [Casos de Teste e Matriz RF ↔ TC](./relatorio_final/05_TEST_CASES_E_RASTREABILIDADE.md) |
| 06 · Stack e Planeamento | [Stack Tecnológico, Planeamento e Conclusões](./relatorio_final/06_STACK_E_PLANEAMENTO.md) |

### Documentação técnica complementar

- [Roadmap para produção](./ROADMAP_PRODUCAO.md)
- [Exportação e importação da base de dados](./database/README.md)
- [Schema da base de dados](./BASE_DE_DADOS.md)
- [Arquitectura do backend](./backend/ARCHITECTURE.md)
- [Ponto de situação do projecto](./PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md)

---

## Segurança e Conformidade

- Autenticação **JWT** com passwords encriptadas (**bcrypt**)
- **RBAC** — controlo de acesso por perfis e permissões granulares (matriz visual em Administração → Perfis e Permissões)
- **Isolamento por médico** — contactos, processos e dashboard filtrados ao prescritor autenticado
- **Auditoria** — registo de acções em `logs_auditoria`
- **Soft delete** — desactivação lógica em vez de eliminação física
- **Rate limiting** — protecção contra abuso da API
- Dados genéticos tratados como **dados sensíveis** ao abrigo do **RGPD**

---

## Evolução recente (Julho 2026)

| Área | Melhoria |
|------|----------|
| **App desktop** | Electron Mac/Windows — arranque automático de BD, migrações e API; instaladores `.dmg` / `.exe` |
| **Relatórios PDF** | Template clínico NIPT (Maternity Proposta 1); geração no servidor com Puppeteer; preview alinhada com o PDF |
| **Resultados NIPT** | Grelha de cromossomas C1–C23; opções clínicas (fracção fetal, sexo fetal, teste cromossomas) |
| **Edição inline** | Processos e contactos: header e separadores estáticos; só o conteúdo do tab activo passa a edição (`?edit=1` na URL) |
| **Rotas de ficha** | `/contactos/:id` e `/processos/:id` com fetch por ID (sem falso «não encontrado» ao refrescar) |
| **Perfil médico** | Dashboard dedicado; contactos/processos isolados por prescritor; resultados read-only |
| **Colheitas hoje** | Calendário operacional `/colheitas-hoje`; registo de colheita na ficha do contacto |
| **Pipeline contactos** | Filtros Criado/Agendado/Cancelado; removido KPI «Com processos» |
| **Robustez** | RBAC reforçado; 56 testes Jest; uploads configuráveis (`UPLOAD_DIR`); rate limit desactivado em modo desktop |
| **Base de dados** | 65+ migrações versionadas (`backend/src/migrations/`) |

---

## Histórico do projecto

| Versão | Stack | Onde |
|--------|-------|------|
| **Actual (main)** | React + Node + Electron | Este repositório — web e desktop Mac/Windows |
| **Legacy** | .NET MAUI Blazor | Branch [`legacy/maui`](https://github.com/rAg0903/Genoma/tree/legacy/maui) |

A versão MAUI serviu de protótipo funcional (arranque de BD, fluxos clínicos, PDF). A stack web actual é a evolução principal.

Espelho académico (PFC): [Males24/CRM-Genoma2026](https://github.com/Males24/CRM-Genoma2026)

---

## Autor

**Rafael Fernandes Males** — Projeto Final de Curso, ISLA  
Engenharia Informática · Ano lectivo 2025/2026

---

## Licença

Este projecto está licenciado sob a licença **ISC**. Ver [`backend/package.json`](./backend/package.json) para mais detalhes.
