# Guião de Apresentação — Defesa Final de Projeto

**Projeto:** Genoma CRM — Sistema de Gestão Operacional de Testes Genéticos
**Instituição:** ISLA — Licenciatura em Engenharia Informática (LEI)
**Equipa:** Rafael Males (a22212343), Alberto Macieira (a22301601), Alexandre e Daniel
**Orientadora:** Ana Paula
**Ano Letivo:** 2025/2026

---

> **Como usar este guião**
> Cada bloco corresponde a um diapositivo. O texto em *bullets* é o que fica **visível** no slide (minimalista). O bloco `> **Notas de Orador**` é o que o estudante deve **falar** (não ler o slide). Tempo total dos slides cronometrados: ~15-16 min, deixando margem para demonstração e perguntas dentro do limite de **20 minutos** (apresentação em grupo).

---
### 1. Capa — Genoma CRM

- **Título:** Genoma CRM — Modernização de um sistema legado
- **Stack:** Node.js/Express 5 + React 18 + TypeScript
- **Equipa:** Rafael Males, Alberto Macieira, Alexandre, Daniel
- **ISLA — LEI · Julho de 2026**

> **Notas de Orador (abertura ~30 s):**
> * Tom: confiante e institucional. Cumprimentar o júri e a orientadora.
> * Apresentar o nome do projeto e a equipa; referir que é a reengenharia de um CRM clínico real para a empresa Genoma.
> * Não detalhar aqui — apenas criar expectativa. Passar rápido ao próximo slide.
> * [Rafael] abre a sessão.

---
### 2. Agenda

- **1.** Enquadramento e problema
- **2.** Objetivos
- **3.** Análise preliminar (Requisitos + Segurança)
- **4.** Desenho (Arquitetura + Dados)
- **5.** Implementação por contribuições
- **6.** Conclusão

> **Notas de Orador (~30 s):**
> * Tom: guia. Dar o "mapa" da apresentação em 20 segundos.
> * Reforçar que o percurso segue o ciclo de vida de engenharia de software: do problema à solução implementada.
> * Anunciar que haverá uma breve demonstração do fluxo real no final.
> * [Rafael].

---
### 3. Enquadramento (1/2) — O Problema

- **Cliente:** Genoma (ex-Stemyca), testes genéticos
- **Legado:** instalação local, 1 só computador
- **Falhas:** conta única admin, sem perfis
- **Silos de dados** e sem rastreabilidade RGPD

> **Notas de Orador (~1 min):**
> * Tom: contextualizar a dor do cliente. Este é o "porquê" do projeto.
> * Explicar que o sistema antigo era uma aplicação de instalação local, operável só a partir de um computador e acessível apenas por uma conta de administrador — sem perfis diferenciados.
> * Sublinhar o ponto crítico: o fornecedor **descontinuou** o produto, deixando a empresa sem evolução, sem gestão de acessos e sem a rastreabilidade ponta a ponta exigida em diagnóstico genómico e pelo RGPD.
> * Ligar à ideia de "silos de dados": informação dispersa e não auditável.
> * [Rafael].

---
### 4. Enquadramento (2/2) — Equipa e Tempo

- **Rafael Males (a22212343):** Frontend/UI-UX + BD
- **Alberto Macieira (a22301601):** Stock + Relatórios + BD
- **Alexandre & Daniel:** fecho de Processos
- **Estagiário externo:** Data Cleansing (dados legados)
- **Período:** Março a Julho de 2026 (4 sprints)

> **Notas de Orador (~1 min):**
> * Tom: organizado. Mostrar que houve divisão clara de responsabilidades.
> * Apresentar cada elemento e o seu foco principal; referir o estagiário da Genoma responsável pela extração e limpeza dos dados legados.
> * Enquadrar temporalmente: projeto arrancou em finais de março e a entrega é em meados de julho de 2026, organizado em quatro sprints com metodologia ágil.
> * Deixar claro que a apresentação vai depois detalhar "quem fez o quê".
> * [Rafael].

---
### 5. Objetivos

- **Modernização:** arquitetura estável Three-Tier
- **Centralização:** Contactos, Stocks e Processos
- **Rastreabilidade:** Lote → Kit → Processo → Resultado
- **Segurança e acessos por perfil (RBAC)**

> **Notas de Orador (~1 min):**
> * Tom: objetivo. Traduzir o problema em metas concretas.
> * Objetivo técnico central: substituir o legado por uma aplicação web full-stack com três camadas desacopladas (apresentação, aplicação, dados).
> * Objetivo operacional: centralizar num único sistema os contactos/pacientes, o stock de kits clínicos e os pipelines de processos.
> * Realçar o pipeline real: Lote → Kit → Agendamento → Colheita → Processo → Resultado → Relatório → Faturação.
> * [Rafael].

---
### 6. Análise Preliminar (1/2) — Requisitos

