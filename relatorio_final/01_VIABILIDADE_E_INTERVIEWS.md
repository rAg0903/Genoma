# Capítulo 1 — Viabilidade e Entrevistas com Stakeholders

**Projeto:** CRM Genoma — Sistema de Gestão Operacional de Testes Genéticos  
**Instituição:** ISLA — [Curso de Engenharia Informática 25/26]  
**Autor:** [Rafael Fernandes Males]  
**Orientador:** [Ana Paula]  
**Data:** Junho de 2026

---

## 1.1. Contexto e Enquadramento

A Genoma é uma entidade dedicada à prestação de serviços de testes genéticos, com um fluxo operacional que abrange a receção de material biológico (kits), o agendamento de colheitas, o processamento laboratorial, a validação clínica de resultados, a emissão de relatórios e a faturação final. O sistema legado limitava-se essencialmente a funcionalidades de CRM genérico, sem suporte adequado à rastreabilidade ponta a ponta exigida por contextos de diagnóstico genómico e conformidade regulatória (RGPD, rastreio de lotes).

O presente projeto consiste no desenvolvimento de uma aplicação web full-stack — **Genoma CRM** — que materializa o fluxo operacional real da organização:

```
Lote → Kit → Agendamento → Colheita → Processo → Resultado → Relatório → Faturação
```

A solução encontra-se em fase de implementação avançada, com módulos operacionais construídos e a compilar sem erros, conforme documentação interna do projeto (`PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md`, junho de 2026).

---

## 1.2. Viabilidade Técnica

### 1.2.1. Adequação da Stack Tecnológica

A análise do repositório confirma uma arquitetura **Three-Tier / API-Based** com separação clara entre camadas:

| Camada | Tecnologia | Justificação |
|---|---|---|
| Apresentação | React 18 + Vite 6 + TypeScript | SPA reativa, componentização modular, build otimizado |
| API REST | Node.js 18+ + Express 5 | Ecossistema maduro, adequado a CRUD e workflows transaccionais |
| Persistência | MariaDB/MySQL (InnoDB) | Suporte a transacções ACID, integridade referencial, UUIDs |
| Autenticação | JWT + bcrypt | Stateless, escalável, padrão de mercado para APIs |
| Segurança HTTP | Helmet, CORS, express-rate-limit | Mitigação de ataques comuns (XSS, brute-force, abuse) |

### 1.2.2. Complexidade do Domínio

O domínio genómico impõe requisitos técnicos específicos que o sistema já contempla:

1. **Máquina de estados finita** para processos clínicos, com transições validadas no backend (`TRANSICOES_VALIDAS` em `backend/src/services/processos.service.js`).
2. **Rastreabilidade bidireccional** lote ↔ kit ↔ processo ↔ resultado, exposta via módulo `/api/trace`.
3. **Integridade 1:1 kit-processo** garantida por índice `UNIQUE` em `processos.kit_id`.
4. **Auditoria** centralizada em `logs_auditoria`, com 14 registos já persistidos em ambiente de desenvolvimento.
5. **Migrações versionadas** (`backend/src/migrations/`, 46+ ficheiros) que asseguram evolução controlada do schema.

### 1.2.3. Riscos Técnicos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Integração com software de faturação certificado | Média | Alto | API modular; campos de faturação já modelados em `processos` e `facturacao` |
| Envio de notificações (e-mail/SMS) | Baixa | Médio | In-app operacional; canal externo depende de credenciais |
| Volume de dados genéticos sensíveis | Média | Alto | RBAC por perfis, soft-delete, exportações controladas por permissão |
| Fuso horário em datas de colheita | Baixa (mitigado) | Médio | Correcção implementada com normalização de datas no backend |

### 1.2.4. Conclusão da Viabilidade Técnica

**Viável.** A stack escolhida suporta o volume funcional previsto, a complexidade do workflow laboratorial e os requisitos de segurança. O código existente demonstra prova de conceito operacional com 29 tabelas relacionais, 20+ endpoints REST agrupados e interface React com 6 módulos principais (Dashboard, Contactos, Processos, Stocks, Listagens, Administração).

---

## 1.3. Viabilidade Económica

### 1.3.1. Custos de Desenvolvimento

