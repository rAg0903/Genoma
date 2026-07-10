# Capítulo 2 — User Stories e Levantamento de Requisitos

**Projeto:** CRM Genoma  
**Versão do Documento:** 1.0  
**Data:** Junho de 2026

---

## 2.1. Metodologia de Levantamento

O levantamento de requisitos combinou:

1. **Análise do domínio** com base na documentação do cliente e no código implementado.
2. **Inspeção do sistema** — módulos React (`frontend/src/app/components/`) e serviços backend (`backend/src/services/`).
3. **Entrevistas semi-estruturadas** com stakeholders (ver Capítulo 1).
4. **Reuniões de sincronização com o cliente** (Nuno/Genoma) — três sessões de recolha e validação incremental de requisitos, alinhadas com os sprints, que consolidaram as decisões de negócio sintetizadas na secção 2.7.
5. **Derivação de User Stories** no formato *Como [ator], quero [acção], para [benefício]*, com Critérios de Aceitação testáveis.

---

## 2.2. User Stories

### US-001 — Recepção e Registo de Lotes de Kits

**Como** gestor de stocks,  
**quero** registar a recepção de um lote de kits com código, fornecedor, quantidade e data de validade,  
**para** garantir rastreabilidade desde a origem do material biológico.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-001.1 | O sistema exige `codigo_lote` único na tabela `lotes` | Tentativa de duplicado retorna erro |
| CA-001.2 | Cada lote associa-se a um `tipo_kit_id` (referência a `testes`) e `fornecedor_id` | FK validada na BD |
| CA-001.3 | Ao criar lote, são gerados automaticamente N kits individuais com `codigo_barras` único | Contagem de kits = `quantidade` |
| CA-001.4 | O estado inicial do lote é "Disponivel" | Campo `lotes.estado` |
| CA-001.5 | A acção é registada em `logs_auditoria` | Entrada com `tabela_afetada = 'lotes'` |

---

### US-002 — Gestão de Inventário de Kits

**Como** técnico de stocks,  
**quero** consultar o estado e localização de cada kit (Disponível, Reservado, Em trânsito, Utilizado, Inválido, Perdido, Expirado),  
**para** saber em tempo real onde se encontra o material.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-002.1 | A listagem de kits apresenta KPIs: disponíveis, reservados, a expirar, inválidos | Componente `StockKpis.tsx` |
| CA-002.2 | Kits expirados ou com validade ultrapassada são sinalizados automaticamente | Query em `stocks.repository.js` |
| CA-002.3 | Alertas de stock por posto: vermelho quando 0, aviso entre 1 e 4, normal a partir de 5; stock mínimo configurável por posto (incluindo zero) | Dashboard / alertas / Inventário por local |
| CA-002.4 | Movimentos entre locais (Escritório, Posto, Laboratório) ficam em `movimentos_kits` | Histórico consultável |
| CA-002.5 | Permissões de stock são controladas por submódulo via `perfil_stock_submodulos` | RBAC granular |
| CA-002.6 | Os lotes são criados vazios (com validade) e os kits inseridos manualmente com leitura de código de barras, com adição de múltiplos em sequência | Formulário de kits |
| CA-002.7 | A criação de kit valida duplicados de imediato, com alerta e indicação do processo/cliente associado | Validação na BD |
| CA-002.8 | Os kits associam-se ao Teste (não à "opção"); por defeito ficam na empresa (Genoma) | `tipo_kit_id`, `localizacao = Escritorio` |
| CA-002.9 | As transferências usam o conceito "Envio" (sem estados "pendente"/"em trânsito"); o kit move-se automaticamente Empresa → Posto → Laboratório, com tracking opcional e destino ao laboratório final (FeatureHealth, UK) | `movimentos_kits`, `kit-lifecycle.js` |

**Decisão do cliente (R2/R3):** a antiga "Requisição" de kits passou a "Envio" (reservando "Requisição" para os pedidos de teste dos médicos); os estados "pendente"/"em trânsito" foram eliminados a favor de transições automáticas; a origem determina os kits disponíveis (independentemente do lote) e o destino é escolhido em dois passos (Laboratório → Posto), podendo incluir o laboratório final.

---

