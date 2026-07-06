# Licenciatura em Engenharia Informática

---

**Plataforma Web de Gestão de Consultas Médicas MediGest+**

**Rafael Fernandes Males**

---

## Resumo

O presente relatório documenta o desenvolvimento da aplicação web MediGest+, realizada no âmbito da unidade curricular de Projeto/Estágio do curso de Engenharia Informática (IPGT/ISLA), adotando metodologia Scrum e práticas de engenharia de software modernas. O projeto insere-se no contexto da crescente digitalização do setor da saúde, propondo uma solução moderna para a gestão de consultas médicas, que suporta três perfis de utilizador com funcionalidades específicas para administradores, médicos e pacientes, permitindo marcações, gestão de agendas e comunicação em contexto clínico.

A solução foi implementada em Laravel 12 (PHP 8.2) com Blade e Alpine.js no frontend, Tailwind CSS v4 para o design responsivo, Vite para bundling e FullCalendar para a agenda interativa dos médicos. Estão aplicadas as proteções por omissão do Laravel (hashing de passwords, CSRF, middleware de sessão e controlo de acesso por role simples). A internacionalização está preparada mas parcial (PT como idioma efetivo; EN/ES como evolução). Preferências de utilizador (tema claro/escuro e idioma) são persistidas; notificações são via base de dados (email preparado, mas não ativo em produção; em desenvolvimento pode usar-se Mailpit quando configurado).

Funcionalidades-chave incluem: (i) autenticação e perfis com menus e vistas dedicadas, (ii) marcação de consultas com validações e parámetros de agendamento (duração, passo e buffer), (iii) gestão de médicos e especialidades, (iv) calendário do médico (visualizações day/week/month) com confirmação/cancelamento, e (v) painéis/resumos básicos (próximas consultas); KPIs avançados ficam como trabalho futuro.

Os resultados obtidos demonstram uma aplicação estável, responsiva e acessível, capaz de digitalizar o processo de agendamento e reduzir o esforço administrativo. A arquitetura modular e os testes de feature cobrem fluxos críticos (autenticação, acesso por role e marcações), sustentando a manutenibilidade e a evolução futura (exportação, permissões mais finas, notificações transacionais por email/SMS, relatórios).

**Palavras-chave:** gestão clínica, marcação de consultas, Laravel, Tailwind, FullCalendar, RBAC (simples), i18n (parcial)

---

## Agradecimentos

Caros professores, orientadores, familiares e amigos,

Ao concluir este projeto final da Licenciatura em Engenharia Informática, é com um misto de gratidão, realização e emoção que olho para trás e recordo a jornada exigente e enriquecedora que me trouxe até aqui.

Em primeiro lugar, quero deixar um agradecimento sincero à minha família, cujo apoio incondicional, paciência e motivação foram fundamentais em todos os momentos. Nos dias mais longos e nos desafios mais complexos, foi o vosso suporte que me deu força para continuar. Esta conquista é, também, vossa.

Um agradecimento especial ao meu orientador, Professor José Moreira, pela disponibilidade constante, pelas orientações sempre assertivas e pela partilha de conhecimento ao longo de todo o desenvolvimento deste projeto. A sua orientação foi crucial para a qualidade técnica e coerência da solução desenvolvida.

Aos colegas e amigos, que ao longo destes anos contribuíram com ideias, partilhas, boa disposição e apoio mútuo, deixo a minha gratidão. O vosso companheirismo tornou esta etapa mais leve e estimulante.

Agradeço ainda à instituição de ensino e aos docentes do curso de Engenharia Informática, por todo o conhecimento transmitido e pelas ferramentas que me proporcionaram ao longo deste percurso académico. A formação recebida vai muito além das competências técnicas — moldou também a minha forma de pensar e resolver problemas no mundo real.

Este projeto representa mais do que um requisito académico. Representa resiliência, crescimento pessoal e profissional, e o culminar de um esforço contínuo em direção a um objetivo maior. É também uma ponte para o futuro, onde espero poder aplicar os conhecimentos adquiridos na construção de soluções tecnológicas úteis, humanas e sustentáveis.

A todos os que, de forma direta ou indireta, contribuíram para que este momento fosse possível: o meu mais sincero obrigado!

---

## Índice

| Secção | Página |
| --- | --- |
| Resumo | iii |
| Agradecimentos | i |
| Índice | iii |
| Índice de figuras | ix |
| Lista de acrónimos | xi |
| **PARTE I – PROJETO DE ENGENHARIA INFORMÁTICA** | **1** |
| 1. Introdução | 2 |
| 1.1 Enquadramento | 3 |
| 1.2 Entidade | 4 |
| 1.3 Objetivo Geral | 4 |
| 1.4 Objetivos Específicos | 5 |
| 1.5 Calendarização | 7 |
| 1.6 Público-Alvo | 11 |
| 1.7 Organização do Relatório | 11 |
| 2. Metodologia | 13 |
| 2.1 Abordagem | 13 |
| 2.2 Planeamento e cadência | 13 |
| 2.3 Gestão de requisitos e rastreabilidade | 13 |
| 2.4 Qualidade e Testes | 14 |
| 2.5 Gestão de configuração, versionamento e entrega | 14 |
| 2.6 Riscos e mitigação | 14 |
| 3. Âmbito do projeto | 15 |
| 3.1 Declaração do âmbito | 15 |
| 3.2 Apresentação do Projeto | 16 |
| 3.3 Descrição da área do negócio | 17 |
| 3.4 Problema(s) no negócio antes do sistema | 17 |
| 3.5 Decomposição funcional do Sistema | 18 |
| 3.6 Desempenho e disponibilidade esperada do sistema | 19 |
| 4. Análise preliminar | 20 |
| 4.1 Estado da arte | 20 |
| 4.2 Critérios de avaliação | 21 |
| 4.3 Métricas de avaliação | 21 |
| 4.4 Referencial de mercado #1 — Agendador clínico (genérico) | 22 |
| 4.5 Referencial de mercado #2 — Agendador genérico (não clínico) | 22 |
| 4.6 Quadro comparativo (síntese) | 23 |
| 4.7 Normas e referencias | 24 |
| 4.8 Estimativa orçamental (indicativa) | 24 |
| 4.9 Levantamento de requisitos (síntese) | 24 |
| 4.10 Requisitos não funcionais | 25 |
| 5. Análise detalhada | 26 |
| 5.1 Diagrama de caso uso | 26 |
| 5.1.1 Diagrama de caso de uso Administrador | 27 |
| 5.1.2 Diagrama de caso de uso Médico | 28 |
| 5.1.3 Diagrama de caso de uso Paciente | 29 |
| 5.2 Diagrama de Sequência | 29 |
| 5.2.1 Diagrama de sequência de Login | 30 |
| 5.2.2 Diagrama de sequência de Gestão de Agenda (Bloquear Período) | 31 |
| 5.2.3 Diagrama de Estados (visão geral) | 32 |
| 5.2.3.1 Diagrama de Estados do Administrador da plataforma | 33 |
| 5.2.3.2 Diagrama de Estados do Médico | 34 |
| 5.2.3.3 Diagrama de Estados do Paciente | 35 |
| 5.3 Modelo de dados | 36 |
| 5.3.1 Diagrama de Classes | 36 |
| 5.3.2 Diagrama Base de Dados | 37 |
| 5.3.3 Estrutura Lógica | 38 |
| 5.3.4 Flow Map do sistema | 42 |
| 6. Desenho | 43 |
| 6.1 Logotipo | 43 |
| 6.2 Icon | 44 |
| 7. Conclusão | 44 |
| 7.1 Reflexões finais | 45 |
| 7.2 Áreas a melhorar | 45 |
| 7.3 Limitações do Projeto | 46 |
| 7.4 Trabalho futuro | 47 |
| **PARTE II – PROJETO APLICADO DE ENGENHARIA INFORMÁTICA** | **48** |
| 8. Revisão ao projeto de Engenharia | 49 |
| 9. Desenvolvimento do Projeto | 50 |
| 9.1 Tecnologias / Ferramentas utilizadas | 51 |
| 10. Descrição do processo de desenvolvimento | 58 |
| 11. Conclusão | 93 |
| 12. Bibliografia e Referencias | 95 |
| ANEXO A: Manual de Utilizador | 97 |

---

## Índice de figuras

| Figura | Descrição | Página |
| --- | --- | --- |
| Figura 1 | ISLA GAIA | 5 |
| Figura 2 | Diagrama de Use Case | 28 |
| Figura 3 | Diagrama de Use Case Administrador | 29 |
| Figura 4 | Diagrama de Use Case Médico | 30 |
| Figura 5 | Diagrama de Use Case Paciente | 31 |
| Figura 6 | Diagrama de sequência (Marcação de Consultas) | 32 |
| Figura 7 | Diagrama de sequência (Login) | 33 |
| Figura 8 | Diagrama de sequência de Gestão de Agenda (Bloquear Período) | 34 |
| Figura 9 | Diagrama de Estados (Consulta) | 34 |
| Figura 10 | Diagrama de Estados (Administrador) | 35 |
| Figura 11 | Diagrama de Estados (Médico) | 36 |
| Figura 12 | Diagrama de Estados (Paciente) | 37 |
| Figura 13 | Diagrama de Classes (UML) do MediGest+ | 38 |
| Figura 14 | Diagrama Entidade–Relacionamento (Base de Dados) | 39 |
| Figura 15 | Flow Map do MediGest+ (navegação) | 44 |
| Figura 16 | Logotipo para (Dark Mode) | 45 |
| Figura 17 | Logotipo para (Light Mode) | 45 |
| Figura 18 | Icon do Medigest+ (.ico) | 45 |

---

## Lista de acrónimos

| Acrónimo | Significado |
| --- | --- |
| API | Application Programming Interface |
| BD | Base de Dados |
| CI/CD | Continuous Integration / Continuous Delivery |
| CRUD | Create, Read, Update, Delete |
| DER | Diagrama Entidade‑Relacionamento |
| DGPD/RGPD | Regulamento Geral de Proteção de Dados |
| DNS | Domain Name System |
| DTO | Data Transfer Object |
| HTTP/HTTPS | HyperText Transfer Protocol (Secure) |
| i18n | Internationalization |
| JWT | JSON Web Token |
| KPI | Key Performance Indicator |
| MVC | Model‑View‑Controller |
| RBAC | Role‑Based Access Control |
| REST | Representational State Transfer |
| SGBD | Sistema de Gestão de Base de Dados |
| SLA | Service Level Agreement |
| SSH | Secure Shell |
| TDD | Test‑Driven Development |
| UML | Unified Modeling Language |
| UI/UX | User Interface / User Experience |
| WAF | Web Application Firewall |

*Observação: Os acrónimos são utilizados ao longo do relatório e retomados na primeira ocorrência de cada secção para garantir clareza.*

---

# PARTE I – PROJETO DE ENGENHARIA INFORMÁTICA

## 1. Introdução

A crescente digitalização dos serviços de saúde e a necessidade de otimizar processos de marcação e gestão de consultas constituem o ponto de partida do MediGest+. Concebido e implementado por Rafael Males no âmbito do Projeto Final da Licenciatura em Engenharia Informática do Instituto Politécnico de Gestão e Tecnologia / ISLA, o MediGest+ materializa a passagem de conhecimentos académicos para uma solução prática, segura e implantável em clínicas e consultórios de pequena e média dimensão.

