const { buildRelatorioClinicoMaternityProposta1Html } = require('../templates/relatorio-clinico-maternity-proposta1');

const NUMEROS = Array.from({ length: 23 }, (_, i) => i + 1);

describe('relatorio-clinico-maternity-proposta1', () => {
  const processoBase = {
    id: 'proc-1',
    numero_processo: 'GPT5957235',
    paciente_nome: 'Carolina Sofia Valente Gomes',
    paciente_data_nascimento: '1996-09-13',
    paciente_telemovel: '913820809',
    medico_nome: 'Dr Joaquim Gonçalves',
    teste_nome: 'Maternity — Completo',
    teste_cromossomas: NUMEROS.join(','),
    resultado_tudo_ok: 1,
    sugerir_repeticao: 0,
    resultados_cromossomas: JSON.stringify(Object.fromEntries(
      Array.from({ length: 23 }, (_, i) => [i + 1, 'Negativo']),
    )),
    cromossomas_sexuais: 'XY',
    fracao_fetal: '6',
    data_relatorio_laboratorio: '2026-07-10',
  };

  test('gera layout Proposta 1 com secções do PDF de referência', () => {
    const html = buildRelatorioClinicoMaternityProposta1Html(processoBase, []);
    expect(html).toContain('Relatório FINAL');
    expect(html).toContain('Dr Joaquim Gonçalves');
    expect(html).toContain('Carolina Sofia Valente Gomes');
    expect(html).toContain('GPT5957235');
    expect(html).toContain('913820809');
    expect(html).toContain('10/07/2026');
    expect(html).toContain('Resultado do Teste');
    expect(html).toContain('NEGATIVO');
    expect(html).toContain('Sexo Fetal');
    expect(html).toContain('MASCULINO');
    expect(html).toContain('Fracção Fetal');
    expect(html).toContain('6%');
    expect(html).toContain('Tabela de Resultados');
    expect(html).toContain('Cromossoma 1');
    expect(html).toContain('Cromossoma 23');
    expect(html).toContain('crom-grid');
    expect(html).toContain('img-header');
    expect(html).toContain('img-footer');
    expect(html).toContain('linha-teal');
    expect(html).toContain('data:image/png;base64,');
  });

  test('mostra POSITIVO quando há anomalia', () => {
    const html = buildRelatorioClinicoMaternityProposta1Html({
      ...processoBase,
      resultado_tudo_ok: 0,
      teste_cromossomas: '13,18,21',
      resultados_cromossomas: JSON.stringify({ 13: 'Negativo', 18: 'Positivo', 21: 'Negativo' }),
    }, [
      { cromossoma: '18', resultado_valor: 'Positivo', tipo_resultado: 'Cromossoma' },
    ]);
    expect(html).toContain('POSITIVO');
    expect(html).toContain('Positivo');
  });

  test('mostra repetir colheita quando sugerido', () => {
    const html = buildRelatorioClinicoMaternityProposta1Html({
      ...processoBase,
      sugerir_repeticao: 1,
      resultado_tudo_ok: 0,
    }, []);
    expect(html).toContain('REPETIR COLHEITA');
  });
});