- **20 Requisitos Funcionais** (RF) mapeados
- **13 User Stories** com critérios de aceitação
- **Vitais:** processos, stock, rastreabilidade, faturação
- **RNF:** performance, usabilidade, manutenibilidade

> **Notas de Orador (~1 min):**
> * Tom: metódico. Mostrar rigor no levantamento.
> * Explicar que os requisitos foram derivados de análise do domínio, inspeção do sistema e entrevistas semi-estruturadas com stakeholders (médico, laboratório, gestão, receção).
> * Dar 2-3 exemplos de RF vitais: gestão de processos com máquina de estados (RF-007), rastreabilidade bidirecional (RF-011), reserva automática de kit no agendamento (RF-005).
> * Referir que cada User Story tem critérios de aceitação testáveis — base para os casos de teste.
> * [Alberto].

---
### 7. Análise Preliminar (2/2) — Foco em Segurança

- **Helmet:** headers HTTP seguros
- **CORS restrito** a origens autorizadas
- **Rate Limiting:** 100 req / 15 min
- **JWT + bcrypt** · RBAC · auditoria · soft-delete

> **Notas de Orador (~1 min):**
> * Tom: sério — dados genéticos são dados sensíveis (Art. 9.º RGPD).
> * Explicar o "porquê" de cada camada: **Helmet** endurece os cabeçalhos HTTP; **CORS** restrito impede pedidos de origens não autorizadas; **rate limiting** (`express-rate-limit`) protege contra abuso e força-bruta.
> * Autenticação stateless com **JWT** e passwords com hash **bcrypt**; controlo de acessos por perfil (RBAC) e isolamento de dados por médico prescritor.
> * Fechar com auditoria (`logs_auditoria`) e soft-delete como garantias de conformidade e recuperabilidade.
> * [Alberto].

---
### 8. Desenho (1/2) — Arquitetura de Software

- **Padrão:** Routes → Controllers → Services → Repositories
- **API REST** desacoplada (Express 5)
- **SPA React 18** consome a API via JSON
- **Benefício:** testável, escalável, manutenível

> **Notas de Orador (~1 min):**
> * Tom: técnico mas claro. Este é o coração da qualidade do software.
> * Explicar o fluxo desacoplado: as **Routes** definem endpoints e middlewares; os **Controllers** tratam request/response; os **Services** concentram a lógica de negócio (ex.: `TRANSICOES_VALIDAS` do workflow); os **Repositories** isolam o SQL.
> * Justificar a escolha do **Express 5** e da separação em camadas: cada camada tem uma única responsabilidade, o que facilita testes e evolução.
> * Referir que o frontend React comunica exclusivamente por HTTP/JSON com `Authorization: Bearer <JWT>`.
> * [Rafael].

---
### 9. Desenho (2/2) — Engenharia de Dados

- **Modelo relacional** escalável (InnoDB, utf8mb4)
- **~29 tabelas**; `processos` como entidade central
- **63 migrações** versionadas (000 → 063)
- **Integridade:** FKs, UUIDs, transações ACID

> **Notas de Orador (~1 min):**
> * Tom: rigoroso. Demonstrar controlo sobre a evolução da base de dados.
> * Explicar que o schema não foi criado "de uma vez": evoluiu de forma controlada através de **63 ficheiros de migração** numerados, executáveis com `npm run migrate` — isto garante reprodutibilidade em qualquer ambiente.
> * Destacar a tabela `processos` como entidade agregadora, ligada a pacientes, médicos, kits, testes e postos.
> * Referir integridade referencial (chaves estrangeiras), identificadores UUID e transações atómicas (ex.: agendamento reserva kit + cria processo numa só transação).
> * [Alberto].

---
### 10. Implementação — UI/UX e Design System (Rafael)

- **Figma → componentes** dinâmicos (Shadcn/Radix + Tailwind)
- **Modo Dark nativo** e paleta slate/teal
- **Pesquisa Global** (Ctrl+K) e Notificações in-app
- **Assets gráficos** produzidos via Photopea

> **Notas de Orador (~1 min):**
> * Tom: entusiasta — esta é a cara do produto.
> * Explicar o percurso: prototipagem em **Figma** e transposição para componentes reutilizáveis com **Shadcn UI/Radix + Tailwind** (justificar: acessibilidade, consistência e velocidade de desenvolvimento).
> * Destacar o **design system** com tokens partilhados (paleta slate/teal), modo claro/escuro nativo e a matriz de permissões visual.
> * Mencionar a **pesquisa global** (Ctrl+K, `cmdk`), as notificações in-app e a criação de assets no Photopea.
> * [Rafael].

---
### 11. Implementação — Core: Contactos e Stock (Rafael & Alberto)

- **Contactos/Pacientes:** resgate e edição inline
- **Stock/Inventário:** ciclo de vida de kits
- **Estados do kit:** Disponível → Reservado → Utilizado
- **Rastreabilidade** e alertas de expiração/stock baixo