A aplicação apresenta uma experiência responsiva e centrada no utilizador, segmentada por perfis — administrador, médico e paciente — e cobre o ciclo essencial de marcação, gestão e acompanhamento de consultas, incluindo especialidades, agenda do paciente, notificações de confirmação/cancelamento (canal base de dados) e preferências de interface (tema e idioma). A arquitetura segue o padrão MVC com Laravel 12.x (PHP ≥ 8.2) no back-end, MySQL (ou equivalente SQL) como SGBD e um stack front-end composto por Vite 5+, Tailwind CSS v4, Alpine.js 3.x e Flowbite 2.x; não é usado Livewire nem Jetstream. O design system é utilitário (Tailwind), com modo escuro aplicado cedo no `<head>` para evitar FOUC.

Metodologicamente, o projeto seguiu uma abordagem iterativa e incremental (inspirada em SCRUM), com iterações curtas de entrega, validação contínua e documentação técnica. O pipeline de desenvolvimento integra Vite (assets), Pest/PHPUnit (testes), Laravel Pint (formatação de código), Collision (DX/erros) e scripts orquestrados por Composer — incluindo um comando dev que usa npx concurrently para executar em paralelo php artisan serve, queue listener (opcional) e npm run dev.

Este relatório descreve, com rigor académico, as fases do trabalho: análise e requisitos, modelação e desenho, implementação, testes, instalação/implantação, bem como limitações e trabalho futuro (p. ex., teleconsulta, exportação iCal e integrações externas). Em síntese, o MediGest+ responde a necessidades concretas do setor, equilibrando qualidade técnica com experiência de utilização e sustentando uma base sólida para evolução.

### 1.1 Enquadramento

O MediGest+ é uma aplicação web de gestão clínica desenvolvida como projeto final de curso por Rafael Males (Engenharia Informática, ISLA). O sistema endereça um cenário realista em que clínicas e unidades de saúde necessitam de marcação e gestão de consultas, gestão de perfis (admin, médico, paciente), notificações e experiências diferenciadas por perfil, com ênfase em usabilidade, acessibilidade, segurança e manutenibilidade.

No back-end, o projeto adota Laravel 12.x (conforme composer.json) sobre PHP 8.2+, tirando partido de migrations, Eloquent, validação, notificações e (opcionalmente) filas. No front-end, utiliza Vite 5+ e Tailwind v4, complementado por Alpine.js e Flowbite para interações leves; não há Livewire. A internacionalização está parcial (PT), com estrutura preparada para EN/ES. Preferências (tema/idioma) persistem em BD e cookies de conveniência.

Para além das funcionalidades nucleares (consultas, especialidades, perfis), o MediGest+ evidencia preocupações de engenharia de produto:

- Organização modular do código (Auth, Account, Admin, Medico, Paciente) e componentização Blade;
- Ferramentas de qualidade/DX presentes no composer.json (Laravel Pint, Collision; Pail/Sail não são requisitos nem estão ativos por omissão);
- Automação de desenvolvimento via scripts Composer — composer dev orquestra servidor Laravel, (opcional) fila e Vite em watch.

Este enquadramento posiciona o MediGest+ como artefacto académico-profissional: rigoroso e praticável para implantação e evolução.

### 1.2 Entidade

O ISLA – Instituto Politécnico de Gestão e Tecnologia, situado em Vila Nova de Gaia, foi fundado em 1989 e é uma instituição privada de ensino superior com forte presença nas áreas de Gestão, Tecnologia, Ciências Empresariais e Engenharia Informática. Com uma missão orientada para a formação de profissionais competentes, éticos e preparados para os desafios do mercado, o ISLA aposta na inovação e no desenvolvimento de projetos aplicados como componente essencial da aprendizagem.

A instituição tem vindo a adaptar os seus métodos pedagógicos às necessidades do mercado, promovendo o desenvolvimento de soluções reais em contextos simulados. O projeto MediGest+ surge neste âmbito como um contributo prático e tecnológico no domínio da transformação digital dos serviços de saúde.

### 1.3 Objetivo Geral

O objetivo geral do MediGest+ é disponibilizar uma plataforma web robusta, segura e escalável para marcação e gestão de consultas, com experiências diferenciadas para administrador, médico e paciente. A solução privilegia usabilidade, acessibilidade, segurança, desempenho e manutenibilidade, assente em Laravel 12 (PHP ≥ 8.2) no back-end e num front-end moderno suportado por Vite e Tailwind v4, preparada para implantação real e evolução futura.

### 1.4 Objetivos Específicos

**A. Funcionais (o que o sistema deve fazer):**

Pretende-se oferecer autenticação manual, sem recurso a Jetstream/Breeze, e a gestão de três perfis distintos (admin, médico e paciente), assegurando menus, permissões e fluxos adequados a cada perfil. No contexto do paciente, a plataforma deve permitir marcar, consultar e cancelar consultas, visualizar próximas marcações com detalhes e indicadores de acompanhamento, bem como receber notificações de confirmação ou cancelamento. Para o médico, o sistema deve disponibilizar acesso à agenda, gestão de horários e confirmações/cancelamentos das marcações atribuídas. Para o administrador, devem existir funcionalidades de gestão de especialidades, médicos e horários, além de uma visão global das consultas. Paralelamente, as preferências de interface e internacionalização devem ser persistidas (tema claro/escuro/sistema com predefinição para claro; idiomas PT/EN/ES; notificações por email, push e resumo semanal) tanto em base de dados como em cookies de conveniência (mg_theme, mg_locale). Como referência de aceitação, o fluxo de marcação do paciente deve concluir-se em poucos passos, as notificações devem surgir de forma visível na sua área inicial e a alternância de idioma deve ser possível nas definições pessoais.

**B. Qualidade de engenharia (como deve ser construído):**

A implementação deve respeitar o padrão MVC com Laravel 12, componentização Blade e organização modular por domínio (Auth, Account, Admin, Medico, Paciente), com JavaScript segmentado por páginas e layout, e CSS orientado a utilitários com Tailwind v4 (tokens via @theme e eliminação de estilos não utilizados via @source). Em termos de UI/UX e acessibilidade, o modo escuro deve ser ativado por data-theme="dark" aplicado no head para evitar FOUC, com troca automática de logótipo, mega menu acessível (focus trap, navegação por teclado e ARIA), botão "Saltar para o conteúdo" e contrastes adequados. O desempenho deve ser suportado por build com Vite, pré-carregamento de assets críticos e carregamento preguiçoso de imagens, procurando tempos de carregamento consistentes nas páginas principais. A qualidade do código deve ser acompanhada por testes (PHPUnit 11 para testes de feature e, quando aplicável, unitários), formatação automática com Laravel Pint, melhor experiência de desenvolvimento com Collision e observabilidade básica com Pail. Como critérios de aceitação, as vistas críticas devem comportar-se corretamente em temas claro e escuro, os testes devem cobrir login, criação de consulta e notificação, e a build de produção deve concluir sem erros com bundles otimizados.

**C. Segurança e conformidade:**

Devem estar ativas proteções por omissão, incluindo CSRF, validação rigorosa no servidor, hashing seguro de passwords (argon2id ou bcrypt), limitação de tentativas no login e autorização por perfil (Policies/Gates), além de cookies de preferências configurados com SameSite=Lax e Secure em HTTPS. A privacidade deve ser assegurada por minimização de dados visíveis por perfil e ocultação de informação sensível quando não necessária. Como critério de aceitação, rotas sensíveis devem permanecer inacessíveis sem autenticação e autorização válidas, e quaisquer alterações de estado devem ser rejeitadas na ausência de token CSRF válido.

**D. Implantação, manutenção e experiência do programador (DX):**

O repositório deve disponibilizar automatismos de desenvolvimento através de scripts em composer.json para execução paralela do servidor de aplicação, processamento de filas e build de assets (por exemplo, "composer dev" a orquestrar php artisan serve, queue:listen e npm run dev via npx concurrently), bem como scripts de teste e otimização (php artisan optimize e optimize:clear). A documentação deve ser completa, cobrindo stack, instalação, scripts, convenções e resolução de problemas, incluindo guia de instalação (migrations, storage:link e build). A observabilidade deve contemplar logging estruturado e filas configuráveis (por exemplo, driver "database"). Como referência de aceitação, o projeto deve executar localmente em poucos passos previsíveis (clonar, instalar dependências, configurar .env, gerar chave, migrar, servir a aplicação e executar o Vite em desenvolvimento) e as filas devem operar corretamente quando configuradas e ativas com php artisan queue:work.

**E. Entregáveis e avaliação:**

O código-fonte deve ser versionado em Git e acompanhado de README atualizado. O relatório técnico académico deve abranger análise, desenho, implementação, testes e conclusões, incluindo diagramas, capturas de ecrã e trechos de código comentados. Devem ainda ser fornecidos manuais de utilização para frontoffice e backoffice e o procedimento de instalação. A aceitação contempla um relatório que reflita o ciclo completo do projeto com rigor e clareza e manuais que permitam a um utilizador não técnico executar as tarefas comuns de forma autónoma.

### 1.5 Calendarização

**Período do projeto:** abril ⟶ início de setembro (aprox. 5 meses).

**Modelo de trabalho:** iterações semanais (sprints curtas), com marcos mensais e incrementos funcionais testáveis.

#### Detalhe por iteração (marcos e incrementos)

**Abril (S1–S4) — Arranque e análise**

- Definição do âmbito, personas e requisitos (funcionais e não funcionais).
- Estado da arte (soluções existentes, padrões de UX/Security no e-saúde).
- Preparação do ambiente: Laravel 12, PHP 8.2, Vite, Tailwind v4, Node 18.
- Estrutura inicial do projeto (MVC, rotas base, controllers "skeleton").
- Repositório Git e scripts de DX (composer dev).

**Maio (S5–S8) — Fundações UI/UX, navegação e tema**

- Layouts Blade (layouts/app.blade.php, layouts/dashboard.blade.php).
- Sidebar dinâmica por role (admin/médico/paciente).
- Navbar do paciente com mega menu acessível (focus trap, teclado, ARIA).
- Componentes UI reutilizáveis (Hero, Breadcrumbs).
- Sistema de tema: aplicação no `<head>` (partials/theme.blade.php), cookies, troca automática de logótipo; varredura inicial de classes dark:*.

**Junho (S9–S12) — Módulo Paciente**

- Home do paciente: próximas consultas, KPIs, modal de detalhe.
- Especialidades: index (pesquisa/filtros) e show (listagem de médicos).
- Canais de contacto: telefones, WhatsApp, emails, horários.
- Internacionalização (PT/EN/ES) e comutação nas definições.
- Persistência de preferências (tema, idioma, notificações) em BD e cookies.

**Julho (S13–S16) — Módulos Médico e Admin; notificações**

- Médico: agenda, confirmação/cancelamento, gestão de disponibilidades.
- Admin: gestão de especialidades, médicos e horários; visão global das consultas.
- Notificações Laravel (ConsultaConfirmada/Cancelada) + alertas na home do paciente.
- Reforço de políticas/guards por perfil; validações server-side.

**Agosto (S17–S20) — Qualidade, A11y, desempenho e testes**

- Revisão completa de modo escuro (contrastes, estados, chips/pills).
- Acessibilidade: "Saltar para o conteúdo", ARIA landmarks, foco visível.
- Performance: pré-carregamento de assets, lazy-loading, bundles Vite otimizados.
- Testes (PHPUnit 11): login, criação/cancelamento/confirm. de consultas, notificações.
- Pint (formatação), Collision (DX), Pail (observabilidade básica).
- Atualização do README e dos guias de instalação/uso.

**Início de setembro — QA e entrega**

