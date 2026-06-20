# QA Checklist - Stocks Tranche (Requisicoes, Movimentos, Lotes, Registo em Massa, Alertas, SMS, Auditoria)

## Execucao rapida (10-15 min)
1. Validar secoes A, B(1-5), C(1-3), D(1-4), E(1-3), F(1-4), I(1-6), H.
2. Se tudo passar, executar os restantes cenarios negativos para fechar com maior confianca.

## Evidencias por execucao
1. Data/hora:
2. Ambiente: local/mock
3. Utilizador/perfil testado:
4. Resultado global: Passou | Falhou | Parcial
5. Notas:

## Preparacao
1. Na pasta frontend, executar `npm run dev`.
2. Abrir a aplicacao e autenticar com perfil que tenha permissao de create/update/delete em Stocks.
3. Entrar na pagina Stocks.

## A. Tabs e navegacao
1. Verificar que existem 5 tabs: Kits, Lotes, Requisicoes, Movimentos, Auditoria.
2. Trocar entre as tabs e confirmar que o conteudo muda corretamente.
3. Confirmar que o botao de acao principal muda por tab:
   - Kits: Novo Kit
   - Lotes: Novo Lote
   - Requisicoes: Nova Requisicao
   - Movimentos: Novo Movimento
   - Auditoria: Novo SMS

## B. Kits - localizacao, filtros e alertas
1. Em Kits, confirmar coluna Localizacao na tabela/cards.
2. Criar 1 kit com localizacao Escritorio e validar exibicao.
3. Criar 1 kit com localizacao Posto e validar exibicao.
4. Editar um kit e alterar localizacao para Laboratorio.
5. Validar filtro de localizacao:
   - Selecionar Escritorio e confirmar lista filtrada.
   - Selecionar Posto e confirmar lista filtrada.
   - Selecionar Laboratorio e confirmar lista filtrada.
6. Validar filtro por status e pesquisa textual em conjunto.
7. Confirmar bloco de Alerta de baixo stock quando alguma localizacao tiver <= 3 kits disponiveis.

## C. Lotes - criacao e edicao
1. Em Lotes, clicar Novo Lote.
2. Criar lote com codigo unico e confirmar que aparece na tabela.
3. Tentar criar lote com codigo duplicado e validar mensagem de erro.
4. Editar lote e ajustar quantidade disponivel para valor maior que total:
   - Resultado esperado: quantidade disponivel nao ultrapassa quantidade total.
5. Confirmar estado visual do lote (Valido, A expirar, Expirado) pela data de validade.

## D. Registo em massa por codigos
1. Em Kits, clicar Registo em Massa por Codigos.
2. Preencher tipo, lote, validade, localizacao e 3 codigos em linhas separadas.
3. Submeter e validar toast de sucesso com numero de kits criados.
4. Confirmar que os novos codigos aparecem na lista.
5. Repetir com codigos existentes e validar erro de duplicacao (nenhum novo kit criado).

## E. Requisicoes
1. Em Requisicoes, clicar Nova Requisicao.
2. Criar requisicao valida com origem != destino.
3. Validar listagem com data, origem, destino, quantidade, estado, tracking, transportadora e lote.
4. Editar requisicao existente e alterar estado.
5. Usar acao de Marcar entregue e validar mudanca para Entregue.
6. Tentar salvar requisicao com origem == destino e validar erro.
7. Tentar salvar requisicao com quantidade <= 0 e validar erro.
8. Eliminar requisicao e validar remocao da lista.
9. Mensagens esperadas:
   - Sucesso criar: Requisição criada.
   - Sucesso editar: Requisição atualizada.
   - Erro origem/destino: Origem e destino devem ser diferentes.
   - Erro quantidade: Quantidade deve ser superior a zero.

## F. Movimentos
1. Em Movimentos, confirmar aviso operacional: nao mover a partir do laboratorio.
2. Criar movimento valido com origem Escritorio e destino Posto.
3. Confirmar que o movimento aparece na lista.
4. Tentar criar movimento com origem Laboratorio:
   - Resultado esperado: bloqueado com mensagem de erro.
5. Tentar criar movimento com origem == destino:
   - Resultado esperado: bloqueado com mensagem de erro.
6. Tentar criar movimento com codigo de kit inexistente:
   - Resultado esperado: erro Kit nao encontrado.
7. Criar movimento com motivo Consumo e validar no kit:
   - localizacao atualizada para destino
   - status atualizado para Utilizado
8. Criar movimento com motivo SMS Colheita via botao Registar SMS Colheita e validar pre-preenchimento.
9. Validar pesquisa por kit, origem, destino, motivo e observacoes.
10. Eliminar movimento e validar remocao da lista.
11. Mensagens esperadas:
   - Erro origem laboratorio: Não é permitido mover kits a partir do laboratório.
   - Erro origem/destino: Origem e destino devem ser diferentes.
   - Erro kit inexistente: Kit não encontrado para o código informado.
   - Sucesso criar: Movimento registado com sucesso.

## G. Permissoes e modo leitura
1. Entrar com perfil sem create/update/delete em Stocks.
2. Validar exibicao de aviso de modo leitura.
3. Confirmar ausencia de botoes de criar/editar/eliminar.

## H. Regressao tecnica minima
1. Executar `npm run build` no frontend.
2. Resultado esperado: build concluido sem erros.

## I. Alertas automaticos, SMS e painel de auditoria
1. Entrar na tab Auditoria.
2. Validar cards de monitorizacao:
   - Alertas automáticos
   - SMS pendentes
   - Eventos auditados
3. Validar lista de alertas automáticos com pelo menos um tipo, quando aplicável:
   - Baixo stock
   - Lote a expirar
   - Requisição pendente
4. Clicar Criar SMS num alerta e confirmar modal pre-preenchido com mensagem/referência.
5. Criar SMS manual pela acao Novo SMS e validar entrada na Fila SMS com estado Pendente.
6. Marcar SMS pendente como Enviado e validar atualização do estado.
7. Validar painel de auditoria:
   - existem eventos após criar/editar/remover entidades
   - filtro por texto funciona por categoria/acao/detalhe
8. Confirmar níveis visuais no painel de auditoria (Info, Aviso, Critico) e consistência do registo.
9. Mensagens esperadas:
   - Erro SMS sem mensagem: A mensagem SMS é obrigatória.
   - Sucesso criar SMS: SMS registado na fila de envio.
   - Sucesso marcar enviado: SMS marcado como enviado.

## Critério de saida
1. Todas as secoes obrigatorias concluidas sem bloqueios.
2. Nenhum erro de build em frontend.
3. Nenhuma regressao funcional em Kits/Lotes/Requisicoes/Movimentos.
4. Fluxos de Alertas/SMS/Auditoria operacionais e com registo coerente.

## Resultado esperado da tranche
- Fluxos de Requisicoes e Movimentos funcionais.
- Criacao de lote funcional.
- Registo em massa por codigos funcional.
- Regra de bloqueio de origem Laboratorio em movimentos ativa.
- Localizacao de kits e alerta de baixo stock ativos.
- Alertas automáticos de stock/lote/requisição ativos.
- Fila SMS operacional com criação manual e a partir de alerta.
- Painel de auditoria a registar eventos operacionais.
