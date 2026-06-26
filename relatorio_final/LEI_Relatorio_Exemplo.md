# Relatório de Exemplo — Engenharia Informática (ISLA)

> **Nota:** Este documento é um exemplo de referência de um Projeto Final de Curso anterior (Clube Desportivo). Serve como modelo de estrutura e formatação para o relatório académico.

---

**Curso:** Engenharia Informática  
**Unidade Curricular:** Laboratório de Programação — Vila Nova de Gaia  
**Projecto:** Clube Desportivo  
**Autores:** Rafael Males (22212343) · Alberto Macieira (22301601) · Daniel Pereira (22406025) · Ricardo Rodrigues (22404102)  
**Data:** [Mês de Ano]

---

## Índice

1. [Relatório de Viabilidade](#1-relatório-de-viabilidade)
   - 1.1. Viabilidade Técnica
   - 1.2. Viabilidade Operacional
   - 1.3. Viabilidade Económica
2. [Stakeholders Interviews](#2-stakeholders-interviews)
   - 2.1. Planeamento da Entrevista
   - 2.2. Guião da Entrevista
3. [User Stories](#3-user-stories)
4. [Levantamento de Requisitos](#4-levantamento-de-requisitos)
   - 4.1. Requisitos Funcionais (RF)
   - 4.2. Requisitos Não Funcionais (RNF)
   - 4.3. Requisitos Técnicos
5. [Desenhos dos Modelos de Sistemas Informáticos](#5-desenhos-dos-modelos-de-sistemas-informáticos)
   - 5.1. Diagrama de Casos de Uso
   - 5.2. Diagrama de Arquitectura do Sistema
   - 5.3. Diagrama de Sequência – Registo de Utilizador por Convite
   - 5.4. Diagrama de Sequência – Inscrição em Prova
   - 5.5. Diagrama de Atividades
   - 5.6. Diagrama de Classes
6. [Database Design](#6-database-design)
   - 6.1. Diagrama Entidade-Relacionamento (ER)
7. [Data Dictionary](#7-data-dictionary)
8. [Design da Interface do Utilizador (UI Design)](#8-design-da-interface-do-utilizador-ui-design)
   - 8.1. Storyboard
   - 8.2. Wireframe
   - 8.3. Mockups
   - 8.4. Protótipos
   - 8.5. Guia de Estilo da Interface (UI Style Guide)
   - 8.6. Relatório de Acessibilidade
9. [Test Cases](#9-test-cases)
10. [Matriz de Rastreabilidade de Requisitos](#10-matriz-de-rastreabilidade-de-requisitos)
11. [Stack Tecnológico](#11-stack-tecnológico)
12. [Conclusão](#12-conclusão)
13. [Bibliografia](#13-bibliografia)

---

## 1. Relatório de Viabilidade

O presente relatório tem como objectivo avaliar a viabilidade técnica, operacional e económica do desenvolvimento de uma plataforma digital de acesso restrito destinada a um clube desportivo. O sistema será acessível exclusivamente a utilizadores convidados pelo Administrador, garantindo controlo e segurança no acesso à informação.

A plataforma permitirá a consulta das provas em que o clube participa, bem como a realização de inscrições por parte dos atletas. Adicionalmente, o Administrador terá a possibilidade de gerir provas, controlar inscrições e gerar fichas consolidadas, contribuindo para uma gestão mais eficiente e organizada. Este estudo pretende confirmar que o sistema proposto pode ser desenvolvido e implementado com sucesso, dentro dos recursos disponíveis e dos prazos definidos.

### 1.1. Viabilidade Técnica

Para o desenvolvimento da plataforma foram seleccionadas tecnologias modernas, estáveis e amplamente utilizadas no mercado, garantindo compatibilidade, desempenho e escalabilidade. O frontend web será desenvolvido em **React.js**, enquanto a aplicação mobile recorrerá a **React Native**, permitindo uma experiência consistente em diferentes dispositivos. O backend será implementado em **Node.js** com **Express**, assegurando uma arquitectura eficiente e de fácil manutenção.

Relativamente à persistência de dados, será utilizada a base de dados **MariaDB** em ambiente de produção e **SQLite** em ambiente de testes, possibilitando um desenvolvimento mais ágil e seguro. Como ferramentas de apoio ao desenvolvimento e design serão utilizados **GitHub**, para controlo de versões e colaboração, e **Figma**, para prototipagem e definição da interface.

A adopção destas tecnologias reduz o risco de incompatibilidades técnicas, facilita futuras evoluções do sistema e assegura que o projecto pode ser desenvolvido de forma sustentável e eficiente.

### 1.2. Viabilidade Operacional

Do ponto de vista operacional, a plataforma foi concebida para ser intuitiva, simples de utilizar e segura, adequando-se às necessidades dos atletas, treinadores e gestores internos do clube. A automatização do processo de inscrição em provas permitirá reduzir erros manuais, melhorar a organização interna e optimizar o fluxo de informação entre os membros e a Administração.

A centralização dos dados numa única plataforma facilitará o acesso rápido e estruturado à informação relevante, contribuindo para uma gestão mais eficaz das actividades desportivas e administrativas do clube.

### 1.3. Viabilidade Económica

A viabilidade económica do projecto é considerada elevada, uma vez que se trata de uma iniciativa sem fins lucrativos. Os custos associados ao desenvolvimento são reduzidos, limitando-se essencialmente ao tempo de implementação e ao alojamento da plataforma.

A utilização de tecnologias open-source e de ferramentas amplamente disponíveis permite minimizar despesas iniciais, tornando o projecto financeiramente sustentável e adequado ao contexto do clube desportivo.

---

## 2. Stakeholders Interviews

As entrevistas a stakeholders constituem uma etapa fundamental na fase de levantamento de requisitos do projecto, uma vez que permitem recolher informações directas junto dos intervenientes que irão utilizar ou gerir a plataforma. Este processo possibilita a compreensão das necessidades reais, das expectativas e das limitações percebidas pelos diferentes perfis de utilizadores, contribuindo para a definição de um sistema mais alinhado com o contexto e os objectivos do clube desportivo.

Através das entrevistas, foi possível identificar funcionalidades consideradas prioritárias, bem como avaliar o nível de complexidade aceitável para a aplicação, de forma a evitar o desvio do foco principal do projecto. Adicionalmente, este método permitiu validar decisões relacionadas com a usabilidade, os meios de acesso preferenciais (web e mobile) e a forma de apresentação da informação, reforçando a importância de uma abordagem centrada no utilizador.

Os dados recolhidos serviram como base para a elaboração do guião de requisitos e para a tomada de decisões técnicas e funcionais, assegurando que a plataforma responde de forma eficaz às necessidades operacionais do clube e dos seus membros.

### 2.1. Planeamento da Entrevista

[Conteúdo de planeamento — a completar conforme metodologia adoptada pelo grupo.]

### 2.2. Guião da Entrevista

O guião de entrevista foi elaborado com o objectivo de recolher a opinião dos utilizadores finais relativamente às funcionalidades, à forma de utilização e às expectativas em relação à plataforma digital do clube desportivo. As questões foram organizadas por áreas temáticas, de modo a facilitar a análise e interpretação dos dados recolhidos.

#### Perfil do Utilizador

1. Qual o seu nível de participação competitiva?
   - Profissional
   - Amador / Lazer

#### Funcionalidades e Conteúdos

2. Considera útil a existência de um registo de treinos e da evolução do seu desempenho ao longo do tempo?
   - *(Nota do entrevistado: esta funcionalidade poderá aumentar significativamente a complexidade da aplicação, desviando-se do objectivo principal do projecto.)*

3. Acha importante ter acesso a estatísticas detalhadas sobre a sua performance nos eventos em que participa?

4. Considera útil a inclusão de uma secção com planos de treino personalizados ou dicas de especialistas?
   - *(Nota do entrevistado: esta funcionalidade poderá desvirtuar o foco e a simplicidade pretendida para a aplicação.)*

5. Existe alguma funcionalidade que considere essencial para a plataforma?
   - Possibilidade de registo de informação através de dispositivos móveis e realização de análises mais detalhadas através do computador.

#### Divulgação e Comunicação

6. De que forma gostaria que os eventos e provas fossem anunciados dentro da plataforma?
   - Apresentação na página inicial do ambiente do utilizador.

7. Considera importante a possibilidade de interagir com outros atletas através da plataforma (por exemplo, criação de grupos internos)?
   - Em avaliação / a considerar.

#### Plataforma e Acesso

8. Qual o meio de acesso que prevê utilizar com maior frequência?
   - Computador (website)
   - Telemóvel (aplicação móvel)
   - Ambos

---

## 3. User Stories

As user stories constituem um artefacto fundamental no processo de levantamento e especificação de requisitos, permitindo descrever as funcionalidades do sistema de forma clara, concisa e centrada no utilizador. No contexto da plataforma desportiva de acesso restrito, as user stories foram definidas com base nas entrevistas realizadas aos stakeholders e reflectem as necessidades dos diferentes perfis de utilizador, nomeadamente atletas e administradores.

Cada user story apresenta uma necessidade específica, o respectivo objectivo e um conjunto de critérios de aceitação, que permitem validar, de forma objectiva, quando a funcionalidade se encontra correctamente implementada.

---

### US-001: Acesso Restrito à Plataforma

**Descrição:** Como utilizador convidado, quero receber um convite para criar conta, de modo a garantir que apenas membros autorizados tenham acesso à plataforma.

**Critérios de Aceitação:**
- O registo de novos utilizadores é possível exclusivamente através de convite do Administrador
- Cada convite contém um identificador único
- Convites inválidos ou expirados impedem a criação de conta
- O sistema bloqueia tentativas de registo não autorizado

---

### US-002: Autenticação Segura

**Descrição:** Como utilizador, quero autenticar-me de forma simples e segura, para garantir a protecção dos meus dados pessoais.

**Critérios de Aceitação:**
- O acesso é realizado através de credenciais válidas
- As palavras-passe são armazenadas de forma segura
- O sistema apresenta mensagens de erro em caso de autenticação incorrecta
- O acesso é temporariamente bloqueado após múltiplas tentativas falhadas

---

### US-003: Consulta de Provas Disponíveis

**Descrição:** Como atleta, quero consultar a lista de provas disponíveis, para decidir em quais pretendo participar.

**Critérios de Aceitação:**
- As provas são apresentadas de forma organizada
- Cada prova inclui nome, data e local
- É possível distinguir provas futuras de provas concluídas
- A consulta é rápida e intuitiva

---

### US-004: Destaque de Provas na Página Inicial

**Descrição:** Como atleta, quero visualizar as provas na página inicial, para acompanhar facilmente as novidades do clube.

**Critérios de Aceitação:**
- As provas relevantes são apresentadas na página inicial
- A informação apresentada é sucinta e clara
- O acesso aos detalhes da prova é imediato

---

### US-005: Acesso Multiplataforma

**Descrição:** Como atleta, quero aceder à plataforma via web e dispositivos móveis, para a utilizar de forma flexível.

**Critérios de Aceitação:**
- A plataforma apresenta comportamento responsivo
- Existe compatibilidade com dispositivos móveis
- A experiência de utilização mantém consistência entre plataformas

---

### US-006: Inscrição em Provas

**Descrição:** Como atleta, quero efectuar a minha inscrição numa prova através da plataforma, para simplificar o processo.

**Critérios de Aceitação:**
- Apenas provas activas permitem inscrição
- O sistema impede inscrições duplicadas
- O estado da inscrição é imediatamente actualizado

---

### US-007: Confirmação de Inscrição

**Descrição:** Como atleta, quero receber confirmação da minha inscrição, para assegurar que o processo foi concluído com sucesso.

**Critérios de Aceitação:**
- O sistema confirma a inscrição após submissão
- O estado da inscrição fica visível no perfil do atleta
- A inscrição fica associada de forma permanente ao utilizador

---

### US-008: Estatísticas de Performance

**Descrição:** Como atleta, quero consultar estatísticas de performance, para acompanhar a minha evolução ao longo do tempo.

**Critérios de Aceitação:**
- As estatísticas são apresentadas de forma estruturada
- É possível consultar dados históricos
- O acesso aos dados é restrito ao próprio atleta

---

### US-009: Gestão de Provas

**Descrição:** Como Administrador, quero criar e editar provas, para manter a informação sempre actualizada.

**Critérios de Aceitação:**
- O Administrador pode criar novas provas
- O Administrador pode editar provas existentes
- As alterações são reflectidas imediatamente na plataforma

---

### US-010: Gestão de Inscrições

**Descrição:** Como Administrador, quero consultar e exportar inscrições, para apoiar a gestão interna do clube.

**Critérios de Aceitação:**
- O Administrador pode visualizar inscrições por prova
- É possível exportar os dados para ficheiro
- A informação apresentada é completa e consistente

---

### US-011: Geração de Fichas Consolidadas

**Descrição:** Como Administrador, quero gerar fichas consolidadas, para simplificar o controlo interno do clube.

**Critérios de Aceitação:**
- O sistema permite gerar documentos com dados agregados
- Os dados apresentados são actualizados
- Os documentos podem ser guardados ou exportados

---

### US-012: Comunicação Interna

**Descrição:** Como atleta, quero aceder à informação institucional do clube, para me manter devidamente informado.

**Critérios de Aceitação:**
- A informação é centralizada na plataforma
- O conteúdo é gerido pela Administração
- O acesso é simples e rápido

---

### US-013: Interacção entre Atletas (Funcionalidade Futura)

**Descrição:** Como atleta, quero interagir com outros atletas em versões futuras da plataforma, para criar grupos e trocar informação.

**Critérios de Aceitação:**
- Funcionalidade identificada como evolução futura
- Não interfere com o funcionamento actual do sistema
- A implementação é prevista para versões posteriores

---

### US-014: Usabilidade entre Mobile e PC

**Descrição:** Como atleta, quero registar informação através de dispositivos móveis e realizar análises mais detalhadas no computador, para tirar partido de ambas as plataformas.

**Critérios de Aceitação:**
- O registo de dados é optimizado para mobile
- A visualização detalhada é optimizada para desktop
- Os dados mantêm-se sincronizados

---

### US-015: Simplicidade da Plataforma

**Descrição:** Como atleta, quero que a plataforma ofereça apenas funcionalidades essenciais, garantindo simplicidade e facilidade de utilização.

**Critérios de Aceitação:**
- A interface é clara e objectiva
- Não existem funcionalidades redundantes
- O sistema mantém foco nos objectivos principais

---

### US-016: Gestão de Competições

**Descrição:** Como Administrador, quero gerir as competições na plataforma, para manter a informação actualizada e relevante.

**Critérios de Aceitação:**
- É possível criar, editar e remover competições
- O sistema valida os dados obrigatórios antes de guardar
- Alterações são registadas para auditoria
- É possível definir o estado da competição (aberta, fechada, cancelada)

---

### US-017: Lista de Inscrições

**Descrição:** Como Administrador, quero consultar a lista de inscrições por competição, para monitorizar a adesão e planear a organização do evento.

**Critérios de Aceitação:**
- São apresentados todos os atletas inscritos
- É possível filtrar e exportar a lista de participantes
- O sistema apresenta estatísticas de inscrição
- É indicado o número de vagas ocupadas e disponíveis

---

## 4. Levantamento de Requisitos

O levantamento de requisitos tem como objectivo identificar e documentar de forma estruturada as funcionalidades e características essenciais da plataforma desportiva de acesso restrito. Os requisitos foram definidos com base nas entrevistas aos stakeholders, nas user stories previamente elaboradas e na análise das necessidades operacionais do clube desportivo.

### 4.1. Requisitos Funcionais (RF)

#### RF001 — Gestão de Acesso

- **RF001.1:** Criação de contas apenas mediante convite do administrador
- **RF001.2:** Autenticação segura por email e palavra-passe
- **RF001.3:** Alternância de contexto (Admin/Atleta)

| Campo | Descrição |
|---|---|
| **Caso de uso** | Registo e Autenticação de Utilizador |
| **Actor** | Atleta / Administrador |
| **Pré-condição** | O utilizador recebe um convite válido; o utilizador não possui conta activa na plataforma |
| **Cenário** | 1. O utilizador acede ao link de convite · 2. O sistema apresenta o formulário de criação de conta · 3. O utilizador introduz os dados solicitados · 4. O utilizador define a palavra-passe · 5. O utilizador submete o formulário · 6. O sistema valida os dados introduzidos · 7. O sistema cria a conta do utilizador · 8. O utilizador realiza autenticação com as credenciais criadas |
| **Pós-condição** | O utilizador encontra-se registado e autenticado na plataforma |

**Nota de Implementação (RF001.3):** A alternância de contexto entre Administrador e Atleta não implica a alteração permanente do perfil do utilizador. Trata-se de uma mudança de modo de utilização da plataforma, em que o sistema aplica o conjunto de permissões correspondente ao papel seleccionado, desde que o utilizador tenha ambos os papéis atribuídos.

---

#### RF002 — Consulta de Provas e Eventos

- **RF002.1:** Apresentação de provas e eventos na página inicial
- **RF002.2:** Consulta da lista de provas disponíveis

| Campo | Descrição |
|---|---|
| **Caso de uso** | Consultar Provas |
| **Actor** | Atleta |
| **Pré-condição** | O atleta encontra-se autenticado |
| **Cenário** | 1. O atleta acede à página inicial · 2. O sistema apresenta as provas disponíveis · 3. O atleta selecciona uma prova para visualizar detalhes |
| **Pós-condição** | O atleta visualiza a informação detalhada da prova seleccionada |

---

#### RF003 — Inscrição em Provas

- **RF003.1:** Inscrição em provas através da plataforma
- **RF003.2:** Envio de confirmação ao atleta após inscrição

| Campo | Descrição |
|---|---|
| **Caso de uso** | Inscrição em Prova |
| **Actor** | Atleta |
| **Pré-condição** | O atleta encontra-se autenticado; a prova encontra-se activa |
| **Cenário** | 1. O atleta acede à lista de provas · 2. Selecciona uma prova activa · 3. Clica em "Inscrever" · 4. O sistema valida duplicações · 5. O sistema regista a inscrição · 6. O sistema confirma a inscrição |
| **Pós-condição** | A inscrição do atleta fica registada; o estado passa a "Confirmada"; o atleta recebe confirmação |

---

#### RF004 — Estatísticas e Informação do Atleta

- **RF004.1:** Disponibilização de estatísticas de performance do atleta

| Campo | Descrição |
|---|---|
| **Caso de uso** | Gerir Perfil |
| **Actor** | Atleta |
| **Pré-condição** | O atleta encontra-se autenticado; existem dados de performance disponíveis |
| **Cenário** | 1. O atleta acede à área pessoal · 2. O sistema apresenta estatísticas de performance · 3. O atleta consulta dados históricos |
| **Pós-condição** | O atleta visualiza as suas estatísticas de forma estruturada |

---

#### RF005 — Gestão de Provas (Administrador)

- **RF005.1:** Criar, editar e remover provas
- **RF005.2:** Consultar inscrições por prova
- **RF005.3:** Exportar inscrições
- **RF005.4:** Gerar fichas consolidadas

| Campo | Descrição |
|---|---|
| **Caso de uso** | Gestão de Provas |
| **Actor** | Administrador |
| **Pré-condição** | O Administrador encontra-se autenticado |
| **Cenário** | 1. O Administrador acede ao painel de gestão · 2. Cria, edita ou remove provas · 3. Consulta inscrições associadas · 4. Exporta dados ou gera fichas consolidadas |
| **Pós-condição** | As alterações e documentos gerados ficam disponíveis no sistema |

---

#### RF006 — Comunicação Interna

- **RF006.1:** Disponibilização de informação relevante do clube aos atletas

| Campo | Descrição |
|---|---|
| **Caso de uso** | Consultar Informação do Clube |
| **Actor** | Atleta |
| **Pré-condição** | O atleta encontra-se autenticado |
| **Cenário** | 1. O atleta acede à área de comunicações · 2. O sistema apresenta informação actualizada do clube |
| **Pós-condição** | O atleta encontra-se informado sobre conteúdos institucionais |

---

#### RF007 — Funcionalidades Futuras

- **RF007.1:** Interacção entre atletas (não incluída no MVP)

> Este requisito encontra-se identificado como evolução futura, não sendo considerado na versão inicial da plataforma.

---

### 4.2. Requisitos Não Funcionais (RNF)

| ID | Requisito |
|---|---|
| **RNF01 — Usabilidade** | RNF01.1: Plataforma simples e focada nas funcionalidades essenciais · RNF01.2: Consistência de utilização entre mobile e PC |
| **RNF02 — Acessibilidade Técnica** | RNF02.1: Disponibilidade via website e aplicação móvel · RNF02.2: Interface responsiva |
| **RNF03 — Segurança** | RNF03.1: Protecção e encriptação dos dados armazenados |
| **RNF04 — Performance** | RNF04.1: Carregamento rápido das páginas · RNF04.2: Processos de inscrição eficientes |
| **RNF05 — Manutenção e Escalabilidade** | RNF05.1: Sistema escalável sem degradação significativa de desempenho |

### 4.3. Requisitos Técnicos

| Componente | Tecnologia |
|---|---|
| Frontend Web | React.js |
| Aplicação Mobile | React Native |
| Backend | Node.js com Express |
| Base de Dados (produção) | MariaDB |
| Base de Dados (testes) | SQLite |
| Ferramentas de Apoio | GitHub, Figma |

---

## 5. Desenhos dos Modelos de Sistemas Informáticos

Os modelos apresentados neste capítulo têm como objectivo representar graficamente o funcionamento da plataforma desportiva de acesso restrito, permitindo uma melhor compreensão da interacção entre os utilizadores e o sistema, bem como dos principais processos internos.

### 5.1. Diagrama de Casos de Uso

O diagrama de casos de uso representa as principais funcionalidades da plataforma e a forma como estas são utilizadas pelos diferentes tipos de utilizadores.

**Actores principais:**
- **Utilizador Convidado** — criação inicial da conta através de convite
- **Atleta** — utilizador principal com acesso às funcionalidades operacionais
- **Administrador** — gestão e manutenção do sistema

#### Casos de Uso do Utilizador Convidado

- **UC01 — Registar utilizador convidado:** criação de conta através de convite válido

#### Casos de Uso do Atleta

- **UC02 — Autenticar utilizador**
- **UC03 — Consultar provas e eventos**
- **UC04 — Consultar detalhes de prova**
- **UC05 — Inscrever-se numa prova**
- **UC06 — Consultar estatísticas**
- **UC07 — Consultar informação do clube**
- **UC11 — Interacção entre atletas** *(funcionalidade futura — não incluída no MVP)*

#### Casos de Uso do Administrador

- **UC02 — Autenticar utilizador**
- **UC08 — Criar/editar provas**
- **UC09 — Exportar inscrições**
- **UC10 — Gerar relatórios**

[INSERIR DIAGRAMA DE CASOS DE USO AQUI]

---

### 5.2. Diagrama de Arquitectura do Sistema

A arquitectura do sistema segue o padrão **Three-Tier Architecture**, promovendo separação clara entre apresentação, aplicação e dados.

#### Camada de Apresentação (Frontend)

- Aplicação Web em **React.js**
- Aplicação Mobile em **React Native**
- Validação básica de formulários
- Comunicação HTTP/REST com o backend
- Adaptação dinâmica conforme perfil (Atleta / Administrador)

#### Camada de Aplicação (Backend)

- Servidor **Node.js** com **Express.js**
- Endpoints REST para todas as funcionalidades
- Controllers: `UserController`, `EventController`, `RegistrationController`
- Middleware de autenticação e autorização (RBAC)
- Validação de regras de negócio

#### Camada de Dados

- **MariaDB** (produção) / **SQLite** (testes)
- Dados: utilizadores, RBAC, eventos, provas, inscrições, estatísticas, auditoria
- Integridade referencial e restrições ao nível da BD

[INSERIR DIAGRAMA DE ARQUITECTURA AQUI — Figura 1]

---

### 5.3. Diagrama de Sequência – Registo de Utilizador por Convite

O fluxo inicia-se quando o utilizador acede ao link de convite. O sistema valida o token (existência, validade temporal, estado). Após submissão dos dados, o backend cria o registo e marca o convite como utilizado.

[INSERIR DIAGRAMA DE SEQUÊNCIA AQUI — Figura 2]

---

### 5.4. Diagrama de Sequência – Inscrição em Prova

O atleta autenticado selecciona uma prova. O backend valida autenticação, estado da prova e ausência de inscrição duplicada. Após validação, regista a inscrição e devolve confirmação.

[INSERIR DIAGRAMA DE SEQUÊNCIA AQUI]

---

### 5.5. Diagrama de Atividades

#### Fluxo do Atleta

Autenticação → Consulta de provas → Visualização de detalhes → Verificação de estado → Inscrição → Consulta de estatísticas → Comunicações do clube

#### Fluxo do Administrador

Autenticação → Painel de administração → Criação/edição/remoção de provas → Gestão de inscrições → Exportação de dados → Gestão de convites

#### Fluxo do Sistema

Validação de convites → Criação de contas → Validação de regras de negócio → Autorização RBAC → Persistência → Registo em AuditLog

[INSERIR DIAGRAMAS DE ACTIVIDADES AQUI]

---

### 5.6. Diagrama de Classes

**Classes principais:**

| Classe | Descrição |
|---|---|
| `User` | Utilizadores — email, passwordHash, isActive, createdAt |
| `Athlete` | Especialização de atleta — totalRacesJoined, lastParticipation |
| `Admin` | Especialização de administrador — métricas de gestão |
| `Role` | Papéis (Atleta, Admin) |
| `Permission` | Permissões individuais |
| `UserRole` / `RolePermission` | Associações RBAC |
| `Event` | Eventos desportivos |
| `Race` | Provas integradas num evento (1:N) |
| `Registration` | Inscrições de atletas em provas |
| `Invitation` | Convites de acesso restrito |
| `AuditLog` | Registos de auditoria |

**Regra de Negócio — Unicidade do Administrador:** Apenas um utilizador pode possuir o papel Admin em simultâneo.

[INSERIR DIAGRAMA DE CLASSES AQUI]

---

## 6. Database Design

O desenho da base de dados garante persistência, integridade e coerência da informação gerida pelo sistema.

### 6.1. Diagrama Entidade-Relacionamento (ER)

**Entidades principais:** User, Role, Permission, Athlete, Admin, Event, Race, Registration, Invitation, AuditLog

**Relações:**
- Role ↔ Permission (M:N)
- User → AuditLog (1:N)
- Event → Race (1:N)
- Athlete → Registration (1:N)
- Race → Registration (1:N)
- Event → Invitation
- Invitation → User (quando aceite)
- User → Athlete / Admin (especialização)

[INSERIR DIAGRAMA ER AQUI]

---

## 7. Data Dictionary

### Tabela `User`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador único |
| name | VARCHAR | | NÃO | Nome do utilizador |
| email | VARCHAR | UNIQUE | NÃO | Endereço de email |
| passwordHash | VARCHAR | | NÃO | Hash da palavra-passe |
| isActive | BOOLEAN | | NÃO | Estado da conta |
| createdAt | DATETIME | | NÃO | Data de criação |

### Tabela `Role`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador único |
| name | TEXT | UNIQUE | NÃO | Nome do papel |
| description | TEXT | | SIM | Descrição |

### Tabela `Permission`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador único |
| name | VARCHAR | UNIQUE | NÃO | Nome da permissão |
| description | TEXT | | SIM | Descrição |

### Tabela `RolePermission`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| roleId | UUID | PK, FK → Role.id | NÃO | Papel |
| permissionId | UUID | PK, FK → Permission.id | NÃO | Permissão |

### Tabela `UserRole`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| userId | UUID | PK, FK → User.id | NÃO | Utilizador |
| roleId | UUID | PK, FK → Role.id | NÃO | Papel atribuído |

> **Restrição:** O papel Admin pode estar associado a apenas um único utilizador em simultâneo.

### Tabela `Athlete`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| userId | UUID | PK, FK → User.id | NÃO | Utilizador atleta |
| totalRacesJoined | INTEGER | | NÃO | Total de provas participadas |
| lastParticipation | DATETIME | | SIM | Data da última participação |

### Tabela `Admin`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| userId | UUID | PK, FK → User.id | NÃO | Utilizador administrador |
| totalInvitesSent | INTEGER | | NÃO | Total de convites enviados |
| totalEventsCreated | INTEGER | | NÃO | Total de eventos criados |
| totalRacesCreated | INTEGER | | NÃO | Total de provas criadas |

### Tabela `Event`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador |
| title | VARCHAR | | NÃO | Título |
| description | TEXT | | SIM | Descrição |
| startsAt | DATETIME | | NÃO | Data de início |
| endsAt | DATETIME | | NÃO | Data de fim |
| status | VARCHAR | | NÃO | Estado |

### Tabela `Race`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador |
| eventId | UUID | FK → Event.id | NÃO | Evento associado |
| title | VARCHAR | | NÃO | Título |
| description | TEXT | | SIM | Descrição |
| startsAt | DATETIME | | NÃO | Início |
| endsAt | DATETIME | | NÃO | Fim |
| status | VARCHAR | | NÃO | Estado |

### Tabela `Registration`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador |
| raceId | UUID | FK → Race.id | NÃO | Prova |
| athleteId | UUID | FK → Athlete.userId | NÃO | Atleta |
| registeredBy | UUID | FK → User.id | NÃO | Responsável |
| status | VARCHAR | | NÃO | Estado |
| createdAt | DATETIME | | NÃO | Data de registo |

### Tabela `Invitation`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador |
| email | VARCHAR | | NÃO | Email do convidado |
| roleDefault | UUID | FK → Role.id | NÃO | Papel por defeito |
| token | TEXT | UNIQUE | NÃO | Token único |
| status | VARCHAR | | NÃO | Estado |
| expiresAt | DATETIME | | NÃO | Expiração |
| createdBy | UUID | FK → Admin.userId | NÃO | Criador |
| acceptedBy | UUID | FK → User.id | SIM | Utilizador que aceitou |

### Tabela `AuditLog`

| Campo | Tipo | Chave | Nulo | Descrição |
|---|---|---|---|---|
| id | UUID | PK | NÃO | Identificador |
| userId | UUID | FK → User.id | NÃO | Utilizador |
| action | VARCHAR | | NÃO | Acção executada |
| entityType | VARCHAR | | NÃO | Tipo de entidade |
| entityId | UUID | | NÃO | ID da entidade (FK lógica) |
| metadata | JSON / TEXT | | SIM | Informação adicional |
| createdAt | DATETIME | | NÃO | Data do registo |

---

## 8. Design da Interface do Utilizador (UI Design)

### 8.1. Storyboard

#### Storyboard do Atleta

| Etapa | Descrição |
|---|---|
| Acesso inicial | Atleta acede via navegador ou app móvel |
| Autenticação | Login com credenciais criadas por convite |
| Consulta de provas | Lista de provas activas e em destaque |
| Detalhes da prova | Data, local, descrição, estado |
| Inscrição | Clicar "Inscrever" na prova seleccionada |
| Confirmação | Sistema valida e confirma inscrição |
| Estatísticas | Área pessoal com performance e histórico |
| Comunicações | Comunicados do clube |

#### Storyboard do Administrador

| Etapa | Descrição |
|---|---|
| Acesso inicial | Autenticação |
| Painel de administração | Redireccionamento pós-login |
| Criação de evento/prova | Definir título, datas, local, estado |
| Edição/remoção | Manutenção de provas existentes |
| Gestão de inscrições | Lista de atletas inscritos |
| Exportação | Fichas consolidadas e listas |
| Convites | Criação e envio de convites |
| Comunicações | Publicação de conteúdos internos |

### 8.2. Wireframes

Wireframes de baixa fidelidade desenvolvidos em **Figma**:
- Login e registo por convite
- Página inicial
- Lista de provas
- Detalhe da prova
- Área pessoal do atleta
- Painel de administração

[INSERIR WIREFRAMES AQUI]

### 8.3. Mockups

Mockups de alta fidelidade com identidade visual definida.

**Link Figma:** [Sport Club Website Mockup](https://www.figma.com/make/U4i7nOVt8uq93VYElug7rS/Sport-Club-Website-Mockup?p=f&fullscreen=1)

### 8.4. Protótipos

Protótipos interactivos de baixa complexidade para validação de navegação (autenticação, consulta de provas, inscrição). Sem lógica funcional nem integração com backend.

### 8.5. Guia de Estilo da Interface (UI Style Guide)

- Paleta de cores institucional
- Tipografia principal e secundária
- Botões, formulários e mensagens de feedback
- Espaçamento e alinhamento
- Ícones e elementos gráficos

### 8.6. Relatório de Acessibilidade

Avaliação do protótipo Figma com base nas **WCAG 2.1 e 2.2 (nível AA)**.

**Critérios avaliados:** contraste, navegação por teclado, estrutura semântica, labels, alt-text, foco visível.

**Problemas identificados:**
- Contraste insuficiente em alguns elementos
- Ausência de estados de foco visível
- Ordem de tabulação não totalmente definida
- Falta de labels e alt-text em componentes específicos

**Recomendações:** ajustar contraste, implementar foco consistente, reorganizar componentes, definir labels e alt-text.

---

## 9. Test Cases

| ID | Requisito | Prioridade | Pré-condição | Passos | Resultado Esperado | Estado |
|---|---|---|---|---|---|---|
| **TC001** | RF001 — Gestão de Acesso | Crítica | Convite válido recebido | Aceder ao link · Preencher formulário · Submeter | Conta criada; convite marcado como utilizado | Por executar |
| **TC002** | RF001.2 — Autenticação | Crítica | Conta activa | Login com email e password | Acesso à plataforma | Por executar |
| **TC003** | RF002 — Consulta de Provas | Alta | Atleta autenticado | Aceder à página inicial · Consultar lista | Provas apresentadas correctamente | Por executar |
| **TC004** | RF002.2 — Detalhe da Prova | Alta | Atleta autenticado | Seleccionar prova · Visualizar detalhes | Informação completa apresentada | Por executar |
| **TC005** | RF003 — Inscrição | Crítica | Atleta autenticado; prova activa | Seleccionar prova · Clicar "Inscrever" | Inscrição registada | Por executar |
| **TC006** | RF003.1 — Anti-duplicação | Crítica | Atleta já inscrito | Tentar nova inscrição na mesma prova | Sistema bloqueia e apresenta erro | Por executar |
| **TC007** | RF003.2 — Confirmação | Alta | Inscrição efectuada | Aceder ao perfil | Estado visível | Por executar |
| **TC008** | RF004 — Estatísticas | Média | Atleta autenticado | Aceder à área pessoal | Estatísticas apresentadas | Por executar |
| **TC009** | RF005 — Criação de Prova | Crítica | Admin autenticado | Painel admin · Criar prova | Prova criada e disponível | Por executar |
| **TC010** | RF005.2 — Exportação | Média | Prova com inscrições | Seleccionar prova · Exportar | Ficheiro gerado | Por executar |
| **TC011** | RF006 — Comunicações | Baixa | Atleta autenticado | Aceder à área de comunicações | Conteúdo apresentado | Por executar |

> Os ficheiros de teste encontram-se no source code dentro da pasta `test`.

---

## 10. Matriz de Rastreabilidade de Requisitos

| ID Requisito | Descrição | Caso(s) de Uso | Test Case(s) |
|---|---|---|---|
| RF001 | Gestão de acesso por convite | UC01 | TC001 |
| RF001.2 | Autenticação de utilizador | UC02 | TC002 |
| RF002 | Consulta de provas | UC03 | TC003 |
| RF002.2 | Consulta de detalhes da prova | UC04 | TC004 |
| RF003 | Inscrição em provas | UC05 | TC005 |
| RF003.1 | Prevenção de inscrições duplicadas | UC05 | TC006 |
| RF003.2 | Confirmação de inscrição | UC05 | TC007 |
| RF004 | Consulta de estatísticas | UC06 | TC008 |
| RF005 | Gestão de provas (Admin) | UC08 | TC009 |
| RF005.2 | Exportação de inscrições | UC09 | TC010 |
| RF006 | Comunicação interna | UC07 | TC011 |

**Análise:** Todos os RF possuem caso de uso e test case associados. Não existem requisitos sem cobertura funcional ou de testes.

---

## 11. Stack Tecnológico

| Camada | Tecnologia | Estado |
|---|---|---|
| **Frontend Web** | React.js (responsivo) | Implementado |
| **Frontend Mobile** | React Native | Planificado |
| **Backend** | Node.js + Express | Planificado |
| **BD Produção** | MariaDB | Modelado |
| **BD Testes** | SQLite | Modelado |
| **Design** | Figma | Implementado |
| **Modelação** | UML | Documentado |

### Considerações

O stack encontra-se alinhado com a arquitectura three-tier e os requisitos do sistema. À data do relatório, frontend e modelo de dados estavam implementados; o backend encontrava-se definido conceptualmente para implementação posterior.

---

## 12. Conclusão

O presente relatório apresentou o processo de análise, conceção e planeamento de uma plataforma desportiva de acesso restrito, destinada à gestão de provas, inscrições e comunicação interna de um clube de atletismo.

Ao longo do documento foram identificados e analisados os requisitos funcionais e não funcionais do sistema, definidos os principais modelos de dados, arquitectura, interface do utilizador e estratégia de testes, assegurando coerência entre os diferentes níveis de abstracção do projecto.

As decisões de concepção adoptadas — arquitectura three-tier, modelo de dados relacional e RBAC — foram fundamentadas com base em boas práticas de engenharia de software, permitindo garantir segurança, escalabilidade e facilidade de manutenção.

Embora o projecto se encontrasse numa fase de concepção e planeamento, os artefactos produzidos constituem uma base sólida para a implementação futura da plataforma, podendo esta ser evoluída com novas funcionalidades, melhorias de usabilidade e reforço dos mecanismos de acessibilidade.

---

## 13. Bibliografia

[INSERIR REFERÊNCIAS BIBLIOGRÁFICAS NO FORMATO ISLA]

1. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson.
2. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures*.
3. W3C. *Web Content Accessibility Guidelines (WCAG) 2.1 / 2.2*.
4. Documentação oficial: React, Node.js, Express, MariaDB.

---

*Documento de exemplo — Clube Desportivo · Engenharia Informática · ISLA · Laboratório de Programação Vila Nova de Gaia*