- Bugfix e polimento final (UX, mensagens, i18n).
- Empacotamento: npm run build, php artisan optimize, artefactos finais.
- Relatório (versão candidata), anexos (manuais front/backoffice, instalação).
- Tag de release e preparação da apresentação.

#### Marcos (milestones)

- **M1** (fim de abril): Projeto inicial configurado + requisitos validados.
- **M2** (fim de maio): Fundações de UI/UX, navegação por role e tema operacional.
- **M3** (fim de junho): MVP Paciente (home, especialidades, canais, preferências).
- **M4** (meados de julho): MVP Médico (agenda) + Admin (gestões base).
- **M5** (fim de agosto): Beta com A11y, dark mode completo, testes e docs.
- **M6** (início de setembro): RC/Entrega final (build, relatório, anexos).

#### Observações de planeamento

- **Ritmo:** sprints semanais com revisão/demonstração no final de cada mês.
- **Risco/Buffer:** 10–15% do tempo reservado em agosto para mitigação de riscos (bugs, ajustes de UX/i18n, compatibilidades).
- **Critério de "Pronto":** incremento utilizável, testado (feature tests) e documentado (README/guia).

#### Cronograma por fases (síntese)

| Mês / Período | Foco principal | Entregáveis (exemplos) |
| --- | --- | --- |
| Abril (S1–S4) | Arranque, análise e base técnica | Repositório Git; .env e setup Laravel 12/PHP ≥ 8.2; Vite + Tailwind v4; estrutura MVC; análise & requisitos. |
| Maio (S5–S8) | Fundações de UI/UX e navegação por perfis | Layouts Blade (app, dashboard), sidebar por role, navbar do paciente com mega menu; componentes UI (hero, breadcrumbs); módulo tema (dark/light/system, logo swap, FOUC-free). |
| Junho (S9–S12) | Módulo Paciente | Home do paciente (KPIs, próximas consultas, detalhes); Especialidades (index/show); Canais; i18n (PT/EN/ES); persistência de preferências (cookies mg_theme, mg_locale). |
| Julho (S13–S16) | Módulos Médico e Admin | Agenda do médico (listas/confirmar/cancelar); gestão de especialidades/médicos/horários; visão global de consultas; notificações (Confirmada/Cancelada) e alertas na home do paciente. |
| Agosto (S17–S20) | Qualidade, acessibilidade, desempenho e testes | Revisão de modo escuro em todas as vistas; foco/ARIA/"Saltar para conteúdo"; otimizações Vite; testes (PHPUnit 11), Pint; documentação técnica (README) e guias de utilização. |
| Início de setembro | Consolidação, QA final e entrega | Correções finais; empacotamento; Relatório e anexos; tag/versão do release; preparação de apresentação. |

### 1.6 Público-Alvo

- **Comissão avaliadora e docentes** — avaliação técnica, metodológica e documental.
- **Equipa de projeto** — referência para manutenção e evolução.
- **Stakeholders de negócio** (administração/secretariado clínico) — entendimento do alinhamento solução‑processos.
- **Utilizadores finais** (médicos e pacientes) — visão geral de capacidades e UX esperada.

### 1.7 Organização do Relatório

Este relatório foi estruturado para refletir, de forma clara e sequencial, a evolução do MediGest+ desde a conceção até à entrega da aplicação funcional. A organização acompanha o ciclo completo do projeto (análise → desenho → implementação → testes → conclusão), evidenciando decisões técnicas e pedagógicas tomadas no âmbito do Projeto Final da Licenciatura em Engenharia Informática (IPGT/ISLA). A estrutura do documento é a seguinte:

- **Introdução:** Contextualização do problema, enquadramento académico, objetivos (geral e específicos) e público-alvo.
- **Metodologia:** Abordagem de trabalho adotada, calendarização por fases/sprints e principais marcos.
- **Requisitos:** Levantamento e síntese dos requisitos funcionais e não funcionais que orientam o desenvolvimento.
- **Arquitetura do Sistema:** Visão geral da organização do código, padrão de camadas e principais módulos.
- **Base de Dados:** Modelo lógico resumido, entidades nucleares e relações essenciais.
- **Desenvolvimento:** Principais funcionalidades implementadas no frontoffice (paciente) e backoffice (admin/médico), com referência a decisões de interface e usabilidade.
- **Testes Realizados:** Estratégia de verificação e validação, casos de teste representativos e resultados gerais.
- **Instalação e Manutenção:** Passos de instalação/execução em ambiente local e notas de manutenção operacional.
- **Conclusão:** Síntese dos objetivos alcançados, dificuldades e limitações encontradas, bem como propostas de trabalho futuro.
- **Anexos:** Diagramas, capturas de ecrã das interfaces e documentação complementar de apoio.

## 2. Metodologia

A abordagem seguida neste projeto foi iterativa e incremental, com base na metodologia Scrum, permitindo incorporar feedback frequente dos stakeholders e reduzir risco de forma progressiva. O trabalho organizou‑se em sprints curtos com entregas potencialmente utilizáveis ao final de cada iteração.

### 2.1 Abordagem

Adotou-se uma abordagem iterativa e incremental, inspirada em Scrum, adequada a um projeto académico com um único desenvolvedor e um orientador que atua como parte interessada principal. Cada iteração entregou um incremento funcional potencialmente utilizável, com foco nas áreas de maior risco/valor (paciente → médico → admin).

### 2.2 Planeamento e cadência

- Sprints semanais (abril ⟶ início de setembro), com marcos mensais (M1–M6) para consolidação.
- Ritual leve: planeamento no início da semana (priorização), revisão/demonstração no fim do mês, retro breve para ajustes.
- Buffer de risco: 10–15% em agosto para bugs, acessibilidade e polimento.

### 2.3 Gestão de requisitos e rastreabilidade

- Backlog funcional organizado por épicos: Paciente, Médico, Admin, Agenda/Slots, Notificações, Preferências.
- User stories com critérios de aceitação (ex.: "Como paciente, quero marcar consulta num wizard em poucos passos…").
- Rastreabilidade: histórias mapeadas para commits, migrations e testes (feature tests), e refletidas nas secções de Arquitetura e Base de Dados.

### 2.4 Qualidade e Testes

**Definição de Pronto (DoD):**

- Código compilado/buildado (Vite) e formatado (Laravel Pint).
- Validações server-side e proteções padrão (CSRF, auth/roles) ativas.
- Feature tests (Pest/PHPUnit) para login e ciclo de marcação (criar/confirmar/cancelar) a passar.
- UI verificada em tema claro/escuro nas vistas críticas.
- Documentação/README atualizados.

**Testes automatizados:** cobertura de fluxos críticos (autenticação, marcações, notificações internas).

**DX/observabilidade:** Collision para DX e logs Laravel padrão; filas opcionais para notificações.

### 2.5 Gestão de configuração, versionamento e entrega

- Git com fluxo leve baseado em branches de feature e releases etiquetadas nos marcos.
- Scripts de desenvolvimento via Composer (servidor Laravel + Vite e, quando necessário, fila).
- Build de produção manual para a entrega académica (npm run build, php artisan optimize).
- Ambiente de dev: Mailpit opcional; dados de acesso e chaves mantidos fora do relatório público.

### 2.6 Riscos e mitigação

- **Conflitos/overbooking:** regra de negócio centralizada (service) e constraint única por médico/data/hora; testes de fluxo.
- **Acessibilidade/UX:** revisão de contrastes e "skip to content" na fase final.
- **Internacionalização:** PT operacional; EN/ES planeados para pós-entrega.
- **Privacidade/GDPR:** minimização e separação por perfis; auditoria e encriptação em repouso como trabalho futuro.

## 3. Âmbito do projeto

### 3.1 Declaração do âmbito

**Incluído**

- Plataforma web MediGest+ para marcação e gestão de consultas médicas, com foco na digitalização do processo de agendamento e acompanhamento operacional.
- Perfis de utilizador: Administrador, Médico e Paciente, com vistas, permissões e responsabilidades claramente diferenciadas.
- Gestão de catálogo de especialidades, médicos, horários e regras de agenda (duração dos slots, intervalos, buffers e janelas de atendimento).
- Calendário interativo por médico (visualizações dia/semana/mês), incluindo criação, alteração e cancelamento de marcações, com validações de conflito.
- Dashboard operacional com indicadores de utilização e KPIs (ocupação, distribuição por estado, próximas consultas, lead time de marcação).
- Autenticação de utilizadores, recuperação de palavra-passe, gestão de perfil e preferências (tema claro/escuro, idioma, notificações).
- RBAC (Role-Based Access Control) com registo de auditoria para operações críticas (acessos administrativos, alterações de marcações).
- Internacionalização (i18n) da interface e conteúdos para pt/en/es.

**Excluído**

- Prontuário clínico e registo de atos médicos.
- Faturação e integração com ERP.
- Integrações com sistemas de billing ou gateways de pagamento.
- Teleconsulta (video call) e prescrição eletrónica.

**Delimitação e pressupostos**

- O projeto centra-se no ciclo de agendamento; módulos clínicos/financeiros e integrações externas são considerados trabalho futuro.
- Ambiente de execução previsto em Docker (VPS/on-prem). Email em desenvolvimento entregue via Mailpit (sandbox), ficando integrações de produção (SMTP/SMS) para fase posterior.
- Conformidade RGPD: aplica-se o princípio da minimização de dados e a recolha de consentimentos explícitos quando aplicável.
- Exportação de dados em CSV/Excel (consultas, médicos, pacientes), visando análise externa e interoperabilidade básica.

### 3.2 Apresentação do Projeto

O MediGest+ disponibiliza interfaces dedicadas por perfil:

- **Administrador** — parametrização global; gestão de utilizadores (CRUD), especialidades e agendas; consulta de indicadores; exportações; monitorização e auditoria.
- **Médico** — agenda própria (janelas/disponibilidades básicas), confirmação/cancelamento de marcações; lista do dia.
- **Paciente** — autoagendamento por especialidade/médico; consulta e gestão das próprias marcações; preferências e notificações internas.

**Arquitetura tecnológica (sumário):**

- **Backend:** Laravel (MVC) sobre PHP 8.x, com middlewares de sessão, políticas de autorização (Policies/Gates) e integração de RBAC.
- **Autenticação/UI:** Jetstream com Livewire/Blade (gestão de sessão, recuperação de palavra-passe, base para 2FA se requerido).
- **Frontend:** Tailwind CSS para estilos responsivos; bundling com Vite.
- **Agenda:** FullCalendar (visões day/week/month e ações rápidas).
- **Gráficos:** Chart.js no dashboard.
- **Exportação:** Laravel Excel (CSV/XLSX).
- **Email (dev):** Mailpit (sandbox).
- **Dados:** SGBD relacional (MySQL/PostgreSQL).

### 3.3 Descrição da área do negócio

O sistema dirige-se a clínicas e consultórios com múltiplas especialidades e agendas independentes por médico. O ecossistema atual carece de:

- Transparência de disponibilidade, reduzindo trocas telefónicas e tempos de espera;
- Consistência no cumprimento de regras de agenda (durações, buffers, bloqueios);
- Medição objetiva de ocupação e produtividade (KPIs);
- Comunicação proativa de alterações (cancelamentos/remarcações) para mitigar no-shows e frustração do paciente.

**Stakeholders:** direção, secretariado/atendimento, corpo clínico e pacientes. **Processos impactados:** planeamento de horários, marcação, confirmação, gestão de alterações, monitorização e reporting.

### 3.4 Problema(s) no negócio antes do sistema