> **Notas de Orador (~1 min):**
> * Tom: colaborativo — sublinhar o co-desenvolvimento.
> * [Rafael] explica o módulo de Contactos/Pacientes: CRUD com dados demográficos e clínicos, edição inline por separador e conversão de contacto em processo.
> * [Alberto] explica o ecossistema de Stock: registo de lotes gera kits individuais com código de barras, com máquina de estados do kit e movimentos entre locais.
> * Realçar que ambos trabalharam a base de dados subjacente e as regras de reserva automática de kit no agendamento.
> * [Rafael] + [Alberto] partilham este slide.

---
### 12. Implementação — Motor de Relatórios (Alberto)

- **9 listagens** operacionais configuráveis
- **Filtros avançados** por data, estado, médico, posto
- **Exportação** Excel (ExcelJS), CSV e PDF
- **Análise de dados** para reporting sem TI

> **Notas de Orador (~1 min):**
> * Tom: valor de negócio. Mostrar que o sistema devolve tempo à operação.
> * Explicar o motor autónomo de listagens: nove vistas (Processos, Resultados, Faturação, Colheitas, Kits, Lotes, Pacientes, Médicos, Auditoria) com filtros avançados.
> * Destacar a exportação multi-formato (Excel via ExcelJS, CSV, PDF) respeitando os filtros ativos e as permissões do utilizador.
> * Ligar ao objetivo: eliminar o reporting manual e dar autonomia à gestão.
> * [Alberto].

---
### 13. Implementação — Finalização de Processos (Alexandre & Daniel)

- **Máquina de estados** validada (transições finitas)
- **Fecho do pipeline** clínico até faturação
- **Validação** de resultados e relatórios PDF
- **Preparação para pós-produção**

> **Notas de Orador (~1 min):**
> * Tom: encerramento do ciclo funcional.
> * Explicar o trabalho de finalização e validação do pipeline de Processos Clínicos: garantir que cada transição de estado (Agendado → ... → Faturado) só ocorre quando válida, evitando saltos de fase.
> * Referir a validação clínica de resultados, a geração de relatórios em PDF e o registo em auditoria.
> * Enquadrar como o passo que deixou o sistema pronto para validação em pós-produção com o cliente.
> * [Alexandre] e [Daniel] partilham este slide.

---
### 14. Demonstração — Fluxo end-to-end

- **Demo ao vivo** (ou capturas de ecrã)
- **Percurso:** Contacto → Colheita → Processo
- **Até:** Resultado → Relatório → Faturação
- **Dashboard e pesquisa global em ação**

> **Notas de Orador (~1-2 min):**
> * Tom: prático e ágil. Mostrar o produto a funcionar, não descrevê-lo.
> * Percorrer rapidamente o fluxo real numa conta de demonstração: criar/abrir um contacto, agendar colheita (reserva de kit), avançar o processo pelo pipeline Kanban e chegar ao relatório/faturação.
> * Ter um plano B: se a demo ao vivo falhar, usar capturas de ecrã já preparadas.
> * Terminar mostrando o dashboard com KPIs e a pesquisa global.
> * [Rafael] conduz; equipa apoia.

---
### 15. Conclusão (1/2) — Balanço Final

- **Sucesso:** transição do sistema legado
- **6 módulos** operacionais e a compilar
- **Ganhos:** rastreabilidade, segurança, centralização
- **Fundações sólidas** para produção

> **Notas de Orador (~1 min):**
> * Tom: afirmativo, sem exagerar. Resumir o que foi entregue.
> * Afirmar que o objetivo central foi cumprido: o legado local e monoutilizador foi substituído por uma aplicação web moderna, segura e multi-perfil.
> * Reforçar os ganhos: rastreabilidade ponta a ponta, workflow rigoroso, isolamento de dados por médico e interface consistente.
> * Ser honesto sobre o que fica para trabalho futuro: notificações e-mail/SMS e integração com faturação certificada (in-app já operacional).
> * [Rafael].

---
### 16. Conclusão (2/2) — Lições Aprendidas

- **Gestão de dependências** entre elementos do grupo
- **Pipeline ágil:** 4 sprints, entregas incrementais
- **Validar workflow** com stakeholders antes de codificar
- **Rastreabilidade** como requisito, não acessório

> **Notas de Orador (~1 min):**
> * Tom: reflexivo e maduro. Mostrar crescimento como equipa.
> * Partilhar a principal lição de coordenação: gerir dependências entre tarefas (BD partilhada, componentes comuns) exigiu comunicação e integração contínua.
> * Referir o valor da metodologia ágil (quatro sprints) para entregar de forma incremental e absorver mudanças de requisitos.
> * Fechar com uma lição de domínio: validar a máquina de estados com os stakeholders antes de a implementar poupou retrabalho.
> * [Alberto].

---
### 17. Agradecimentos

- **À ISLA** e à orientadora, Prof. Ana Paula
- **À empresa Genoma** (cliente) e equipa
- **Ao estagiário** de Data Cleansing
- **Obrigado pela atenção**