### US-003 — Agendamento de Colheita com Reserva Automática de Kit

**Como** rececionista de posto de colheita,  
**quero** agendar uma colheita no calendário e reservar automaticamente um kit compatível,  
**para** evitar marcações sem material disponível.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-003.1 | Ao agendar, o sistema selecciona kit `Disponivel` do tipo correcto | `colheitas.repository.js` |
| CA-003.2 | O kit passa a estado `Reservado` e o processo a `Kit Reservado` | Transacção atómica na BD |
| CA-003.3 | O calendário apresenta carga por dia com codificação por cores (verde: ≥1 colheita; amarelo: 2; vermelho: 3–4, indicando carga elevada) | Módulo de agendamentos |
| CA-003.4 | É registada colheita em `colheitas` com `data_prevista`, `posto_id` e `periodo` | Persistência validada |
| CA-003.5 | O processo é criado automaticamente a partir do agendamento | `numero_processo` gerado |
| CA-003.6 | O agendamento verifica o stock de kit do posto na data; sem kit disponível não é possível marcar colheita | Verificação de stock por posto |
| CA-003.7 | O posto de colheita pode ser escolhido por proximidade (código postal da utente) ou manualmente | Pesquisa por proximidade |

**Decisão do cliente (R1/R3):** o calendário usa cores como indicador de capacidade/pressão (sem limite rígido de marcações). A escolha do posto por proximidade e a verificação de stock na data foram validadas para evitar colheitas sem material.

---

### US-004 — Conversão de Contacto em Processo

**Como** operador de contactos,  
**quero** converter um contacto/paciente existente num processo clínico associando teste, médico e kit,  
**para** iniciar o acompanhamento operacional do exame.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-004.1 | O fluxo Contacto → Kit → Processo está operacional | `ContactDetail.tsx`, API `/api/processos` |
| CA-004.2 | A `data_entrada` do processo corresponde ao dia da conversão (fuso horário local) | Normalização de datas no backend |
| CA-004.3 | Cada processo tem `numero_processo` único (varchar 20) | Constraint `UNIQUE` |
| CA-004.4 | Um kit só pode estar associado a um processo (relação 1:1) | `uk_processos_kit` |
| CA-004.5 | Dados clínicos de gravidez podem ser registados em `informacao_clinica` | Campos de semanas, tipo gravidez |
| CA-004.6 | A ficha do contacto organiza-se em separadores (Identificação, Gravidez, Colheita, Faturação, Notas, Anexos), sem a antiga aba "Marketing" | `ContactViewPage.tsx`, `record-tabs.ts` |
| CA-004.7 | A origem da conceção (natural vs fertilização/FIV) é registável | `origem_conceicao` (migração 060) |
| CA-004.8 | A morada suporta País/Distrito/Cidade com autofill a partir do código postal | Campos de identificação |
| CA-004.9 | Ao seleccionar o médico, apenas surgem as clínicas associadas a esse médico | Filtro médico → clínicas |

**Decisão do cliente (R2/R3):** a aba "Marketing" foi removida e mantiveram-se Notas e Anexos; foram adicionados País/Distrito/Cidade com autofill por código postal, o campo de conceção (natural/FIV) e o filtro das clínicas pelas associadas ao médico escolhido.

---

### US-005 — Triagem e Transição de Estados do Processo

**Como** técnico de laboratório,  
**quero** avançar o processo apenas para estados válidos do workflow,  
**para** impedir saltos de fase que comprometam a rastreabilidade.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-005.1 | Transições válidas estão definidas em `TRANSICOES_VALIDAS` no backend | Ver tabela abaixo |
| CA-005.2 | Transição inválida retorna erro descritivo ao utilizador | `assertTransicaoValida()` |
| CA-005.3 | A vista pipeline (Kanban) reflecte o estado actual de cada processo | `ProcessPipeline.tsx` |
| CA-005.4 | Processos parados > 7 dias aparecem como "atrasados" no dashboard | KPI configurável |
| CA-005.5 | Cancelamento só é permitido a partir de estados não terminais | Estado `Cancelado` terminal |

**Máquina de Estados Implementada:**

```
Agendado → Kit Reservado → Colheita Realizada → Enviado Laboratorio
         → Em Analise → Resultado Disponivel → Validado → Faturado
(qualquer estado não terminal pode transitar para Cancelado)
```