- Agendamento manual (telefone/email) com baixa rastreabilidade e suscetível a erros.
- Conflitos e ineficiências em calendário (duplas marcações, gaps não aproveitados).
- Custo administrativo elevado e ausência de indicadores para gestão informada.
- Comunicação tardia de alterações, aumentando no-shows e insatisfação.
- Riscos de não conformidade RGPD (dispersão de dados, procedimentos não uniformes).

### 3.5 Decomposição funcional do Sistema

- **Autenticação & Perfis** — registo; login; recuperação de palavra-passe; gestão de conta; preferências (tema; idioma PT).
- **Administração** — gestão de utilizadores (CRUD); RBAC simples por role; especialidades; parâmetros globais e horários.
- **A Agenda do Médico** — definição de janelas/disponibilidades; sem bloqueios de férias/feriados dedicados (futuro); visões dia/semana/mês; confirmação/cancelamento.
- **Marcações** — criação/alteração/cancelamento; deteção de conflitos; estados pendente/confirmada/cancelada/concluída; histórico e rastreabilidade.
- **Notificações** — internas (database) para confirmação/cancelamento; email/SMS para futuro.
- **Dashboards/Relatórios** — resumos básicos; KPIs e exportações CSV/Excel para futuro.
- **Configurações & Preferências** — gestão de tema, idioma (PT, ES, EN) e definições pessoais.
- **Traçabilidade:** refletida em casos de uso, fluxos e modelo de dados.

### 3.6 Desempenho e disponibilidade esperada do sistema

| Categoria | Meta | Observações |
| --- | --- | --- |
| Tempo de resposta | ≤ 2 s para 95% das requisições | Medido para páginas de dashboard e agenda |
| Concorrência | 100 utilizadores ativos | Escalável horizontalmente via contêineres |
| Disponibilidade | ≥ 99,0% (horário laboral) | Monitorização e alertas |
| Integridade de dados | 0 perdas em operações ACID | Transações no SGBD |
| Segurança | 0 vulnerabilities críticas em scans periódicos | OWASP Top 10 mitigado |
| Tempo de recuperação | < 4 h (RTO) | Backups diários; RPO ≤ 24 h |

## 4. Análise preliminar

Esta secção enquadra o MediGest+ face ao estado da arte, define critérios e métricas de avaliação, apresenta referenciais de mercado genéricos (sem marcas), um quadro comparativo, referencia normas relevantes, estima custos e sintetiza o levantamento de requisitos funcionais e não funcionais.

### 4.1 Estado da arte

O panorama de marcação e gestão de consultas médicas pode agrupar-se em três famílias de soluções:

1. **Soluções clínicas integradas** (agenda + clínica/ERP): alto grau de integração, maior complexidade.
2. **Agendadores especializados em saúde:** foco em agenda médica, self-service, lembretes, gestão de recursos.
3. **Agendadores genéricos:** úteis para marcação de slots, mas sem semântica clínica (especialidades, perfis, privacidade clínica).

**Tendências:** autoagendamento do paciente, regras de agenda (buffers/bloqueios), dashboards operacionais, integrações (vídeo/pagamentos/EHR), segurança e privacidade por conceção (RGPD).

**Posicionamento do MediGest+:** classe (2) — agenda clínica com self-service do paciente, RBAC, dashboard (KPIs) e auditoria, deixando fora desta versão prontuário, faturação/ERP e teleconsulta.

### 4.2 Critérios de avaliação

- **Funcionalidade:** agenda por médico, regras/buffers, bloqueios, estados de consulta, notificações básicas.
- **Usabilidade & Acessibilidade:** UX responsiva, consistência de estados, i18n, WCAG 2.1 (nível base).
- **Segurança & Privacidade (RGPD):** autenticação/recuperação, RBAC, auditoria, minimização de dados, consentimento.
- **Integração & Extensibilidade:** APIs, modularidade, potencial para vídeo/pagamentos/sincronização de calendários.
- **Desempenho & Escala:** latência p95, concorrência, eficácia de filas e caching seletivo.
- **Operação & Manutenção:** migrations, testes, runbooks, backup/restore.
- **Custo total de propriedade (TCO):** infra, operação, suporte.
- **Conformidade & Qualidade:** PSR-12, OWASP, boas práticas Laravel.

### 4.3 Métricas de avaliação

- p95 de resposta (agenda/dashboard) ≤ 2 s.
- Disponibilidade (horário laboral) ≥ 99,0 %.
- Conflitos não detetados em testes: 0.
- Erros 5xx < 0,1 %.
- Cobertura de testes (funcionalidades críticas) ≥ 60–70 %.
- MTTR < 4 h (com backup/restore validado).
- Vuln. críticas = 0 em verificações OWASP regulares.

### 4.4 Referencial de mercado #1 — Agendador clínico (genérico)

**Descrição:** aplicações SaaS focadas em marcação clínica, com self-service, regras de agenda por médico e lembretes.

**Lições para o MediGest+:**

- Clareza na seleção de especialidade/médico e slot disponível.
- Bloqueios e buffers configuráveis por agenda.
- Painéis simples com ocupação e distribuição por estado.

### 4.5 Referencial de mercado #2 — Agendador genérico (não clínico)

**Descrição:** ferramentas horizontais de marcação de slots.

**Lições para o MediGest+:**

- Fluxos de marcação rápidos e UI minimalista.
- Limitações em semântica clínica, RBAC e auditoria, reforçando a necessidade de um desenho próprio no MediGest+.

### 4.6 Quadro comparativo (síntese)

| Critério | MediGest+ | Ref. Clínico (genérico) | Ref. Genérico (não clínico) | Observações |
| --- | --- | --- | --- | --- |
| Agenda clínica (regras/buffers/bloqueios) | Forte | Forte | Fraco | MediGest+ focado no domínio médico |
| Self-service do paciente | Forte | Forte | Médio | MediGest+ com pesquisa por especialidade/médico |
| RBAC e auditoria | Forte | Médio | Fraco | Granularidade por papel no MediGest+ |
| Dashboards/KPIs operacionais | Médio-Forte | Médio | Fraco | KPIs centrados em ocupação/estados |
| Integrações (vídeo/pagamentos/EHR) | Planeado | Forte (variável) | Fraco | Fora de âmbito nesta versão |
| Aderência RGPD | Forte (base) | Médio-Forte | Fraco-Médio | Requer ajustes adicionais em produção |

### 4.7 Normas e referencias

- RGPD (privacidade por conceção e por defeito).
- OWASP Top 10 (mitigação de riscos aplicacionais).
- ISO/IEC 27001 (gestão de segurança da informação) e ISO/IEC 27701 (privacidade).
- WCAG 2.1 (acessibilidade).

### 4.8 Estimativa orçamental (indicativa)

**Infra mínima (produção):**

- VPS 2–4 vCPU / 4–8 GB RAM: 20–50 €/mês.
- BD gerida (opcional): 30–80 €/mês.
- Domínio + TLS (Let's Encrypt): 10–20 €/ano.
- SMTP (email): custo pay-as-you-go baixo.

**Operação/DevOps:** soluções open-source possíveis (CI, monitorização); custo varia com escala (médicos/consultas) e metas de disponibilidade.

### 4.9 Levantamento de requisitos (síntese)

**Funcionais:** autenticação/recuperação; perfis e RBAC; catálogo (especialidades, tipos de consulta); agenda do médico (janelas, buffers, bloqueios); marcações (criar/alterar/cancelar; estados); notificações por email; dashboard (KPIs); auditoria; i18n (pt/en/es).

**Dados:** modelo relacional (3NF), FKs numéricas, índices por caso de uso, retenção/backup/restore, transações ACID.

- Autenticação & Perfis — registo; login; preferências (tema; idioma PT); gestão de conta.
- Administração — gestão de utilizadores (CRUD); RBAC simples por role; especialidades; parâmetros globais e horários.
- A Agenda do Médico — definição de janelas/disponibilidades; sem bloqueios de férias/feriados dedicados (futuro); visões dia/semana/mês; confirmação/cancelamento.
- Marcações — criação/alteração/cancelamento; detecção de conflitos; estados pendente/confirmada/cancelada/concluída; histórico e rastreabilidade.
- Notificações — internas (database) para confirmação/cancelamento; email/SMS para futuro.
- Dashboards/Relatórios — resumos básicos; KPIs e exportações CSV/Excel para futuro.
- Configurações & Preferências — gestão de tema, idioma (PT, ES, EN) e definições pessoais.
- Traçabilidade: refletida em casos de uso, fluxos e modelo de dados.

### 4.10 Requisitos não funcionais

- **Segurança:** OWASP, rate-limiting, CSP/HSTS, hashing robusto, menor privilégio; recuperação de palavra-passe.
- **Privacidade:** minimização, consentimento, direitos de titulares, registos de acesso.
- **Desempenho:** p95 ≤ 2 s (agenda/dashboard), ~100 utilizadores concorrentes, jobs assíncronos.
- **Disponibilidade:** ≥ 99,0 % (horário laboral), RTO < 4 h, RPO ≤ 24 h, backup diário validado.
- **Usabilidade & Acessibilidade:** responsivo, WCAG 2.1 (base), mensagens/estados consistentes.
- **Escalabilidade:** sessões/filas passíveis de Redis; caching seletivo; containers para escala horizontal.
- **Manutenibilidade:** PSR-12, lint, testes feature, migrations idempotentes, documentação (manual, instalação, runbooks).
- **Observabilidade:** logging estruturado, métricas (p95, erros, filas), health checks e alertas.

*Síntese: o MediGest+ pretende cobrir os requisitos essenciais do domínio de marcação clínica, está alinhado com as tendências atuais e encontra-se preparado para evoluir com segurança, qualidade e extensibilidade, sem dependências de plataformas externas específicas.*

## 5. Análise detalhada

Neste capítulo serão apresentados todos os diagramas produzidos na fase de conceção do projeto.

### 5.1 Diagrama de caso uso

No contexto do desenvolvimento deste projeto, o diagrama de caso de uso torna-se essencial para entender as interações entre o utilizador e o sistema.

O sistema apresenta três atores — Administrador, Médico e Paciente — com responsabilidades distintas. As funcionalidades nucleares incluem autenticação/recuperação de acesso, marcação/gestão de consultas, gestão de agendas e especialidades, dashboard (KPIs), bem como auditoria e preferências de utilizador.

> **Figura 2** — Diagrama de Use Case

#### 5.1.1 Diagrama de caso de uso Administrador

Responsável pela parametrização e governação: gestão de utilizadores, RBAC, especialidades, configuração global de agenda, dashboard e relatórios e auditoria/logs.

> **Figura 3** — Diagrama de Use Case Administrador

#### 5.1.2 Diagrama de caso de uso Médico

Foca-se na gestão operacional da agenda: definição de janelas e regras, bloqueios de férias/ausências, aprovação/ajuste de marcações, consulta dia/semana/mês, lista de pacientes do dia e KPIs de ocupação/estados.

> **Figura 4** — Diagrama de Use Case Médico

#### 5.1.3 Diagrama de caso de uso Paciente

Orienta-se para autoatendimento e experiência: registo/autenticação/recuperação, pesquisa por especialidade/médico, seleção de slots disponíveis, marcação/cancelamento/remarcação, consulta das suas marcações e preferências (tema/idioma/notificações).

> **Figura 5** — Diagrama de Use Case Paciente

### 5.2 Diagrama de Sequência

O diagrama de sequência vai representar de forma gráfica como processos interagem ao longo do tempo. Serão apresentadas as fases ou passos de uma determinada operação no sistema, geralmente do ponto de vista de um objeto ou entidade. Em sistemas complexos este tipo de diagrama torna-se útil para ajudar a entender o fluxo e ordem das operações.

Abaixo apresenta-se uma sequência representativa do processo de marcação de consulta: o paciente solicita a criação, a UI envia para o AppointmentController, são verificadas as regras e conflitos via AgendaService, consulta-se a base de dados, e retorna-se confirmação/erro.

> **Figura 6** — Diagrama de sequência (Marcação de Consultas)

#### 5.2.1 Diagrama de sequência de Login

Fluxo de autenticação: submissão de credenciais pela UI, validação no AuthController com o UserProvider/DB e criação de sessão (driver database), seguida de redireção para o dashboard ou mensagem de erro.

> **Figura 7** — Diagrama de sequência (Login)

#### 5.2.2 Diagrama de sequência de Gestão de Agenda (Bloquear Período)

Mostra o fluxo de um Médico a bloquear um intervalo na agenda: UI → ScheduleController → AgendaService → BD (horarios/consultas) → notificações se houver consultas afetadas.

> **Figura 8** — Diagrama de sequência de Gestão de Agenda (Bloquear Período)

#### 5.2.3 Diagrama de Estados

Esta secção apresenta o modelo de estados das entidades e papéis mais relevantes do MediGest+. A visão geral foca a entidade transacional "Consulta", cuja evolução é comum aos três perfis (Administrador, Médico e Paciente). As subseções 5.2.3.1–5.2.3.3 detalham os estados operacionais por papel (Médico, Administrador, Paciente).

> **Figura 9** — Diagrama de Estados (Consulta)

##### 5.2.3.1 Diagrama de Estados do Administrador da plataforma

Estados principais do Administrador: Desautenticado → Autenticado → navegação entre módulos (Utilizadores, RBAC, Especialidades, Configuração de Agendas, Dashboard & Relatórios, Exportações, Auditoria, Configurações) → Logout/Timeout.

> **Figura 10** — Diagrama de Estados (Administrador)

##### 5.2.3.2 Diagrama de Estados do Médico

Estados operacionais: Autenticado → (Visualizar Agenda | Definir Regras/Janelas | Bloquear Períodos | Aprovar/Ajustar Marcações | Lista do Dia | KPIs) → Logout/Timeout.

> **Figura 11** — Diagrama de Estados (Médico)

##### 5.2.3.3 Diagrama de Estados do Paciente

Estados: Autenticado → (Pesquisar Especialidade/Médico → Selecionar Slot → Gerir Marcações; Preferências) → Logout/Timeout.

> **Figura 12** — Diagrama de Estados (Paciente)

### 5.3 Modelo de dados

#### 6.1 Modelo de dados

A modelação do MediGest+ segue uma abordagem relacional normalizada (3NF), separando identidade de conta (users) dos perfis de domínio (medicos, pacientes) e concentrando a transação em consultas. O catálogo clínico (especialidades, consulta_tipos) e as tabelas de configuração/agenda (horarios, configuracao_horarios, parametros_agendamento) sustentam regras de disponibilidade, duração e buffers. Adotam-se FKs numéricas, constraints de unicidade, índices operacionais (por médico/paciente/data) e checks para garantir integridade e desempenho.

##### 5.3.1 Diagrama de Classes

Representa as entidades nucleares de domínio (User, Médico, Paciente, Especialidade, ConsultaTipo, Consulta, Horário) e as associações 1–1/1–N/N–N, alinhadas com os casos de uso (sec. 5.1) e os fluxos transacionais (sec. 5.2).

> **Figura 13** — Diagrama de Classes (UML) do MediGest+

##### 5.3.2 Diagrama Base de Dados

O diagrama entidade–relacionamento evidencia tabelas de domínio, pivots (especialidade_medico) e tabelas de infraestrutura Laravel em uso (sessões, jobs, notifications, password reset), com FKs explícitas entre consultas, médicos, pacientes, especialidades e tipos de consulta.

> **Figura 14** — Diagrama Entidade–Relacionamento (Base de Dados)

##### 5.3.3 Estrutura Lógica

A framework Laravel é das mais populares no desenvolvimento web. Ela apresenta uma arquitetura elegante e orientada a componentes, oferecendo ao programador a estrutura ideal em termos de criação de plataformas web escaláveis e de alta qualidade.

O MediGest+ assenta em Laravel e segue o padrão MVC enriquecido com componentes reativos (Livewire), camada de serviços e RBAC. Abaixo descrevem-se as principais estruturas lógicas utilizadas no projeto.

**1) Routes (Rotas)**

