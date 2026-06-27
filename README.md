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
| **Agendamentos** | Calendário de colheitas com reserva automática de kits |
| **Faturação** | Emissão de faturas com numeração, descontos e referências multibanco |
| **Rastreabilidade** | Cadeia completa lote ↔ kit ↔ processo ↔ resultado, em ambos os sentidos |
| **Listagens e exportação** | Consultas avançadas com exportação para Excel, CSV e PDF |
| **Painel médico** | Dashboard dedicado ao perfil Médico, com KPIs e dados isolados por prescritor |
| **Administração** | Utilizadores, perfis, permissões, catálogo de testes e configuração do sistema |

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

---

## Estrutura do Repositório

```
genoma_app-main/
├── frontend/          # SPA React + Vite + TypeScript
├── backend/           # API REST Express + MariaDB
├── database/          # Exportação SQL da BD (partilha entre ambientes)
├── relatorio_final/   # Documentação académica (PFC — ISLA)
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
git clone https://github.com/Males24/CRM-Genoma2026.git
cd CRM-Genoma2026

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
| Contactos | `/contactos` | Pacientes e conversão em processo (filtrado por médico quando aplicável) |
| Processos | `/processos` | Pipeline clínico-laboratorial (Kanban) |
| Stocks | `/stocks` | Lotes, kits, requisições e movimentos |
| Listagens | `/listagens` | Consultas, filtros e exportações |
| Administração | `/definicoes` | Utilizadores (incl. médicos), testes, postos, laboratórios |

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

- [Exportação e importação da base de dados](./database/README.md)
- [Schema da base de dados](./BASE_DE_DADOS.md)
- [Arquitectura do backend](./backend/ARCHITECTURE.md)
- [Ponto de situação do projecto](./PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md)

---

## Segurança e Conformidade

- Autenticação **JWT** com passwords encriptadas (**bcrypt**)
- **RBAC** — controlo de acesso por perfis e permissões granulares
- **Isolamento por médico** — contactos, processos e dashboard filtrados ao prescritor autenticado
- **Auditoria** — registo de acções em `logs_auditoria`
- **Soft delete** — desactivação lógica em vez de eliminação física
- **Rate limiting** — protecção contra abuso da API
- Dados genéticos tratados como **dados sensíveis** ao abrigo do **RGPD**

---

## Autor

**Rafael Fernandes Males** — Projeto Final de Curso, ISLA  
Engenharia Informática · Ano lectivo 2025/2026

---

## Licença

Este projecto está licenciado sob a licença **ISC**. Ver [`backend/package.json`](./backend/package.json) para mais detalhes.