---

### US-006 — Recepção de Amostra no Laboratório (Extração/Processamento)

**Como** técnico de laboratório,  
**quero** registar a chegada da amostra ao laboratório e iniciar a fase de análise,  
**para** documentar o início do processamento genómico (extração de ADN, preparação para sequenciação).

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-006.1 | Ao receber amostra, `data_chegada_laboratorio` é preenchida | Campo em `processos` |
| CA-006.2 | Estado transita de `Enviado Laboratorio` para `Em Analise` | Validação de transição |
| CA-006.3 | O kit associado actualiza localização para `Laboratorio` | `kit-lifecycle.service.js` |
| CA-006.4 | Movimento de kit é registado com motivo adequado | `movimentos_kits` |
| CA-006.5 | Painel lateral do processo apresenta separador "Fluxo de trabalho" | `ProcessDrawer.tsx` |

---

### US-007 — Registo de Resultados Genéticos (Sequenciação)

**Como** bioinformático / técnico de análise,  
**quero** registar resultados por cromossoma e carregar ficheiros PDF de análise,  
**para** consolidar o output da sequenciação no processo.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-007.1 | Resultados são persistidos em `resultados_geneticos` por `cromossoma` | FK `processo_id` |
| CA-007.2 | Ficheiros PDF ficam em `assets_resultados` com `url_ficheiro` | Upload associado ao processo |
| CA-007.3 | Estado do processo pode transitar para `Resultado Disponivel` | Transição validada |
| CA-007.4 | Campos `resultado_tudo_ok` e `resultado_anomalias` são actualizáveis | `processos` |
| CA-007.5 | Metadados do teste (cromossomas 1–23, deleções/duplicações, microdeleções/microduplicações, gémeos) vêm de `testes` | Catálogo pré-configurado |
| CA-007.6 | Por defeito o resultado assume "nenhuma anomalia detectada" ("tudo OK"), assinalando apenas as anomalias (ex.: trissomia 21) | `resultado_tudo_ok = 1` por defeito |
| CA-007.7 | A fração fetal é um campo de escrita (0–100%), presente por defeito | `fracao_fetal`, `incluir_fracao_fetal` |
| CA-007.8 | São registáveis a data de envio ao laboratório e a data de recepção no laboratório | `data_envio_laboratorio`, `data_chegada_laboratorio` |

**Decisão do cliente (R1/R2):** adoptou-se o padrão "tudo OK" por defeito nos cromossomas para reduzir o esforço e o erro de marcar manualmente os 23 pares; a fração fetal ficou como campo de escrita (sem dropdown). O conteúdo do relatório depende do teste e das opções seleccionadas.

---

### US-008 — Validação Clínica de Resultados

**Como** responsável clínico,  
**quero** validar o resultado e o relatório antes do envio ao paciente/médico,  
**para** garantir conformidade clínica e legal.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-008.1 | Validação só é possível a partir de `Resultado Disponivel` | `TRANSICOES_VALIDAS` |
| CA-008.2 | `data_validacao` e `relatorio_validado = 1` são registados | Campos em `processos` |
| CA-008.3 | Relatório PDF é gerado e guardado em `processo_relatorios` | `pdf_url`, `estado_envio` |
| CA-008.4 | Estado transita para `Validado` | Workflow |
| CA-008.5 | Acção fica registada em auditoria com identificação do utilizador | `logs_auditoria` |

---

### US-009 — Geração de Relatório e Envio

**Como** operador administrativo,  
**quero** gerar o relatório clínico em PDF e registar o envio ao destinatário,  
**para** documentar a entrega do resultado ao paciente ou médico.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-009.1 | Relatório é gerado com template configurável | `processo_relatorios.template` |
| CA-009.2 | `data_envio_relatorio` é registada no processo | Campo `processos` |
| CA-009.3 | Destinatário registado em `relatorio_enviado_para` | Enum de destinos |
| CA-009.4 | Estado de envio: Pendente / Enviado / Falha | `processo_relatorios.estado_envio` |
| CA-009.5 | Notificação in-app e canal externo preparado (e-mail/SMS) | `notificacoes.service.js`, `/api/notificacoes`, `NotificationsPage.tsx` |

