# Genoma CRM — Ponto de Situação (atualização)

**Data:** 17 de junho de 2026  
**Documento anterior de referência:** `PONTO_DE_SITUACAO_E_PERGUNTAS_CLIENTE.md` (11 de junho de 2026)  
**Para:** Equipa Genoma e equipa de desenvolvimento  
**Assunto:** Registo do que foi implementado desde o ponto de situação anterior

> Este documento complementa o ficheiro de 11 de junho. Mantém linguagem acessível e
> serve de **histórico dos passos concretos** feitos no CRM, para consulta futura.

---

## Resumo executivo

Desde o documento anterior, o foco foi **alinhar a estrutura organizacional do sistema**
com a realidade da Genoma:

- **Entidades** (clínicas/hospitais onde a paciente é seguida) passaram a ser dados de
  referência próprios, em vez de uma lista fixa de clínicas.
- **Postos de colheita** deixaram de ser um módulo isolado na Administração e passaram a
  pertencer a cada **Laboratório** (o laboratório é o “dono”; o stock está nos postos).
- **Contactos** e **Stocks** foram ajustados para usar estas relações (médico → entidades,
  morada → postos próximos, envios entre locais sem depender de lote).

Tudo o que está descrito abaixo está **implementado no código** (frontend + backend). Em
ambientes novos, correr `npm run migrate` no backend (migrações `037` a `041`).

---

## 1. Administração — Entidades (novo)

### O que foi feito
- Criado o separador **Entidades** na Administração (ao lado de Empresas, Laboratórios, etc.).
- Cada entidade tem: nome, código, morada, código postal, cidade, distrito, país, contactos,
  condições comerciais por teste e notas — estrutura semelhante à dos postos/laboratórios.
- API dedicada: `/entidades`.
- Migração `037_entidades.js` cria a tabela `entidades` e ligações necessárias.

### Dados iniciais
- Foi criada uma migração de seed (`040`) com entidades baseadas na antiga lista de
  clínicas portuguesas do dropdown de contactos. O ficheiro de seed foi **removido do
  repositório** a pedido — os dados ficam na base de dados onde a migração já correu.

### Porquê
- As clínicas/hospitais onde a grávida é seguida são entidades de negócio distintas dos
  postos de colheita e dos laboratórios.

---

## 2. Administração — Postos dentro dos Laboratórios

### O que foi feito
- **Removidos Postos** da barra lateral e dos separadores da Administração.
- Cada **Laboratório** tem agora o separador **Postos**, com lista, criar, editar e
  eliminar postos associados (`laboratorio_id`).
- Rotas aninhadas: `/definicoes/laboratorios/:id/postos/novo` e `.../postos/:id/editar`.
- Componente `LaboratorioPostosPanel.tsx`.
- Migração `038_postos_laboratorio.js`: campo `laboratorio_id` em postos + associação
  inicial dos postos existentes ao laboratório **Unilabs**.

### Herança laboratório → posto
- Condições comerciais dos postos **herdam** do laboratório pai (read-only no formulário
  do posto quando há laboratório associado).
- **Email** do posto mantém-se próprio (não herdado).
- Migração `039_postos_herdam_laboratorio.js` alinha dados existentes.

### Morada do laboratório
- Removida a secção **Morada** do formulário de laboratório (criar e editar).
- Texto de ajuda: as moradas são definidas **por posto**, no separador Postos.
- Ao guardar laboratório, campos de morada ficam vazios na base de dados.

### Porquê
- Na Genoma, o laboratório não tem morada única nem stock próprio — tem **vários postos**,
  cada um com a sua localização e inventário.

---

## 3. Administração — Médicos

### Locais de trabalho
- Em **Médicos → Locais de trabalho**, a associação passou de **Postos** para **Entidades**.
- Migração `041_medico_locais_entidades.js`: tabela `medico_locais_trabalho` usa
  `entidade_id` em vez de posto.
- API de médicos devolve `locais_trabalho` com `entidade_id`, `entidade_nome`, `entidade_cidade`.

### Tabela de médicos
- Coluna **Postos** renomeada para **Entidades** (mostra a contagem de locais de trabalho).

---

## 4. Contactos — Separador Gravidez

### Campo «Onde é seguida»
- **Antes:** dropdown com lista estática de clínicas/hospitais (`/clinicas`).
- **Agora:**
  - Só fica ativo **depois de escolher o médico**.
  - Opções = **entidades** associadas ao médico (locais de trabalho).
  - Ao mudar de médico, a seleção é limpa.
  - Ao guardar, continua a gravar o **nome da entidade** em `onde_seguida` (compatível com
    contactos antigos).
  - Ao editar, o sistema tenta mapear o nome guardado para a entidade correta do médico.

### Removido
- Backend de clínicas estáticas: rotas, serviço, controlador e ficheiro
  `clinicas-portugal.js`.

---

## 5. Contactos — Separador Colheita

### Campo «Posto de colheita»
- **Antes:** todos os postos ativos no dropdown.
- **Agora:**
  - Só ativo após preencher **morada** e **código postal** válido (separador Identificação).
  - Mostra apenas **postos próximos** da morada do contacto.
  - Ordenação do mais próximo ao mais distante.
  - Critérios: mesmo distrito (todos os postos do distrito), mesma cidade, ou código postal
    numericamente próximo; exclui combinações muito distantes (ex.: Lisboa vs Braga).
  - Se a morada/CP mudar e o posto selecionado deixar de ser válido, a seleção é limpa.

### Ficheiro de lógica
- `frontend/src/lib/posto-proximity.ts`

### Requisito operacional
- Cada posto deve ter **código postal** (e idealmente distrito/cidade) configurado em
  **Administração → Laboratórios → Postos**.

---

## 6. Stocks — Lotes