> **Notas de Orador (~30 s):**
> * Tom: sincero e formal.
> * Agradecer à faculdade (ISLA) e em particular à orientadora pelo acompanhamento; agradecer à empresa cliente Genoma pela disponibilidade, feedback e acesso ao contexto real.
> * Um agradecimento ao estagiário responsável pela limpeza de dados legados.
> * Encerrar com uma nota de agradecimento ao júri.
> * [Equipa] em conjunto.

---
### 18. Perguntas

- **Obrigado!**
- **Perguntas & Discussão**
- Genoma CRM — ISLA LEI 2025/2026
- Rafael Males · Alberto Macieira · Alexandre · Daniel

> **Notas de Orador:**
> * Tom: aberto e disponível. Convidar o júri a colocar questões.
> * Distribuir as respostas pela equipa consoante a área (UI/UX e BD → Rafael; Stock e Relatórios → Alberto; Processos → Alexandre/Daniel).
> * Se não souber uma resposta na totalidade, ser honesto e indicar como se resolveria tecnicamente.
> * [Equipa].

---

*Guião calibrado para apresentação em grupo com duração total ≤ 20 minutos, fundamentado no código-fonte real do CRM Genoma (backend Express 5, frontend React 18/TypeScript, base de dados MariaDB/MySQL). Julho de 2026.*

---

## Versão condensada para o template ISLA

> Esta secção corresponde ao modelo de apresentação com os diapositivos: **Capa**, **Agenda**, **Enquadramento e objetivos**, **Análise preliminar**, **Análise detalhada**, **Desenho**, **Implementação** e **Conclusão**. O texto foi preparado para ser colado diretamente nos slides, mantendo o conteúdo curto e legível.

---

### 1. Capa

- **CRM Genoma**
- Sistema de Gestão Operacional de Testes Genéticos
- Relatório de Projeto Aplicado
- Licenciatura em Engenharia Informática
- Rafael Fernandes Males (a22212343) · Alberto Macieira (a22301601)
- ISLA · Julho de 2026

> **Notas de Orador (~30 s):**
> Apresentar o projeto como uma reengenharia de um sistema real utilizado no contexto de diagnóstico genómico. Referir que o objetivo foi substituir uma aplicação legada, local e limitada, por uma plataforma web moderna, multiutilizador e preparada para acompanhar o ciclo operacional completo dos testes genéticos.

---

### 2. Agenda

- Enquadramento
- Objetivos
- Análise preliminar
- Análise detalhada
- Desenho
- Implementação
- Conclusão

> **Notas de Orador (~30 s):**
> Explicar que a apresentação segue a evolução natural do projeto: primeiro o problema e os objetivos, depois a análise feita, a arquitetura desenhada, a implementação realizada e, por fim, os resultados e aprendizagens.

---

### 3. Enquadramento e objetivos

O projeto **CRM Genoma** nasce da necessidade de modernizar o sistema de informação da Genoma, anteriormente Stemyca, uma organização ligada à prestação de serviços de diagnóstico genómico. O sistema anterior era uma aplicação instalada localmente num único computador, dependente de uma conta de administrador e sem perfis de utilizador, rastreabilidade completa ou capacidade de evolução.

O objetivo principal foi desenvolver uma aplicação web full-stack capaz de centralizar a gestão de contactos, pacientes, stocks, agendamentos, processos clínicos, resultados, relatórios e faturação. A solução foi concebida para garantir rastreabilidade ponta a ponta no fluxo **Lote → Kit → Agendamento → Colheita → Processo → Resultado → Relatório → Faturação**, reforçando simultaneamente a segurança, a auditoria e a conformidade com o RGPD.

> **Notas de Orador (~1 min):**
> Destacar que o problema não era apenas técnico, mas também operacional e regulatório. A empresa dependia de uma solução descontinuada, difícil de auditar e inadequada para trabalho multiutilizador. O CRM Genoma responde a esse problema com uma plataforma acessível em rede, organizada por perfis e alinhada com o fluxo real de trabalho da organização.

---

### 4. Análise preliminar

Na fase preliminar foi analisado o contexto da organização, o funcionamento do sistema legado e as principais limitações sentidas pelos utilizadores. Foram identificados riscos de continuidade de negócio, falta de controlo de acessos, ausência de responsabilização individual, dados dispersos e rastreabilidade insuficiente para um domínio que trabalha com informação genética sensível.

A partir desse levantamento foram definidos requisitos funcionais e não funcionais, incluindo gestão de contactos e pacientes, reserva automática de kits, workflow de processos, controlo de stocks, relatórios exportáveis, autenticação, permissões por perfil, auditoria e isolamento de dados por médico prescritor.

> **Notas de Orador (~1 min):**
> Referir que a análise preliminar transformou problemas concretos em requisitos de sistema. Exemplos importantes: cada utilizador deve ter a sua conta, cada ação relevante deve poder ser auditada, e cada processo deve manter ligação ao kit, ao lote, ao paciente, ao médico e ao resultado.

