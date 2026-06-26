# Licenciatura em Engenharia Informática

---

**CRM Genoma — Sistema de Gestão Operacional de Testes Genéticos**

**Rafael Fernandes Males**

a22212343

Ana Paula *(Orientadora)*

ISLA — Instituto Superior de Linguas e Administração  
Campus de Vila Nova de Gaia

Junho de 2026

---

## Dedicatória (facultativa)

À minha família e à equipa Genoma, pelo apoio e partilha de conhecimento ao longo deste percurso académico e profissional.

---

## Resumo

A Genoma é uma entidade dedicada à prestação de serviços de testes genéticos, cujo fluxo operacional abrange a recepção de material biológico, o agendamento de colheitas, o processamento laboratorial, a validação clínica de resultados, a emissão de relatórios e a faturação final. O sistema informático legado limitava-se a funcionalidades genéricas de gestão de contactos, não reflectindo a cadeia de rastreabilidade exigida em contextos de diagnóstico genómico nem as exigências de conformidade regulatória, designadamente ao abrigo do Regulamento Geral sobre a Protecção de Dados (RGPD).

O presente relatório documenta o projecto de desenvolvimento do **CRM Genoma**, uma aplicação web full-stack concebida para digitalizar e centralizar a operação clínico-laboratorial da organização. O trabalho realizado incluiu o levantamento de requisitos junto de stakeholders, a modelação de uma arquitectura Three-Tier com API REST, o desenho de uma base de dados relacional com 29 tabelas, a implementação de um workflow rigoroso com máquina de estados finita para processos clínicos, módulos de stocks, agendamentos, listagens exportáveis e mecanismos de auditoria. A solução adopta React 18 com TypeScript no frontend, Node.js com Express 5 no backend e MariaDB/MySQL como sistema de gestão de base de dados, complementada por autenticação JWT, controlo de acessos baseado em perfis (RBAC) e registo de acções em `logs_auditoria`.

Conclui-se que o CRM Genoma constitui uma base sólida e viável para a gestão operacional de testes genéticos, reduzindo erros humanos, garantindo rastreabilidade ponta a ponta (lote → kit → processo → resultado → faturação) e preparando a organização para evoluções futuras, nomeadamente integração com software de faturação certificado e activação de notificações automáticas.

**Palavras-chave:** testes genéticos; CRM; rastreabilidade; arquitectura Three-Tier; React; Node.js; MariaDB; RGPD; engenharia de software

---

## Agradecimentos

Agradeço à orientadora **Ana Paula**, pelo acompanhamento académico, orientação metodológica e feedback construtivo ao longo da elaboração deste projecto.

À **equipa Genoma**, em particular aos intervenientes que participaram nas sessões de levantamento de requisitos, pela disponibilidade em partilhar o conhecimento do fluxo operacional real e em validar as decisões de concepção do sistema.

Ao **Instituto Superior de Línguas e Administração (ISLA)**, pelos conhecimentos transmitidos ao longo da Licenciatura em Engenharia Informática, que permitiram abordar este projecto com rigor técnico e académico.

À minha **família e amigos**, pelo apoio incondicional durante este percurso.

---

## Índice

| Secção | Página |
|---|---|
| Resumo | v |
| Agradecimentos | vii |
| Índice | ix |
| Índice de figuras | xi |
| **1. Introdução** | **1** |
| &nbsp;&nbsp;&nbsp;&nbsp;1.1 Enquadramento | 1 |
| &nbsp;&nbsp;&nbsp;&nbsp;1.2 Objectivo | 2 |
| &nbsp;&nbsp;&nbsp;&nbsp;1.3 Organização do Relatório | 2 |
| **2. Análise do Problema e Levantamento de Requisitos** | **3** |
| &nbsp;&nbsp;&nbsp;&nbsp;2.1 Relatório de Viabilidade | 3 |
| &nbsp;&nbsp;&nbsp;&nbsp;2.2 Entrevistas a Stakeholders | 5 |
| &nbsp;&nbsp;&nbsp;&nbsp;2.3 User Stories | 6 |
| &nbsp;&nbsp;&nbsp;&nbsp;2.4 Requisitos Funcionais | 10 |
| &nbsp;&nbsp;&nbsp;&nbsp;2.5 Requisitos Não Funcionais | 14 |
| **3. Concepção da Solução e Modelação do Sistema** | **16** |
| &nbsp;&nbsp;&nbsp;&nbsp;3.1 Diagrama de Casos de Uso | 16 |
| &nbsp;&nbsp;&nbsp;&nbsp;3.2 Arquitectura do Sistema | 18 |
| &nbsp;&nbsp;&nbsp;&nbsp;3.3 Diagramas de Sequência e Actividades | 20 |
| &nbsp;&nbsp;&nbsp;&nbsp;3.4 Diagrama de Classes | 22 |
| &nbsp;&nbsp;&nbsp;&nbsp;3.5 Database Design e Modelo ER | 23 |
| &nbsp;&nbsp;&nbsp;&nbsp;3.6 Data Dictionary | 25 |
| **4. Implementação, Interface e Validação do CRM Genoma** | **30** |
| &nbsp;&nbsp;&nbsp;&nbsp;4.1 Stack Tecnológico e Módulos Implementados | 30 |
| &nbsp;&nbsp;&nbsp;&nbsp;4.2 Design da Interface do Utilizador | 33 |
| &nbsp;&nbsp;&nbsp;&nbsp;4.3 Test Cases | 35 |
| &nbsp;&nbsp;&nbsp;&nbsp;4.4 Matriz de Rastreabilidade | 38 |
| **5. Conclusões e Perspectivas de Trabalho Futuro** | **40** |
| &nbsp;&nbsp;&nbsp;&nbsp;5.1 Conclusões | 40 |
| &nbsp;&nbsp;&nbsp;&nbsp;5.2 Perspectivas de Trabalho Futuro | 41 |
| **6. Referências e Bibliografia** | **42** |
| **ANEXO A:** User Stories Completas | 43 |
| **ANEXO B:** Casos de Teste Detalhados | 47 |

---

## Índice de figuras

| Figura | Legenda | Página |
|---|---|---|
| Figura 1 | Fluxo operacional do CRM Genoma (Lote → Faturação) | 2 |
| Figura 2 | Diagrama de Casos de Uso do CRM Genoma | 17 |
| Figura 3 | Diagrama de Arquitectura Three-Tier do sistema | 19 |
| Figura 4 | Diagrama de Sequência — Agendamento com reserva de kit | 21 |
| Figura 5 | Diagrama de Sequência — Transição de estado do processo | 21 |
| Figura 6 | Diagrama de Actividades — Fluxo operacional do processo | 22 |
| Figura 7 | Diagrama de Classes — Domínio operacional | 23 |
| Figura 8 | Diagrama Entidade-Relacionamento (ERD) — Base de dados `genoma` | 24 |
| Figura 9 | Vista pipeline (Kanban) do módulo de Processos | 34 |
| Figura 10 | Mockup da interface — Módulo de Administração | 34 |

---

## 1. Introdução

Nesta secção apresenta-se o contexto do projecto CRM Genoma, os objectivos do trabalho desenvolvido, bem como a organização do presente relatório. O projecto insere-se no âmbito da Licenciatura em Engenharia Informática do ISLA e documenta a concepção e implementação de um sistema de informação orientado ao domínio clínico-laboratorial de testes genéticos.