### Formulário «Novo lote»
- Removido o campo **Teste**.
- O lote define apenas **tipo de kit** (ex.: Maternity), empresa fornecedora e validade.
- Um lote Maternity pode conter kits usados por **vários testes** desse tipo; o teste
  concreto é escolhido na **colheita/contacto** (separador Gravidez).

### Tabela de lotes
- Coluna Teste mostra **«Vários testes»** quando o lote não tem teste único associado.

### Backend
- Stock nos postos: filtro por teste na colheita aceita kits de lotes **sem** `teste_id`,
  desde que o tipo de kit corresponda ao teste selecionado (`postos.repository.js`).

---

## 7. Stocks — Inventário por local

### O que mudou
- **Antes:** três colunas — Empresas | Postos | Laboratórios.
- **Agora:** duas colunas:
  1. **Empresas**
  2. **Laboratórios e postos** — cada laboratório agrupa os seus postos; o número no
     cabeçalho é a **soma do stock dos postos** (não há stock no laboratório).
- Postos sem `laboratorio_id` aparecem em **Postos sem laboratório**.
- Alertas de stock baixo: apenas **empresas** e **postos** (não laboratórios).

---

## 8. Stocks — Novo envio

### Campo Lote
- **Removido** do formulário. Os kits são escolhidos diretamente pela origem, podendo
  pertencer a lotes diferentes.

### Origem e destino
- **Sem pré-seleção** — placeholders «Selecione a origem...» e «Selecione o destino...».
- Ao escolher a **origem**, aparecem **todos os kits disponíveis** nesse local no painel
  Kits (origem ↔ a enviar), como antes mas sem passo intermédio do lote.

### Laboratórios nos dropdowns
- Postos agrupados sob **Laboratório: [nome]**.
- **Não** existe opção «stock no laboratório» — só os **postos** são selecionáveis.
- Grupo **Postos sem laboratório** para postos órfãos.

### Backend
- Envio com `kit_ids` **já não exige** `lote_codigo` (`stocks.service.js`).

---

## 9. Migrações de base de dados (novas desde o doc. anterior)

| Migração | Descrição |
|----------|-----------|
| `037_entidades.js` | Tabela e API de entidades |
| `038_postos_laboratorio.js` | `laboratorio_id` em postos + backfill Unilabs |
| `039_postos_herdam_laboratorio.js` | Herança de condições comerciais lab → posto |
| `040_seed_entidades_clinicas.js` | Seed de entidades (ficheiro removido do repo; dados na BD) |
| `041_medico_locais_entidades.js` | Médicos associam entidades em locais de trabalho |

**Comando:** na pasta `backend`, executar `npm run migrate`.

---

## 10. Ficheiros principais alterados (referência técnica)

| Área | Ficheiros |
|------|-----------|
| Entidades | `037_entidades.js`, `entidades.*`, `LocalFormPage` (kind `entidade`), `SettingsPage` |
| Postos / Lab | `038`, `039`, `LaboratorioPostosPanel`, `LocalFormPage`, `postos.service.js` |
| Médicos | `041`, `medicos.repository.js`, `MedicoFormPage`, `MedicosTab` |
| Contactos | `ContactFormPage`, `posto-proximity.ts`; removidos `clinicas.*` |
| Stocks | `StockForms`, `StockByLocationPanel`, `stocks.ts`, `stock-locations.ts`, `stocks.service.js`, `postos.repository.js` |

---

## 11. O que permanece do documento de 11 de junho

Continua válido e **não foi alterado** nesta fase (salvo o que está explicitamente acima):

- Módulo de Processos (pipeline, validações de estado, datas).
- Listagens e exportações.
- Agendamentos (calendário).
- Motivos de anulação na Administração (ligação ao cancelamento de processos ainda pendente).
- Notificações (canais reais por configurar).
- Perguntas ao cliente na Parte 2 do documento anterior.

**Nota:** várias perguntas da secção B do documento anterior (postos de colheita, lista
oficial) ficaram **parcialmente respondidas pela implementação**: postos são geridos por
laboratório; entidades são dados de referência; proximidade por código postal no contacto.

---

## 12. Pontos de atenção / validação recomendada

1. **Confirmar em ambiente real** que todos os postos têm código postal e estão associados
   ao laboratório correto — necessário para colheita e envios.
2. **Associar entidades aos médicos** em Administração → Médicos → Locais de trabalho, para
   o campo «Onde é seguida» em contactos funcionar.
3. **Contactos antigos** com `onde_seguida` em texto livre: o sistema tenta mapear pelo
   nome; revisar manualmente casos sem correspondência.
4. **Reiniciar backend** após migrações e testar fluxo: novo contacto → gravidez → colheita
   → envio de kits empresa → posto.
5. Mensagens na UI de colheita que ainda referem «Administração → Postos» podem ser
   atualizadas para «Laboratórios → Postos» (ajuste cosmético pendente).

---

## 13. Próximos passos sugeridos

1. Sessão de validação com a Genoma: fluxo contacto (médico → entidade → posto por CP) e
   fluxo stock (lote sem teste → envio para posto do laboratório).
2. Rever textos de ajuda e i18n (PT/EN) nos novos ecrãs.
3. Ligar **motivos de anulação** ao cancelamento de processos (pendente do doc. anterior).
4. Decidir se `onde_seguida` deve passar a guardar `entidade_id` em vez do nome (migração
   de dados futura).
5. Atualizar documentação interna / formação se existir material que ainda fale em
   «Postos na Administração» ou lista fixa de clínicas.

---

## Histórico de alterações deste documento

| Data | Nota |
|------|------|
| 17/06/2026 | Criação — registo do trabalho Entidades, Postos↔Laboratórios, Contactos, Stocks |