---

### 5. Análise detalhada

A análise detalhada estruturou o domínio em módulos principais: **Contactos/Pacientes**, **Processos Clínicos**, **Stocks**, **Listagens/Relatórios**, **Administração**, **Notificações** e **Dashboard**. O centro funcional do sistema é o processo clínico, que agrega paciente, médico, teste, kit, colheita, resultado, relatório e faturação.

Foram documentadas **13 user stories**, **20 requisitos funcionais**, requisitos não funcionais e casos de teste associados. A rastreabilidade entre requisitos e testes permitiu validar os fluxos críticos, especialmente o agendamento com reserva de kit, o ciclo de vida do inventário, as transições de estado do processo e os mecanismos de segurança.

> **Notas de Orador (~1 min):**
> Explicar que esta fase serviu para perceber como as entidades se relacionam e quais os fluxos que não podiam falhar. O processo clínico foi tratado como a entidade central, enquanto contactos, kits, testes, resultados e faturação gravitam em torno dele.

---

### 6. Desenho

A solução foi desenhada segundo uma arquitetura **Three-Tier / API-Based**, separando apresentação, lógica de negócio e persistência. O frontend é uma SPA em **React 18 + TypeScript + Vite**, o backend é uma API REST em **Node.js/Express 5**, e a base de dados utiliza **MariaDB/MySQL** com motor InnoDB.

No backend foi adotado o padrão **Routes → Controllers → Services → Repositories**, garantindo separação de responsabilidades, maior testabilidade e manutenção mais simples. A base de dados foi evoluída através de migrações versionadas, com chaves estrangeiras, UUIDs, soft delete, auditoria e regras de integridade para preservar a consistência do fluxo clínico-laboratorial.

> **Notas de Orador (~1 min):**
> Realçar que o desenho procurou evitar acoplamento entre interface, regras de negócio e SQL. As rotas expõem a API, os controllers tratam pedidos e respostas, os services aplicam regras como transições válidas de estado, e os repositories isolam o acesso à base de dados.

---

### 7. Implementação

A implementação materializou os módulos principais do CRM Genoma. No frontend foram criadas interfaces responsivas com Tailwind, Shadcn/Radix e componentes reutilizáveis, incluindo modo escuro, pesquisa global, dashboards, notificações in-app, formulários e vistas de detalhe com edição inline.

No backend foram implementados autenticação JWT, passwords com bcrypt, RBAC, rate limiting, CORS restrito, auditoria, validações de payloads, endpoints REST e regras de negócio para contactos, processos, agendamentos, stocks, relatórios e administração. O sistema suporta exportação de listagens para Excel, CSV e PDF, além de isolamento de dados para o perfil Médico.

> **Notas de Orador (~1-2 min):**
> Dar exemplos visíveis da aplicação: criar contacto, agendar colheita, reservar kit, avançar processo no Kanban, registar resultado, gerar relatório e chegar à faturação. Referir também as contribuições: Rafael focado em UI/UX, frontend, contactos e base de dados; Alberto em stock, relatórios e base de dados; Alexandre e Daniel na finalização dos processos clínicos.

---

### 8. Conclusão

O CRM Genoma cumpriu o objetivo central do projeto: substituir uma aplicação local, limitada e descontinuada por uma plataforma web moderna, multiutilizador, segura e alinhada com o funcionamento real da organização. A solução centraliza a operação, melhora a rastreabilidade, reforça o controlo de acessos e cria uma base técnica preparada para evolução futura.

Como trabalho futuro destacam-se a integração com software de faturação certificado, o envio de notificações externas por e-mail ou SMS, o reforço de métricas analíticas e a preparação final para ambiente de produção. O projeto permitiu consolidar competências de engenharia de software, gestão de requisitos, arquitetura, base de dados, segurança e desenvolvimento full-stack em contexto real.

> **Notas de Orador (~1 min):**
> Fechar com um balanço honesto: o sistema já resolve os principais problemas do legado e deixa fundações sólidas para produção, mas ainda existem evoluções naturais para uma adoção completa em ambiente empresarial. Terminar agradecendo à orientadora, ao ISLA, à equipa Genoma e ao júri.

---

## Guia de texto para apresentação oral

> Esta versão serve como apoio caso exista bloqueio durante a apresentação. Cada slide tem: **ideia principal**, **texto para dizer** e **frase de transição**. O objetivo não é decorar palavra por palavra, mas ter um fio condutor claro.

---

### Slide 1 — Capa

**Ideia principal:** apresentar o projeto, a equipa e o contexto geral.

**Texto para dizer:**

Bom dia/boa tarde. O nosso projeto chama-se **CRM Genoma — Sistema de Gestão Operacional de Testes Genéticos** e foi desenvolvido no âmbito da Licenciatura em Engenharia Informática no ISLA. Este trabalho resulta de um contexto real, ligado à empresa Genoma, anteriormente conhecida como Stemyca, que atua na área dos testes genéticos.

