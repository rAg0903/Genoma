# Relatório Final de Curso — CRM Genoma

**Instituição:** ISLA — [Curso de Engenharia Informática]  
**Autor:** [Rafael Fernandes Males]  
**Orientador:** [Ana Paula]  
**Ano Lectivo:** [25/26]  
**Data:** Junho de 2026

---

## Sobre este directório

Esta pasta contém a estrutura modular do Relatório de Projeto Final de Curso (PFC), organizada por capítulos obrigatórios da ISLA. O conteúdo técnico foi derivado do código-fonte real do projecto **Genoma CRM** (`genoma_app-main`).

## Documento Principal

| Ficheiro | Conteúdo |
|---|---|
| [LEI_Relatorio_a22212343.md](./LEI_Relatorio_a22212343.md) | **Relatório final completo — CRM Genoma (Rafael Males, a22212343)** |

## Índice de Capítulos

| Ficheiro | Conteúdo |
|---|---|
| [01_VIABILIDADE_E_INTERVIEWS.md](./01_VIABILIDADE_E_INTERVIEWS.md) | Viabilidade técnica, económica e operacional; guião de entrevistas |
| [02_USER_STORIES_E_REQUISITOS.md](./02_USER_STORIES_E_REQUISITOS.md) | 13 User Stories, RF e RNF |
| [03_ARQUITETURA_E_SISTEMA.md](./03_ARQUITETURA_E_SISTEMA.md) | Arquitectura Three-Tier, fluxos de dados |
| [04_DATABASE_DESIGN_E_DICTIONARY.md](./04_DATABASE_DESIGN_E_DICTIONARY.md) | Dicionário de dados das tabelas principais |
| [05_TEST_CASES_E_RASTREABILIDADE.md](./05_TEST_CASES_E_RASTREABILIDADE.md) | 11 casos de teste e matriz RF ↔ TC |
| [06_STACK_E_PLANEAMENTO.md](./06_STACK_E_PLANEAMENTO.md) | Stack tecnológico, planeamento e conclusões |

## Placeholders por preencher

Os seguintes elementos devem ser completados pelo autor antes da entrega final:

- [ ] Dados pessoais (nome, orientador, curso, ano lectivo)
- [ ] Diagramas (ERD, casos de uso, Gantt, deployment)
- [ ] Mockups Figma / capturas de ecrã
- [ ] Registos de entrevistas realizadas
- [ ] Resultados de execução dos test cases (PASS/FAIL)
- [ ] Cronograma efectivo do projecto
- [ ] Referências bibliográficas no formato ISLA
- [ ] Conclusões finais e reflexão pessoal

## Documentação de apoio no repositório

- `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md` — Estado actual do projecto
- `BASE_DE_DADOS.md` — Schema completo (29 tabelas)
- `backend/ARCHITECTURE.md` — Arquitectura do backend

## Últimas actualizações (Junho 2026)

Implementações documentadas nesta fase (commit `f7497dc` e actualizações de relatório):

| Área | Descrição | Ficheiros principais |
|---|---|---|
| **Isolamento por médico** | Contactos, processos e listagens filtrados ao médico autenticado | `medico-access.js`, `pacientes.service.js`, `processos.service.js` |
| **Dashboard médico** | KPIs operacionais scoped por `medico_id`; painel dedicado com acções prioritárias | `MedicoDashboard.tsx`, `dashboards.repository.js` |
| **Utilizadores ↔ Médicos** | Médicos visíveis em Utilizadores com título Dr./Dra.; edição via `/definicoes/utilizadores/:id/editar` | `utilizadores.service.js`, `SettingsPage.tsx` |
| **Sessão e auth** | Bootstrap de sessão sem flash de UI admin; limpeza de dados ao logout | `AuthContext.tsx`, `auth-session.ts` |
| **Seeds CRM** | Dados de referência (empresa Genoma, médicos, inventário via envios) e reset | `seed-admin.js`, `seed-inventory.js`, `reset-crm.js` |
| **Formulário contacto** | Campo médico pré-preenchido e bloqueado para perfil Médico | `ContactFormPage.tsx` |
| **Stocks posto** | Verificação de stock por tipo de kit (sub-teste não afecta stock físico) | `postos.repository.js` |

## Como compilar o relatório final

Para gerar um documento único, pode concatenar os capítulos na ordem indicada ou importá-los para Word/LaTeX mantendo a formatação Markdown.

```powershell
# Exemplo: visualizar estrutura
Get-ChildItem -Path relatorio_final -Filter *.md | Sort-Object Name
```

---

*Documentação gerada com base no código-fonte do CRM Genoma — Junho de 2026.*