As rotas residem em `routes/web.php` e `routes/api.php`, sendo carregadas pelo `App\Providers\RouteServiceProvider`.

- **web.php:** interface web (grupo de middleware web) com sessão, CSRF e localização. Espaços de nomes e prefixes por domínio funcional (admin, medico, paciente).
- **api.php:** endpoints sem estado (grupo api, throttle por token), preparados para integrações futuras.
- Route Model Binding para Consulta, Medico, Paciente e nomeação de rotas para facilitar policies e breadcrumbs.
- Middlewares chave: auth, verified (Jetstream), locale, role:* (Spatie), throttle.

**2) Controllers (Controladores)**

Os controladores em `app/Http/Controllers` orquestram pedidos HTTP, delegando regra de negócio para services e autorização para policies. Exemplos: AppointmentController, ScheduleController, Admin\UsersController, Admin\SpecialtyController, DashboardController.

**3) Models (Modelos/Eloquent)**

Principais: User, Medico, Paciente, Especialidade, ConsultaTipo, Consulta, Horario. Relações: Medico 1–N Horario, 1–N Consulta; N–N Especialidade via pivot; Paciente 1–N Consulta.

**4) Views & Componentes (Blade + Livewire)**

Blade para layouts, páginas e partials; Livewire para UI reativa (Agenda, Dashboard, gestão de marcações). Tailwind CSS, FullCalendar e Chart.js integrados via Vite. i18n (pt/en/es) com strings em `resources/lang/*`.

**5) Services (Camada de Serviços)**

- **AgendaService:** valida disponibilidade, buffers, conflitos; cria/atualiza/cancela slots e consultas.
- **ReportService:** indicadores de ocupação, distribuição de estados, lead time.
- **ExportService:** geração de CSV/XLSX (Laravel-Excel).

**6) Policies & Gates (RBAC)**

Autorização granular com Spatie Roles/Permissions + Policies do Laravel. Papéis: Administrador, Médico, Paciente.

**7) Form Requests (Validação)**

Validação declarativa em `app/Http/Requests`. Exemplos: StoreAppointmentRequest, UpdateScheduleRuleRequest.

**8) Jobs & Queue (Assíncrono)**

Tarefas assíncronas com queue driver em base de dados. Exemplos: SendAppointmentNotifications, GenerateExportJob.

**9) Notifications & Mail**

Notificações por email (em desenvolvimento com Mailpit) e canal database para histórico. Templates: ConsultaConfirmada, ConsultaCancelada.

**10) Middlewares e Providers**

Middlewares: auth, verified, locale, role, throttle, csrf. Providers: RouteServiceProvider, AuthServiceProvider, EventServiceProvider, AppServiceProvider.

**11) Build & Assets (Vite)**

Bundling com Vite para JS/CSS; import e lazy load de FullCalendar/Chart.js; postcss de Tailwind.

**12) Persistência & Migrations**

Migrações idempotentes para schema e seeders (papéis base, utilizadores de teste, especialidades).

**13) Sessões, Cache e Logging**

Sessões em BD (SESSION_DRIVER=database). Cache local (file). Logging orientado a auditoria das ações críticas.

##### 5.3.4 Flow Map do sistema

Mapa de navegação entre as áreas principais, a partir do Login/Registo para os dashboards dos três perfis, detalhando os caminhos de Administração, Médico e Paciente e o acesso às Preferências.

> **Figura 15** — Flow Map do MediGest+ (navegação)

## 6. Desenho

### 6.1 Logotipo

**Modo Dark:**

> **Figura 16** — Logotipo para (Dark Mode)

**Modo Light:**

> **Figura 17** — Logotipo para (Light Mode)

### 6.2 Icon

> **Figura 18** — Icon do Medigest+ (.ico)

## 7. Conclusão

A conclusão final do projeto de conceção da plataforma MediGest+ foi alcançada com sucesso, demonstrando a viabilidade técnica e funcional de uma solução web para marcação e gestão de consultas com perfis diferenciados (Administrador, Médico e Paciente). Ao longo do ciclo de vida do projeto — do levantamento e análise de requisitos ao desenho, implementação, testes e entrega — foram aplicados princípios de engenharia de software e áreas de conhecimento do PMBOK (integração, âmbito, tempo, qualidade, risco e comunicações), operacionalizados através de iterações ágeis.

A arquitetura baseou-se em Laravel (MVC) com Livewire/Blade e Tailwind, recorrendo a FullCalendar para a agenda e Chart.js para o dashboard, com RBAC (Spatie), exportações (Laravel-Excel) e sandbox de e-mail (Mailpit). Em qualidade, foram adotadas normas PSR-12, mitigação OWASP Top 10 e princípios RGPD (minimização, consentimento, registos). Os principais objetivos definidos no âmbito — agenda por médico com regras, gestão de marcações, dashboard, exportações, auditoria e i18n — foram cumpridos, tendo sido entregues também o Manual do Utilizador, o Procedimento de Instalação e o Relatório Técnico. Em termos de valor, a plataforma melhora a rastreabilidade operacional, reduz erros e sobreposições, e cria base sólida para evoluções futuras (p. ex., lembretes multicanais, integrações). A gestão do trabalho em Notion e o acompanhamento próximo com a orientação docente sustentaram a priorização e o cumprimento dos marcos planeados.

### 7.1 Reflexões finais

O plano de conceção do planeamento do projeto foi grande desafio devido à sua extensão e à elevada complexidade dos assuntos abordados, mas através do estudo e pesquisa, das sessões de feedback e da iteração contínua, foi possível amadurecer o desenho e concretizar uma solução coerente. Destacam-se aprendizagens chave: (i) modelação de dados orientada a casos de uso críticos (índices por médico/paciente/data e guards contra sobreposições); (ii) integração de componentes (Livewire, FullCalendar, Chart.js) com atenção ao desempenho e à experiência de utilização; (iii) autorização granular via policies e middlewares; (iv) uso de tarefas assíncronas para desacoplar operações pesadas; e (v) importância de auditoria e privacidade desde o início.

Houve trade-offs assumidos: sessões e filas em base de dados (pela simplicidade e observabilidade no contexto académico), exclusão de módulos fora de âmbito (teleconsulta, faturação/ERP) e foco nos fluxos essenciais de marcação/agenda. O resultado é uma fundação técnica robusta, documentada e testada nos pontos críticos, preparada para evoluir de forma segura e iterativa, mantendo a qualidade alcançada nesta entrega.

### 7.2 Áreas a melhorar