### 1.1. Enquadramento

A **Genoma** presta serviços de diagnóstico genómico, acompanhando cada amostra biológica desde a recepção do material até à emissão do relatório clínico e faturação final. O fluxo operacional real da organização pode ser sintetizado da seguinte forma:

```
Lote → Kit → Agendamento → Colheita → Processo → Resultado → Relatório → Faturação
```

O sistema informático existente funcionava essencialmente como um CRM genérico, incapaz de reflectir este percurso, de impedir transições inválidas entre fases laboratoriais, ou de garantir rastreabilidade bidireccional entre lotes, kits, processos e resultados — requisito crítico para conformidade, recalls de material e auditorias.

O **CRM Genoma** foi concebido para responder a esta lacuna, transformando a plataforma num **sistema operacional completo** para gestão de testes genéticos. À data de elaboração deste relatório (Junho de 2026), a solução encontra-se em fase de implementação avançada, com módulos operacionais construídos e a compilar sem erros, incluindo Processos, Contactos, Stocks, Agendamentos, Listagens, Dashboard e Administração.

[INSERIR IMAGEM DO DIAGRAMA DE FLUXO OPERACIONAL AQUI]

**Figura 1** — Fluxo operacional do CRM Genoma (Lote → Faturação)

O projecto adopta metodologias de engenharia de software consagradas — levantamento de requisitos orientado a stakeholders, user stories com critérios de aceitação, modelação UML, desenho relacional normalizado e testes funcionais com matriz de rastreabilidade — garantindo rigor académico e alinhamento com as boas práticas da disciplina.

### 1.2. Objectivo

**Objectivo geral:** Desenvolver um sistema de informação web que suporte integralmente a gestão operacional de testes genéticos na Genoma, desde a recepção de amostras até à faturação, com rastreabilidade, segurança de dados e conformidade regulatória.

**Objectivos específicos:**

1. Analisar o domínio clínico-laboratorial e identificar requisitos funcionais e não funcionais junto de stakeholders.
2. Conceber uma arquitectura Three-Tier / API-Based escalável e de fácil manutenção.
3. Modelar uma base de dados relacional que reflecta entidades, relações e regras de integridade do domínio genómico.
4. Implementar um workflow de processos com máquina de estados finita e transições validadas no servidor.
5. Desenvolver módulos de stocks, agendamentos, listagens exportáveis e administração com RBAC.
6. Definir casos de teste e matriz de rastreabilidade que assegurem cobertura dos requisitos críticos.
7. Documentar a solução de forma a permitir evolução futura (notificações, faturação certificada, importação histórica).

### 1.3. Organização do Relatório

| Capítulo | Conteúdo |
|---|---|
| **Capítulo 2** | Análise do problema: viabilidade técnica, económica e operacional; entrevistas a stakeholders; user stories; requisitos funcionais e não funcionais |
| **Capítulo 3** | Concepção da solução: casos de uso, arquitectura, diagramas de sequência, actividades e classes; desenho da base de dados e dicionário de dados |
| **Capítulo 4** | Trabalho desenvolvido: stack tecnológico, módulos implementados, design da interface, casos de teste e matriz de rastreabilidade |
| **Capítulo 5** | Conclusões e perspectivas de trabalho futuro |
| **Capítulo 6** | Referências bibliográficas |
| **Anexos A e B** | User stories completas e casos de teste detalhados |

---

## 2. Análise do Problema e Levantamento de Requisitos

Este capítulo apresenta a análise de viabilidade do projecto, a metodologia de recolha de requisitos junto de stakeholders, as user stories derivadas e o levantamento formal de requisitos funcionais (RF) e não funcionais (RNF).

### 2.1. Relatório de Viabilidade

#### 2.1.1. Viabilidade Técnica

Para o desenvolvimento do CRM Genoma foram seleccionadas tecnologias modernas, estáveis e amplamente adoptadas, garantindo compatibilidade, desempenho e escalabilidade:

| Camada | Tecnologia | Justificação |
|---|---|---|
| Apresentação | React 18 + Vite 6 + TypeScript | SPA reactiva, componentização modular |
| API REST | Node.js ≥ 18 + Express 5 | Ecossistema maduro; workflows transaccionais |
| Persistência | MariaDB/MySQL (InnoDB) | Transacções ACID; integridade referencial; UUIDs |
| Autenticação | JWT + bcrypt | Stateless; padrão de mercado |
| Segurança HTTP | Helmet, CORS, express-rate-limit | Mitigação de XSS, brute-force e abuse |

O domínio genómico impõe requisitos técnicos específicos já contemplados na implementação:

1. **Máquina de estados finita** — transições validadas em `backend/src/services/processos.service.js` (`TRANSICOES_VALIDAS`).
2. **Rastreabilidade bidireccional** — módulo `/api/trace` (lote ↔ kit ↔ processo ↔ resultado).
3. **Integridade 1:1 kit-processo** — índice `UNIQUE` em `processos.kit_id`.
4. **Auditoria centralizada** — tabela `logs_auditoria` com registo de acções.
5. **Migrações versionadas** — 46+ ficheiros em `backend/src/migrations/`.

**Conclusão:** Viável. O código existente demonstra prova de conceito com 29 tabelas, 20+ grupos de endpoints REST e 6 módulos frontend operacionais.

#### 2.1.2. Viabilidade Operacional

A plataforma reflecte o pipeline validado com o cliente:

| Ordem | Estado (`processo_status`) |
|---|---|
| 1 | Agendado |
| 2 | Kit Reservado |
| 3 | Colheita Realizada |
| 4 | Enviado Laboratorio |
| 5 | Em Analise |
| 6 | Resultado Disponivel |
| 7 | Validado |
| 8 | Faturado |
| 9 | Cancelado |

A automatização de reserva de kits no agendamento, a impossibilidade de saltar estados e a centralização de listagens reduzem erros manuais e optimizam a gestão operacional. Perfis configuráveis (`perfis`, `perfil_stock_submodulos`) permitem adaptar a interface a rececionistas, técnicos, responsáveis clínicos e gestão financeira.

**Conclusão:** Viável, condicionada à validação final de regras de negócio em ambiente real (motivos de anulação, faturação, notificações).

#### 2.1.3. Viabilidade Económica

| Factor | Análise |
|---|---|
| Custos de licenciamento | 0 € — stack open-source (React, Node.js, MariaDB) |
| Custos de desenvolvimento | Tempo de PFC (sem custo directo de licenças) |
| Custos operacionais | Hosting, BD gerida, eventual SMS/e-mail transaccional |
| Benefícios | Redução de erros, automatização, rastreabilidade para recalls, reporting centralizado |

A utilização de tecnologias open-source minimiza despesas iniciais, tornando o projecto financeiramente sustentável para uma PME do sector da saúde.

### 2.2. Entrevistas a Stakeholders

As entrevistas semi-estruturadas permitiram recolher informação directa junto de médicos prescritores, directores de laboratório, administradores e técnicos de recepção. O guião organizou questões por áreas temáticas:

| Bloco | Temas abordados |
|---|---|
| A — Fluxo operacional | Sequência de estados, validação clínica, critérios de atraso (7 dias), motivos de anulação |
| B — Agendamentos | Postos de colheita, reserva automática de kits |
| C — Resultados e faturação | Modelo de relatório PDF, numeração de faturas, integração contabilística |
| D — Notificações | E-mail/SMS, eventos e destinatários |
| E — Stocks | Limiares de alerta (stock baixo: 5; expiração: 45 dias) |
| F — Permissões e RGPD | Perfis, exportações, campos sensíveis |
| G — Dados e arranque | Importação histórica, sessão de demonstração |

**Principais conclusões das entrevistas:**

- A sequência de estados implementada corresponde ao fluxo real, pendente de validação final de motivos de anulação.
- A reserva automática de kit no agendamento é considerada essencial para evitar colheitas sem material.
- A rastreabilidade ponta a ponta é prioritária para conformidade e eventual recall de lotes.
- Exportações (Excel, CSV, PDF) devem respeitar permissões por perfil, dado o carácter sensível dos dados genéticos.

Documentos complementares de apoio: `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md`.

### 2.3. User Stories

Foram definidas **12 user stories** com critérios de aceitação testáveis. Seguem-se as mais representativas do domínio; a lista completa consta do **Anexo A**.

#### US-001 — Recepção e Registo de Lotes de Kits

**Como** gestor de stocks, **quero** registar a recepção de um lote de kits, **para** garantir rastreabilidade desde a origem do material biológico.

| ID | Critério de Aceitação |
|---|---|
| CA-001.1 | `codigo_lote` único na tabela `lotes` |
| CA-001.2 | Associação a `tipo_kit_id` e `fornecedor_id` |
| CA-001.3 | Geração automática de N kits com `codigo_barras` único |
| CA-001.4 | Estado inicial do lote: "Disponivel" |
| CA-001.5 | Registo em `logs_auditoria` |

#### US-003 — Agendamento com Reserva Automática de Kit

**Como** rececionista, **quero** agendar uma colheita com reserva automática de kit, **para** evitar marcações sem material.

| ID | Critério de Aceitação |
|---|---|
| CA-003.1 | Selecção de kit `Disponivel` compatível |
| CA-003.2 | Kit → `Reservado`; processo → `Kit Reservado` (transacção atómica) |
| CA-003.3 | Calendário com codificação por carga |
| CA-003.5 | Processo criado automaticamente com `numero_processo` |

#### US-005 — Triagem e Transição de Estados

**Como** técnico de laboratório, **quero** avançar o processo apenas para estados válidos, **para** impedir saltos de fase.

**Máquina de estados implementada:**

```
Agendado → Kit Reservado → Colheita Realizada → Enviado Laboratorio
         → Em Analise → Resultado Disponivel → Validado → Faturado
(estados não terminais podem transitar para Cancelado)
```

| ID | Critério de Aceitação |
|---|---|
| CA-005.1 | Transições definidas em `TRANSICOES_VALIDAS` |
| CA-005.2 | Transição inválida retorna erro descritivo |
| CA-005.3 | Pipeline Kanban reflecte estado actual (`ProcessPipeline.tsx`) |
| CA-005.4 | Processos parados > 7 dias sinalizados como atrasados |

#### US-010 — Faturação de Processo

**Como** gestor financeiro, **quero** emitir fatura com numeração e descontos, **para** concluir o ciclo comercial.

| ID | Critério de Aceitação |
|---|---|
| CA-010.1 | Faturação apenas a partir de `Validado` |
| CA-010.2 | Campos `fatura_numero`, `valor_final` persistidos |
| CA-010.4 | Desconto validado entre 0 e 100% |
| CA-010.5 | Estado `Faturado` é terminal |

#### US-011 — Rastreabilidade Ponta a Ponta

**Como** director de laboratório, **quero** consultar a cadeia lote → resultado em ambos os sentidos, **para** responder a recalls ou auditorias.

| ID | Critério de Aceitação |
|---|---|
| CA-011.1 | API `/api/trace` operacional |
| CA-011.4 | Separador "Rastreabilidade" no painel do processo |
| CA-011.5 | Listagem de auditoria exportável |

### 2.4. Requisitos Funcionais

#### RF-001 — Autenticação e Gestão de Sessão

- **RF-001.1:** Autenticação por email e palavra-passe com emissão de JWT
- **RF-001.2:** Recuperação de password por token temporário
- **RF-001.3:** Terminação de sessão em caso de token inválido ou expirado (HTTP 401)

| Campo | Descrição |
|---|---|
| **Caso de uso** | Autenticar Utilizador |
| **Actor** | Utilizador (qualquer perfil) |
| **Pré-condição** | Conta activa em `utilizadores` |
| **Cenário** | 1. Utilizador acede a `/login` · 2. Introduz credenciais · 3. Backend valida com bcrypt · 4. Emite JWT · 5. Frontend armazena token · 6. Pedidos subsequentes incluem `Authorization: Bearer` |
| **Pós-condição** | Utilizador autenticado com permissões do perfil associado |

---

#### RF-002 — Gestão de Utilizadores, Perfis e Permissões

- **RF-002.1:** CRUD de utilizadores com soft-delete (`ativo`)
- **RF-002.2:** Perfis configuráveis com permissões por módulo (Dashboard, Contactos, Processos, Stocks, Listagens, Administração)
- **RF-002.3:** Permissões granulares de stock via `perfil_stock_submodulos`
- **RF-002.4:** Perfil Administrador único — não criável/eliminável pela interface

| Campo | Descrição |
|---|---|
| **Caso de uso** | Gerir Utilizadores e Perfis |
| **Actor** | Administrador |
| **Pré-condição** | Autenticado com permissão de Administração |
| **Cenário** | 1. Acede a Definições · 2. Cria/edita utilizador · 3. Atribui perfil · 4. Sistema valida unicidade de email · 5. Regista acção em auditoria |
| **Pós-condição** | Utilizador disponível com permissões correctas |

---

#### RF-003 — Gestão de Contactos e Pacientes

- **RF-003.1:** CRUD de pacientes com dados demográficos e clínicos
- **RF-003.2:** Conversão de contacto em processo clínico
- **RF-003.3:** Associação a médico prescritor, teste e kit

| Campo | Descrição |
|---|---|
| **Caso de uso** | Converter Contacto em Processo |
| **Actor** | Operador de contactos |
| **Pré-condição** | Paciente registado; kit disponível |
| **Cenário** | 1. Selecciona contacto · 2. Associa kit e teste · 3. Sistema gera `numero_processo` · 4. Define `data_entrada` · 5. Cria registo em `processos` |
| **Pós-condição** | Processo activo com estado inicial adequado |

---

#### RF-004 — Gestão de Stocks (Lotes e Kits)

- **RF-004.1:** Registo de lotes com geração automática de kits
- **RF-004.2:** Rastreabilidade por `codigo_barras` único
- **RF-004.3:** Estados de kit: Disponivel, Reservado, Em transito, Utilizado, Invalido, Perdido, Expirado
- **RF-004.4:** Movimentos entre locais (Escritorio, Posto, Laboratorio)
- **RF-004.5:** Alertas de stock baixo e lotes a expirar

---

#### RF-005 — Agendamento de Colheitas