---

### US-010 — Faturação de Processo

**Como** gestor financeiro,  
**quero** emitir fatura com numeração, valor base, desconto e referências multibanco, e registar o pagamento,  
**para** concluir o ciclo comercial do exame genético.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-010.1 | Faturação só é possível a partir do estado `Validado` | Transição para `Faturado` |
| CA-010.2 | Campos `fatura_numero`, `fatura_data_emissao`, `valor_final` são persistidos | `processos` |
| CA-010.3 | Registo complementar em `facturacao` com `preco_teste`, referências MB | Tabela dedicada |
| CA-010.4 | Desconto percentual validado entre 0 e 100 (ex.: 10% para médicos) | Validação no service |
| CA-010.5 | Estado `Faturado` é terminal (sem transições posteriores) | `TRANSICOES_VALIDAS['Faturado'] = []` |
| CA-010.6 | O preço por defeito é obtido da definição do teste, com override manual | `testes.preco_venda` → `valor_base` |
| CA-010.7 | O pagamento é registável com estado Pago, data de pagamento e número de recibo | `pago`, `pagamento_data`, número de recibo |
| CA-010.8 | O dashboard sinaliza faturas não emitidas e não pagas | Alertas de faturação |

**Decisão do cliente (R2):** a emissão de fatura não é obrigatória no momento de criação do processo; evitou-se uma separação rígida "pendente/faturado" que comprometesse o histórico, mantendo antes os estados "Fatura emitida" e "Pago". A emissão fiscal oficial (AT) é tratada externamente.

---

### US-011 — Rastreabilidade Ponta a Ponta (Lote → Resultado)

**Como** director de laboratório,  
**quero** consultar a cadeia completa de um lote, kit ou resultado em ambos os sentidos,  
**para** responder a recalls ou auditorias regulatórias.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-011.1 | API `/api/trace` permite rastreio por lote, kit ou processo | `trace.routes.js` |
| CA-011.2 | De um lote é possível listar todos os kits e processos derivados | Query relacional |
| CA-011.3 | De um resultado é possível recuar até ao lote de origem | Cadeia inversa |
| CA-011.4 | Separador "Rastreabilidade" no painel do processo | `ProcessDrawer.tsx` |
| CA-011.5 | Listagem de auditoria exportável (Excel/CSV/PDF) | Módulo Listagens |

---

### US-012 — Pesquisa Global e Exportação de Dados

**Como** utilizador autorizado,  
**quero** pesquisar instantaneamente por nome, número de processo, código de kit ou lote e exportar listagens filtradas,  
**para** obter relatórios operacionais sem intervenção técnica.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-012.1 | Pesquisa global activável com Ctrl/Cmd+K | Componente de pesquisa |
| CA-012.2 | 9 listagens disponíveis: Processos, Resultados, Faturação, Colheitas, Kits, Lotes, Pacientes, Médicos, Auditoria | `listingConfig.ts` |
| CA-012.3 | Filtros avançados por data, estado, médico, posto, empresa, tipo de teste | `AdvancedFilters.tsx` |
| CA-012.4 | Exportação para Excel, CSV e PDF respeitando filtros activos | `export.service.js` (ExcelJS) |
| CA-012.5 | Exportação restrita a perfis com permissão adequada | RBAC |

---

### US-013 — Isolamento de Dados e Painel do Médico Prescritor

**Como** médico prescritor,  
**quero** consultar apenas os meus doentes, processos e KPIs num painel dedicado,  
**para** ter uma visão clínica focada sem exposição a dados de outros médicos.

#### Critérios de Aceitação

| ID | Critério | Verificação |
|---|---|---|
| CA-013.1 | APIs de contactos e processos filtram por `medico_id` do utilizador autenticado | `medico-access.js`, `pacientes.service.js`, `processos.service.js` |
| CA-013.2 | Dashboard operacional calcula KPIs apenas com dados do médico | `dashboards.repository.js` |
| CA-013.3 | Perfil Médico vê `MedicoDashboard.tsx` em vez do painel administrativo | `DashboardPage.tsx` |
| CA-013.4 | Saudação e menu exibem título Dr./Dra. | `formatUtilizadorGreeting`, `AuthContext.tsx` |
| CA-013.5 | Formulário de contacto bloqueia campo médico para perfil Médico | `ContactFormPage.tsx` |
| CA-013.6 | Médicos aparecem em Utilizadores com título; edição via rota dedicada | `SettingsPage.tsx`, `/definicoes/utilizadores/:id/editar` |

