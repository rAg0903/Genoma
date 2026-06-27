# Capítulo 5 — Casos de Teste e Matriz de Rastreabilidade

**Projeto:** CRM Genoma  
**Metodologia:** Testes funcionais baseados em requisitos (RF) e User Stories (US)  
**Data:** Junho de 2026

---

## 5.1. Estratégia de Testes

### 5.1.1. Objectivos

1. Verificar a conformidade do sistema com os Requisitos Funcionais (RF) definidos no Capítulo 2.
2. Validar os fluxos críticos do domínio genómico (amostra → resultado → faturação).
3. Garantir integridade de dados e regras de negócio (máquina de estados, RBAC, auditoria).
4. Estabelecer rastreabilidade bidireccional RF ↔ Test Case.

### 5.1.2. Níveis de Teste

| Nível | Âmbito | Ferramentas Previstas |
|---|---|---|
| Unitário | Services e validators | Jest (configurado em `backend/package.json`) |
| Integração | API REST + BD | Jest + Supertest [INSERIR] |
| Sistema | Fluxos end-to-end | Testes manuais / [INSERIR CYPRESS OU PLAYWRIGHT] |
| Aceitação | Validação com cliente | Sessão de demonstração Genoma |

**Nota:** O script `npm test` está configurado no backend (`jest --coverage`), mas a suite de testes automatizados encontra-se em fase de implementação. Os casos de teste abaixo estão definidos para execução manual e futura automatização.

---

## 5.2. Casos de Teste — Fluxos Críticos

### TC-001 — Registo de Lote e Geração de Kits (Recepção de Amostra)

| Campo | Valor |
|---|---|
| **ID** | TC-001 |
| **Título** | Registo de lote com geração automática de kits rastreáveis |
| **Prioridade** | Alta |
| **Pré-condições** | Utilizador autenticado com permissão de Stocks (write); tipo de kit existente em `testes` |
| **RF Associados** | RF-004 |
| **US Associada** | US-001 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Aceder ao módulo Stocks → Lotes | Listagem de lotes visível |
| 2 | Clicar "Novo Lote" | Formulário apresentado |
| 3 | Preencher `codigo_lote` = "LOTE-TEST-001", quantidade = 3, tipo de kit, fornecedor, validade | Campos aceites |
| 4 | Submeter formulário | HTTP 201; lote criado |
| 5 | Consultar kits gerados | 3 kits com `codigo_barras` único e `status = Disponivel` |
| 6 | Verificar `logs_auditoria` | Entrada com `acao` de criação e `tabela_afetada = 'lotes'` |

#### Dados de Teste

```
codigo_lote: LOTE-TEST-001
quantidade: 3
validade: [DATA + 365 DIAS]
tipo_kit_id: [ID DE TESTE EXISTENTE]
fornecedor_id: [ID DE EMPRESA EXISTENTE]
```

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-002 — Agendamento de Colheita com Reserva de Kit

| Campo | Valor |
|---|---|
| **ID** | TC-002 |
| **Título** | Agendamento cria processo e reserva kit automaticamente |
| **Prioridade** | Alta |
| **Pré-condições** | Kit disponível; paciente e posto registados |
| **RF Associados** | RF-005, RF-006 |
| **US Associada** | US-003 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Aceder ao calendário de agendamentos | Calendário visível |
| 2 | Seleccionar data futura e posto | Slot disponível |
| 3 | Associar paciente e tipo de teste | Dados válidos |
| 4 | Confirmar agendamento | POST /api/agendamentos → 201 |
| 5 | Verificar processo criado | `status_id = 'Kit Reservado'`, `numero_processo` gerado |
| 6 | Verificar kit reservado | `kits.status = 'Reservado'` |
| 7 | Verificar colheita | Registo em `colheitas` com `data_prevista` correcta |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-003 — Transição de Estado do Processo (Workflow)

| Campo | Valor |
|---|---|
| **ID** | TC-003 |
| **Título** | Validação da máquina de estados — transições válidas e inválidas |
| **Prioridade** | Crítica |
| **Pré-condições** | Processo em estado `Agendado` |
| **RF Associados** | RF-007 |
| **US Associada** | US-005 |