- **RF-005.1:** Calendário de colheitas com reserva automática de kit
- **RF-005.2:** Criação automática de processo e colheita
- **RF-005.3:** Associação a posto e período (Manhã/Tarde/Noite)

| Campo | Descrição |
|---|---|
| **Caso de uso** | Agendar Colheita |
| **Actor** | Rececionista |
| **Pré-condição** | Kit disponível do tipo correcto; posto activo |
| **Cenário** | 1. Selecciona data e posto · 2. Sistema reserva kit · 3. Cria processo e colheita · 4. Actualiza estados |
| **Pós-condição** | Colheita agendada; kit reservado; processo criado |

---

#### RF-006 — Gestão de Processos Clínicos

- **RF-006.1:** Entidade central `processos` agrega paciente, médico, kit, teste, posto
- **RF-006.2:** Relação 1:1 processo-kit (`uk_processos_kit`)
- **RF-006.3:** Painel lateral com separadores: Resumo, Fluxo, Resultado, Relatório, Faturação, Rastreabilidade, Histórico

---

#### RF-007 — Workflow com Máquina de Estados

- **RF-007.1:** Transições validadas server-side (`assertTransicaoValida`)
- **RF-007.2:** Vista pipeline Kanban com drag-and-drop (`ProcessPipeline.tsx`)
- **RF-007.3:** KPIs: processos atrasados, pendentes de validação, prontos a faturar

**Tabela de transições válidas:**

| Estado Actual | Estados Permitidos |
|---|---|
| Agendado | Kit Reservado, Cancelado |
| Kit Reservado | Colheita Realizada, Agendado, Cancelado |
| Colheita Realizada | Enviado Laboratorio, Cancelado |
| Enviado Laboratorio | Em Analise, Cancelado |
| Em Analise | Resultado Disponivel, Cancelado |
| Resultado Disponivel | Validado, Cancelado |
| Validado | Faturado, Cancelado |
| Faturado | *(terminal)* |
| Cancelado | *(terminal)* |

---

#### RF-008 a RF-019 — Requisitos Complementares

| ID | Descrição | Estado |
|---|---|---|
| RF-008 | Registo de resultados genéticos por cromossoma (`resultados_geneticos`) | Implementado |
| RF-009 | Validação clínica e geração de relatórios PDF (`processo_relatorios`) | Implementado |
| RF-010 | Faturação com numeração, descontos, referências MB (`facturacao`) | Implementado |
| RF-011 | Rastreabilidade bidireccional (`/api/trace`) | Implementado |
| RF-012 | Requisições e movimentos de kits | Implementado |
| RF-013 | Dashboard com KPIs e alertas | Implementado |
| RF-014 | Listagens com filtros e exportação Excel/CSV/PDF | Implementado |
| RF-015 | Catálogo de testes genómicos com metadados ADN fetal | Implementado |
| RF-016 | Motivos de anulação configuráveis | Parcial* |
| RF-017 | Notificações e-mail/SMS | Preparado** |
| RF-018 | Integração faturação certificada | Pendente |
| RF-019 | Importação de dados históricos | Pendente |

\* Tabela criada; ligação ao ecrã de cancelamento pendente.  
\** Módulo interno implementado; credenciais externas por configurar.

### 2.5. Requisitos Não Funcionais

#### RNF-001 a RNF-010 — Segurança e RGPD

| ID | Requisito | Implementação |
|---|---|---|
| RNF-001 | Autenticação JWT obrigatória | `auth.middleware.js` |
| RNF-002 | Passwords com hash bcrypt | `auth.service.js` |
| RNF-003 | Rate limiting (100 req/15 min) | `express-rate-limit` |
| RNF-004 | Headers HTTP seguros | Helmet |
| RNF-005 | RBAC por perfis | `perfis`, `permissions.ts` |
| RNF-006 | Auditoria de acções | `logs_auditoria` |
| RNF-007 | Soft-delete | Campo `ativo` |
| RNF-008 | Dados genéticos como sensíveis (Art. 9.º RGPD) | Política de retenção a formalizar |
| RNF-009 | Exportações restritas por perfil | RBAC frontend/backend |
| RNF-010 | HTTPS em produção | Configuração de deployment |

#### RNF-011 a RNF-015 — Performance

| ID | Requisito | Meta |
|---|---|---|
| RNF-011 | Listagens paginadas | < 2 s para 10 000 registos |
| RNF-012 | Pesquisa global (Ctrl+K) | < 500 ms |
| RNF-013 | Pool de conexões BD | 10 conexões |
| RNF-014 | Lazy loading React | Redução do bundle inicial |
| RNF-015 | Limite payload JSON | 100 KB |

#### RNF-016 a RNF-022 — Usabilidade

| ID | Requisito |
|---|---|
| RNF-016 | Interface em Português (`i18n/locales/pt.ts`) |
| RNF-017 | Mensagens de erro localizadas |
| RNF-018 | Vista pipeline Kanban |
| RNF-019 | Painel lateral contextual (`ProcessDrawer.tsx`) |
| RNF-020 | Pesquisa global Ctrl/Cmd+K |
| RNF-021 | Modo claro/escuro |
| RNF-022 | Responsividade (Tailwind + MUI) |

#### RNF-023 a RNF-028 — Fiabilidade e Manutenibilidade

| ID | Requisito |
|---|---|
| RNF-023 | Arquitectura em camadas (Routes → Controllers → Services → Repositories) |
| RNF-024 | Migrações versionadas (46+ ficheiros) |
| RNF-025 | Documentação Swagger/OpenAPI |
| RNF-026 | Tratamento centralizado de erros |
| RNF-027 | Prepared statements (prevenção SQL Injection) |
| RNF-028 | Disponibilidade em produção — SLA a definir |

Documentos importantes produzidos durante o levantamento de requisitos encontram-se nos anexos e na pasta `relatorio_final/` do repositório.

---

## 3. Concepção da Solução e Modelação do Sistema

Este capítulo apresenta os modelos de sistemas informáticos que suportam a concepção do CRM Genoma: casos de uso, arquitectura, diagramas comportamentais e estruturais, desenho da base de dados e dicionário de dados.

### 3.1. Diagrama de Casos de Uso

O diagrama de casos de uso representa as funcionalidades da plataforma e a interacção dos actores com o sistema.

**Actores identificados:**

| Actor | Descrição |
|---|---|
| **Utilizador Autenticado** | Qualquer perfil com credenciais válidas |
| **Operador / Técnico** | Gestão de processos, stocks e colheitas |
| **Responsável Clínico** | Validação de resultados e relatórios |
| **Gestor Financeiro** | Faturação e exportações |
| **Administrador** | Configuração do sistema, utilizadores, catálogo |

**Casos de uso principais:**

| UC | Nome | Actor |
|---|---|---|
| UC01 | Autenticar utilizador | Todos |
| UC02 | Gerir contactos/pacientes | Operador |
| UC03 | Registar lote e kits | Operador (Stocks) |
| UC04 | Agendar colheita com reserva de kit | Operador |
| UC05 | Gerir processo clínico (workflow) | Operador / Técnico |
| UC06 | Registar resultados genéticos | Técnico / Bioinformático |
| UC07 | Validar resultado clínico | Responsável Clínico |
| UC08 | Gerar relatório PDF | Operador / Clínico |
| UC09 | Emitir fatura | Gestor Financeiro |
| UC10 | Consultar rastreabilidade (lote ↔ resultado) | Director Lab. |
| UC11 | Exportar listagens (Excel/CSV/PDF) | Utilizador autorizado |
| UC12 | Administrar utilizadores, testes e postos | Administrador |