O objetivo do projeto foi modernizar um sistema de informação antigo, limitado e dependente de uma instalação local, transformando-o numa aplicação web capaz de apoiar a operação diária da empresa. Ao longo da apresentação vou explicar o problema encontrado, os objetivos definidos, a análise realizada, a arquitetura escolhida, aquilo que foi implementado e as principais conclusões.

**Se bloquear, dizer simplesmente:**

Este projeto consistiu na reengenharia de um sistema legado da Genoma para uma plataforma web moderna, segura e multiutilizador.

**Transição:** Para começar, vou apresentar a estrutura da apresentação.

---

### Slide 2 — Agenda

**Ideia principal:** explicar o percurso lógico da apresentação.

**Texto para dizer:**

A apresentação está organizada em sete pontos principais. Primeiro faço o **enquadramento**, para explicar o contexto da empresa e o problema que motivou o projeto. Depois apresento os **objetivos**, ou seja, aquilo que se pretendia alcançar com a solução.

De seguida passo para a **análise preliminar**, onde foram identificadas as limitações do sistema antigo e os requisitos iniciais. Depois falo da **análise detalhada**, onde o domínio foi dividido em módulos, requisitos, user stories e casos de teste.

Na parte do **desenho**, explico a arquitetura da solução, a organização do backend, o frontend e a base de dados. Na **implementação**, resumo os módulos desenvolvidos e as principais funcionalidades. Por fim, termino com a **conclusão**, onde faço o balanço do projeto e refiro trabalho futuro.

**Se bloquear, dizer simplesmente:**

A apresentação segue o ciclo normal de um projeto de engenharia de software: problema, objetivos, análise, desenho, implementação e conclusões.

**Transição:** Começando então pelo enquadramento, é importante perceber primeiro de onde surgiu a necessidade deste projeto.

---

### Slide 3 — Enquadramento e objetivos

**Ideia principal:** explicar o problema real e os objetivos da solução.

**Texto para dizer:**

O projeto surge porque a Genoma utilizava um sistema antigo, herdado da fase em que a empresa ainda era conhecida como Stemyca. Esse sistema tinha várias limitações importantes: era uma aplicação instalada localmente, funcionava apenas num computador específico e era usada através de uma única conta de administrador.

Isto criava vários problemas. Em primeiro lugar, havia dependência de uma única máquina, o que era um risco para a continuidade da operação. Em segundo lugar, não existiam perfis de utilizador, por isso não era possível separar permissões entre receção, médicos, técnicos, administração ou gestão. Em terceiro lugar, a rastreabilidade era limitada, o que é especialmente crítico num contexto de testes genéticos, onde se trabalha com dados sensíveis.

O objetivo principal foi então desenvolver uma aplicação web que substituísse esse sistema legado. A nova solução deveria permitir gerir contactos, pacientes, stocks, agendamentos, processos clínicos, resultados, relatórios e faturação. Além disso, tinha de garantir rastreabilidade ao longo de todo o fluxo: **Lote, Kit, Agendamento, Colheita, Processo, Resultado, Relatório e Faturação**.

Também foi definido como objetivo garantir segurança, autenticação individual, controlo de acessos por perfil, auditoria e conformidade com o RGPD, porque os dados genéticos são dados particularmente sensíveis.

**Resumo por pontos:**

- O sistema antigo era local, limitado e dependente de uma conta admin.
- A empresa precisava de uma solução web, multiutilizador e evolutiva.
- O novo CRM centraliza a operação e melhora a rastreabilidade.
- A segurança e o RGPD foram tratados como requisitos centrais.

**Se bloquear, dizer simplesmente:**

O problema principal era substituir um sistema local e sem perfis por uma aplicação web capaz de acompanhar todo o ciclo de vida dos testes genéticos com segurança e rastreabilidade.

**Transição:** Depois de perceber o contexto, passámos à análise preliminar para transformar estes problemas em requisitos concretos.

---

### Slide 4 — Análise preliminar

**Ideia principal:** mostrar como o problema foi analisado e transformado em requisitos.

**Texto para dizer:**

Na análise preliminar começámos por estudar o funcionamento da organização e do sistema existente. O objetivo era perceber quais eram as dificuldades reais dos utilizadores e que riscos existiam no processo atual.

Foram identificados vários pontos críticos. O primeiro foi a falta de controlo de acessos, porque todos os utilizadores dependiam da mesma conta de administrador. Isto significa que não era possível saber com rigor quem alterou dados, quem consultou determinado processo ou quem executou determinada ação.

Outro problema foi a dispersão da informação. Num processo clínico-laboratorial, é essencial conseguir ligar o paciente ao médico, ao teste, ao kit utilizado, ao lote de origem, à colheita, ao resultado e à faturação. Sem esta ligação clara, torna-se difícil fazer auditorias, corrigir erros ou responder a situações como expiração de kits ou necessidade de rastrear uma amostra.