#### Passos de Execução — Cenário Positivo

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Abrir processo no pipeline | Estado actual: `Agendado` |
| 2 | Transitar para `Kit Reservado` | Sucesso; estado actualizado |
| 3 | Transitar para `Colheita Realizada` | Sucesso; `data_colheita` preenchida |
| 4 | Transitar para `Enviado Laboratorio` | Sucesso; kit em `Laboratorio` |
| 5 | Continuar até `Faturado` | Todas as transições válidas aceites |

#### Passos de Execução — Cenário Negativo

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Processo em estado `Agendado` | — |
| 2 | Tentar transitar directamente para `Em Analise` | Erro: "Transicao de estado invalida" |
| 3 | Processo em estado `Faturado` | — |
| 4 | Tentar qualquer transição | Erro: estado terminal |

#### Referência de Código

Transições validadas em `backend/src/services/processos.service.js`:

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

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-004 — Registo de Resultados Genéticos

| Campo | Valor |
|---|---|
| **ID** | TC-004 |
| **Título** | Registo de resultados por cromossoma e upload de PDF |
| **Prioridade** | Alta |
| **Pré-condições** | Processo em estado `Em Analise` |
| **RF Associados** | RF-008 |
| **US Associada** | US-007 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Abrir separador "Resultado" no processo | Formulário de resultados |
| 2 | Registar resultado para cromossoma "21" com valor e probabilidade | INSERT em `resultados_geneticos` |
| 3 | Carregar ficheiro PDF de análise | Registo em `assets_resultados` |
| 4 | Transitar para `Resultado Disponivel` | Sucesso |
| 5 | Verificar `resultado_tudo_ok` e `resultado_anomalias` | Campos actualizáveis |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-005 — Validação Clínica de Resultado

| Campo | Valor |
|---|---|
| **ID** | TC-005 |
| **Título** | Validação clínica e transição para estado Validado |
| **Prioridade** | Alta |
| **Pré-condições** | Processo em `Resultado Disponivel` com resultados registados |
| **RF Associados** | RF-009 |
| **US Associada** | US-008 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Responsável clínico acede ao processo | Separador Resultado visível |
| 2 | Marca relatório como validado | `relatorio_validado = 1` |
| 3 | Transita para `Validado` | Sucesso; `data_validacao` preenchida |
| 4 | Verificar auditoria | Acção registada com `utilizador_id` do validador |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-006 — Geração de Fatura

| Campo | Valor |
|---|---|
| **ID** | TC-006 |
| **Título** | Emissão de fatura a partir de processo validado |
| **Prioridade** | Alta |
| **Pré-condições** | Processo em estado `Validado` |
| **RF Associados** | RF-010 |
| **US Associada** | US-010 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Abrir separador "Faturação" no processo | Formulário de faturação |
| 2 | Preencher `valor_base` = 150.00, `desconto_percentual` = 10 | `valor_final` = 135.00 |
| 3 | Preencher `fatura_numero` = "FAT-2026-0001" | Campo aceite |
| 4 | Emitir fatura | Estado transita para `Faturado` |
| 5 | Verificar `facturacao` | Registo complementar criado |
| 6 | Tentar nova transição | Bloqueado (estado terminal) |

#### Cenário Negativo — Desconto Inválido

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Definir `desconto_percentual` = 150 | Erro: "Desconto percentual deve estar entre 0 e 100" |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-007 — Autenticação e Controlo de Acesso (RBAC)

| Campo | Valor |
|---|---|
| **ID** | TC-007 |
| **Título** | Verificação de autenticação JWT e permissões por perfil |
| **Prioridade** | Crítica |
| **RF Associados** | RF-001, RF-002 |
| **RNF Associados** | RNF-001, RNF-005 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Aceder a `/api/processos` sem token | HTTP 401 "Token não fornecido" |
| 2 | Login com credenciais válidas | JWT retornado |
| 3 | Aceder a `/api/processos` com token | HTTP 200 |
| 4 | Login com perfil sem permissão de Administração | Módulo Definições bloqueado na UI |
| 5 | Token expirado | HTTP 401; redireccionamento para login |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-008 — Rastreabilidade Lote → Processo → Resultado