Na conceção desta plataforma, ainda existem áreas onde é possível melhorar e desenvolver algumas matérias futuras. Alguns pontos a ter em atenção seria melhorar a robustez da camada de dados—substituindo slugs por chaves estrangeiras numéricas em relações críticas, afinando índices (por médico/paciente/data) e reforçando checks de integridade—bem como consolidar as regras de agenda com validações de sobreposição e buffers uniformizadas no serviço de marcações. Em segurança, recomenda-se endurecer o rate-limiting de autenticação, políticas de palavra-passe, cabeçalhos (CSP/HSTS) e revisão sistemática de permissões (RBAC/Policies), complementadas por testes de intrusão de rotina. No desempenho e operação, é aconselhável introduzir caching seletivo e migrar sessões/filas para Redis, além de métricas e alertas (p95, taxa de erro, health checks) para reduzir MTTR. Ao nível de qualidade, importa ampliar a cobertura de testes (unitários/integração/E2E) com pipeline CI, melhorar a acessibilidade (WCAG 2.1 AA) e harmonizar mensagens/estados da interface em todos os locales. Em conformidade e evolução funcional, devem ser formalizados registos de consentimento, políticas de retenção/anonimização (RGPD) e, numa fase posterior, avaliadas integrações de maior valor como lembretes multicanais (email/SMS), teleconsulta, pagamentos/ERP e sincronização com calendários externos, garantindo que cada incremento mantém a base atual estável e editável.

### 7.3 Limitações do Projeto

Durante o desenvolvimento deste projeto surgiram algumas limitações que impediram o desenvolvimento de mais módulos e funcionalidades. Essas limitações prendem-se nas restrições de tempo, a complexidade intrínseca do domínio da gestão de agendas médicas (regras, buffers, bloqueios, conflitos e exceções), a dimensão reduzida da equipa e a necessidade de priorizar entregáveis com maior valor. Em termos técnicos, a ausência de ambiente de produção e de integração com serviços externos condicionou decisões: usou-se Mailpit como sandbox de e-mail (sem SMS ou SMTP real), queue/sessions em base de dados (sem Redis), e não foram realizados testes de carga extensivos. A segurança foi tratada ao nível de boas práticas, mas não se efetuou pentest independente; a observabilidade ficou limitada a logging básico, sem dashboards de métricas e alertas. No modelo funcional, ficaram de fora, por opção de âmbito, módulos como teleconsulta, faturação/ERP e pagamentos, bem como sincronização com calendários externos e prontuário clínico. Em UX/Acessibilidade, a interface cumpre requisitos gerais, mas a conformidade WCAG 2.1 não foi auditada integralmente. Por fim, a cobertura de testes concentrou-se em fluxos críticos (auth, marcações, RBAC, exportações), não abrangendo todas as variações e cenários de falha.

### 7.4 Trabalho futuro

As expectativas de trabalho futuro para este projeto baseiam-se sobretudo no melhoramento de funcionalidades, na robustez operacional e na preparação para integração em contexto produtivo. Em primeiro lugar, aprofundar a camada de agenda: consolidar verificações de sobreposição com intervalos start/end, reforçar índices específicos e formalizar políticas de retenção/backup. Em segurança, introduzir 2FA, cabeçalhos de proteção (CSP/HSTS) mais estritos, gestão de segredos e auditoria imutável de ações críticas. Em performance/escala, migrar sessions/queues para Redis, acrescentar caching seletivo e realizar testes de carga com metas de p95. Em observabilidade, expor métricas (latência, erros, filas), health checks e alertas alinhados com SLOs. Em UX/Acessibilidade, evoluir para WCAG 2.1 AA, melhorar estados de interface e finalizar a i18n (pt/en/es) com revisão terminológica. Em funcionalidades, acrescentar lembretes multicanal (email/SMS), teleconsulta, pagamentos e faturação/ERP, além de sincronização com Google/Outlook e self-service de cancelamentos/remarcações assistidas por regras. No ciclo de qualidade, ampliar testes unitários/integrados/E2E e automatizar pipeline CI com code quality gates. Estas linhas permitirão transformar o MediGest+ numa solução mais segura, escalável e completa, mantendo a base atual estável e preparada para evolução contínua.

# PARTE II – PROJETO APLICADO DE ENGENHARIA INFORMÁTICA

## 8. Revisão ao projeto de Engenharia

Este capítulo reflete a implementação concreta após a fase de planeamento. O objetivo foi transformar os conceitos e planos em entrega funcional, usando uma abordagem ágil que permitiu introduzir alterações sempre que necessário, sem perder o foco nos objetivos.

Ao longo do processo foram aplicadas boas práticas de engenharia e decisões técnicas consistentes com os requisitos levantados:

- **Arquitetura e organização:** padrão MVC em Laravel 12 (PHP ≥ 8.2), organização por domínios (Auth, Account, Admin, Médico, Paciente) e componentização Blade. JS modular por página e CSS utilitário com Tailwind v4.
- **Modelação do domínio:** entidades nucleares (User, Medico, Paciente, Especialidade, Consulta, ConsultaTipo, Horario, ConfiguracaoHorario, ParametrosAgendamento). Regra de integridade para evitar overbooking com UNIQUE (medico_id, data, hora).
- **Algoritmo de slots:** geração e validação de disponibilidade no ConsultaService, respeitando passo (granularidade), buffer, horários globais e por médico, e as regras por tipo de consulta (duracao_min, lead_minutos, horizonte_horas).
- **Fluxos por perfil:**
  - **Paciente:** wizard de marcação (especialidade → médico → dia/slot) com validações server-side.
  - **Médico:** FullCalendar (visões dia/semana/mês) e ações de confirmação/cancelamento.
  - **Admin:** gestão de especialidades, médicos, parâmetros e horários; visão global de consultas.
- **Notificações:** canal database para confirmação/cancelamento (email/SMS previstos como evolução).
- **Segurança:** proteções CSRF, hashing de passwords (argon2id/bcrypt), gating por role (RBAC simples), validação rigorosa em requests.
- **Qualidade:** feature tests para fluxos críticos (login; criação/confirm./cancel. de consultas), Laravel Pint (formatação) e build com Vite.

**Aderência ao planeado vs. ajustado**

- **Entregue conforme planeado:** núcleo de marcações; agenda do médico; gestão admin; preferências (tema/idioma PT); notificações internas; testes de feature.
- **Ajustado/adiado:** dashboards/KPIs avançados, exportações (CSV/Excel), i18n completa (EN/ES), notificações por email/SMS em produção, auditoria detalhada e gestão de férias/feriados — planeado como trabalho futuro.
- **Escolhas intencionais:** sem Livewire/Jetstream (autenticação manual/Blade + Alpine), para manter simplicidade e controlo fino do UI.

**Riscos mitigados e lições**

- Colisões de agenda: prevenidas por regra de negócio + constraint única.
- Resiliência do front: endpoints de slots devolvem [] em falha controlada, evitando quebra de UI.
- Lições: centralizar regras no service facilitou testes e evolução; diferir i18n completa e dashboards permitiu cumprir o escopo sem comprometer a qualidade do núcleo.

## 9. Desenvolvimento do Projeto

Esta secção descreve o processo de desenvolvimento, tecnologias, ferramentas e passos seguidos.

- **Abordagem e cadência:** iterações semanais com marcos mensais; priorização por valor/risco (primeiro Paciente, depois Médico, depois Admin).
- **Fases práticas:**
  - **Arranque:** setup de Laravel 12, Vite/Tailwind v4, estrutura de rotas/guards, layouts base e tema (aplicado no `<head>` para evitar FOUC).
  - **Módulo Paciente:** especialidades e médicos; wizard de marcação; validações (lead/horizonte/tipo); persistência de preferências (tema/idioma PT).
  - **Módulo Médico:** FullCalendar com eventos construídos a partir da duração do tipo; ações de confirmação/cancelamento.
  - **Módulo Admin:** CRUD de especialidades/médicos; parâmetros de agendamento; horários globais e por médico.
  - **Notificações e UX:** notificações internas; toasts/feedback; acessibilidade base (skip-link, foco visível, landmarks ARIA onde aplicável).
  - **Qualidade e performance:** Pest/PHPUnit para fluxos críticos; otimizações Vite; revisão de contrastes em dark mode; npm run build + php artisan optimize para a entrega.
  - **Segurança e conformidade:** políticas/guards por role, CSRF em mutações, validação server-side em FormRequest, cookies de preferências com SameSite=Lax (recomendado Secure em HTTPS).
  - **Entrega e DX:** scripts Composer para serve + queue:listen (opcional) + vite em paralelo; README e guias de instalação atualizados.

### 9.1 Tecnologias / Ferramentas utilizadas

Neste capítulo, serão apresentadas após uma seleção criteriosa todas as tecnologias e ferramentas utilizadas para o desenvolvimento e implementação do projeto aplicado. As escolhas destas ferramentas garantiram o sucesso do desenvolvimento desta plataforma, facilitando assim a sua execução e permitindo estar alinhado com as melhores práticas no desenvolvimento deste projeto.

#### 9.1.1 Visual Studio Code

Enquanto editor principal, o Visual Studio Code foi escolhido pela rapidez de desenvolvimento, pela integração fluida com Git e pelo ecossistema de extensões focadas em PHP, Blade e Tailwind. Esta combinação garantiu linting, sugestões inteligentes e realce semântico nas vistas, reduzindo erros e acelerando iterações. A configuração com ESLint/Prettier no front e a possibilidade de depurar aplicações Laravel tornaram o ciclo editar-testar particularmente eficiente ao longo do projeto.

#### 9.1.2 PHP 8.2 e Composer

A base tecnológica assenta em PHP 8.2, que disponibiliza tipagem mais rigorosa e melhorias de performance, e no Composer, responsável pelo lock de dependências e pelos scripts de automação. Esta dupla viabilizou o uso do ecossistema moderno do Laravel 12 e assegurou previsibilidade nas instalações e builds, facilitando tanto o arranque local como a preparação da entrega final.

#### 9.1.3 Laravel 12

O Laravel 12 estruturou o backend segundo o padrão MVC, reunindo roteamento, Eloquent ORM, validação e notificações numa plataforma coesa e produtiva. Optou-se por autenticação manual e um RBAC simples por role, garantindo controlo direto sobre a interface e os fluxos. As FormRequests centralizaram validações e os controladores foram organizados por domínio (admin, médico, paciente), melhorando legibilidade e manutenção.

#### 9.1.4 Blade (templating)

O Blade foi adotado como motor de vistas para compor páginas a partir de layouts e partials reutilizáveis. Esta abordagem promoveu consistência visual e evitou duplicação, com o tema, a navegação e as mensagens de feedback definidos em fragmentos partilhados. A herança de layouts permitiu evoluir a interface rapidamente, mantendo uma base comum e coesa.

#### 9.1.5 MySQL (SGBD relacional)

Para a persistência de dados recorreu-se a MySQL, privilegiando transações e integridade referencial. O esquema foi desenhado com constraints e índices adequados ao domínio, destacando-se a restrição UNIQUE (medico_id, data, hora) na tabela de consultas, essencial para evitar overbooking e sustentar as regras de negócio do agendamento clínico.

#### 9.1.6 Node.js 18, NPM e Vite

No apoio ao frontend, o conjunto Node.js 18, NPM e Vite assegurou hot module reload em desenvolvimento e bundling rápido e fiável em produção. A integração com o plugin Laravel automatizou cache busting e refresh de vistas, reduzindo o tempo entre uma alteração no código e o seu reflexo na interface da aplicação.

#### 9.1.7 Tailwind CSS v4

O Tailwind v4 foi a base do design system, permitindo construir interfaces responsivas através de utilidades consistentes. O modo escuro é aplicado logo no `<head>`, evitando FOUC e garantindo uma experiência estável. A configuração com tokens e a purga de classes resultaram em bundles leves, mantendo desempenho sem sacrificar a expressividade visual.

#### 9.1.8 Alpine.js 3

Para dotar a interface de interações reativas sem a complexidade de uma SPA, recorreu-se ao Alpine.js. Modais, dropdowns e estados de página foram declarados diretamente nas vistas Blade, favorecendo um progressive enhancement acessível (gestão de foco, suporte a teclado, fecho por ESC) e um código JavaScript organizado por página.