Com base nesta análise foram definidos os requisitos principais: gestão de contactos e pacientes, gestão de stocks e kits, agendamento de colheitas, workflow de processos, relatórios exportáveis, autenticação, permissões, auditoria e isolamento de dados por médico.

**Resumo por pontos:**

- Foram analisadas as limitações do sistema antigo.
- Foram identificados riscos operacionais, de segurança e de conformidade.
- Os problemas foram traduzidos em requisitos funcionais e não funcionais.
- A rastreabilidade foi definida como uma necessidade essencial, não como uma funcionalidade secundária.

**Se bloquear, dizer simplesmente:**

Nesta fase pegámos nos problemas do sistema antigo e transformámo-los em requisitos concretos para o novo CRM.

**Transição:** Depois desta visão inicial, a análise foi aprofundada e organizada em módulos, user stories e casos de teste.

---

### Slide 5 — Análise detalhada

**Ideia principal:** explicar os módulos, requisitos e validação funcional.

**Texto para dizer:**

Na análise detalhada organizámos o sistema em módulos principais. O primeiro módulo é o de **Contactos e Pacientes**, que permite gerir a informação das pessoas acompanhadas pela empresa. Depois temos o módulo de **Processos Clínicos**, que é o centro do sistema, porque liga o paciente, o médico, o teste, o kit, a colheita, os resultados, o relatório e a faturação.

Outro módulo importante é o de **Stocks**, onde são geridos lotes e kits. Cada kit tem um ciclo de vida, por exemplo disponível, reservado ou utilizado, e esta informação é essencial para garantir que a amostra certa fica associada ao processo certo.

Também foi implementado o módulo de **Relatórios e Listagens**, que permite consultar dados operacionais e exportar informação para Excel, CSV ou PDF. Além disso, existe a parte de **Administração**, onde são configurados utilizadores, perfis, permissões, testes, empresas e outros dados de suporte.

Para estruturar o trabalho foram documentadas **13 user stories** e **20 requisitos funcionais**, além de requisitos não funcionais ligados à segurança, usabilidade, desempenho e manutenção. Também foram definidos casos de teste para validar os fluxos mais críticos, como agendamento com reserva de kit, transições de estado do processo, rastreabilidade e controlo de permissões.

**Resumo por pontos:**

- O domínio foi dividido em módulos funcionais.
- O processo clínico é a entidade central do sistema.
- Foram definidos requisitos, user stories e casos de teste.
- A matriz de rastreabilidade liga requisitos a validação.

**Se bloquear, dizer simplesmente:**

Na análise detalhada organizámos o CRM em módulos e definimos user stories, requisitos e testes para garantir que os fluxos principais eram cobertos.

**Transição:** Com os requisitos definidos, o passo seguinte foi desenhar uma solução técnica capaz de os suportar.

---

### Slide 6 — Desenho

**Ideia principal:** explicar a arquitetura e justificar as escolhas técnicas.

**Texto para dizer:**

A solução foi desenhada com uma arquitetura **Three-Tier**, ou seja, dividida em três camadas principais: apresentação, aplicação e dados.

Na camada de apresentação temos o frontend, desenvolvido em **React 18 com TypeScript e Vite**. Esta camada é responsável pela interface que o utilizador vê: dashboards, formulários, tabelas, pipelines, páginas de detalhe, pesquisa global, notificações e modo escuro.

Na camada de aplicação temos o backend, desenvolvido em **Node.js com Express 5**. O backend expõe uma API REST e concentra as regras de negócio. É aqui que são validadas permissões, autenticação, transições de estado, criação de agendamentos, reserva de kits e registos de auditoria.

Na camada de dados temos **MariaDB/MySQL**, com uma base de dados relacional. A base de dados foi pensada para representar o domínio real: pacientes, médicos, kits, lotes, processos, resultados, faturação, utilizadores, perfis e auditoria.

No backend foi seguido o padrão **Routes, Controllers, Services e Repositories**. As routes definem os endpoints, os controllers tratam os pedidos HTTP, os services aplicam a lógica de negócio e os repositories isolam as queries SQL. Esta separação torna o sistema mais organizado, mais fácil de testar e mais simples de manter.

**Resumo por pontos:**

- Frontend em React para a interface.
- Backend em Express para a API e regras de negócio.
- MariaDB/MySQL para persistência relacional.
- Separação por camadas para melhorar manutenção e escalabilidade.

**Se bloquear, dizer simplesmente:**

O desenho separa a interface, a lógica de negócio e a base de dados, seguindo uma arquitetura Three-Tier com API REST.

**Transição:** Depois de definido o desenho técnico, avançámos para a implementação dos módulos principais.

---

### Slide 7 — Implementação

**Ideia principal:** explicar o que foi efetivamente construído no projeto.

**Texto para dizer:**

Na implementação foram desenvolvidas várias áreas do CRM Genoma. No frontend foi construída uma aplicação web com uma interface moderna e responsiva, baseada em React, TypeScript, Tailwind, Shadcn e Radix. Foram criados componentes reutilizáveis, modo escuro, pesquisa global, notificações in-app, dashboards, páginas de detalhe e formulários com validação.