---

## 2.3. Requisitos Funcionais (RF)

| ID | Requisito | Prioridade | User Story | Estado |
|---|---|---|---|---|
| RF-001 | Autenticação por JWT com recuperação de password | Alta | — | Implementado |
| RF-002 | Gestão de utilizadores, perfis e permissões por módulo | Alta | US-012 | Implementado |
| RF-003 | CRUD de contactos/pacientes com dados demográficos e clínicos | Alta | US-004 | Implementado |
| RF-004 | CRUD de lotes e kits com rastreabilidade por código de barras | Alta | US-001, US-002 | Implementado |
| RF-005 | Agendamento de colheitas com reserva automática de kit | Alta | US-003 | Implementado |
| RF-006 | Criação e gestão de processos clínicos (entidade central) | Alta | US-004, US-005 | Implementado |
| RF-007 | Workflow com máquina de estados e transições validadas | Alta | US-005 | Implementado |
| RF-008 | Registo de resultados genéticos por cromossoma | Alta | US-007 | Implementado |
| RF-009 | Validação clínica e geração de relatórios PDF | Alta | US-008, US-009 | Implementado |
| RF-010 | Faturação com numeração, descontos e referências MB | Alta | US-010 | Implementado |
| RF-011 | Rastreabilidade bidireccional lote-kit-processo-resultado | Alta | US-011 | Implementado |
| RF-012 | Requisições e movimentos de kits entre locais | Média | US-002 | Implementado |
| RF-013 | Dashboard com KPIs e alertas operacionais (scoped por médico) | Média | US-005, US-013 | Implementado |
| RF-014 | Listagens com pesquisa, filtros e exportação multi-formato | Média | US-012 | Implementado |
| RF-015 | Gestão de catálogo de testes genómicos (metadados ADN fetal) | Média | US-007 | Implementado |
| RF-016 | Motivos de anulação configuráveis | Média | US-005 | Implementado |
| RF-017 | Notificações in-app e automáticas e-mail/SMS | Baixa | US-009 | Parcial** |
| RF-018 | Integração com software de faturação certificado | Baixa | US-010 | Pendente |
| RF-019 | Importação de dados históricos | Baixa | — | Pendente |
| RF-020 | Isolamento de dados e painel dedicado ao perfil Médico | Alta | US-013 | Implementado |

\** Centro de notificações in-app implementado (categorias, preferências, alertas faturação); envio e-mail/SMS por configurar. Os motivos de anulação (`motivos_anulacao`) foram integrados no ecrã de cancelamento de processos (campos `motivo_anulacao_id` e `data_anulacao` em `processos`).

---

## 2.4. Requisitos Não Funcionais (RNF)

### 2.4.1. Segurança e Protecção de Dados (RGPD)

| ID | Requisito | Implementação no Código |
|---|---|---|
| RNF-001 | Autenticação obrigatória em endpoints protegidos | `auth.middleware.js` — verificação JWT |
| RNF-002 | Passwords armazenadas com hash bcrypt | `bcrypt` em `auth.service.js` |
| RNF-003 | Rate limiting (máx. 100 req/15 min) | `express-rate-limit` em `app.js` |
| RNF-004 | Headers de segurança HTTP | `helmet` |
| RNF-005 | Controlo de acesso baseado em perfis (RBAC) | `perfis`, `perfil_stock_submodulos`, `permissions.ts` |
| RNF-005.1 | Isolamento lógico de dados por médico prescritor | `medico-access.js` |
| RNF-006 | Auditoria de acções de utilizadores | `logs_auditoria` + `log.service.js` |
| RNF-007 | Soft-delete (desactivação em vez de eliminação física) | Campo `ativo` nas entidades |
| RNF-008 | Dados genéticos tratados como dados sensíveis (Art. 9.º RGPD) | [INSERIR POLÍTICA DE RETENÇÃO E PSEUDONIMIZAÇÃO] |
| RNF-009 | Exportações restritas a perfis autorizados | Verificação de permissões no frontend e backend |
| RNF-010 | Comunicação encriptada em produção (HTTPS/TLS) | [INSERIR CONFIGURAÇÃO DE PRODUÇÃO] |