| Item | Estimativa | Notas |
|---|---|---|
| Horas de desenvolvimento (estudante) | [INSERIR HORAS] | Projeto de final de curso |
| Infraestrutura cloud (dev/staging) | [INSERIR VALOR €/mês] | VPS ou PaaS (ex.: Railway, Render) |
| Licenças de software | 0 € | Stack open-source (React, Node.js, MariaDB) |
| Domínio e certificado SSL | [INSERIR VALOR €/ano] | Let's Encrypt gratuito em produção |

### 1.3.2. Custos Operacionais Recorrentes

| Item | Estimativa Anual | Notas |
|---|---|---|
| Hosting produção | [INSERIR VALOR] | Servidor dedicado ou cloud |
| Base de dados gerida | [INSERIR VALOR] | MariaDB/MySQL managed |
| Serviço SMS/e-mail transaccional | [INSERIR VALOR] | Twilio, SendGrid ou equivalente |
| Manutenção evolutiva | [INSERIR VALOR] | Pós-entrega do PFC |

### 1.3.3. Benefícios Quantificáveis

1. **Redução de erros operacionais** — impossibilidade de saltar estados no workflow reduz retrabalho e recalls indevidos.
2. **Automatização de reserva de kits** no agendamento elimina colheitas sem material disponível.
3. **Centralização de listagens e exportações** (Excel, CSV, PDF) reduz tempo de reporting manual.
4. **Rastreabilidade para recall de lotes** — valor crítico em conformidade e gestão de risco clínico.

### 1.3.4. Análise Custo-Benefício

[INSERIR TABELA ROI OU GRÁFICO DE PAYBACK]

**Conclusão preliminar:** O investimento em desenvolvimento é justificado pela eliminação de processos manuais, pela conformidade regulatória e pela escalabilidade operacional face ao crescimento previsto da carteira de testes genéticos da Genoma.

---

## 1.4. Viabilidade Operacional

### 1.4.1. Adequação ao Fluxo de Trabalho Real

O sistema reflecte o pipeline operacional validado com o cliente:

| Fase | Estado no Sistema (`processo_status`) | Ordem |
|---|---|---|
| Agendamento | Agendado | 1 |
| Reserva de material | Kit Reservado | 2 |
| Colheita | Colheita Realizada | 3 |
| Envio ao laboratório | Enviado Laboratorio | 4 |
| Análise genómica | Em Analise | 5 |
| Resultado disponível | Resultado Disponivel | 6 |
| Validação clínica | Validado | 7 |
| Faturação | Faturado | 8 |
| Cancelamento | Cancelado | 9 |

### 1.4.2. Perfis de Utilizador e Adopção

O sistema prevê perfis configuráveis (`perfis`, `perfil_stock_submodulos`) com permissões granulares por módulo (Dashboard, Contactos, Processos, Stocks, Listagens, Administração). Isto permite adaptar a interface a:

- Rececionistas / postos de colheita
- Técnicos de laboratório
- Responsáveis clínicos (validação)
- Gestão financeira (faturação)
- Administradores de sistema

### 1.4.3. Formação e Mudança Organizacional

| Actividade | Duração Estimada | Responsável |
|---|---|---|
| Sessão de demonstração ao cliente | 2 h | [INSERIR] |
| Formação por perfil de utilizador | [INSERIR HORAS] | [INSERIR] |
| Importação de dados históricos | [INSERIR DIAS] | Equipa técnica + Genoma |
| Período de convivência (sistema antigo + novo) | [INSERIR SEMANAS] | Genoma |

### 1.4.4. Conclusão da Viabilidade Operacional

**Viável, condicionada à validação do cliente.** Persistem decisões de negócio pendentes (motivos de anulação no ecrão de processos, regras de faturação, e-mail/SMS transaccional), mas a estrutura operacional — incluindo notificações in-app, design system unificado e integridade de dados de colheita — está alinhada com o fluxo laboratorial real.

---

## 1.5. Entrevistas com Stakeholders

### 1.5.1. Objectivos das Entrevistas

1. Validar requisitos funcionais e não funcionais junto dos utilizadores finais.
2. Confirmar a sequência de estados do workflow laboratorial.
3. Identificar restrições de conformidade (RGPD, exportação de dados genéticos).
4. Levantar expectativas de integração (contabilidade, SMS, e-mail).

### 1.5.2. Perfil dos Entrevistados