**Descrição textual do diagrama:** O actor *Operador* estabelece associação com UC02–UC06 e UC11. O *Responsável Clínico* associa-se a UC07 e UC08. O *Gestor Financeiro* a UC09. O *Administrador* inclui UC12 e generaliza autenticação (UC01). UC10 é transversal a perfis com permissão de rastreio. Relações `<<include>>` de UC05 para UC01 (autenticação) e de UC04 para UC03 (disponibilidade de kits).

[INSERIR IMAGEM DO DIAGRAMA DE CASOS DE USO AQUI]

**Figura 2** — Diagrama de Casos de Uso do CRM Genoma

### 3.2. Arquitectura do Sistema

A arquitectura adopta o padrão **Three-Tier Architecture / API-Based**, promovendo separação clara entre apresentação, lógica de negócio e persistência.

#### Camada de Apresentação (Frontend)

- SPA **React 18.3** com **TypeScript**, build **Vite 6.3**, porta 5173 (dev)
- **React Router 7.13** com rotas protegidas (`RequireAuth`, `ProtectedRoute`)
- **Tailwind CSS 4** + **MUI 7** + **Radix UI** para componentes acessíveis
- Módulos: Dashboard, Contactos, Processos, Stocks, Listagens, Administração
- Cliente HTTP em `frontend/src/lib/api.ts` — JWT em `Authorization: Bearer`

#### Camada de Aplicação (Backend)

- **Node.js ≥ 18** + **Express 5.2**, porta 3000
- Padrão **Routes → Controllers → Services → Repositories**
- 20+ grupos de rotas: `/auth`, `/processos`, `/agendamentos`, `/stocks`, `/listagens`, `/trace`, etc.
- Middlewares: Helmet, CORS, rate-limit, JWT, express-validator
- Documentação Swagger em `/api-docs`

#### Camada de Dados

- **MariaDB/MySQL** — base `genoma`, 29 tabelas InnoDB, charset `utf8mb4_unicode_ci`
- Pool `mysql2` (10 conexões), UUIDs `CHAR(36)`, soft-delete, migrações versionadas

[INSERIR IMAGEM DO DIAGRAMA DE ARQUITECTURA THREE-TIER AQUI]

**Figura 3** — Diagrama de Arquitectura Three-Tier do CRM Genoma

### 3.3. Diagramas de Sequência e Actividades

#### 3.3.1. Sequência — Agendamento com Reserva de Kit

**Descrição textual:** O operador selecciona data, posto e paciente no calendário (`AgendamentosPage`). O frontend envia `POST /api/agendamentos`. O `colheitas.service.js` invoca o repositório que, numa transacção: (1) selecciona kit `Disponivel` compatível; (2) insere registo em `processos` com `status_id = 'Kit Reservado'`; (3) actualiza `kits.status = 'Reservado'`; (4) insere em `colheitas`; (5) regista em `logs_auditoria`. Resposta JSON devolve processo e colheita. Frontend actualiza calendário e pipeline.

[INSERIR IMAGEM DO DIAGRAMA DE SEQUÊNCIA — AGENDAMENTO AQUI]

**Figura 4** — Diagrama de Sequência — Agendamento com reserva de kit

#### 3.3.2. Sequência — Transição de Estado do Processo

**Descrição textual:** O técnico altera estado no pipeline Kanban ou no drawer lateral. Frontend envia `PUT /api/processos/:id`. O `processos.service.js` carrega processo actual, invoca `assertTransicaoValida(atual, destino)`, valida campos obrigatórios (ex.: kit após colheita), actualiza datas contextuais (`data_colheita`, `data_resultado`, etc.), persiste via repository e regista auditoria. Resposta inclui processo actualizado; UI reflecte novo estado.

[INSERIR IMAGEM DO DIAGRAMA DE SEQUÊNCIA — TRANSICÃO DE ESTADO AQUI]

**Figura 5** — Diagrama de Sequência — Transição de estado do processo

#### 3.3.3. Diagrama de Actividades — Fluxo do Processo

**Descrição textual:** O fluxo inicia com criação do processo (Agendado). Decisão: kit disponível? → Reserva (Kit Reservado). Colheita efectuada → Colheita Realizada. Envio ao laboratório → Enviado Laboratorio. Análise genómica → Em Analise. Resultados registados → Resultado Disponivel. Validação clínica → Validado. Emissão de fatura → Faturado (estado terminal). Em qualquer ponto não terminal, ramo para Cancelado. Paralelamente, movimentos de kit actualizam `movimentos_kits` e localização.

[INSERIR IMAGEM DO DIAGRAMA DE ACTIVIDADES AQUI]

**Figura 6** — Diagrama de Actividades — Fluxo operacional do processo clínico-laboratorial

### 3.4. Diagrama de Classes

**Classes principais do domínio operacional:**

| Classe / Entidade | Atributos relevantes | Responsabilidade |
|---|---|---|
| `Utilizador` | id, email, passwordHash, perfil_id | Autenticação e RBAC |
| `Perfil` | id, nome | Agrupamento de permissões |
| `Paciente` | id, nome, nif, data_nascimento | Contacto clínico |
| `Medico` | utilizador_id, num_ordem | Prescritor |
| `Teste` | id, nome, cromossomas, preco | Catálogo genómico |
| `Lote` | id, codigo_lote, validade, quantidade | Recepção de material |
| `Kit` | id, codigo_barras, status, localizacao | Amostra rastreável |
| `Processo` | id, numero_processo, status_id, datas | Entidade central do workflow |
| `Colheita` | id, data_prevista, data_efetiva | Agendamento |
| `ResultadoGenetico` | id, cromossoma, resultado_valor | Output da sequenciação |
| `Facturacao` | id, numero_fatura, preco_teste | Ciclo comercial |
| `LogAuditoria` | id, acao, tabela_afetada, registro_id | Rastreabilidade de acções |

**Relações:** `Processo` associa 1:1 a `Kit` (UNIQUE). `Lote` contém N `Kit`. `Processo` referencia `Paciente`, `Medico`, `Teste`, `Posto`. `Processo` contém N `ResultadoGenetico`. `Processo` contém 0..1 `Facturacao`.

[INSERIR IMAGEM DO DIAGRAMA DE CLASSES AQUI]

**Figura 7** — Diagrama de Classes — Domínio operacional do CRM Genoma

### 3.5. Database Design e Modelo ER

A base de dados `genoma` compreende **29 tabelas** organizadas em agregados:

| Domínio | Tabelas principais |
|---|---|
| Autenticação | `perfis`, `utilizadores`, `perfil_stock_submodulos` |
| Entidades | `empresas`, `postos`, `laboratorios` |
| Clínico | `pacientes`, `medicos`, `informacao_clinica` |
| Catálogo | `testes`, `itens_pesquisa`, `teste_composicao` |
| Stock | `lotes`, `kits`, `requisicoes_kits`, `movimentos_kits` |
| Operacional | `processo_status`, `processos`, `colheitas` |
| Resultados | `resultados_geneticos`, `assets_resultados`, `processo_relatorios` |
| Comercial | `facturacao` |
| Auditoria | `logs_auditoria` |