### 2.4.2. Performance

| ID | Requisito | Meta | Notas |
|---|---|---|---|
| RNF-011 | Tempo de resposta de listagens paginadas | < 2 s para 10 000 registos | Paginação em repositories |
| RNF-012 | Pesquisa global | < 500 ms | [INSERIR RESULTADOS DE BENCHMARK] |
| RNF-013 | Pool de conexões à BD | 10 conexões simultâneas | `database.js` |
| RNF-014 | Lazy loading de módulos React | Redução do bundle inicial | `React.lazy()` em `routes.tsx` |
| RNF-015 | Limite de payload JSON | 100 KB | Middleware Express |

### 2.4.3. Usabilidade

| ID | Requisito | Implementação |
|---|---|---|
| RNF-016 | Interface em Português de Portugal | `i18n/locales/pt.ts` |
| RNF-017 | Mensagens de erro claras e localizadas | Validação `express-validator` + frontend |
| RNF-018 | Vista pipeline (Kanban) para processos | `ProcessPipeline.tsx` |
| RNF-019 | Painel lateral com separadores contextuais | `ProcessDrawer.tsx` |
| RNF-020 | Atalho de pesquisa global (Ctrl/Cmd+K) | Componente de pesquisa |
| RNF-021 | Suporte a modo claro/escuro | `ThemeContext.tsx` |
| RNF-022 | Consistência visual (design tokens slate/teal) | `design-tokens.ts`, `design-system.ts`, `PermissionsMatrix.tsx` |
| RNF-023 | Responsividade para tablets | Tailwind CSS + MUI |

### 2.4.4. Fiabilidade e Manutenibilidade

| ID | Requisito | Implementação |
|---|---|---|
| RNF-023 | Arquitectura em camadas (Routes → Controllers → Services → Repositories) | `backend/ARCHITECTURE.md` |
| RNF-024 | Migrações versionadas (63 ficheiros) | `backend/src/migrations/` |
| RNF-025 | Documentação API (OpenAPI/Swagger) | `swagger.json` + `swagger-ui-express` |
| RNF-026 | Tratamento centralizado de erros | `error.middleware.js` |
| RNF-027 | Prepared statements (prevenção SQL Injection) | `mysql2` parameterized queries |
| RNF-028 | Disponibilidade (uptime) | [INSERIR SLA DE PRODUÇÃO] |

### 2.4.5. Compatibilidade

| ID | Requisito | Versão Mínima |
|---|---|---|
| RNF-029 | Node.js | ≥ 18.0.0 |
| RNF-030 | Navegadores | Chrome 90+, Firefox 90+, Edge 90+, Safari 15+ |
| RNF-031 | Base de dados | MariaDB 10.x / MySQL 8.x |
| RNF-032 | Resolução mínima | 1280×720 px |

---

## 2.5. Matriz User Story ↔ Requisito Funcional

| User Story | RF Associados |
|---|---|
| US-001 | RF-004 |
| US-002 | RF-004, RF-012 |
| US-003 | RF-005, RF-006 |
| US-004 | RF-003, RF-006 |
| US-005 | RF-006, RF-007, RF-013 |
| US-006 | RF-007, RF-012 |
| US-007 | RF-008, RF-015 |
| US-008 | RF-009 |
| US-009 | RF-009, RF-017 |
| US-010 | RF-010 |
| US-011 | RF-011 |
| US-012 | RF-014, RF-002 |
| US-013 | RF-020, RF-002, RF-013 |

---

## 2.6. Diagramas

[INSERIR DIAGRAMA DE CASOS DE USO AQUI]

[INSERIR MOCKUP FIGMA DO MÓDULO DE PROCESSOS AQUI]

---

## 2.7. Decisões de Negócio Validadas com o Cliente

Esta secção consolida as decisões de negócio acordadas nas três reuniões de sincronização com o cliente (Nuno/Genoma), rastreando cada decisão ao(s) requisito(s) e/ou user story afectados. A síntese qualitativa consta da secção 1.5.5.