#### 9.1.9 Flowbite 2

Como complemento ao Tailwind, o Flowbite forneceu componentes prontos — modais, tabs, carrosséis e menus — com padrões de acessibilidade já incorporados. A sua adoção encurtou o tempo de implementação da UI e contribuiu para uniformizar comportamentos e estilos em todo o produto, permitindo concentrar esforços na lógica de negócio.

#### 9.1.10 FullCalendar

A gestão da agenda do médico foi viabilizada com o FullCalendar, que disponibiliza vistas de dia, semana e mês e uma API flexível para eventos. A integração com o backend permitiu construir horários a partir da duração dos tipos de consulta e expor ações rápidas de confirmação e cancelamento, oferecendo ao utilizador uma visão clara e operativa do planeamento.

#### 9.1.11 Pest/PHPUnit

A qualidade foi suportada por testes de feature escritos com Pest sobre PHPUnit. O foco incidiu nos fluxos críticos — autenticação e ciclo completo de marcação —, criando uma rede de segurança contra regressões e documentando o comportamento esperado da aplicação numa linguagem próxima do domínio.

#### 9.1.12 GitHub

No que diz respeito ao controlo de versões, a escolha recaiu no Git através da plataforma de alojamento GitHub, prática corrente no desenvolvimento profissional. O repositório centralizou o histórico de alterações, associando commits a incrementos funcionais e marcos, o que facilitou a rastreabilidade e a colaboração. A utilização sistemática do GitHub reforçou disciplina de versionamento e trouxe experiência aplicável a contextos reais de equipa.

## 10. Descrição do processo de desenvolvimento

Esta secção documenta as etapas mais relevantes do desenvolvimento do MediGest+, tornando reprodutível o setup, explicando o fluxo de autenticação, as medidas de segurança e inventariando todas as páginas/componentes implementados.

### 10.1 Processo de preparação de ambiente

#### 10.1.1 Pré-requisitos (Windows 10/11)

- PHP 8.2+ (extensões: pdo_mysql, mbstring, openssl, fileinfo, intl)
- Composer 2.7+
- MySQL 8+ (ou MariaDB 10.6+)
- Node.js 18 LTS e npm
- Git e Visual Studio Code
- (Opcional) Mailpit para testes de e-mail em desenvolvimento

Verificação rápida (cmd check version).

#### 10.1.2 Criação do projeto e configuração

- Nova sessão de terminal e criação do esqueleto Laravel 12
- Base de dados `medigest_clean`
- Atualizar `.env`
- Migrações e servidor de desenvolvimento
- Git (primeiro commit)
- Tooling do front-end (no projeto MediGest+)

**Screens do processo (referência):**

> **Figura 19** — Criação do projeto Laravel 12 e lock de dependências.
> **Figura 20** — Application key set, migrações core e instruções de arranque.
> **Figura 21** — Correr migrações após criar a BD, php artisan serve a correr e primeiros pedidos.
> **Figura 22** — git init / git add
> **Figura 23** — Primeiro git commit.

### 10.2 Processo de autenticação

#### 10.2.1 Enquadramento e estratégia

- Autenticação manual (sem Jetstream/Breeze) com Blade + Alpine.
- Sessão em cookies e redirecionamento por role (admin, medico, paciente).
- Layouts/apoio: `resources/views/layouts/auth.blade.php` e modal unificado em `resources/views/auth/auth_modal.blade.php` com três panes: Login, Registar e Esqueceste a password?

> **Figura 24** — modal de autenticação (Login)
> **Figura 25** — modal de autenticação (Register)
> **Figura 26** — modal de autenticação (Forgot your password?)

#### 10.2.2 Fluxos (Login, Registo e Recuperação)

**Login:**

- O utilizador abre o painel Login no modal e preenche email e password.
- Submissão para POST /login; em sucesso cria-se sessão e redireciona-se por role:
  - admin → /admin
  - medico → /medico
  - paciente → /paciente
- Em falha, permanecem os valores seguros e apresentam-se mensagens de validação no formulário.

`resources/views/auth/auth_modal.blade.php` — excerto do pane Login:

```blade
<form method="POST" action="{{ route('login') }}" class="mt-6 space-y-5" novalidate data-auth-ajax="login">
  @csrf
  <input type="hidden" name="form_name" value="login">

  <label class="block text-sm mb-2">Email</label>
  <input id="login_email" name="email" type="email" autocomplete="username" required class="w-full h-11 px-4 rounded-xl">

  <div>
    <div class="flex items-center justify-between">
      <label class="block text-sm mb-2">Palavra-passe</label>
      <button type="button" class="text-xs text-emerald-700" data-auth-switch="forgot">Esqueceste a palavra-passe?</button>
    </div>
    <input id="login_password" name="password" type="password" autocomplete="current-password" required class="w-full h-11 px-4 rounded-xl">
  </div>

  <label class="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="remember" class="rounded"> Manter sessão</label>

  <button type="submit" class="w-full h-11 rounded-xl bg-home-medigest text-white font-semibold">Entrar</button>
</form>
```

`app/Http/Controllers/Auth/LoginController.php` — excerto do método login():

```php
// 1) Validar credenciais
$credentials = $request->validate(['email' => ['required','email'], 'password' => ['required']]);
$remember = $request->boolean('remember', false);

// 2) Tentar autenticar
if (Auth::attempt($credentials, $remember)) {
    $request->session()->regenerate();

    $role = Auth::user()->role;
    $target = match ($role) {
        'admin'    => '/admin/dashboard',
        'medico'   => '/medico/dashboard',
        'paciente' => '/home/paciente',
        default    => abort(403, 'Acesso não autorizado.'),
    };

    return $request->expectsJson()
        ? response()->json(['ok' => true, 'redirect_to' => $target])
        : redirect()->intended($target);
}

$msg = __('auth.failed');
return $request->expectsJson()
    ? response()->json(['message' => $msg, 'form' => 'login', 'errors' => ['email' => [$msg]]], 422)
    : back()->withInput(['form_name' => 'login'])->withErrors(['email' => $msg]);
```

**Registo (apenas Paciente):**

- O utilizador abre o pane Registar no modal e preenche nome, email, password (e confirmação).
- A submissão cria sempre uma conta com role = 'paciente' (os médicos são exclusivamente criados pelo administrador na área de backoffice).
- Em sucesso, o comportamento padrão é autenticar e redirecionar para /paciente.

```php
User::create([
    'name'     => (string) $request->input('name'),
    'email'    => (string) $request->input('email'),
    'password' => Hash::make((string) $request->input('password')),
    'role'     => 'paciente',  // <- apenas pacientes são registados publicamente
]);
```

**"Esqueceste a password?" (estado atual):**

- O pane de recuperação está presente no modal e aceita o email do utilizador.
- Estado atual: a recuperação não está funcional em produção (requer mailer configurado). Em desenvolvimento, pode ser testada com Mailpit.
- Quando ativo, segue o fluxo padrão Laravel (password_reset_tokens).

#### 10.2.3 Logout e autorização por role

- **Logout:** POST /logout invalida a sessão e redireciona para /.
- **Autorização:** rotas agrupadas com auth + role:<perfil>; cada área expõe apenas o que o papel permite.

```php
Auth::logout();
$request->session()->invalidate();
$request->session()->regenerateToken();
return redirect('/');
```

```php
Route::middleware(['auth','role:admin'])->group(function () {
    Route::get('/admin/dashboard', fn() => view('admin.dashboard'))->name('admin.dashboard');
});
Route::middleware(['auth','role:medico'])->group(function () {
    Route::get('/medico/dashboard', fn() => view('medico.dashboard'))->name('medico.dashboard');
});
Route::middleware(['auth','role:paciente'])->group(function () {
    Route::get('/home/paciente', fn() => view('paciente.home'))->name('paciente.home');
});
```

#### 10.2.4 Validação e UX

- Mensagens de erro inline nos campos (ex.: email inválido, credenciais incorretas).
- Acessibilidade: foco inicial no primeiro campo, ESC para fechar modal, tab order correto.
- Feedback após registo/login (toast/alert) e redirecionamento claro conforme o perfil.

#### 10.2.5 Limitações e notas operacionais

- Recuperação de password: inativa em produção sem configuração de mailer; usar Mailpit em desenvolvimento para testes.
- Registo de médicos: não é público; apenas o administrador cria/associa médicos na área /admin.
- Verificação de email e 2FA: não implementados nesta versão (trabalho futuro).
- Mitigações sugeridas: rate limiting no login/registro, CAPTCHA após falhas repetidas.

### 10.3 Segurança

A aplicação implementa salvaguardas de segurança no stack Laravel (v11+) e no próprio domínio funcional.

**CSRF em todas as mutações**

O grupo web do Laravel já inclui o middleware de CSRF por omissão. Os formulários Blade usam `@csrf`.

**Validação server side via Form Requests**

```php
public function rules(): array
{
    $role = auth()->user()?->role;

    return [
        'paciente_id' => [ $role === 'paciente' ? 'sometimes' : 'required', 'integer', Rule::exists('users','id')->where(fn($q)=>$q->where('role','paciente')) ],
        'especialidade_id' => ['required','integer','exists:especialidades,id'],
        'medico_id' => ['required','integer', Rule::exists('users','id')->where(fn($q)=>$q->where('role','medico')) ],
        'tipo_slug' => ['required', Rule::in(['normal','prioritaria','urgente'])],
        'data' => ['required','date','after_or_equal:today'],
        'hora' => ['required','date_format:H:i'],
        'duracao' => ['sometimes','integer','min:10','max:180'],
        'descricao' => ['nullable','string','max:400'],
    ];
}
```

**Hashing robusto (bcrypt/argon2id)**

```php
protected function casts(): array
{
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'settings' => 'array',
    ];
}
```

**RBAC simples por role com middleware**

```php
public function handle(Request $request, Closure $next, string ...$roles): Response
{
    if (!auth()->check()) { /* 401/redirect */ }
    $userRole = strtolower(auth()->user()->role ?? '');
    if (!in_array($userRole, array_map('strtolower',$roles), true)) {
        return match ($userRole) {
            'admin' => redirect()->route('admin.dashboard'),
            'medico' => redirect()->route('medico.dashboard'),
            'paciente' => redirect()->route('paciente.home'),
            default => abort(403),
        };
    }
    return $next($request);
}
```

**Integridade da agenda (evita overbooking)**

```php
$table->unique(['medico_id','data','hora'], 'uniq_medico_data_hora');
```

**Cookies/Headers (SameSite/Secure)**

Sessão com SameSite=Lax e http_only=true. Tema no `<head>` previne FOUC via `resources/views/partials/theme.blade.php`.

**Redefinição de senha**

Fluxo padrão com tabela `password_reset_tokens` e rota para envio de link.

### 10.4 Página Principal — Home

> **Figura 27** — Home pública — hero/carrossel (ficheiro home.blade.php)

**Perfis e vistas**

- **Paciente** — `resources/views/paciente/home.blade.php` (atalhos) + `paciente/consultas/index.blade.php` (lista) + `paciente/consultas/create.blade.php` (wizard de marcação).
- **Médico** — `resources/views/medico/dashboard.blade.php` (resumos) + `medico/calendario.blade.php` (FullCalendar com dia/semana/mês e ações rápidas Confirmar/Cancelar).
- **Admin** — `resources/views/admin/consultas/index.blade.php` (visão global) com navegação para especialidades, médicos e horários.
- **Landing pública** — `resources/views/home.blade.php`.