**Relações críticas:**
- `processos.kit_id` → `kits.id` (UNIQUE — 1:1)
- `kits.lote_id` → `lotes.id` (N:1)
- `processos.status_id` → `processo_status.nome`
- `facturacao.processo_id` → `processos.id`

**Convenções:** UUIDs `CHAR(36)`; soft-delete via `ativo`; charset `utf8mb4_unicode_ci`; 46+ migrações em `backend/src/migrations/`.

[INSERIR IMAGEM DO DIAGRAMA ENTIDADE-RELACIONAMENTO (ERD) AQUI]

**Figura 8** — Diagrama Entidade-Relacionamento — Base de dados `genoma`

### 3.6. Data Dictionary

#### Tabela `utilizadores`

| Coluna | Tipo | Nulo | Chave | Default | Descrição |
|---|---|---|---|---|---|
| id | CHAR(36) | NÃO | PK | — | UUID |
| perfil_id | CHAR(36) | SIM | FK → perfis.id | — | Perfil RBAC |
| empresa_id | CHAR(36) | SIM | FK → empresas.id | — | Empresa |
| nome | VARCHAR(100) | NÃO | — | — | Nome de apresentação |
| email | VARCHAR(100) | NÃO | UNIQUE | — | Email de login |
| telefone | VARCHAR(20) | SIM | — | — | Contacto |
| password_hash | TEXT | NÃO | — | — | Hash bcrypt |
| ativo | TINYINT(1) | SIM | — | 1 | Soft delete |
| created_at | TIMESTAMP | SIM | — | CURRENT_TIMESTAMP | Criação |
| reset_token_hash | VARCHAR(128) | SIM | — | — | Token recuperação |
| reset_token_expires_at | DATETIME | SIM | — | — | Expiração token |
| avatar_url | TEXT | SIM | — | — | Foto de perfil |

#### Tabela `kits` (Amostras)

| Coluna | Tipo | Nulo | Chave | Default | Descrição |
|---|---|---|---|---|---|
| id | CHAR(36) | NÃO | PK | — | UUID |
| codigo_barras | VARCHAR(50) | NÃO | UNIQUE | — | Identificador físico |
| numero_kit | VARCHAR(50) | SIM | — | — | Número sequencial |
| tracking | VARCHAR(100) | SIM | — | — | Tracking logístico |
| tipo_kit_id | CHAR(36) | SIM | FK → testes.id | — | Tipo compatível |
| lote_id | CHAR(36) | SIM | FK → lotes.id | — | Lote de origem |
| status | ENUM | SIM | INDEX | Disponivel | Estado do kit |
| localizacao | ENUM | SIM | — | Escritorio | Escritorio/Posto/Laboratorio |
| data_validade | DATE | SIM | — | — | Validade |

#### Tabela `testes`

| Coluna | Tipo | Nulo | Chave | Default | Descrição |
|---|---|---|---|---|---|
| id | CHAR(36) | NÃO | PK | — | UUID |
| nome | VARCHAR(100) | NÃO | — | — | Nome comercial |
| codigo | VARCHAR(20) | SIM | — | — | Código interno |
| preco | DECIMAL(10,2) | SIM | — | 0.00 | Preço base |
| cromossomas | TEXT | SIM | — | — | Cromossomas analisados |
| gestacao_minima_semanas | INT(11) | SIM | — | — | Semanas mínimas |
| incluir_fracao_fetal | TINYINT(1) | SIM | — | 1 | Fração fetal |
| ativo | TINYINT(1) | SIM | — | 1 | Activo no catálogo |

#### Tabela `processos`

| Coluna | Tipo | Nulo | Chave | Default | Descrição |
|---|---|---|---|---|---|
| id | CHAR(36) | NÃO | PK | — | UUID |
| numero_processo | VARCHAR(20) | NÃO | UNIQUE | — | Número legível |
| paciente_id | CHAR(36) | SIM | FK | — | Paciente |
| medico_id | CHAR(36) | SIM | FK | — | Médico prescritor |
| kit_id | CHAR(36) | SIM | FK, UNIQUE | — | Kit 1:1 |
| teste_id | CHAR(36) | SIM | FK | — | Tipo de teste |
| status_id | VARCHAR(30) | SIM | FK | — | Estado workflow |
| data_entrada | TIMESTAMP | SIM | INDEX | CURRENT_TIMESTAMP | Abertura |
| data_colheita | DATE | SIM | — | — | Colheita efectiva |
| data_validacao | DATE | SIM | — | — | Validação clínica |
| fatura_numero | VARCHAR(50) | SIM | — | — | Número fatura |
| valor_final | DECIMAL(10,2) | SIM | — | 0.00 | Valor facturado |
| relatorio_validado | TINYINT(1) | SIM | — | 0 | Relatório validado |

#### Tabela `facturacao`

| Coluna | Tipo | Nulo | Chave | Default | Descrição |
|---|---|---|---|---|---|
| id | CHAR(36) | NÃO | PK | — | UUID |
| processo_id | CHAR(36) | SIM | FK → processos.id | — | Processo |
| preco_teste | DECIMAL(10,2) | SIM | — | 0.00 | Preço |
| numero_fatura | VARCHAR(50) | SIM | — | — | Número |
| data_fatura | DATE | SIM | — | — | Data emissão |
| entidade_multibanco | VARCHAR(20) | SIM | — | — | Entidade MB |
| referencia_multibanco | VARCHAR(20) | SIM | — | — | Referência MB |
| created_at | TIMESTAMP | SIM | — | CURRENT_TIMESTAMP | Criação |

#### Tabela `logs_auditoria`

| Coluna | Tipo | Nulo | Chave | Default | Descrição |
|---|---|---|---|---|---|
| id | CHAR(36) | NÃO | PK | — | UUID |
| empresa_id | CHAR(36) | SIM | FK | — | Contexto |
| utilizador_id | CHAR(36) | SIM | FK | — | Autor da acção |
| acao | VARCHAR(100) | SIM | — | — | CREATE/UPDATE/... |
| tabela_afetada | VARCHAR(100) | SIM | — | — | Tabela |
| registro_id | CHAR(36) | SIM | — | — | ID afectado |
| data | TIMESTAMP | SIM | — | CURRENT_TIMESTAMP | Data/hora |

Documentação completa das 29 tabelas: `BASE_DE_DADOS.md` (repositório).

Documentos ou protótipos desenvolvidos pelo autor encontram-se nos anexos e no repositório GitHub do projecto.

---

## 4. Implementação, Interface e Validação do CRM Genoma

Este capítulo descreve o trabalho de implementação efectivamente realizado: stack tecnológico, módulos funcionais, design da interface, casos de teste e matriz de rastreabilidade.

### 4.1. Stack Tecnológico e Módulos Implementados