| # | Decisão validada | Reunião | RF / US associados |
|---|---|---|---|
| D-01 | Contacto converte-se em processo após a colheita, identificado pelo código único do kit (1:1 kit-processo) | R1 | RF-006, US-004 |
| D-02 | Calendário de agendamentos com codificação por cores (verde/amarelo/vermelho) como indicador de carga | R1 | RF-005, US-003 |
| D-03 | Verificação de stock de kit antes de agendar; sem kit não há colheita | R1/R3 | RF-005, US-003 |
| D-04 | Padrão "tudo OK" por defeito nos cromossomas; assinalar apenas anomalias | R1/R2 | RF-008, US-007 |
| D-05 | Fração fetal como campo de escrita (0–100%), sem dropdown | R2 | RF-015, US-007 |
| D-06 | Relatório gerado em PDF com layout personalizável; parsing automático de PDFs fora do âmbito imediato | R1/R2 | RF-009, US-009 |
| D-07 | "Envio" substitui "Requisição" nas transferências de kits; "Requisição" reservada aos pedidos de teste | R2 | RF-012, US-002 |
| D-08 | Eliminação dos estados "pendente"/"em trânsito"; movimento automático Empresa → Posto → Laboratório | R2/R3 | RF-012, US-002 |
| D-09 | Tracking da transportadora opcional | R2 | RF-012, US-002 |
| D-10 | Lotes criados vazios; kits inseridos manualmente com código de barras e validação de duplicados | R2 | RF-004, US-001/US-002 |
| D-11 | Kits associados ao Teste (não à "opção"); localização inicial na empresa (Genoma) | R3 | RF-004, US-002 |
| D-12 | Alertas de stock por posto (vermelho=0, aviso=1–4, normal≥5); stock mínimo configurável (incl. zero) | R2/R3 | RF-013, US-002 |
| D-13 | Laboratório com N postos associados; laboratório final (FeatureHealth, UK) como destino possível | R3 | RF-012 |
| D-14 | Escolha de posto por proximidade (código postal da utente) ou manual, com stock na data | R3 | RF-005, US-003 |
| D-15 | Ao seleccionar médico, apresentar apenas as clínicas associadas a esse médico | R3 | RF-003, US-004 |
| D-16 | Condições comerciais por laboratório (preço por colheita, prazo de pagamento) e listagem mensal por posto | R3 | RF-010, RF-014 |
| D-17 | Contactos: remover aba "Marketing"; manter Notas/Anexos; adicionar País/Distrito/Cidade com autofill por código postal | R2 | RF-003, US-004 |
| D-18 | Campo de conceção (natural vs fertilização/FIV) | R3 | RF-003, US-004 |
| D-19 | Preço por defeito do teste com override manual; descontos (ex.: 10% médicos) | R2 | RF-010, US-010 |
| D-20 | Estados de faturação "Fatura emitida" e "Pago" (data de pagamento, nº de recibo); emissão fiscal (AT) externa | R2 | RF-010, US-010 |
| D-21 | Dashboard com métricas (contactos, processos activos, faturação) e alertas de SLA e faturação | R2 | RF-013 |
| D-22 | Perfis restritivos: Admin gere credenciais/acesso total; Médico limitado ao seu dashboard e processos | R2 | RF-002, RF-020, US-013 |
| D-23 | Capacidade multiutilizador (centenas em simultâneo) e módulos desacoplados | R1 | RNF-011/013, RNF-023 |
| D-24 | Reactivação de e-mails automáticos desejável mas não prioritária; contingência manual + notificações in-app | R1/R2 | RF-017, US-009 |
| D-25 | Integração com a app mobile de requisições (Gabriel), com risco por stack/design distintos | R1/R3 | RF-003 (criação automática de contactos) |
| D-26 | Actualização da nomenclatura da empresa para "Genoma" nos módulos relevantes | R1 | — |

---

## Referências

- `backend/src/services/processos.service.js` — Máquina de estados
- `frontend/src/lib/permissions.ts` — Modelo de permissões
- `BASE_DE_DADOS.md` — Modelo de dados relacional