### 10.5 Navbar

Navegação adaptativa por perfil e sensível ao tema (claro/escuro).

- **Partials reais:**
  - `resources/views/layouts/partials/navbar-paciente.blade.php` — navbar do paciente.
  - `resources/views/layouts/partials/sidebar.blade.php` — sidebar do dashboard.
  - `resources/views/partials/theme.blade.php` — aplica o tema no `<head>` (previne FOUC).
- **Entradas típicas por perfil:**
  - **Paciente:** Início, Especialidades, Marcar consulta, Minhas consultas, Notificações.
  - **Médico:** Calendário, Minhas consultas, Disponibilidades.
  - **Admin:** Consultas, Médicos, Pacientes, Especialidades, Horários (globais), Tipos de consulta, Parâmetros, Utilizadores.

### 10.6 Componentes e páginas criados (catálogo real)

#### 10.6.1 Layouts & Partials

- **layouts/app.blade.php** — layout base do frontend público; monta `<head>` com metadata, injeta o tema cedo, carrega assets do Vite.
- **layouts/auth.blade.php** — layout mínimo para ecrãs de autenticação.
- **layouts/dashboard.blade.php** — layout das áreas autenticadas (Paciente/Médico/Admin).
- **layouts/partials/navbar-paciente.blade.php** — navbar específica do paciente com acessibilidade (roles/aria).
- **layouts/partials/sidebar.blade.php** — sidebar do dashboard com variações por role.
- **partials/theme.blade.php** — script que calcula e aplica o tema (light|dark|system) cedo para evitar FOUC.
- **home.blade.php** — landing pública com hero/carrossel a toda a largura.

#### 10.6.2 Área Paciente

- **paciente/home.blade.php** — início do paciente com atalhos e próximo compromisso.
- **paciente/canais/index.blade.php** — página de contactos (telefones, WhatsApp, e-mail).
- **paciente/consultas/create.blade.php** — wizard de marcação com metadados para JS (slots e médicos por especialidade).
- **paciente/consultas/index.blade.php** — lista de consultas presenciais do paciente.
- **paciente/consultas/todas.blade.php** — histórico/aba de todas as consultas.
- **paciente/especialidades/index.blade.php** — catálogo com caixa de pesquisa e filtros.
- **paciente/especialidades/show.blade.php** — detalhe de uma especialidade, listando médicos/slots.

#### 10.6.3 Área Médico

- **medico/dashboard.blade.php** — página inicial do médico com KPIs/resumos e listas "Hoje/Próximas".
- **medico/calendario.blade.php** — FullCalendar com vistas dia/semana/mês, toolbar e modal.
- **medico/consultas/index.blade.php** — listagem com ações rápidas (Confirmar/Cancelar).
- **medico/consultas/create.blade.php** — criação manual de consulta pelo médico.

#### 10.6.4 Área Admin (dentro de account/)

- **admin/consultas/index.blade.php** — visão global de consultas com filtros por data.
- **admin/consultas/create.blade.php** — criação de consulta (admin).
- **admin/especialidades/index|create|edit.blade.php** — CRUD de especialidades.
- **admin/horarios/index.blade.php** — gestão de horários globais.
- **admin/horarios/configurar.blade.php** — formulário de configuração com tratamento de erros.
- **admin/medicos/index|create|edit.blade.php** — gestão de médicos (lista e formulários).
- **admin/dashboard.blade.php** — visão agregada (KPIs, contagens) para o administrador.

#### 10.6.5 Conta & Autenticação

- **account/profile.blade.php** — perfil do utilizador com avatar e fallback seguro para "voltar" consoante o role.
- **account/settings.blade.php** — definições (tema/idioma/notificações).
- **account/settings_app.blade.php** — versão "app" das preferências, com suporte a dark mode via CSS vars.
- **auth/auth_modal.blade.php** — modal de autenticação com panes (login/registo/recuperação).

#### 10.6.6 Listas públicas auxiliares

- **paciente/medicos/index.blade.php** — listagem pública de médicos com busca.
- **paciente/medicos/show.blade.php** — perfil/detalhe do médico (avatar, cover, especialidades, slots via API).
- **paciente/legal/privacy.blade.php** e **paciente/legal/terms.blade.php** — páginas legais.

#### 10.6.7 Componentes Blade (UI/Form/Ícones)

- **components/form/input.blade.php** — input reutilizável com ícone opcional e toggle de password.
- **components/form/select.blade.php** — select com suporte a ícone e tokens de cor para light/dark.
- **components/form/textarea.blade.php** — textarea com ícone opcional.
- **components/ui/breadcrumbs.blade.php** — breadcrumbs simples com items tipados.
- **components/ui/hero.blade.php** — hero reutilizável (brand/plain), com title, subtitle, height e align.

## 11. Conclusão

**Objetivos alcançados.**

O MediGest+ atingiu o objetivo central de disponibilizar uma aplicação web funcional para marcação e gestão de consultas com experiências distintas para administrador, médico e paciente. Concretizaram-se os principais fluxos: autenticação manual e perfis com navegação dedicada; wizard de marcação (paciente) com validações de negócio; agenda do médico com FullCalendar e ações de confirmação/cancelamento; e gestão administrativa de especialidades, médicos, horários e parâmetros de agendamento (passo e buffer). A camada visual foi construída com Blade + Tailwind v4 + Alpine, com modo escuro aplicado no `<head>` para evitar FOUC, e o controlo de acesso por role manteve o isolamento entre áreas. Foram ainda implementados testes de feature para os fluxos críticos, e documentado o processo de instalação/execução.

**Dificuldades.**

As principais dificuldades surgiram na modelação da agenda (regras de passo, buffer, lead/horizonte por tipo de consulta e prevenção de overbooking), na integração do calendário com estados de marcação e UX de modais, e na padronização da navegação acessível (focus trap/teclado) mantendo o código simples (sem SPA). Em ambiente Windows, a configuração inicial de dependências e migrações exigiu ajustes e validações repetidas. A i18n completa e a orquestração de assets com um tema coerente em claro/escuro também exigiram revisões.

**Limitações do projeto.**

A versão entregue centra-se no ciclo de agendamento. Ficam fora do escopo: prontuário clínico, faturação/ERP, integrações de pagamento, teleconsulta, auditoria detalhada, gestão de férias/ausências dedicada, i18n EN/ES completa, relatórios/KPIs avançados e exportações (CSV/Excel). As notificações externas (email/SMS) não estão ativas em produção — o canal operacional atual é database/in-app.

**Trabalho futuro.**

Como evolução, propõe-se: (i) exportações (CSV/Excel) e relatórios com dashboards/KPIs; (ii) notificações transacionais por email/SMS com filas; (iii) auditoria (logs de operações sensíveis) e verificação de email/2FA; (iv) gestão de ausências/feriados por médico e janelas excecionais; (v) i18n completa (EN/ES) e acessibilidade alargada; (vi) teleconsulta e interoperabilidade (iCal/ICS); e (vii) hardening operacional (backups, monitorização e containerization parametrizada).

## 12. Bibliografia e Referencias

- Alpine.js. (n.d.). Docs. https://alpinejs.dev/
- Flowbite. (n.d.). Getting started: Introduction. https://flowbite.com/docs/getting-started/introduction/
- FullCalendar. (n.d.). Documentation. https://fullcalendar.io/docs
- Laravel. (n.d.). Installation — Laravel 12.x documentation. https://laravel.com/docs/12.x/installation
- Laravel. (n.d.). Testing — Laravel 12.x documentation. https://laravel.com/docs/12.x/testing
- Oracle. (2025). MySQL 8.0 Reference Manual. https://docs.oracle.com/cd/E17952_01/mysql-8.0-en/index.html
- PestPHP Team. (n.d.). Writing tests — Pest documentation. https://pestphp.com/docs/writing-tests
- PHP Group. (n.d.). PHP Manual. https://www.php.net/manual/en/index.php
- Sebastian Bergmann. (2025). PHPUnit 10.5 Manual. https://docs.phpunit.de/en/10.5/index.html
- Tailwind Labs (Adam Wathan). (2025, January 22). Tailwind CSS v4.0. https://tailwindcss.com/blog/tailwindcss-v4
- Vite Contributors. (n.d.). Vite — Next generation frontend tooling. https://vite.dev/

---

## ANEXO A: Manual de Utilizador

### Manual de utilizador do Frontoffice

Este manual destina-se a fornecer instruções básicas detalhadas para os utilizadores do MediGest+ na interface Frontoffice. Abrange os perfis Paciente e Médico (e, quando aplicável, ações simples do Administrador que sejam visíveis no Frontoffice). O objetivo é apoiar a execução das tarefas diárias de forma clara e segura.

#### Requisitos e Acesso

**Como aceder:**

1. Abra o navegador e introduza o endereço da plataforma.
2. Clique em Entrar.
3. Introduza Email e Palavra-passe e selecione Iniciar sessão.
4. Se ainda não tem conta (Paciente), escolha Criar conta e siga os passos de registo.
5. Caso se esqueça da palavra-passe, use Recuperar acesso e siga o link enviado por email.

#### Perfis e permissões

- **Paciente:** registo/autenticação, pesquisa por especialidade/médico, marcação/remoção/remarcação de consultas, gestão de preferências (tema, idioma, notificações), consulta do histórico.
- **Médico:** consulta de agenda (dia/semana/mês), definição de janelas de atendimento e bloqueios, aprovação/ajuste de marcações, lista de pacientes do dia, visualização de indicadores operacionais.
- **Administrador (quando usa Frontoffice):** pode visualizar dashboards e aceder a áreas básicas; a configuração completa faz-se no Backoffice.

#### Paciente — Primeiros passos

**1) Criar conta e iniciar sessão**

a. Criar conta: preencha Nome, Email, Palavra-passe e aceite os Termos & Privacidade.
b. Confirmação: verifique o seu email e confirme a conta.
c. Iniciar sessão: use as credenciais definidas.

**2) Marcar uma consulta**

a. No Dashboard do Paciente, clique em Marcar consulta.
b. Escolha a especialidade e, opcionalmente, o médico.
c. Selecione a data no calendário e um horário disponível (slot).
d. Indique o motivo (opcional) e confirme em Agendar.
e. Receberá confirmação na plataforma e por email.

**3) Cancelar ou remarcar**

a. Aceda a Minhas marcações.
b. Escolha a consulta pretendida e clique em Cancelar ou Remarcar.
c. Para remarcar, selecione um novo slot e confirme.

**4) Preferências e notificações**

a. Tema: claro/escuro em Definições > Aparência.
b. Idioma: pt/en/es em Definições > Idioma.
c. Notificações: ative/desative lembretes por email em Definições > Notificações.

#### Médico — Operação diária

**1. Iniciar sessão**

a. Iniciar sessão: use as credenciais definidas.

**2. Ver a agenda**

a. Aceda ao Calendário no dashboard do médico.
b. Utilize as vistas dia/semana/mês para consultar marcações.
c. Confirme ou cancele consultas através das ações rápidas disponíveis.

**3. Gerir marcações**

a. Aceda a Minhas consultas para listagem detalhada.
b. Utilize filtros por intervalo temporal quando necessário.
c. Confirme ou cancele conforme o estado da consulta.

**4. Preferências**

a. Tema: claro/escuro em Definições > Aparência.
b. Idioma: pt/en/es em Definições > Idioma.
c. Notificações: configure lembretes em Definições > Notificações.

---

*Documento gerado no âmbito do Projeto Final da Licenciatura em Engenharia Informática — MediGest+ (2025).*