#### Stack Tecnológico

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React + TypeScript | 18.3.1 |
| Build | Vite | 6.3.5 |
| Routing | React Router | 7.13.0 |
| UI | MUI + Tailwind + Radix UI | 7.3 / 4.1 |
| Backend | Node.js + Express | ≥18 / 5.2.1 |
| Base de Dados | MariaDB/MySQL | 10.x / 8.x |
| Driver SQL | mysql2 | 3.18.2 |
| Auth | JWT + bcrypt | 9.0 / 6.0 |
| Exportação | ExcelJS | 4.4.0 |
| Testes | Jest | configurado |
| Docs API | Swagger UI | 5.0.1 |

#### Módulos Implementados

| Módulo | Rota | Funcionalidades principais |
|---|---|---|
| **Dashboard** | `/` | KPIs, alertas, processos atrasados, colheitas do dia |
| **Contactos** | `/contactos` | CRUD pacientes; conversão em processo |
| **Processos** | `/processos` | Pipeline Kanban; drawer lateral; workflow completo |
| **Stocks** | `/stocks` | Lotes, kits, requisições, movimentos, alertas |
| **Agendamentos** | *(integrado)* | Calendário; reserva automática de kit |
| **Listagens** | `/listagens` | 9 listagens; filtros; exportação Excel/CSV/PDF |
| **Administração** | `/definicoes` | Utilizadores, perfis, testes, postos, laboratórios, motivos anulação |

#### Estado de Implementação (Junho 2026)

Conforme `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md`:

- Todos os módulos **constroem e compilam sem erros**
- Migrações de BD aplicáveis definidas (foto perfil, motivos anulação, password opcional)
- **Pendente:** ligação de motivos de anulação ao ecrã de processos; credenciais e-mail/SMS; importação histórica; modelo gráfico de relatório Genoma

### 4.2. Design da Interface do Utilizador

#### Storyboard — Operador de Processos

| Etapa | Descrição |
|---|---|
| Login | Autenticação JWT; redireccionamento para Dashboard |
| Dashboard | Visualização de KPIs e alertas operacionais |
| Processos | Pipeline Kanban por estado; drag-and-drop |
| Detalhe | Drawer lateral com separadores contextuais |
| Resultado | Registo por cromossoma; upload PDF |
| Faturação | Emissão com desconto e referências MB |
| Listagens | Filtros avançados; exportação multi-formato |

#### Wireframes e Mockups

Interfaces desenvolvidas com **React + Tailwind + MUI**, com componentes Radix UI para acessibilidade. A vista pipeline (`ProcessPipeline.tsx`) utiliza **React DnD** para transições visuais de estado. Pesquisa global activável via **Ctrl/Cmd+K** (`cmdk`).

[INSERIR IMAGEM DO MOCKUP — PIPELINE DE PROCESSOS AQUI]

**Figura 9** — Vista pipeline (Kanban) do módulo de Processos

[INSERIR IMAGEM DO MOCKUP — ADMINISTRAÇÃO AQUI]

**Figura 10** — Mockup do módulo de Administração

#### Guia de Estilo

- Tipografia: Inter (frontend)
- Tema claro/escuro via `ThemeContext.tsx`
- Tokens de design em `frontend/src/lib/design-tokens.ts`
- Mensagens de erro em Português (`i18n/locales/pt.ts`)

#### Acessibilidade

Avaliação alinhada com **WCAG 2.1/2.2 (nível AA)**. Componentes Radix UI garantem semântica e navegação por teclado. Recomendações: validar contraste em produção e testes com leitor de ecrã.

### 4.3. Test Cases

| ID | Requisito | Prioridade | Resultado Esperado | Estado |
|---|---|---|---|---|
| TC-001 | RF-004 — Registo de lote | Alta | Lote criado; N kits gerados; auditoria registada | Por executar |
| TC-002 | RF-005 — Agendamento | Alta | Processo + colheita + kit reservado | Por executar |
| TC-003 | RF-007 — Transição válida | Crítica | Estados avançam sequencialmente | Por executar |
| TC-003-N | RF-007 — Transição inválida | Crítica | Erro "Transicao de estado invalida" | Por executar |
| TC-004 | RF-008 — Resultados genéticos | Alta | Registos por cromossoma + PDF | Por executar |
| TC-005 | RF-009 — Validação clínica | Alta | Estado Validado; data_validacao | Por executar |
| TC-006 | RF-010 — Faturação | Alta | Estado Faturado; valor_final correcto | Por executar |
| TC-006-N | RF-010 — Desconto inválido | Alta | Erro se desconto > 100% | Por executar |
| TC-007 | RF-001/002 — Auth e RBAC | Crítica | 401 sem token; módulos restritos | Por executar |
| TC-008 | RF-011 — Rastreabilidade | Alta | Cadeia lote → processo → resultado | Por executar |
| TC-009 | RF-014 — Exportação | Média | Excel/CSV/PDF com filtros | Por executar |
| TC-010 | RF-006 — Integridade kit 1:1 | Alta | Segundo processo com mesmo kit falha | Por executar |

Detalhe completo dos passos de execução: **Anexo B** e `05_TEST_CASES_E_RASTREABILIDADE.md`.

### 4.4. Matriz de Rastreabilidade

| RF | Descrição | UC | TC |
|---|---|---|---|
| RF-001 | Autenticação JWT | UC01 | TC-007 |
| RF-002 | Perfis e permissões | UC12 | TC-007 |
| RF-003 | Contactos/pacientes | UC02 | — |
| RF-004 | Lotes e kits | UC03 | TC-001 |
| RF-005 | Agendamentos | UC04 | TC-002 |
| RF-006 | Processos | UC05 | TC-010 |
| RF-007 | Workflow estados | UC05 | TC-003, TC-003-N |
| RF-008 | Resultados genéticos | UC06 | TC-004 |
| RF-009 | Validação/relatórios | UC07, UC08 | TC-005 |
| RF-010 | Faturação | UC09 | TC-006, TC-006-N |
| RF-011 | Rastreabilidade | UC10 | TC-008 |
| RF-012 | Movimentos kits | UC03 | TC-001 |
| RF-013 | Dashboard | UC05 | TC-003 |
| RF-014 | Listagens/exportação | UC11 | TC-009 |

**Cobertura:** 13 de 19 RF com test cases definidos (68%). Todas as 12 user stories possuem pelo menos um TC associado.

Documentos importantes produzidos durante a implementação encontram-se no repositório (`backend/`, `frontend/`, `BASE_DE_DADOS.md`, `backend/ARCHITECTURE.md`).

---

## 5. Conclusões e Perspectivas de Trabalho Futuro

### 5.1. Conclusões

O projecto CRM Genoma demonstrou a viabilidade técnica, operacional e económica de digitalizar o fluxo completo de testes genéticos numa plataforma web integrada. O trabalho desenvolvido permitiu:

1. **Transformar um CRM genérico** num sistema operacional alinhado com o fluxo real: Lote → Kit → Agendamento → Colheita → Processo → Resultado → Relatório → Faturação.

2. **Implementar rigor operacional** através de uma máquina de estados finita com 9 estados, impedindo transições inválidas que comprometeriam a rastreabilidade clínica.

3. **Garantir rastreabilidade ponta a ponta** entre lotes, kits, processos e resultados, requisito essencial para conformidade regulatória e gestão de recalls.

4. **Adoptar arquitectura Three-Tier** com separação clara de responsabilidades (React SPA + API Express + MariaDB), facilitando manutenção e evolução.