| Campo | Valor |
|---|---|
| **ID** | TC-008 |
| **Título** | Consulta de cadeia de rastreabilidade bidireccional |
| **Prioridade** | Alta |
| **RF Associados** | RF-011 |
| **US Associada** | US-011 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Identificar lote com kits utilizados em processos | Lote existente |
| 2 | GET /api/trace/lote/:id | Lista de kits e processos derivados |
| 3 | Seleccionar processo com resultado | Processo em estado ≥ Resultado Disponivel |
| 4 | Rastrear até ao lote de origem | Cadeia completa apresentada |
| 5 | Exportar listagem de auditoria | Ficheiro Excel/CSV gerado |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-009 — Exportação de Listagens com Filtros

| Campo | Valor |
|---|---|
| **ID** | TC-009 |
| **Título** | Exportação multi-formato respeitando filtros activos |
| **Prioridade** | Média |
| **RF Associados** | RF-014 |
| **US Associada** | US-012 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Aceder a Listagens → Processos | Tabela carregada |
| 2 | Aplicar filtro: estado = "Validado", data ≥ [INSERIR] | Resultados filtrados |
| 3 | Exportar para Excel | Ficheiro .xlsx descarregado |
| 4 | Verificar conteúdo do ficheiro | Apenas registos filtrados presentes |
| 5 | Repetir para CSV e PDF | Formatos gerados correctamente |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-010 — Integridade Kit-Processo (1:1)

| Campo | Valor |
|---|---|
| **ID** | TC-010 |
| **Título** | Impedir associação de kit já utilizado a novo processo |
| **Prioridade** | Alta |
| **RF Associados** | RF-006, RF-007 |
| **US Associada** | US-004 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Criar processo A com kit K1 | Sucesso |
| 2 | Tentar criar processo B com o mesmo kit K1 | Erro de constraint UNIQUE |
| 3 | Verificar na BD | Apenas um registo em `processos` com `kit_id = K1` |

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

### TC-011 — Isolamento de Dados por Médico Prescritor

| Campo | Valor |
|---|---|
| **ID** | TC-011 |
| **Título** | Médico A não acede a contactos, processos nem KPIs do Médico B |
| **Prioridade** | Crítica |
| **Pré-condições** | Dois médicos com utilizadores activos (ex.: `anaclaraferreira@genoma.pt`, `sofiasilva@genoma.pt`); cada um com pelo menos 1 contacto/processos próprios |
| **RF Associados** | RF-020 |
| **US Associada** | US-013 |

#### Passos de Execução

| Passo | Acção | Resultado Esperado |
|---|---|---|
| 1 | Login como Médico A | Redireccionamento para `MedicoDashboard.tsx` |
| 2 | Verificar KPIs no painel | Valores reflectem apenas dados do Médico A |
| 3 | Abrir Contactos | Listagem contém apenas doentes com `medico_id` = Médico A |
| 4 | Abrir Processos | Pipeline mostra apenas processos do Médico A |
| 5 | Login como Médico B | KPIs e listagens diferentes do Médico A |
| 6 | Tentar aceder directamente a ID de paciente do Médico A (API ou URL) | 403 ou registo inacessível |
| 7 | Verificar saudação e menu lateral | Nome com título Dr./Dra. |

#### Dados de Teste

```
Médico A: anaclaraferreira@genoma.pt / Teste1234!
Médico B: sofiasilva@genoma.pt / Teste1234!
```

#### Resultado

| Execução | Data | Resultado | Observações |
|---|---|---|---|
| [INSERIR] | [INSERIR] | [PASS/FAIL] | [INSERIR] |

---

## 5.3. Matriz de Rastreabilidade (RF ↔ Test Cases)