| Stakeholder | Papel | Interesse no Sistema |
|---|---|---|
| Médico prescritor | Utilizador externo/indirecto | Agendamentos, resultados, relatórios |
| Director de laboratório | Utilizador interno | Workflow, validação, rastreabilidade |
| Administrador/Gestão | Decisor | Faturação, KPIs, exportações, permissões |
| Técnico de recepção | Utilizador operacional | Stocks, kits, colheitas |

### 1.5.3. Guião de Entrevista Semi-Estruturado

#### Bloco A — Identificação e Contexto (5 min)

1. Qual é o seu papel na organização e há quanto tempo desempenha estas funções?
2. Que sistemas ou ferramentas utiliza actualmente para gerir testes genéticos?
3. Quais são as três maiores dificuldades no processo actual?

#### Bloco B — Fluxo Operacional (15 min)

4. Descreva o percurso de uma amostra desde a recepção do kit até à entrega do relatório ao paciente.
5. A sequência *Agendado → Kit Reservado → Colheita Realizada → Enviado Laboratório → Em Análise → Resultado Disponível → Validado → Faturado* corresponde ao vosso processo? Falta ou sobra alguma fase?
6. Quem tem autoridade para validar um resultado clínico? Existe regra de *four-eyes* (dupla validação)?
7. A partir de quantos dias sem movimento um processo deve ser considerado "atrasado"? (valor por defeito no sistema: 7 dias)
8. Quais são os motivos de anulação/cancelamento mais frequentes?

#### Bloco C — Stocks e Rastreabilidade (10 min)

9. Como é gerido actualmente o inventário de kits e lotes?
10. A partir de que quantidade de kits deve ser emitido alerta de stock baixo? (valor por defeito: 5)
11. Com quantos dias de antecedência deve ser alertada a expiração de um lote? (valor por defeito: 45 dias)
12. Em caso de recall de um lote, que informação precisa de consultar rapidamente?

#### Bloco D — Resultados, Relatórios e Faturação (10 min)

13. Qual é o formato actual dos relatórios clínicos? Existe modelo gráfico específico da Genoma (logótipo, texto legal)?
14. As faturas devem seguir numeração automática (ex.: FAT-2026-0001)? Existem regras de IVA ou séries contabilísticas?
15. É necessária integração com software de faturação certificado? Qual?

#### Bloco E — Segurança, Permissões e RGPD (10 min)

16. Que perfis de utilizador existem e o que cada um pode ver/fazer?
17. Quem pode exportar dados (Excel/PDF/CSV)? Existem campos que não devem aparecer em exportações?
18. Como devem ser tratados dados genéticos sensíveis ao abrigo do RGPD?
19. Qual o período de retenção de dados clínicos e de auditoria?

#### Bloco F — Notificações e Integrações (5 min)

20. Pretendem activar notificações automáticas por e-mail e/ou SMS? Em que eventos e para quem?
21. Existem dados históricos a importar? Em que formato?

#### Bloco G — Encerramento (5 min)

22. Que funcionalidade considera **indispensável** na primeira versão em produção?
23. Estaria disponível para uma sessão de validação do protótipo?
24. Há mais algum requisito que não tenhamos abordado?

### 1.5.4. Registo de Entrevistas Realizadas

| Data | Entrevistado | Função | Duração | Ficheiro de Notas |
|---|---|---|---|---|
| [INSERIR] | [INSERIR NOME] | Médico | [INSERIR] | [INSERIR CAMINHO] |
| [INSERIR] | [INSERIR NOME] | Director de Laboratório | [INSERIR] | [INSERIR CAMINHO] |
| [INSERIR] | [INSERIR NOME] | Administrador | [INSERIR] | [INSERIR CAMINHO] |

### 1.5.5. Síntese das Conclusões das Entrevistas

[INSERIR SÍNTESE APÓS REALIZAÇÃO DAS ENTREVISTAS — incluir citações relevantes e decisões tomadas]

---

## 1.6. Diagramas de Apoio

[INSERIR DIAGRAMA DE STAKEHOLDERS AQUI]

[INSERIR DIAGRAMA DO FLUXO OPERACIONAL VALIDADO COM O CLIENTE AQUI]

---

## Referências Internas do Projeto

- `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md` — Estado de implementação e questões em aberto
- `BASE_DE_DADOS.md` — Schema relacional (29 tabelas)
- `backend/ARCHITECTURE.md` — Arquitectura em camadas do backend