5. **Assegurar segurança e conformidade** com JWT, bcrypt, RBAC, auditoria, soft-delete e tratamento de dados genéticos sensíveis ao abrigo do RGPD.

6. **Entregar módulos funcionais** — Dashboard, Contactos, Processos, Stocks, Listagens e Administração — operacionais e a compilar sem erros.

O projecto cumpre os objectivos definidos na fase de análise e concepção, constituindo uma base sólida para entrada em produção após validação com o cliente Genoma.

### 5.2. Perspectivas de Trabalho Futuro

| Prioridade | Trabalho futuro |
|---|---|
| Alta | Ligar motivos de anulação ao ecrã de cancelamento de processos |
| Alta | Validar fluxo completo em ambiente real com equipa Genoma |
| Média | Activar notificações e-mail/SMS com credenciais reais |
| Média | Implementar suite de testes automatizados (Jest + E2E) |
| Média | Modelo gráfico de relatório/fatura personalizado Genoma |
| Baixa | Integração com software de faturação certificado |
| Baixa | Importação de dados históricos (pacientes, processos, lotes) |
| Baixa | Deploy em produção com HTTPS, backups e monitorização |

---

## 6. Referências e Bibliografia

FIELDING, Roy T. (2000), *Architectural Styles and the Design of Network-based Software Architectures* — Dissertação doctoral, University of California, Irvine.

ISO (1976), *ISO 214:1976 — Documentation — Abstracts for publications and documentation*, International Organization for Standardization.

PARLAMENTO EUROPEU E CONSELHO (2016), *Regulamento (UE) 2016/679* — Regulamento Geral sobre a Protecção de Dados (RGPD), Jornal Oficial da União Europeia.

SOMMERVILLE, Ian (2016), *Software Engineering*, 10.ª ed., Pearson Education.

VARAJÃO, João E. Q. (1998), *A Arquitectura da Gestão de Sistemas de Informação*, FCA — Editora de Informática.

W3C (2023), *Web Content Accessibility Guidelines (WCAG) 2.2*, https://www.w3.org/TR/WCAG22/

Documentação técnica oficial:
- React — https://react.dev
- Node.js — https://nodejs.org
- Express — https://expressjs.com
- MariaDB — https://mariadb.org
- Vite — https://vitejs.dev

Documentação interna do projecto:
- `BASE_DE_DADOS.md` — Schema completo (29 tabelas)
- `backend/ARCHITECTURE.md` — Arquitectura em camadas
- `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md` — Estado do projecto

---

## ANEXO A: User Stories Completas

### US-001 — Recepção e Registo de Lotes de Kits

**Como** gestor de stocks, **quero** registar a recepção de um lote de kits, **para** garantir rastreabilidade desde a origem do material biológico.

**Critérios de Aceitação:** CA-001.1 a CA-001.5 (ver Capítulo 2, secção 2.3).

---

### US-002 — Gestão de Inventário de Kits

**Como** técnico de stocks, **quero** consultar estado e localização de cada kit, **para** saber em tempo real onde se encontra o material.

**Critérios de Aceitação:** CA-002.1 a CA-002.5 — KPIs (`StockKpis.tsx`); alertas expiração; movimentos em `movimentos_kits`; RBAC `perfil_stock_submodulos`.

---

### US-003 — Agendamento com Reserva Automática de Kit

**Critérios de Aceitação:** CA-003.1 a CA-003.5 (ver Capítulo 2).

---

### US-004 — Conversão de Contacto em Processo

**Critérios de Aceitação:** CA-004.1 a CA-004.5 — fluxo `ContactDetail.tsx`; `uk_processos_kit`; `informacao_clinica`.

---

### US-005 — Triagem e Transição de Estados

**Critérios de Aceitação:** CA-005.1 a CA-005.5 — `TRANSICOES_VALIDAS`; `ProcessPipeline.tsx`.

---

### US-006 — Recepção de Amostra no Laboratório

**Critérios de Aceitação:** CA-006.1 a CA-006.5 — `data_chegada_laboratorio`; `kit-lifecycle.service.js`.

---

### US-007 — Registo de Resultados Genéticos

**Critérios de Aceitação:** CA-007.1 a CA-007.5 — `resultados_geneticos`; `assets_resultados`.

---

### US-008 — Validação Clínica

**Critérios de Aceitação:** CA-008.1 a CA-008.5 — transição para `Validado`; `relatorio_validado`.

---

### US-009 — Geração de Relatório e Envio

**Critérios de Aceitação:** CA-009.1 a CA-009.5 — `processo_relatorios`; `estado_envio`.

---

### US-010 — Faturação

**Critérios de Aceitação:** CA-010.1 a CA-010.5 (ver Capítulo 2).

---

### US-011 — Rastreabilidade Ponta a Ponta

**Critérios de Aceitação:** CA-011.1 a CA-011.5 — `/api/trace`.

---

### US-012 — Pesquisa Global e Exportação

**Critérios de Aceitação:** CA-012.1 a CA-012.5 — 9 listagens; `export.service.js` (ExcelJS).

---

## ANEXO B: Casos de Teste Detalhados

### TC-001 — Registo de Lote e Geração de Kits

| Campo | Valor |
|---|---|
| RF | RF-004 |
| US | US-001 |
| Prioridade | Alta |
| Pré-condições | Utilizador autenticado com permissão Stocks (write); tipo kit em `testes` |

**Passos:** (1) Stocks → Lotes → Novo Lote · (2) Preencher codigo_lote, quantidade=3, validade · (3) Submeter · (4) Verificar 3 kits Disponivel · (5) Verificar logs_auditoria.

**Resultado esperado:** HTTP 201; kits com codigo_barras único.

---

### TC-003 — Transição de Estado (Positivo e Negativo)

**Cenário positivo:** Agendado → Kit Reservado → ... → Faturado (todas aceites).

**Cenário negativo:** Agendado → Em Analise (rejeitado com mensagem descritiva).

**Referência de código:**

```javascript
const TRANSICOES_VALIDAS = {
  'Agendado': ['Kit Reservado', 'Cancelado'],
  'Kit Reservado': ['Colheita Realizada', 'Agendado', 'Cancelado'],
  'Colheita Realizada': ['Enviado Laboratorio', 'Cancelado'],
  'Enviado Laboratorio': ['Em Analise', 'Cancelado'],
  'Em Analise': ['Resultado Disponivel', 'Cancelado'],
  'Resultado Disponivel': ['Validado', 'Cancelado'],
  'Validado': ['Faturado', 'Cancelado'],
  'Faturado': [],
  'Cancelado': [],
};
```

*Ficheiro: `backend/src/services/processos.service.js`*

---

### TC-006 — Geração de Fatura

**Passos:** (1) Processo em Validado · (2) valor_base=150, desconto=10% · (3) Emitir fatura · (4) Verificar valor_final=135 · (5) Estado Faturado terminal.

**Cenário negativo:** desconto=150 → erro de validação.

---

*Documentação completa de TC-002 a TC-010: `relatorio_final/05_TEST_CASES_E_RASTREABILIDADE.md`*

---

*Relatório Final de Projecto — CRM Genoma · Rafael Fernandes Males (a22212343) · ISLA · Junho de 2026*