| RF | Descrição Resumida | TC-001 | TC-002 | TC-003 | TC-004 | TC-005 | TC-006 | TC-007 | TC-008 | TC-009 | TC-010 | TC-011 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RF-001 | Autenticação JWT | | | | | | | ✓ | | | | |
| RF-002 | Perfis e permissões | | | | | | | ✓ | | | | ✓ |
| RF-003 | CRUD pacientes | | | | | | | | | | | ✓ |
| RF-004 | Lotes e kits | ✓ | | | | | | | | | | |
| RF-005 | Agendamento colheitas | | ✓ | | | | | | | | | |
| RF-006 | Gestão de processos | | ✓ | | | | | | | | ✓ | ✓ |
| RF-007 | Workflow / estados | | | ✓ | | | | | | | ✓ | |
| RF-008 | Resultados genéticos | | | | ✓ | | | | | | | |
| RF-009 | Validação e relatórios | | | | | ✓ | | | | | | |
| RF-010 | Faturação | | | | | | ✓ | | | | | |
| RF-011 | Rastreabilidade | | | | | | | | ✓ | | | |
| RF-012 | Movimentos de kits | ✓ | | | | | | | | | | |
| RF-013 | Dashboard KPIs | | | ✓ | | | | | | | | ✓ |
| RF-014 | Listagens e exportação | | | | | | | | | ✓ | | ✓ |
| RF-015 | Catálogo de testes | ✓ | ✓ | | ✓ | | | | | | | |
| RF-020 | Isolamento médico | | | | | | | | | | | ✓ |

**Legenda:** ✓ = Test Case cobre o requisito

---

## 5.4. Matriz de Rastreabilidade (User Stories ↔ Test Cases)

| User Story | TC Associados | Cobertura |
|---|---|---|
| US-001 | TC-001 | Completa |
| US-002 | TC-001 | Parcial |
| US-003 | TC-002 | Completa |
| US-004 | TC-002, TC-010 | Completa |
| US-005 | TC-003 | Completa |
| US-006 | TC-003 | Parcial (transição Enviado Lab → Em Análise) |
| US-007 | TC-004 | Completa |
| US-008 | TC-005 | Completa |
| US-009 | TC-005 | Parcial (envio notificação pendente) |
| US-010 | TC-006 | Completa |
| US-011 | TC-008 | Completa |
| US-012 | TC-009 | Completa |
| US-013 | TC-011 | Completa |

---

## 5.5. Matriz de Rastreabilidade (RNF ↔ Test Cases)

| RNF | Descrição | TC |
|---|---|---|
| RNF-001 | Autenticação obrigatória | TC-007 |
| RNF-005 | RBAC por perfis | TC-007 |
| RNF-005.1 | Isolamento por médico | TC-011 |
| RNF-006 | Auditoria de acções | TC-001, TC-005, TC-008 |
| RNF-027 | SQL Injection prevention | [INSERIR TC DE SEGURANÇA] |
| RNF-003 | Rate limiting | [INSERIR TC DE CARGA] |

---

## 5.6. Resumo de Cobertura

| Métrica | Valor |
|---|---|
| Total de Test Cases definidos | 11 |
| RF com cobertura de teste | 14 / 20 (70%) |
| RF sem teste definido | RF-016 a RF-019 |
| User Stories com cobertura | 13 / 13 (100% com pelo menos 1 TC) |

---

## 5.7. Plano de Testes Futuro

[INSERIR CRONOGRAMA DE EXECUÇÃO DE TESTES AQUI]

| Fase | Actividade | Data Prevista |
|---|---|---|
| 1 | Execução manual TC-001 a TC-006 | [INSERIR] |
| 2 | Implementação testes Jest (services) | [INSERIR] |
| 3 | Testes de aceitação com cliente Genoma | [INSERIR] |
| 4 | Testes de segurança (OWASP Top 10) | [INSERIR] |

---

## Referências

- `backend/src/services/processos.service.js` — Regras de transição
- `backend/package.json` — Configuração Jest
- Capítulo 2 — Requisitos Funcionais e User Stories