Um dos módulos principais foi o de **Contactos e Pacientes**, onde é possível criar, consultar e editar informação associada aos utentes. Este módulo permite também ligar o contacto ao processo clínico e consultar informação organizada por separadores.

No módulo de **Stocks**, foram implementados lotes, kits, movimentos e estados do kit. Isto permite saber se um kit está disponível, reservado, utilizado ou descartado, garantindo rastreabilidade física do material.

No módulo de **Processos Clínicos**, foi implementado um workflow com estados controlados. Isto significa que o processo não deve avançar de forma aleatória, mas sim respeitando transições válidas, por exemplo desde o agendamento e colheita até ao resultado, relatório e faturação.

Também foi desenvolvido o módulo de **Relatórios/Listagens**, com filtros e exportação para Excel, CSV e PDF. Esta funcionalidade é importante porque permite à gestão obter informação operacional sem depender de consultas manuais à base de dados.

Do lado da segurança, foram implementados JWT, bcrypt para passwords, RBAC para permissões, rate limiting, CORS restrito, auditoria e isolamento de dados por médico. Assim, cada utilizador só deve aceder aos dados compatíveis com o seu perfil e responsabilidades.

**Resumo por pontos:**

- Foi implementada uma SPA completa em React.
- Foram desenvolvidos módulos de contactos, processos, stocks, relatórios e administração.
- O backend inclui autenticação, permissões, auditoria e validações.
- A solução permite acompanhar o fluxo operacional de ponta a ponta.

**Se bloquear, dizer simplesmente:**

Na prática, implementámos os módulos essenciais para gerir contactos, stocks, processos, relatórios, utilizadores e permissões, sempre com rastreabilidade e segurança.

**Transição:** Depois da implementação, é possível fazer um balanço final do que foi alcançado e do que ainda pode evoluir.

---

### Slide 8 — Conclusão

**Ideia principal:** fechar com resultados, aprendizagem e trabalho futuro.

**Texto para dizer:**

Concluindo, o CRM Genoma cumpriu o objetivo principal do projeto: substituir uma aplicação local, limitada e descontinuada por uma plataforma web moderna, multiutilizador e alinhada com o fluxo real da empresa.

A solução permite centralizar a informação, melhorar a rastreabilidade, controlar acessos por perfil, registar ações em auditoria e apoiar o ciclo completo dos testes genéticos. Isto representa uma melhoria significativa face ao sistema anterior, porque reduz dependências manuais, aumenta a segurança e cria uma base técnica preparada para evolução.

Do ponto de vista académico e técnico, o projeto permitiu aplicar conhecimentos de engenharia de software num contexto real: levantamento de requisitos, modelação de dados, arquitetura, frontend, backend, segurança, testes e gestão de projeto em equipa.

Como trabalho futuro, ficam algumas evoluções naturais: integração com software de faturação certificado, envio de notificações externas por e-mail ou SMS, reforço de métricas analíticas e preparação final para produção.

Em resumo, o projeto não é apenas um CRM tradicional. É uma plataforma operacional para acompanhar testes genéticos desde o kit inicial até ao resultado e faturação, com foco em rastreabilidade, segurança e organização.

**Resumo por pontos:**

- O sistema legado foi substituído por uma solução web.
- A operação ficou mais centralizada, segura e rastreável.
- O projeto aplicou conhecimentos reais de engenharia informática.
- Existem melhorias futuras, mas a base técnica ficou preparada.

**Se bloquear, dizer simplesmente:**

O principal resultado foi criar uma base sólida para a Genoma gerir testes genéticos de forma centralizada, segura e rastreável.

**Frase final:**

Obrigado pela atenção. Estamos disponíveis para responder às questões.

---

## Resumo ultra-curto para memorizar

1. **Problema:** sistema antigo local, sem perfis, sem evolução e com rastreabilidade limitada.
2. **Objetivo:** criar uma aplicação web para gerir todo o ciclo dos testes genéticos.
3. **Análise:** transformar limitações reais em requisitos, user stories e testes.
4. **Desenho:** arquitetura Three-Tier com React, Express e MariaDB/MySQL.
5. **Implementação:** contactos, stocks, processos, relatórios, administração, segurança e auditoria.
6. **Resultado:** sistema mais moderno, seguro, centralizado e preparado para produção.

## Frases úteis para recuperar se houver bloqueio

- O ponto principal deste slide é mostrar a passagem do problema para a solução.
- Em termos simples, esta parte demonstra como garantimos rastreabilidade.
- A ideia essencial é que cada camada tem uma responsabilidade diferente.
- Este módulo foi importante porque liga a operação real ao sistema.
- O projeto procurou resolver limitações concretas do sistema legado.
- A solução ficou preparada para evoluir, mesmo que ainda existam integrações futuras.
