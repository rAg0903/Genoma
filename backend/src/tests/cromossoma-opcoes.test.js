const {
  cromossomasAnalisados,
  derivarTudoOk,
  resultadosParaAnomalias,
  inicializarNegativo,
  parseResultadosJson,
  serializarResultados,
} = require('../utils/cromossoma-opcoes');

describe('cromossoma-opcoes', () => {
  test('usa cromossomas do teste quando definidos', () => {
    const lista = cromossomasAnalisados({ teste_cromossomas: '13,18,21' });
    expect(lista).toEqual([13, 18, 21]);
  });

  test('fallback para kit base pelo nome do sub-teste', () => {
    const lista = cromossomasAnalisados({ sub_teste_nome: 'Básico', teste_pai_nome: 'Maternity' });
    expect(lista).toEqual([13, 18, 21]);
  });

  test('deriva tudo ok quando todos negativos', () => {
    const analisados = [13, 18, 21];
    const resultados = inicializarNegativo(analisados);
    expect(derivarTudoOk(resultados, analisados, false)).toBe(true);
  });

  test('gera anomalias compatíveis com resultados_geneticos', () => {
    const analisados = [13, 18, 21];
    const resultados = { 13: 'Negativo', 18: 'Positivo', 21: 'Suspeita' };
    const anomalias = resultadosParaAnomalias(resultados, analisados, {});
    expect(anomalias).toHaveLength(2);
    expect(anomalias.map((a) => a.cromossoma)).toEqual(['18', '21']);
  });

  test('serializa e parseia JSON de resultados', () => {
    const original = { 1: 'Negativo', 21: 'Positivo' };
    const parsed = parseResultadosJson(serializarResultados(original));
    expect(parsed[1]).toBe('Negativo');
    expect(parsed[21]).toBe('Positivo');
  });
});
